export const FULL_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const TRAIL_FRAG = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uMask;      // the word, white on transparent
uniform vec2  uResolution;    // drawing buffer size, px
uniform float uAspect;        // w/h

// trail
uniform float uEchoes;        // how many copies to accumulate
uniform float uStep;          // spacing between copies, px @ 620h
uniform float uAlpha;         // per-copy alpha
uniform vec2  uFall;          // trail direction (unit-ish)
uniform float uZStep;         // recession per copy

// magnetism: the trail bends toward the cursor as it falls, hard near the word
// and relaxing back to a straight fall further out.
uniform vec2  uMagnet;        // cursor in uv; only meaningful when uMagnetOn > 0
uniform float uMagnetOn;      // eased 0..1 presence
uniform float uSwing;         // how much the cursor twists the near copies (depth coupling)

// The five layers built on top of the raw accumulation. All of them are pure
// arithmetic inside the sampling loop that was already running — none adds a
// texture fetch, which is the only thing that costs real money in a fill-rate
// bound shader like this one.
uniform float uTurb;          // how much the tail wavers (px @ 620h)
uniform float uSpread;        // how much each copy widens as it falls
uniform float uEdge;          // brightness of the true leading edge
uniform float uFringe;        // per-channel ramp offset -> dispersion at the tail

// camera
uniform vec2  uAnchor;        // word centre in uv
uniform float uYaw;
uniform float uPitch;
uniform float uFocal;

// colour
uniform vec3  uTrailHead;     // hsl-ish resolved rgb at the word
uniform vec3  uTrailTail;     // resolved rgb at the tail
uniform vec3  uBleed;
uniform vec3  uHalo;
uniform vec3  uCore;
uniform vec3  uBg;
uniform vec3  uPoolA;
uniform vec3  uPoolB;
uniform float uPoolAlphaA;
uniform float uPoolAlphaB;
uniform vec3  uVignette;
uniform float uSubtract;      // 1.0 = ink on paper, 0.0 = light on dark
uniform float uSoft;          // strength of the two soft word layers
uniform float uNoise;
uniform float uTime;
uniform vec2  uHaloShift;
uniform vec2  uWordShift;     // the bleed/halo offset that sells directional light

// Sample the word mask at a point on the plane, z units back, with the glyph
// scaled up by grow (1.0 = its own size).
// Forward projection is  p' = anchor + rot(p) * focal/(focal+z)
// so to find which mask texel lands on THIS fragment we undo it.
float maskAt(vec2 uv, float z, float grow) {
  vec2 p = uv - uAnchor;
  p.x *= uAspect;                       // work in square space so the turn is even

  float s = (uFocal + z) / uFocal;      // inverse of the perspective divide
  p *= s;

  // Making the SAMPLED glyph bigger means shrinking the lookup toward the anchor.
  p /= max(0.001, grow);

  // undo the in-plane rotation (yaw about y, pitch about x). The forward pass
  // scales x by cos(yaw) and y by cos(pitch), so invert that.
  float cy = max(0.001, cos(uYaw));
  float cp = max(0.001, cos(uPitch));
  p.x /= cy;
  p.y /= cp;

  p.x /= uAspect;
  vec2 t = p + uAnchor;
  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return 0.0;
  return texture2D(uMask, t).a;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // ── the trail ────────────────────────────────────────────────────────────
  // March backward along the fall direction. Each step is one "copy": if the
  // word covers us at that offset, it contributes one more overlapping stamp.
  //
  // Rather than loop uEchoes times (a dynamic bound, illegal in GLSL ES 1.0,
  // and wasteful), we take a FIXED number of samples spread across the trail and
  // weight each by how many copies it stands in for. The accumulation law is
  // smooth in k, so sampling it coarsely and scaling the exponent is
  // indistinguishable from stamping every copy — and it is a constant cost.
  const int SAMPLES = 48;

  // One authored pixel, in uv. The params are written against a 620px-tall card,
  // so a step of 1.0 means one 620th of the height regardless of the real size —
  // that is what keeps the copies overlapping (and the ramp smooth) at every
  // card size instead of combing apart on a tall one.
  float px = 1.0 / 620.0;
  vec2 fall = uFall * uStep * px;
  float perSample = uEchoes / float(SAMPLES); // copies each sample represents

  // Recession per copy, in the SAME uv units the perspective divide works in.
  // This is the one that has to be normalised: uZStep is authored per-copy in
  // card pixels, and feeding raw pixel counts into focal/(focal+z) drove z to
  // ~115 against a focal of 1.6, a ~70x divide that threw every sample far
  // outside the mask — so nothing was found and the trail vanished entirely.
  float zPer = uZStep * px;

  float dens = 0.0;   // accumulated coverage 0..1
  float ramp = 0.0;   // density-weighted position along the trail, for the hue
  float wsum = 0.0;
  // (A) The lowest copy index that covered this pixel. This is the real leading
  // edge of the exposure — the front face of the whole stack — and it is exact
  // rather than assumed, so it follows the trail wherever the bend and the
  // turbulence put it. The Canvas 2D version could only fake this by brightening
  // the first three copies, which pinned a rim to the word instead of to the
  // actual front of the trail.
  float firstHit = 1e9;

  for (int i = 1; i <= SAMPLES; i++) {
    float fi = float(i) * perSample;           // which copy index this is
    float t  = fi / max(1.0, uEchoes);         // 0 at the word, 1 at the tail

    vec2 off = fall * fi;

    // ── magnetism ─────────────────────────────────────────────────────────
    // The trail bends toward the cursor instead of falling dead straight. The
    // pull grows along the trail (t*t), so the copies nearest the word stay put
    // and the far end swings — which is what makes it read as the trail being
    // ATTRACTED rather than the whole word being dragged. Squared so the bend is
    // a curve, not a kink.
    //
    // Free: the sample offset is already a vector, so this is one multiply-add
    // inside a loop that was going to run anyway. No extra texture fetches, which
    // is the only thing that actually costs anything in here.
    vec2 toCur = uMagnet - uAnchor;
    toCur.x *= uAspect;
    // Attraction falls off with distance, so a cursor parked in the far corner
    // relaxes the trail back to vertical instead of hauling it sideways forever.
    float grip = uMagnetOn / (1.0 + dot(toCur, toCur) * 5.0);
    off += toCur * (t * t * grip * 0.55);

    // ── cursor-coupled depth ──────────────────────────────────────────────
    // The recession already exists per copy; coupling it to the cursor makes the
    // near copies swing further than the far ones, so the stack shears in depth
    // and you get a genuine parallax read out of geometry that was already here.
    // (1-t) weights it toward the word end — the near copies are the ones a real
    // parallax would move most.
    float z = zPer * fi * (1.0 + uSwing * (1.0 - t));

    // ── (C) turbulence ────────────────────────────────────────────────────
    // The tail wavers, the head stays crisp. Two sines at incommensurate rates
    // beating against each other, so it never reads as a clean oscillation.
    //
    // The important part is that the phase advances with fi: the displacement
    // differs from copy to copy, so the trail SNAKES along its length instead of
    // sliding sideways as a rigid shape. Weighted t*t so it is nothing at the
    // word and strongest at the far end, which is how smoke and hot air actually
    // behave — the disturbance has had further to travel.
    float wob = sin(fi * 0.105 + uTime * 1.25)
              * sin(fi * 0.037 - uTime * 0.71 + 2.1);
    off += vec2(wob, wob * 0.35) * (t * t * uTurb * px);

    // ── (E) dissipation ───────────────────────────────────────────────────
    // Each copy is sampled slightly larger than the last, so the trail opens up
    // as it falls rather than staying a constant-width ribbon. A long exposure of
    // something emitting light does spread, and it also softens the hard edges of
    // the tail without any blur — the widening copies overlap less exactly, which
    // is its own kind of falloff.
    float grow = 1.0 + t * uSpread;

    float m = maskAt(uv - off, z, grow);
    if (m > 0.0) {
      // coverage contributed by perSample overlapping copies at uAlpha
      float k = 1.0 - pow(1.0 - uAlpha * m, perSample);
      // composite this band OVER what we already have (same as stacking stamps)
      dens += k * (1.0 - dens);
      ramp += t * k;   // t is this copy's position along the trail
      wsum += k;
      firstHit = min(firstHit, fi);   // (A)
    }
  }
  float q = wsum > 0.0 ? ramp / wsum : 0.0;    // mean position along the ramp

  // (A) The leading edge, from the real first-hit index. Decays fast, so it is a
  // thin bright rim on the front of the exposure rather than a general lift of
  // the head — which is what gives the trail a defined front instead of just
  // fading in from nothing.
  float edge = firstHit < 1.0e8 ? exp(-firstHit * 0.085) * uEdge : 0.0;

  // ── the word itself, three layers ────────────────────────────────────────
  // Sampled at z = 0, on the plane. The two soft layers are nudged AWAY from the
  // pointer so the light reads as directional; the core never moves. Now that
  // maskAt takes a scale, the wide layers ask for a genuinely larger glyph rather
  // than faking size with a second offset sample.
  float bleed = maskAt(uv - uWordShift, 0.0, 1.055);
  float halo  = maskAt(uv - uWordShift * 0.45, 0.0, 1.018);
  float core  = maskAt(uv, 0.0, 1.0);

  // ── the atmosphere pool ──────────────────────────────────────────────────
  vec2 pc = uv - uAnchor - uHaloShift;
  pc.x *= uAspect;
  float pd = length(pc) / 0.52;
  float pool = 1.0 - clamp(pd, 0.0, 1.0);
  pool *= pool;

  // ── compose ──────────────────────────────────────────────────────────────
  // (B) Chromatic fringe. Each channel reads the ramp at a slightly different
  // position, as if the three wavelengths had been exposed for slightly different
  // lengths of trail. Red trails a touch behind and blue runs a touch ahead, so
  // the tail separates into colour exactly where the density is thinnest and the
  // separation is visible — and the dense head stays neutral, because there the
  // ramp is flat and all three land in the same place.
  //
  // Three mixes on values already in registers. The Canvas 2D version bought the
  // same idea with a second ~190-blit pass over the whole trail.
  float qr = clamp(q + uFringe, 0.0, 1.0);
  float qb = clamp(q - uFringe, 0.0, 1.0);
  vec3 trailCol = vec3(
    mix(uTrailHead.r, uTrailTail.r, qr),
    mix(uTrailHead.g, uTrailTail.g, q),
    mix(uTrailHead.b, uTrailTail.b, qb)
  );
  // ── both composites, then blended ────────────────────────────────────────
  // uSubtract is CONTINUOUS, not a boolean, and that is the whole point.
  //
  // The presets alternate dark and light, so nearly every crossfade crosses from
  // additive to subtractive. Branching on uSubtract > 0.5 meant the compositing
  // mode SNAPPED at the midpoint of every transition — and the midpoint is the
  // worst possible moment for it, because the background is then a mid-grey where
  // neither mode looks right. That snap, plus the washed-out middle it sat in, is
  // what made the colour change read as broken rather than as a wash.
  //
  // Evaluating both and mixing costs a handful of ALU ops on values already in
  // registers (no extra texture fetches), and in exchange every frame of the
  // transition is a valid image. uSoft and the trail alpha can now ride the same
  // continuous mix instead of jumping with the mode.
  vec3 add = uBg;
  add += uPoolA * pool * uPoolAlphaA;
  add += uPoolB * pool * uPoolAlphaB;
  add += trailCol * dens;
  // (A) the leading edge, lifted toward the core colour so the front of the
  // exposure reads as the hottest part of the light.
  add += mix(trailCol, uCore, 0.5) * edge * dens;
  add += uBleed * bleed * 0.16 * uSoft;
  add += uHalo  * halo  * 0.32 * uSoft;
  add += uCore  * core  * 0.95;

  // INK ON PAPER. Adding light to near-white blows straight out and the trail
  // vanishes, so the same accumulation has to subtract instead — density of
  // pigment, not emission. Multiply is what keeps the ramp readable.
  vec3 sub = uBg;
  sub = mix(sub, sub * uPoolA, pool * uPoolAlphaA);
  sub = mix(sub, sub * uPoolB, pool * uPoolAlphaB);
  sub *= mix(vec3(1.0), trailCol, dens);
  // (A) on paper the leading edge is the DENSEST ink, not the brightest light —
  // the front of the stroke where the pigment pooled.
  sub *= mix(vec3(1.0), trailCol, edge * dens * 0.5);
  sub *= mix(vec3(1.0), uBleed, bleed * 0.16 * uSoft);
  sub *= mix(vec3(1.0), uHalo,  halo  * 0.32 * uSoft);
  sub *= mix(vec3(1.0), uCore,  core  * 0.95);

  vec3 col = mix(add, sub, uSubtract);

  // ── vignette ─────────────────────────────────────────────────────────────
  vec2 vc = uv - vec2(0.5, 0.45);
  vc.x *= uAspect;
  float vd = clamp((length(vc) - 0.16) / 0.56, 0.0, 1.0);
  col *= mix(vec3(1.0), uVignette, vd);

  // ── (D) grain ────────────────────────────────────────────────────────────
  // Wide soft gradients band badly in 8-bit, so some dither is non-negotiable.
  // But a FLAT layer of it reads as a dirty screen sitting in front of the image.
  // Real film grain lives in the emulsion: it is strongest where the exposure
  // actually happened and nearly absent in untouched shadow. Weighting it by the
  // trail's own density is what turns the dither into part of the photograph —
  // the trail comes out looking exposed rather than drawn.
  //
  // A floor keeps just enough everywhere to kill banding in the pool + vignette.
  // The sign rides uSubtract continuously (grain LIFTS out of shadow on a dark
  // ground, DARKENS on paper) so it passes through zero mid-transition instead of
  // inverting in one frame.
  float n = hash(gl_FragCoord.xy + vec2(uTime * 60.0)) - 0.5;
  float grainAmt = uNoise * (0.35 + 1.5 * max(dens, core));
  col += n * grainAmt * mix(1.0, -1.0, uSubtract);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

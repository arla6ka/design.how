// Pixel threshold (https://design.how/vault/pixel-threshold), shaders.ts.
// FIXED. Change the VARIABLE values in params instead (SEQUENCE, COLORWAYS, DEFAULTS.threshold, FINE, COARSE, HOLD_MS, COLLAPSE_MS, RESOLVE_MS, DEFAULTS.halo, DEFAULTS.keyline, DEFAULTS.keylineOffset, DEFAULTS.texture, FONT_CSS, FONT_WEIGHT).
export const FULL_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const THRESHOLD_FRAG = `
// highp requested, but plenty of mobile GPUs quietly hand back mediump in the
// fragment stage. Every hash folds its input into a small range first, so the
// texture survives on a phone instead of collapsing into flat bands.
precision highp float;

varying vec2 vUv;

uniform sampler2D uField;       // R = face, G = white halo, B = black keyline
uniform vec2  uResolution;
uniform float uAspect;
uniform float uTime;

uniform sampler2D uMoire;   // the real moire interference plate, tiled
uniform sampler2D uGrain;   // the real fine-grain plate
uniform sampler2D uDust;    // the real dust specks, tiled
uniform float uTexture;     // surface strength
uniform float uSeparation;  // per-channel moire offset — print misregistration
uniform vec2  uCursor;      // pointer in uv
uniform float uCursorOn;    // eased presence, 0..1
uniform float uSwim;        // S3: cursor-driven counter-rotation of the moire
uniform float uParallax;    // how far the plates drift toward the pointer, in uv
uniform float uPull;        // magnetism: how hard the whole word leans in
uniform vec2  uMoireScale;  // how many times the plate tiles across the card
uniform vec2  uGrainScale;
uniform vec2  uDustScale;
uniform float uThreshold;   // the source's Threshold, as a crush on the ground

uniform vec3  uGround;
uniform vec3  uInk;
uniform vec3  uPaper;
uniform vec3  uFringe;

uniform vec2  uLevels;      // input black / white points
uniform float uVibrance;

// Still needed for the final dither only — the surface itself is now sampled
// from the real template plates rather than generated.
float hash(vec2 p){
  p = mod(p, 137.0);
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
// ── Image-editor blend modes, written out exactly ──────────────────────────────
// Not approximated with a mix(): these curves are the difference between
// "looks a bit like the reference" and "is the reference".
float hardLight(float base, float blend){
  return blend < 0.5
    ? 2.0 * base * blend
    : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
}
float linearLight(float base, float blend){
  return clamp(base + 2.0 * blend - 1.0, 0.0, 1.0);
}

// Levels with gamma 1.0 — the source has no midtone shift, so this is a pure
// contrast crush and there is no pow() to pay for.
vec3 levels(vec3 c, float lo, float hi){
  return clamp((c - lo) / max(hi - lo, 0.0001), 0.0, 1.0);
}

// Vibrance, not saturation: it lifts muted channels far harder than saturated
// ones, so a hot ground gains almost nothing while the fringe gains a lot. Plain
// saturation clips the ground to a flat primary and kills the printed quality.
vec3 vibrance(vec3 c, float amt){
  float mx = max(c.r, max(c.g, c.b));
  float mn = min(c.r, min(c.g, c.b));
  float sat = mx - mn;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(lum), c, 1.0 + amt * (1.0 - sat));
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * vec2(uAspect, 1.0);

  // ── PARALLAX ──────────────────────────────────────────────────────────────
  // The three plates drift toward the pointer at DIFFERENT rates, so the letter,
  // its white halo and its shadow separate slightly and the type reads as a
  // stack of layers rather than one flat print.
  //
  // THE UV IS SHIFTED, THE MASK IS NOT REBUILT, and that distinction is the
  // whole reason this can be smooth. The letters live on a fixed lattice, so
  // moving them WITHIN the grid means either resampling the block edges
  // (soft, shimmering staircase) or snapping in whole 9px cells (a visible
  // lurch). Sliding the sample point instead moves the entire rasterised plate
  // as one rigid sheet: every block keeps the exact shape it was built with, and
  // the motion is free of the grid because nothing is re-quantised.
  //
  // Tiny on purpose — a couple of pixels at most. Enough that the layers breathe
  // when you move; small enough that the poster never looks like it is sliding.
  // MAGNETISM. The word as a whole leans toward the pointer, strongest when the
  // cursor is near it and relaxing as you move away — so it reads as attraction
  // rather than as the card tracking your mouse everywhere.
  //
  // Measured from the FRAME CENTRE, not per pixel: a per-pixel pull would warp
  // the letterforms (near cells dragged further than far ones), and warping is
  // the one thing a lattice cannot survive. One vector for the whole plate keeps
  // every block rigid and just moves the sheet.
  vec2 fromMid = uCursor - vec2(0.5, 0.5);
  float grip = 1.0 - smoothstep(0.0, 0.75, length(fromMid * vec2(uAspect, 1.0)));
  vec2 pull = fromMid * uPull * grip * uCursorOn;

  vec2 toCur = (uCursor - uv) * uCursorOn * uParallax + pull;
  // The shadow moves most, the face least: the further a layer is from the
  // surface, the more a viewpoint change should shift it.
  float face = texture2D(uField, uv - toCur * 0.35).r;
  float halo = texture2D(uField, uv - toCur * 0.70).g;
  float key  = texture2D(uField, uv - toCur * 1.00).b;

  // ── THE GROUND SURVIVES ───────────────────────────────────────────────────
  vec3 col = uGround;

  // ── THE THRESHOLD, doing its real job ─────────────────────────────────────
  // In the source this is a Threshold 150 in color burn, and it only deepens the
  // ground where the print is already dark — it does not create the letterforms.
  // Modelled as a mild darkening of the ground's own shadows.
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col *= mix(1.0, 0.86, smoothstep(uThreshold, uThreshold - 0.35, lum));

  // ── THE LETTERS, painted back to front ────────────────────────────────────
  // Widest first, exactly as the two stroke effects stack: the black keyline is
  // 103px where the white halo is 73px, so the black shows as a band beyond the
  // white rather than sitting under it.
  col = mix(col, uInk, key);
  col = mix(col, uPaper, halo);
  col = mix(col, uInk, face);

  // ── THE SURFACE, OVER EVERYTHING ──────────────────────────────────────────
  // The three real texture layers from the template, in their own blend modes.
  //
  // THIS RUNS AFTER THE LETTERS, and the order is not a detail. In the source
  // the Textures group sits ABOVE the Effect group, so the surface falls across
  // the whole poster — the white halo and the black keyline included. Applying
  // it to the ground and then painting clean type on top leaves the letters
  // looking like flat vector laid on a printed background, and the most obvious
  // tell in the reference is that the white faces are just as printed as the red.
  //
  // The plates are sampled at a scale that keeps the moire's measured pitch
  // (~28px at 4500 wide, so ~0.6% of the width) rather than stretching the image
  // to fit — stretch it and the interference pattern changes frequency, which is
  // the one property that makes it read as moire at all.
  // ── S3 — THE MOIRE SWIMS ──────────────────────────────────────────────────
  // The plate is TWO curved gratings beating against each other, and that is
  // what makes this worth doing: interference is enormously sensitive to the
  // angle between its gratings. Sampling the plate a second time, rotated by a
  // fraction of a degree around the cursor, and taking the darker of the two
  // shifts the beat pattern across the whole surface. A rotation far too small
  // to see as a rotation produces a visible change in where the bands land.
  //
  // Rotating the WHOLE surface instead would just spin the texture, which reads
  // as the poster turning. Beating two nearly-identical samples is what makes
  // the pattern itself move while the print stays put.
  vec2 mUV = uv * uMoireScale;
  vec2 dUV = uv * uDustScale;

  float swimD = length((uv - uCursor) * vec2(uAspect, 1.0));
  // Falls off with distance, so the surface churns under your hand and is still
  // out at the edges — a local disturbance rather than a global animation.
  // A TIGHT falloff. At 0.55 the disturbance covered most of the card, which is
  // what made it read as a shape following the cursor rather than as the surface
  // reacting where you touch it.
  float swimAmt = smoothstep(0.22, 0.0, swimD) * uCursorOn * uSwim;
  float a = swimAmt * 0.055;                       // radians: ~3 degrees at most
  float cs = cos(a), sn = sin(a);
  vec2 about = uCursor * uMoireScale;
  vec2 rel = mUV - about;
  vec2 mUV2 = about + vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs);
  // ── COLOUR SEPARATION ─────────────────────────────────────────────────────
  // The moire sampled three times, one per channel, each offset by a fraction of
  // a tile along the stripe direction. A print out of register — and because the
  // offset is tied to the plate rather than the screen, the fringe rides the
  // interference pattern instead of floating over it.
  //
  // Small: at more than a texel or two this stops reading as registration drift
  // and starts reading as a 3D-glasses effect.
  vec2 sep = vec2(0.0022, 0.0009) * uSeparation;
  // BLEND BETWEEN THE TWO SAMPLES — DO NOT take min() of them.
  //
  // min() was the first attempt, on the reasoning that two overlaid physical
  // screens both block light. That reasoning is wrong in a way that is obvious
  // in hindsight: the minimum of two draws from the same distribution is
  // systematically DARKER than either draw (about 0.05 lower for this plate), so
  // it does not merely move the interference, it drops the brightness of the
  // whole region. With a wide falloff that paints a large dark disc under the
  // pointer — a grey blob that has nothing to do with moire.
  //
  // Mixing keeps the mean exactly where it was. The rotated sample still shifts
  // where the bands fall, which is the entire effect, but the surface does not
  // get darker for being disturbed.
  float mA = texture2D(uMoire, mUV).r;
  float mB = texture2D(uMoire, mUV2).r;
  float moire = mix(mA, mB, swimAmt);
  vec3 moireRGB = vec3(
    mix(texture2D(uMoire, mUV + sep).r, texture2D(uMoire, mUV2 + sep).r, swimAmt),
    moire,
    mix(texture2D(uMoire, mUV - sep).r, texture2D(uMoire, mUV2 - sep).r, swimAmt)
  );
  // The fine grain is its OWN plate from the template (the linear-light layer), not a
  // resample of the moire. They are genuinely different images — one is
  // structured interference, the other is per-pixel noise — and standing one in
  // for the other was a shortcut that showed.
  float grain = texture2D(uGrain, uv * uGrainScale).r;
  float dust  = texture2D(uDust, dUV).r;

  float t = uTexture;
  // 1) the moire, HARD LIGHT. The template layer is 30% opacity, but that is 30% of a
  //    plate composited in the image editor's own colour pipeline — here it sits over a
  //    fully saturated ground where a 30% mix only swings the value by ~0.07,
  //    which is on the edge of visible at 8-bit. Taken up to where the print
  //    actually reads.
  vec3 h1 = vec3(
    hardLight(col.r, moireRGB.r),
    hardLight(col.g, moireRGB.g),
    hardLight(col.b, moireRGB.b)
  );
  col = mix(col, h1, 0.72 * t);

  // 2) the fine grain, LINEAR LIGHT.
  vec3 l2 = vec3(linearLight(col.r, grain), linearLight(col.g, grain), linearLight(col.b, grain));
  col = mix(col, l2, 0.55 * t);

  // A SIGNED GRAIN on top, because both blend modes go nearly silent on white.
  // Hard light and linear light CLIP at 1.0, so on a white letter face every
  // value above 0.5 does nothing and the paper can only ever darken — the grain
  // lands about half as strong on the type as on the ground, which is the
  // opposite of the reference, where the white faces are the most obviously
  // printed part of the poster.
  col += (grain - 0.5) * 0.16 * t;
  col += (moire - 0.5) * 0.10 * t;

  // 3) the dust, SCREEN
  col = 1.0 - (1.0 - col) * (1.0 - dust * 0.45 * t);

  // ── EDGE FRINGE ───────────────────────────────────────────────────────────
  // The coloured speckle the source shows along the quantised boundary — a
  // registration artefact of the print. Confined to the band between the halo
  // and the face, so it clings to the block edges rather than dusting the frame.
  float rim = clamp(halo - face, 0.0, 1.0);
  float speck = step(0.62, hash(floor(p * uResolution.y * 0.6) + 3.0));
  col += uFringe * rim * speck * 0.22 * uTexture;

  // ── FINISH ────────────────────────────────────────────────────────────────
  col = levels(col, uLevels.x, uLevels.y);
  col = vibrance(col, uVibrance);
  col += (hash(uv * 1024.0 + fract(uTime)) - 0.5) * (1.5 / 255.0);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

// Voice wave (https://design.how/vault/voice-wave), shaders.ts.
// FIXED. Change the VARIABLE values in params instead (PALETTE, PHRASES, ZOOM).
export const PALETTE: readonly [number, number, number][] = [
  [0.26, 0.18, 1.0],
  [0.74, 0.17, 0.96],
  [1.0, 0.22, 0.52],
  [1.0, 0.66, 0.22],
];
export const ZOOM = 0.62;
const v3 = (c: readonly number[]) => `vec3(${c.map((n) => n.toFixed(3)).join(", ")})`;

export const VERT = `#version 300 es
void main(){
  vec2 v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

export const FRAG = `#version 300 es
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uLow;     // 0..1 band energies
uniform float uMid;
uniform float uHigh;
uniform float uLevel;   // 0..1 overall loudness (drives amplitude + brightness)
uniform float uPresence;// 0..1 fades the whole thing in when the card comes alive
uniform float uWake;    // 0 = resting (idle breath), 1 = listening (full bloom)
uniform float uWakeLag; // uWake delayed ~120ms; drives dispersion only, so the
                        // colour blooms just AFTER the bend rather than with it
uniform vec3  uPaper;   // page background, so the glow composites onto the site
uniform float uDark;    // 1 = glow on dark, 0 = ink on light

out vec4 outColor;

const float PI = 3.14159265359;

// The four dispersion samples.
//
// The original uses a full wavelength->RGB ramp (pure red, green, green, blue).
// That is physically the honest thing to do, but it is also every rainbow shader
// ever written, and the four primaries average to a muddy green wherever they
// overlap — which is most of the ribbon.
//
// So this is a chosen PALETTE instead of a spectrum: a violet -> magenta -> coral
// ramp. The four still sum to a neutral core (the
// shader divides by the summed hue), so the un-bent middle of the ribbon stays
// bright and colourless and the split only shows where the wave actually bends.
vec3 spectral4(int s){
  // The stops have to be SPREAD, not merely different: the shader divides by the
  // summed hue, so what survives is each stop's deviation from the palette mean.
  // Four close violets average out to grey no matter how nice they look listed.
  vec3 c0 = ${v3(PALETTE[0])};  // blue-violet
  vec3 c1 = ${v3(PALETTE[1])};  // purple
  vec3 c2 = ${v3(PALETTE[2])};  // magenta
  vec3 c3 = ${v3(PALETTE[3])};  // warm coral
  return s == 0 ? c0 : s == 1 ? c1 : s == 2 ? c2 : c3;
}

// The ribbon's centre line at a given x and phase.
//
// Not a single sine: a fundamental plus a SECOND HARMONIC at an incommensurate
// frequency, drifting at its own rate. One sine undulates — it is too clean, and
// the eye reads it as a maths curve. Adding a smaller, faster partial makes the
// line RIPPLE, with peaks that are never quite the same height twice, which is
// what a real voice-driven wave looks like.
float waveY(float x, float amp, float env, float drift, float harm){
  float fundamental = sin(x * 1.1 + drift);
  // 2.3x is deliberately not a whole multiple, so the two never re-align into a
  // repeating shape; the extra 0.6 drift rate keeps the partial travelling too.
  float partial = sin(x * 2.53 + drift * 1.6 + 1.7);

  // A slow travelling swell along x, so the two halves of the ribbon are never
  // equally energetic at the same moment.
  //
  // The wave already MOVES — sin(x*1.1 + drift) travels. What made it read as
  // mechanical is that its envelope does not: the containment term is cos(|x|),
  // perfectly mirrored about the centre, so both ends always swell by exactly the
  // same amount and the shape stays balanced whatever the phase does. This breaks
  // that symmetry by letting a broad crest of emphasis drift across the width, so
  // one side leads and the other answers. Small (±14%) — enough to stop it
  // looking machined, not enough to look lopsided.
  float tilt = 1.0 + 0.14 * sin(x * 0.42 - drift * 0.6);

  return amp * env * tilt * (fundamental + harm * partial);
}

// Softly-varying line thickness: thin at the tapered ends, fattest in the middle,
// swelling a touch with the mid band. A constant thickness reads as a tube; a
// varying one reads as a brushstroke that was drawn with pressure.
float thicknessAt(float xN, float uMid){
  float taper = 1.0 - 0.55 * clamp(abs(xN) * 0.75, 0.0, 1.0);
  return (0.020 + 0.016 * taper) * (1.0 + 0.35 * uMid);
}

// One full pass of the spectral ribbon, so the reflection can reuse it verbatim.
// "soften" widens the glow and the caller scales the amplitude down, which is all
// the reflection needs to read as a blurrier copy in a surface.
vec3 ribbon(vec2 p, float aspect, float amp, float spread, float drift,
            float harm, float uMid, float uLevel, float soften){
  float xN  = p.x / max(aspect, 1.0);
  float env = cos(PI * 0.5 * min(abs(0.92 * xN), 1.0));
  env *= env;

  float thick = thicknessAt(xN, uMid) * soften;
  float soft  = (0.020 + 0.012 * uMid) * soften;
  float inten = 0.019 * (1.0 + 0.7 * uLevel);

  float yMain = waveY(p.x, amp, env, drift, harm);

  vec3 num = vec3(0.0), den = vec3(0.0);
  for (int s = 0; s < 4; s++){
    vec3 hue = spectral4(s);
    den += hue;
    // phase offset per copy: this is the dispersion. -spread..+spread across s.
    float ab = mix(-spread, spread, float(s) / 3.0);
    float yL = waveY(p.x, amp + 0.03 * uMid, env, drift + ab, harm);

    float d    = abs(p.y - yL);
    // Lorentzian core — the 1/d falloff IS the glow, so it stays. But its tail
    // never reaches zero, and four copies plus a reflection stack that residue
    // into a visible fog far from the wave. A wide gaussian window trims only the
    // far end: at d=0.2 it costs nothing, by d=1.2 it has cleared the haze.
    float line = inten / (sqrt(d * d + soft * soft) + thick);
    line *= exp(-d * d);

    // Fill between the main line and this copy, so the ribbon reads as a lit body
    // rather than separate wires. INSIDE the pair this is flat; outside it has to
    // die fast, so the falloff is exponential rather than 1/d.
    //
    // 1/d is unbounded: at a full unit away it is still ~10% of peak, and with
    // every copy contributing that, the background silts up into a soapy haze.
    // An exponential keeps the body and kills the tail — 29% one notch out,
    // effectively nothing by 0.4.
    float lo = min(yMain, yL), hi = max(yMain, yL);
    float dB = max(0.0, max(p.y - hi, lo - p.y));
    // (scaled by inten, like the line, so loudness still drives the body)
    float band = 4.9 * inten * exp(-dB / (0.08 * soften));

    num += hue * (line + band);
  }
  // Divide by a SCALAR, not per-channel. The original divides by the summed hue
  // vector, which forces anywhere the four samples overlap to neutral — correct
  // for a full spectrum (white core, coloured fringes), but fatal for a chosen
  // palette, because the overlap is most of the ribbon and it all goes grey.
  // A scalar divide keeps the palette's own colour everywhere and lets the
  // dispersion read as a shift WITHIN that family.
  float denS = (den.r + den.g + den.b) / 3.0;
  vec3 col = num / max(denS, 1e-5);

  // The main line again on top, uncoloured — keeps a bright neutral core so the
  // ribbon does not turn into pure rainbow mush at high spread.
  float dM = abs(p.y - yMain);
  col += 0.42 * inten / (sqrt(dM * dM + soft * soft) + thick);

  return col;
}

// Cheap value noise, for the film grain.
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main(){
  vec2 R = uRes;
  float aspect = R.x / R.y;
  // centred coords, x scaled by aspect so the wave keeps its shape at any width
  vec2 p = (gl_FragCoord.xy + 0.5) * 2.0 / R - 1.0;
  p.x *= aspect;
  float yScreen = p.y;
  p /= ${ZOOM.toFixed(3)};                     // zoom: how much of the wave fills the card

  float t = uTime;

  // ── awake vs resting ──────────────────────────────────────────────────────
  // uWake is 0 when nothing is driving the wave and 1 when it is listening. At
  // rest the ribbon nearly flattens and just breathes; waking makes it bloom.
  // Without this there is no visual difference between waiting and listening, and
  // the moment you turn the mic on lands on nothing.
  float wake = clamp(uWake, 0.0, 1.0);
  float rest = 1.0 - wake;

  // ── the wave ──────────────────────────────────────────────────────────────
  // Amplitude answers the low band (the body of a voice), the aberration spread
  // answers the highs (sibilance splits the colours further). At rest both fall
  // back to a small idle value so the line is calm but never dead.
  float idleBreath = 0.030 + 0.016 * sin(t * 0.9) * sin(t * 0.41 + 1.0);
  float amp    = mix(idleBreath, 0.20 + 0.34 * uLow, wake) * uPresence;
  // Dispersion rides the LAGGED wake, so the colours separate a beat after the
  // wave swings. Amplitude and spread answering the same value on the same frame
  // made the shape and its rainbow move as one object; splitting them is what
  // gives the ribbon depth.
  float lag    = clamp(uWakeLag, 0.0, 1.0);
  float spread = mix(0.55, 2.2 + 1.6 * uHigh + 0.6 * uMid, lag) * uPresence;
  float harm   = mix(0.10, 0.34 + 0.22 * uHigh, wake);

  float xN    = p.x / max(aspect, 1.0);
  float drift = t * mix(0.9, 2.1, wake);   // rests slower, speeds up awake
  float ends  = exp(-pow(xN * 1.55, 2.0));

  // ── the ribbon, and its reflection ────────────────────────────────────────
  vec3 col = ribbon(p, aspect, amp, spread, drift, harm, uMid, uLevel, 1.0);

  // Mirror about a surface line just below the ribbon. Reusing the same pass with
  // a flipped y is what makes it read as the SAME light rather than a second
  // object: it ripples in step, disperses in step, and answers the voice in step.
  // Wider glow + lower amplitude + a fast fade with depth do the rest.
  const float SURFACE = 0.50;
  vec2 rp = vec2(p.x, 2.0 * SURFACE - p.y);
  vec3 refl = ribbon(rp, aspect, amp * 0.86, spread, drift, harm, uMid, uLevel, 2.1);
  // A reflection only exists BELOW the surface. Clamping depth at 0 left the fade
  // at a flat 1.0 for every pixel above the line, so the mirrored wave was drawn
  // at full strength across the whole upper half — the stray lines above the
  // ribbon. This gates it to the lower side and fades it with distance from the
  // surface, which is what a reflection actually does.
  float underSurface = smoothstep(0.0, 0.16, p.y - SURFACE);
  float depth = clamp((p.y - SURFACE) / 0.95, 0.0, 1.0);
  col += refl * 0.52 * underSurface * (1.0 - depth) * (1.0 - depth);

  // Gamma-ish shaping: pushes the dim tail down and the core up, which is what
  // makes it read as light rather than a smear.
  col = pow(max(col, 0.0), vec3(1.45));

  // ── containment ───────────────────────────────────────────────────────────
  // Fade toward the card edges, and taper the ends horizontally. The bottom fade
  // starts later than the top one so it does not clip the reflection off halfway
  // — the wave has nothing above it but a whole mirrored copy below.
  float above = smoothstep(1.0, 0.34, -yScreen);
  float below = smoothstep(1.06, 0.52, yScreen);
  float edge  = yScreen < 0.0 ? above : below;
  col *= edge * ends * uPresence;

  // ── composite ─────────────────────────────────────────────────────────────
  // The original renders on black, where the wave IS the light and you just show
  // it directly. On white paper that inverts: adding light to a page that is
  // already at 1.0 blows straight out and the wave vanishes. So on light the glow
  // composites SUBTRACTIVELY — as pigment density on paper. The intensity says how
  // much light the ribbon takes away, and its hue says which wavelengths survive,
  // so a red-leaning part of the wave removes cyan and reads red. Same dispersion,
  // legible on white.
  vec3 outc;
  if (uDark > 0.5) {
    // On a dark page the wave is the light: add it to the page colour.
    outc = clamp(uPaper + col, 0.0, 1.0);
  } else {
    float dens = clamp(max(max(col.r, col.g), col.b) * 1.9, 0.0, 1.0);
    // normalised colour direction — which channel this part of the wave favours
    vec3 hue = col / max(max(max(col.r, col.g), col.b), 1e-6);
    // 0.55 keeps some ink in the favoured channel too, so the ribbon stays a
    // colour rather than a fully saturated primary.
    outc = uPaper * (1.0 - dens * (1.0 - hue * 0.55));
    outc = clamp(outc, 0.0, 1.0);
  }

  // ── grain ─────────────────────────────────────────────────────────────────
  // Dense film grain, soft-light blended. Takes the digital edge off these very
  // wide gradients, which otherwise look plasticky on a light page.
  float g = hash21(gl_FragCoord.xy * 0.75 + fract(uTime) * 91.7);
  // soft light: darkens below 0.5, lightens above, so it textures without
  // shifting the overall value of the paper.
  vec3 sl = outc * (1.0 - 2.0 * (g - 0.5) * outc) + (2.0 * (g - 0.5)) * sqrt(max(outc, 0.0));
  outc = mix(outc, clamp(sl, 0.0, 1.0), 0.055);

  // dither — these are wide, very smooth gradients and 8-bit banding shows badly
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  outc += (n - 0.5) / 255.0;

  outColor = vec4(outc, 1.0);
}`;

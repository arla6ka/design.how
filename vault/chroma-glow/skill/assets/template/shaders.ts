// Chromatic glow (https://design.how/vault/chroma-glow), shaders.ts.
// FIXED. Change the VARIABLE values in params instead (HERO_CYCLE, CHROMA_PRESETS, split, bloom, spectral).
export const FULL_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const BLUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;   // per-tap step (texel * radius) along one axis

void main() {
  // 9-tap Gaussian weights (sigma ~ 2), normalized.
  float w0 = 0.2270270270;
  float w1 = 0.1945945946;
  float w2 = 0.1216216216;
  float w3 = 0.0540540541;
  float w4 = 0.0162162162;
  vec4 c = texture2D(uTex, vUv) * w0;
  c += texture2D(uTex, vUv + uDir * 1.0) * w1;
  c += texture2D(uTex, vUv - uDir * 1.0) * w1;
  c += texture2D(uTex, vUv + uDir * 2.0) * w2;
  c += texture2D(uTex, vUv - uDir * 2.0) * w2;
  c += texture2D(uTex, vUv + uDir * 3.0) * w3;
  c += texture2D(uTex, vUv - uDir * 3.0) * w3;
  c += texture2D(uTex, vUv + uDir * 4.0) * w4;
  c += texture2D(uTex, vUv - uDir * 4.0) * w4;
  gl_FragColor = c;
}
`;

export const COMPOSITE_FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uMask;    // crisp white silhouette (the core)
uniform sampler2D uB0;      // bloom level 0 (tightest)
uniform sampler2D uB1;
uniform sampler2D uB2;
uniform sampler2D uB3;      // bloom level 3 (widest halo)
uniform vec2  uSplit;       // chromatic aberration offset (uv units), cursor/auto driven
uniform float uBloom;       // overall bloom gain
uniform vec3  uWarm;        // warm/yellow tint  (yellow/blue preset)
uniform vec3  uCool;        // cool/blue tint
uniform vec3  uRed;         // red/cyan fringe tint
uniform float uCore;        // brightness of the crisp white core
uniform vec3  uBg;          // background tint (dark wall, or light wall if inverted)
uniform float uInvert;      // 0 = dark wall + glowing word, 1 = light wall + dark press
uniform float uNoise;       // grain amount 0..1
uniform float uTime;        // for animated grain
uniform float uAspect;      // w/h, to keep the split + vignette round
uniform vec2  uResolution;
uniform float uSpectral;    // 0..1 how much true prism rainbow rides over the base split
uniform vec2  uCursor;      // pointer position in uv (0..1)
uniform float uCursorOn;    // 0..1 eased cursor presence over the card
uniform float uDisperse;    // 0..1 cycle transition: blooms the word out into a soft haze

// cheap hash noise for the lo-fi grain
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

// smooth value noise (bilinear-interpolated hash) — soft blotches, not per-pixel dither.
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // smoothstep the cell
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// a minimal but richer wall texture, centred around 0. Kept very subtle — just enough that
// the dark background reads as a soft, lit surface with depth instead of flat grain:
//   - 3-octave fbm gives gentle cloudy mottling (large soft blotches + a little fine break-up)
//   - a slow, large-scale diagonal drift so the surface feels hand-finished, not tiled
// The amplitude is low; the caller scales it down further. No hard edges, no obvious pattern.
float wallTex(vec2 uv, vec2 res) {
  vec2 p = uv * vec2(res.x / res.y, 1.0);        // square the domain so blotches aren't stretched
  float fbm =
      vnoise(p * 2.4) * 0.55 +
      vnoise(p * 5.1 + 11.0) * 0.30 +
      vnoise(p * 11.7 + 3.0) * 0.15;
  // a broad, slowly-varying sheen across the panel (one very low-freq octave), so one side
  // of the wall sits a touch lighter — a soft raking light rather than uniform fill.
  float sheen = vnoise(p * 0.9 + 5.0);
  return (fbm - 0.5) * 0.8 + (sheen - 0.5) * 0.5;
}

// the summed multi-radius bloom sampled at an offset (one "channel"). CONCENTRATED:
// the tight core levels carry most of the weight; the wide halo is only a faint skirt,
// so the glow hugs the letters instead of washing the whole card out.
float bloomAt(vec2 uv) {
  float b = 0.0;
  b += texture2D(uB0, uv).r * 0.85;  // tightest -> most of the glow
  b += texture2D(uB1, uv).r * 0.55;
  b += texture2D(uB2, uv).r * 0.22;
  b += texture2D(uB3, uv).r * 0.10;  // widest halo -> just a faint skirt
  return b;
}

// A palette-anchored spectral ramp: 0 = warm end, 1 = cool end, with the fringe tint
// as the midpoint. Instead of 3 hard tints this gives a smooth colour walk across the
// halo, so the split reads as a soft rainbow edge rather than a flat colour cast.
vec3 spectralTint(float u) {
  u = clamp(u, 0.0, 1.0);
  if (u < 0.5) return mix(uWarm, uRed, u * 2.0);
  return mix(uRed, uCool, (u - 0.5) * 2.0);
}

// TRUE prism dispersion, kept MINIMAL: the aberration grows with distance from the word
// centre (real glass fans outward), and we take a few taps across the spectrum along the
// split direction. Small radius + few taps => a refined rainbow rim, not a busy smear.
vec3 spectralFringe(vec2 uv, vec2 split) {
  // radial gain: ~1 near centre, a touch more toward the edges (clamped so it stays soft)
  vec2 fromC = (uv - 0.5) * vec2(uAspect, 1.0);
  float disp = 0.6 + 0.9 * clamp(length(fromC), 0.0, 1.0);
  vec2 step = split * disp;
  vec3 acc = vec3(0.0);
  // 5 evenly-spaced taps from -1 (warm) to +1 (cool); the fringe colour sits in the middle
  const int N = 5;
  for (int i = 0; i < N; i++) {
    float f = float(i) / float(N - 1);        // 0..1
    float off = (f - 0.5) * 2.0;              // -1..1
    float b = bloomAt(uv + step * off);
    acc += spectralTint(f) * b;
  }
  return acc / float(N);
}

void main() {
  // LIQUID SHIMMER: a whisper-amplitude uv warp driven by slow noise, so the word
  // and its glow gently wobble like molten metal instead of a dead silhouette. The warp
  // is domain-distorted (noise of noise) for an organic, non-directional ripple and kept
  // extremely small (~0.15% of the frame) so it never smears the letters.
  vec2 uv = vUv;
  float wx = vnoise(uv * 4.0 + vec2(uTime * 0.13, uTime * 0.05));
  float wy = vnoise(uv * 4.0 + vec2(7.0 - uTime * 0.06, 3.0 + uTime * 0.11));
  uv += (vec2(wx, wy) - 0.5) * 0.0016;

  // ---- CYCLE DISPERSE & RE-FORM: the transition is made entirely of the effect's OWN
  // language — bloom + split — not a glitch. uDisperse (0 at rest, 1 at mid-swap) spreads
  // the chromatic split WIDE so the warm/cool copies pull far apart, melts the crisp core,
  // and lifts the bloom, so the old word blooms out into a soft coloured haze; at the peak
  // the word swaps under the cloud; then uDisperse falls and the new word condenses back
  // out of the light as the split collapses to rest. Smooth, glowy, in-style. ----
  vec2 s = uSplit;
  float disp = uDisperse;                         // 0..1 dispersion strength this frame
  // spread the split RADIALLY outward from centre (a prism blooming apart), plus a slow
  // swirl so the haze has a little organic drift rather than a pure zoom.
  vec2 fromMid = (uv - 0.5) * vec2(uAspect, 1.0);
  float rr = length(fromMid) + 0.0001;
  vec2 radial = fromMid / rr;
  float ang = uTime * 0.6;
  vec2 swirl = vec2(radial.x * cos(ang) - radial.y * sin(ang),
                    radial.x * sin(ang) + radial.y * cos(ang));
  // during dispersion the split grows (copies drift apart) and gains the radial/swirl
  // direction, so the word softens into a gentle rainbow haze instead of tearing. Kept
  // WEAK — the word stays put and just breathes, it never flies far out.
  s += mix(radial, swirl, 0.5) * disp * 0.022;
  s *= 1.0 + disp * 0.9;
  // no per-channel tear anymore — the split alone carries the whole transition.
  vec2 tearW = vec2(0.0), tearC = vec2(0.0), tearR = vec2(0.0);

  // CURSOR POOL: a soft aspect-correct falloff around the pointer. It does NOT move the
  // word — it just brightens the bloom + widens the rainbow locally, so the light lifts
  // where you hover and settles back when you leave. Gentle radius, eased by presence.
  vec2 cAsp = vec2(uAspect, 1.0);
  vec2 toCur = uv * cAsp - uCursor * cAsp;
  float cd = length(toCur);
  float pool = smoothstep(0.34, 0.0, cd) * uCursorOn;   // 1 at cursor -> 0 by ~0.34

  // HOVER LIFE: near the pointer the light behaves like a disturbed liquid, not just a
  // brighter spot. Two small touches, both fading out with the pool:
  //  1. a soft concentric RIPPLE pushes the sampled uv in/out radially around the cursor,
  //     so the glow ripples as if the pointer pressed into it.
  //  2. the split gains a component that leans ALONG the cursor->centre direction, so the
  //     rainbow tilts toward where you are (felt, but it never drags the whole word).
  if (pool > 0.001) {
    vec2 rdir = toCur / max(cd, 0.0001);
    float ripple = sin(cd * 46.0 - uTime * 5.0) * pool * 0.0022;
    uv += (rdir / cAsp) * ripple;
    s += (rdir / cAsp) * pool * 0.010;                  // split leans toward the cursor
  }

  // Chromatic aberration: sample the bloom three times, each pushed a different way, so
  // the tinted copies pull apart at the edges:
  //   warm  ->  +split
  //   cool  ->  -split
  //   fringe -> perpendicular split (a second, weaker fringe)
  // These are SCALAR intensities per channel, tinted then blended below.
  float bw = bloomAt(uv + s + tearW);
  float bc = bloomAt(uv - s + tearC);
  float br = bloomAt(uv + vec2(-s.y, s.x) * 0.6 + tearR);

  // Coloured glow, tone-mapped with a soft rolloff so the letter bodies don't clip to
  // flat white. 1 - exp(-x) saturates gently toward the tint's own colour. A small
  // amount of the TRUE spectral fringe (radial prism, multi-tap) is mixed into the raw
  // energy so the halo edge gains a soft rainbow without changing the overall colour.
  vec3 baseRaw = (uWarm * bw + uCool * bc + uRed * br);
  // near the cursor, widen the rainbow (more spectral) and lift the glow (more energy).
  // during dispersion gently widen the spectral rainbow + lift the bloom a touch, so the
  // word softly breathes rather than blowing into a big cloud. Kept weak.
  float specAmt = clamp(uSpectral + pool * 0.4 + disp * 0.25, 0.0, 1.0);
  vec3 raw = mix(baseRaw, spectralFringe(uv, s), specAmt * 0.55) * uBloom * (1.0 + pool * 0.9 + disp * 0.45);
  vec3 glow = vec3(1.0) - exp(-raw);
  // the crisp white core softens as the word disperses (loses its hard edge into the bloom)
  // but never fully vanishes, so it stays readable while it re-forms.
  float core = texture2D(uMask, uv).r * (1.0 - disp * 0.75);

  // shared: vignette + a minimal plaster grain so the wall reads as a real surface
  vec2 vc = (uv - 0.5) * vec2(uAspect, 1.0);
  float vig = smoothstep(1.05, 0.35, length(vc));
  float tex = wallTex(uv, uResolution);
  float g = hash(uv * uResolution * 0.5 + uTime);

  // LIVING WALL: a very slow caustic drift so the dark background breathes instead of
  // sitting dead. Two counter-scrolling low-freq noise fields beat against each other;
  // the result is tiny (a few % of the wall value) and tinted by the palette below.
  float ca = vnoise(uv * vec2(uAspect, 1.0) * 2.3 + vec2(uTime * 0.012, uTime * 0.008));
  float cb = vnoise(uv * vec2(uAspect, 1.0) * 3.7 - vec2(uTime * 0.009, uTime * 0.014));
  float caustic = (ca * cb - 0.25);   // centred-ish, mostly small

  // ---- DARK mode: dark wall + glowing word (additive) ----
  vec3 rimC = vec3(uCore) * smoothstep(0.35, 0.55, core) * (1.0 - smoothstep(0.6, 0.9, core));
  vec3 glowD = glow;
  glowD += rimC;
  glowD += (g - 0.5) * uNoise * (0.4 + 0.6 * length(glowD));
  glowD *= mix(0.82, 1.0, vig);
  // base wall + a soft mottle/sheen: multiply for the darker blotches, plus a gentle additive
  // lift on the bright side of the sheen so the surface has light on it (not only shadow).
  vec3 wallD = uBg * mix(0.82, 1.08, vig) * (1.0 + tex * 0.35) + uBg * max(tex, 0.0) * 0.25;
  // palette-tinted caustic light on the wall (stronger toward the darker outer field, so it
  // never fights the glow): the wall clearly shimmers in the word's own colours instead of
  // sitting as a flat near-black panel.
  vec3 causticTint = normalize(uWarm + uCool + 0.0001);
  wallD += causticTint * caustic * 0.09 * (1.0 - vig * 0.4);
  vec3 outD = wallD + glowD;

  // ---- LIGHT mode: dark word with the SAME soft bloom, as a dark tinted haze ----
  // This is dark mode's look inverted: the same soft multi-radius bloom (bw/bc/br) drives
  // everything, so the word carries the same blurry glow — but here it DARKENS the light
  // wall toward each split colour instead of adding light. Because we use the soft bloom
  // (not the crisp mask), the edges are soft + glowy, and the warm/cool offsets give the
  // coloured chromatic haze. A crisp dark core sits under it so the letters stay legible.
  vec3 wallL = uBg * mix(1.0, 0.94, 1.0 - vig);       // light wall, faintly darker at edges
  wallL += tex * 0.018;                               // faint mottle/sheen (subtle on paper)

  // the soft bloom, tinted + split, as a "darken amount" per channel (same tone-map as
  // dark mode). glowL is bright/coloured near the word, ~0 out on the wall.
  vec3 rawL = mix(baseRaw, spectralFringe(uv, s), specAmt * 0.55) * uBloom * (1.0 + pool * 0.9);
  vec3 glowL = vec3(1.0) - exp(-rawL);
  // darken the wall toward the COMPLEMENT of the glow colour, weighted by how strong the
  // glow is here -> a soft warm haze on one side, cool on the other, fading into the wall.
  vec3 pressed = wallL * (vec3(1.0) - glowL * 0.9);

  // a crisp dark core so the letters read solid (the soft bloom alone is too faint to be
  // legible as text). Uses the plain mask, pressed to near-black.
  float ink = smoothstep(0.4, 0.62, core);
  pressed *= mix(1.0, 0.1, ink);
  pressed += (g - 0.5) * uNoise * 0.4;                // grain
  vec3 outL = pressed;

  vec3 outc = mix(outD, outL, uInvert);
  gl_FragColor = vec4(outc, 1.0);
}
`;

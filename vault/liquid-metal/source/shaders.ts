export const METAL_VERT = `
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const METAL_FRAG = `
precision highp float;

varying vec2 vUV;

uniform sampler2D uField; // R crisp coverage, G round height (the liquid surface)
uniform vec2  uTexel;
uniform vec2  uTilt;      // cursor-driven reflection tilt
uniform float uAspect;
uniform float uTime;
// metal ramp: 5 stops (sky, horizon-light, horizon-dark, ground, base)
uniform vec3  uS0;
uniform vec3  uS1;
uniform vec3  uS2;
uniform vec3  uS3;
uniform vec3  uS4;
uniform vec3  uSpark;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

// combined height = macro bulge (G) + a little micro-surface (B). The micro term adds
// fine curvature so the reflection has life; kept small so the surface stays smooth (#1).
float heightAt(vec2 uv){
  vec4 f = texture2D(uField, uv);
  return f.g + f.b * 0.18;
}

// SMOOTH continuous metal reflection (#2). Instead of a 5-stop PIECEWISE-LINEAR ramp
// (which has slope kinks at every stop -> visible bands), blend the 5 preset colours
// with a SMOOTHSTEP (Hermite) basis so the horizon is one continuous curve with no
// discontinuities. Same 5 control colours, but C1-smooth between them.
vec3 ramp(float t){
  t = clamp(t, 0.0, 1.0);
  float x = t * 4.0;                    // 0..4 across the 5 stops
  vec3 col = uS0;
  col = mix(col, uS1, smoothstep(0.0, 1.0, clamp(x - 0.0, 0.0, 1.0)));
  col = mix(col, uS2, smoothstep(0.0, 1.0, clamp(x - 1.0, 0.0, 1.0)));
  col = mix(col, uS3, smoothstep(0.0, 1.0, clamp(x - 2.0, 0.0, 1.0)));
  col = mix(col, uS4, smoothstep(0.0, 1.0, clamp(x - 3.0, 0.0, 1.0)));
  return col;
}

// Reflect->ramp coordinate: turn an env direction into the vertical reflection coord
// with the horizon sharpen baked in. Shared by the sharp + blurry reflection layers.
float envT(vec2 env){
  float t = clamp(0.5 - env.y * 0.9, 0.0, 1.0);
  t = t + (t - 0.5) * 0.35 * (1.0 - abs(env.x));   // sharpen the horizon line
  return clamp(t, 0.0, 1.0);
}

// filmic-ish tone map (#7): soft-clip the summed HDR layers so stacked highlights
// COMPRESS (staying metal-coloured) instead of hard-clipping to flat white.
vec3 toneMap(vec3 c){
  return c / (c + vec3(0.85)) * 1.85;   // Reinhard-ish, tuned to keep mids bright
}

// smooth 2-octave value-noise flow field, for the living backdrop + metal reflection.
float fbm(vec2 p){
  return noise(p) * 0.6 + noise(p * 2.1 + 4.0) * 0.3 + noise(p * 4.3 + 9.0) * 0.1;
}

// A DARK environment whose PALETTE is DERIVED FROM THE ACTIVE RAMP (uS0/uS3/uS4/uSpark),
// so the background follows each colorway and crossfades with it (the ramp uniforms are
// eased on the CPU). Slow morphing pools drift through it (an oil-slick aurora); because
// the metal also reflects this field, background + effect are one coherent environment.
// The word sits in a soft dark vignette so it stays the focus.
vec3 background(vec2 uv){
  vec2 p = uv * vec2(uAspect, 1.0);
  float t = uTime * 0.08;
  // two slowly-warping flow fields -> where each colour pool sits, morphing over time
  float f1 = fbm(p * 1.4 + vec2(t, -t * 0.7));
  float f2 = fbm(p * 1.9 + vec2(-t * 0.8, t) + f1);
  // pools built FROM THE PRESET, darkened to a moody-room level so it stays minimal.
  vec3 poolA = uS0   * 0.16;               // sky tint
  vec3 poolB = uS3   * 0.5;                // ground tint (usually the richest hue)
  vec3 poolC = uSpark* 0.1;                // accent glint tint
  vec3 col = uS4 * 0.04 + vec3(0.015);     // near-black base, faintly the metal's base hue
  col = mix(col, poolA, smoothstep(0.35, 0.75, f1));
  col = mix(col, poolB, smoothstep(0.4, 0.85, f2));
  col = mix(col, poolC, smoothstep(0.6, 0.95, f1 * f2 * 1.6));
  // a soft radial softbox behind the word, tinted by the preset's sky.
  vec2 c = (uv - vec2(0.5, 0.44)) * vec2(uAspect, 1.0);
  float radial = 1.0 - smoothstep(0.0, 0.95, length(c));
  col += (uS0 * 0.08 + vec3(0.02)) * radial;

  // ---- STUDIO cues that tie the room to the metal (minimal, all very faint). All are
  // tinted by the PRESET's sky/horizon colours so they follow + crossfade with it. ----
  vec3 studioTint = mix(uS0, uS1, 0.4);
  // 1) a soft REFLECTED HORIZON band low in the frame — the studio floor line the metal
  //    reflects, so the void feels like a real (if dark) room, not flat black.
  float horizon = 1.0 - smoothstep(0.0, 0.16, abs(uv.y - 0.30));
  col += studioTint * 0.09 * horizon * 0.6;
  // 2) a slow drifting CAUSTIC light streak (a soft diagonal ray, like light through a
  //    window). One faint band that glides — gives the emptiness gentle structure.
  float ray = uv.x * uAspect * 0.5 + uv.y - fract(uTime * 0.03) * 2.0;
  col += studioTint * 0.07 * (1.0 - smoothstep(0.0, 0.22, abs(ray - 0.4))) * 0.5 * radial;
  // 3) a subtle TEMPERATURE split so the backdrop isn't monochrome: the preset sky on one
  //    side, its warm spark accent on the other.
  float temp = clamp((uv.x - uv.y) * 0.5 + 0.5, 0.0, 1.0);
  col += mix(uS0 * 0.03, uSpark * 0.03, temp) * radial;

  // dark vignette to the corners so the metal is the focus
  col *= mix(0.45, 1.0, radial);
  // fine grain
  col += (noise(p * 320.0) - 0.5) * 0.012;
  return col;
}

void main() {
  vec2 uv = vUV;

  // SUPER-WEAK PARALLAX: the word drifts a couple px toward the cursor on hover, over
  // the fixed background, for a hair of depth. uTilt is the eased cursor offset (0 at
  // rest), so this is zero until you hover and eases back on leave. Tiny on purpose.
  vec2 wuv = uv - uTilt * 0.012;

  float crisp = texture2D(uField, wuv).r;
  float height = heightAt(wuv);

  vec3 bg = background(uv);

  // ---- CONTACT SHADOW: a soft dark pool under the word so it doesn't float. Sample the
  // coverage a bit BELOW-on-screen (lower uv.y, the field is unflipped) at growing
  // offsets for a soft falloff. Only darkens the backdrop — never touches the metal. ----
  float shadow = 0.0;
  shadow += texture2D(uField, wuv - vec2(0.004, 0.03)).g * 0.5;
  shadow += texture2D(uField, wuv - vec2(0.006, 0.055)).g * 0.3;
  shadow += texture2D(uField, wuv - vec2(0.008, 0.085)).g * 0.2;
  bg *= 1.0 - clamp(shadow, 0.0, 1.0) * 0.6;

  // Keep the FLUFFY blurred edge (that's the poured-liquid look) — just don't let it
  // spread quite so far. The composite edge below trims the very faint blur tail so the
  // letters are puffy but not obese, without going hard-clipped/sharp.
  if (height < 0.01) {
    gl_FragColor = vec4(bg, 1.0);
    return;
  }

  // ---- SMOOTH SUPERSAMPLED NORMAL (#1, #9) ----
  // A single 8-bit height blur gives stair-stepped normals. We reconstruct the normal
  // from an 8-tap gradient over TWO rings (a near + a wider ring) and average them, which
  // supersamples the derivative -> a continuous, glassy surface with no contour steps.
  float g1 = 1.6, g2 = 3.4;
  // near ring
  float aL = heightAt(wuv - vec2(g1,0.)*uTexel), aR = heightAt(wuv + vec2(g1,0.)*uTexel);
  float aD = heightAt(wuv - vec2(0.,g1)*uTexel), aU = heightAt(wuv + vec2(0.,g1)*uTexel);
  // wider ring (smooths the low-frequency shape)
  float bL = heightAt(wuv - vec2(g2,0.)*uTexel), bR = heightAt(wuv + vec2(g2,0.)*uTexel);
  float bD = heightAt(wuv - vec2(0.,g2)*uTexel), bU = heightAt(wuv + vec2(0.,g2)*uTexel);
  vec2 slope = (vec2(aR - aL, aU - aD) * 0.6 + vec2(bR - bL, bU - bD) * 0.4) * 22.0;
  vec3 N = normalize(vec3(-slope.x, -slope.y, 1.0));

  // ---- reflection setup: reflect the view vector off N, add cursor tilt + churn ----
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 R = reflect(-V, N);
  // LIQUID-METAL RESTING CHURN: a slow flow-noise field rolls the reflection over the
  // letters like molten metal, plus a slow overall orbit.
  float tt = uTime;
  vec2 fp = uv * vec2(uAspect, 1.0) * 1.6;
  vec2 flow = vec2(
    fbm(fp + vec2(tt * 0.25, height * 3.0)) - 0.5,
    fbm(fp + vec2(-tt * 0.2 + 5.0, tt * 0.15)) - 0.5
  ) * 0.55;
  flow += vec2(sin(tt * 0.31) * 0.1, cos(tt * 0.24) * 0.08);
  vec2 env = R.xy + uTilt + flow;

  // ---- TWO-LAYER ENVIRONMENT REFLECTION (#3): a SHARP mirror reflection + a BLURRY
  // (rough) reflection, mixed. The sharp layer gives the crisp horizon; the blurry layer
  // is a soft body glow that removes hardness and reads as real polished (not mirror-
  // perfect) metal. The blur is done by averaging the ramp over jittered env directions. */
  vec3 sharpRefl = ramp(envT(env));
  vec3 blurRefl = vec3(0.0);
  const int NB = 6;
  for (int i = 0; i < NB; i++) {
    float a = float(i) / float(NB) * 6.2831853;
    vec2 j = vec2(cos(a), sin(a)) * 0.14;        // roughness radius in env space
    blurRefl += ramp(envT(env + j));
  }
  blurRefl /= float(NB);
  // roughness: a hair rougher on the flanks (steeper normal) than on the flat faces.
  float rough = 0.4 + 0.25 * clamp(length(slope), 0.0, 1.0);
  vec3 metal = mix(sharpRefl, blurRefl, rough);

  // reflect the iridescent BACKDROP too (ties bg <-> effect), on the reflective mids.
  float tMid = envT(env);
  vec3 envColor = background(clamp(uv + env * 0.35, 0.0, 1.0));
  float envMix = (1.0 - abs(tMid - 0.5) * 2.0) * 0.3;
  metal = mix(metal, metal + envColor * 2.0, envMix);

  // horizontal sky streak across the metal (soft).
  float streak = smoothstep(0.35, 0.5, abs(env.x + sin(env.y*3.0)*0.1));
  metal += (1.0 - streak) * 0.1 * uS1;

  // ---- FRESNEL RIM: edges of the bulge catch a bright reflection ----
  float fres = pow(1.0 - N.z, 2.2);
  metal += fres * uS1 * 0.45;

  // ---- BLINN-PHONG SPECULAR HOTSPOT (#5, #6): one moving KEY light. A tight bright spot
  // slides across the bulges as the surface curves = the single biggest "wet real metal"
  // cue. The light orbits slowly. #6: the highlight is stretched ANISOTROPICALLY along x
  // for a faint brushed-liquid streak (uAniso small -> mostly round). ----
  vec3 keyDir = normalize(vec3(cos(tt * 0.22) * 0.7, 0.5 + sin(tt * 0.18) * 0.3, 0.9));
  vec3 Hh = normalize(keyDir + V);
  // anisotropy: squash the half-vector's x contribution so the lobe elongates on x.
  vec3 Na = normalize(vec3(N.x * 0.6, N.y, N.z));
  float ndh = max(dot(Na, Hh), 0.0);
  float spec = pow(ndh, 120.0);                 // tight, glossy hotspot
  metal += spec * uSpark * 1.3;
  // a second, broader soft specular for the "sheen" body (keeps it from looking dry).
  metal += pow(max(dot(N, Hh), 0.0), 16.0) * uS1 * 0.25;

  // ---- traveling SHINE sweep (soft moving light band) ----
  float sweepPos = fract(uTime * 0.16);
  float diag = (uv.x * uAspect + (1.0 - uv.y)) * 0.42;
  float band = 1.0 - smoothstep(0.0, 0.06, abs(diag - sweepPos * 1.4 + 0.2));
  float facing = clamp(N.x * -0.6 + N.y * 0.6 + 0.4, 0.0, 1.0);
  metal += band * facing * uSpark * 0.5;

  // ---- SPARKS: sharp star glints at the brightest high-curvature ridges ----
  float curv = length(slope);
  float bright = smoothstep(0.62, 1.0, tMid) * smoothstep(0.4, 1.2, curv);
  float tw = 0.5 + 0.5 * sin(uTime * 2.0 + height * 40.0 + uv.x * 30.0);
  metal += bright * tw * tw * uSpark * 1.1;

  // ---- AMBIENT OCCLUSION in the crevices (#4): where coverage is high but the height
  // is LOW (the valleys where strokes meet / the letter interiors dip), darken the metal
  // so it has real depth. Uses the macro height directly. ----
  float ao = smoothstep(0.15, 0.7, texture2D(uField, wuv).g); // 0 in valleys, 1 on crowns
  metal *= 0.7 + ao * 0.3;

  // edge deboss so the metal reads as a raised liquid slab.
  float face = smoothstep(0.3, 0.55, crisp);
  metal *= 0.86 + face * 0.14;

  // fine grain (surface micro-texture).
  metal += (noise(uv * vec2(uAspect,1.0) * 520.0) - 0.5) * 0.035;

  // ---- TONE MAP (#7): soft-clip the summed layers so stacked highlights compress and
  // keep their metal tint instead of blowing to flat white. ----
  vec3 c = toneMap(metal);
  // DITHER (#8) AFTER tone-map: sub-LSB noise removes any residual 8-bit banding.
  c += (hash(uv * 1024.0 + fract(uTime)) - 0.5) * (1.5 / 255.0);
  c = clamp(c, 0.0, 1.0);

  // composite over the backdrop with the soft fluffy liquid edge.
  float aa = smoothstep(0.16, 0.4, height);
  gl_FragColor = vec4(mix(bg, c, aa), 1.0);
}
`;

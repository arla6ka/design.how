// Realistic emboss (https://design.how/vault/emboss), shaders.ts.
// FIXED. Change the VARIABLE values in params instead (STYLES, REST_ANGLE, GRUNGE_AMT, BUILTIN_SVGS).
export const EMBOSS_VERT = `
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const EMBOSS_FRAG = `
precision highp float;

varying vec2 vUV;

uniform sampler2D uField;   // R = crisp coverage, G = blurred height (bevel ramp)
uniform sampler2D uPlaster; // real plaster surface
uniform sampler2D uGrunge;  // paper/grunge overlay
uniform float uGrungeAmt;
uniform vec2  uTexel;       // 1/fieldSize
uniform vec2  uLight;       // bevel light dir xy
uniform float uLightZ;
uniform vec2  uWash;        // hovered-panel wash center (cursor)
uniform float uHover;       // hovered panel index (-1 = none)
// per-panel style (3 panels): x=panel0, y=panel1, z=panel2
uniform vec3  uDepth;       // relief strength per panel
uniform vec3  uHi;          // highlight opacity per panel
uniform vec3  uSh;          // shadow opacity per panel
uniform vec3  uContrast;    // plaster grain punch per panel
uniform vec3  uBright;      // brightness per panel
uniform vec3  uTint0;       // panel tints
uniform vec3  uTint1;
uniform vec3  uTint2;
uniform vec3  uTexScale;    // plaster zoom per panel
uniform vec2  uTexOff0;     // plaster sample offset per panel
uniform vec2  uTexOff1;
uniform vec2  uTexOff2;
uniform float uReveal;
uniform float uAspect;

// panel columns in x (must match PANELS in text-mask.ts)
const vec2 P0 = vec2(0.02, 0.333);
const vec2 P1 = vec2(0.347, 0.653);
const vec2 P2 = vec2(0.667, 0.98);
// panels span this y band (vertical inset), rest is white card
const float PY0 = 0.16;
const float PY1 = 0.84;
const float RADIUS = 0.02; // rounded-corner softness in uv

float plasterAt(vec2 uv){ return texture2D(uPlaster, uv).r; }
float heightAt(vec2 uv){ return texture2D(uField, uv).g; }

// which panel (0/1/2) is uv.x in, or -1 outside all
int panelOf(float x){
  if (x >= P0.x && x <= P0.y) return 0;
  if (x >= P1.x && x <= P1.y) return 1;
  if (x >= P2.x && x <= P2.y) return 2;
  return -1;
}

void main() {
  vec2 uv = vUV;
  vec3 white = vec3(0.985);

  int panel = panelOf(uv.x);
  // vertical panel band
  float inY = step(PY0, uv.y) * step(uv.y, PY1);
  if (panel < 0 || inY < 0.5) { gl_FragColor = vec4(white, 1.0); return; }

  vec2 col2 = panel == 0 ? P0 : (panel == 1 ? P1 : P2);
  vec3 tint = panel == 0 ? uTint0 : (panel == 1 ? uTint1 : uTint2);
  // per-panel style params (pick component by panel index)
  float depth    = panel == 0 ? uDepth.x    : (panel == 1 ? uDepth.y    : uDepth.z);
  float hiAmt    = panel == 0 ? uHi.x       : (panel == 1 ? uHi.y       : uHi.z);
  float shAmt    = panel == 0 ? uSh.x       : (panel == 1 ? uSh.y       : uSh.z);
  float contrast = panel == 0 ? uContrast.x : (panel == 1 ? uContrast.y : uContrast.z);
  float bright   = panel == 0 ? uBright.x   : (panel == 1 ? uBright.y   : uBright.z);
  float texScale = panel == 0 ? uTexScale.x : (panel == 1 ? uTexScale.y : uTexScale.z);
  vec2  texOff   = panel == 0 ? uTexOff0    : (panel == 1 ? uTexOff1    : uTexOff2);

  // soft rounded edge of the panel (antialiased against the white card)
  float edgeX = min(uv.x - col2.x, col2.y - uv.x);
  float edgeY = min(uv.y - PY0, PY1 - uv.y);
  float edge = smoothstep(0.0, RADIUS, min(edgeX, edgeY));

  // --- word bevel ---
  float gstep = 1.0;
  float hL = heightAt(uv - vec2(gstep, 0.0) * uTexel);
  float hR = heightAt(uv + vec2(gstep, 0.0) * uTexel);
  float hD = heightAt(uv - vec2(0.0, gstep) * uTexel);
  float hU = heightAt(uv + vec2(0.0, gstep) * uTexel);
  float crisp = texture2D(uField, uv).r;
  vec2 slope = vec2(hR - hL, hU - hD) * depth * 16.0 * uReveal;
  vec3 N = normalize(vec3(-slope.x, -slope.y, 1.0));
  float bevel = clamp(length(slope), 0.0, 1.0);

  vec3 L = normalize(vec3(uLight, uLightZ));
  float diff = dot(N, L);
  float hi = pow(max(diff, 0.0), 1.2) * bevel;
  float sh = pow(max(-diff, 0.0), 1.0) * bevel;

  // --- plaster surface, DIFFERENT slice + tint per panel ---
  // Sample a sub-window of the plaster: zoom in by texScale (>=1 -> a smaller slice)
  // and pan by texOff, but CLAMP the window inside [0,1] so it never wraps. Using a
  // clamped sub-rect (not fract) removes the hard vertical/horizontal seams the wrap
  // used to create, and stops the texture tiling across the panel.
  float zoom = max(1.0, texScale);
  vec2 span = vec2(1.0 / zoom);           // size of the sampled window in tex space
  vec2 origin = clamp(texOff, 0.0, 1.0) * (1.0 - span); // keep the window in range
  vec2 puv = origin + uv * span;
  float p = texture2D(uPlaster, puv).r;
  p = clamp((p - 0.5) * contrast + 0.5, 0.0, 1.0);
  vec3 base = tint * p * bright;

  // deboss the glyph face
  float face = smoothstep(0.4, 0.62, crisp);
  base *= mix(1.0, 0.86, face * uReveal);

  vec3 c = base;
  c += hi * hiAmt * uReveal;   // per-panel highlight rim
  c -= sh * shAmt * uReveal;   // per-panel shadow

  // hovered panel: a weak directional wash follows the cursor
  if (uHover > float(panel) - 0.5 && uHover < float(panel) + 0.5) {
    vec2 tp = uv * vec2(uAspect, 1.0);
    float d = distance(tp, uWash * vec2(uAspect, 1.0));
    c += (0.5 - clamp(d * 0.9, 0.0, 1.0)) * 0.1;
  }

  // paper/grunge overlay inside the panel
  float gr = texture2D(uGrunge, uv).r;
  vec3 ov = mix(2.0 * c * gr, 1.0 - 2.0 * (1.0 - c) * (1.0 - gr), step(0.5, c));
  c = mix(c, ov, uGrungeAmt);
  c = clamp(c, 0.0, 1.0);

  // composite the panel over the white card with the soft rounded edge
  vec3 outc = mix(white, c, edge);
  gl_FragColor = vec4(outc, 1.0);
}
`;

export const PG_VERT = `
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main(){ vUV = aUV; gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

export const PG_FRAG = `
precision highp float;
varying vec2 vUV;

uniform sampler2D uField;   // R crisp, G blurred height
uniform sampler2D uPlaster;
uniform sampler2D uGrunge;
uniform float uGrungeAmt;
uniform vec2  uTexel;
uniform vec2  uLight;       // from angle + altitude
uniform float uLightZ;
uniform float uDepth;
uniform float uHi;
uniform float uSh;
uniform float uContrast;
uniform float uBright;
uniform vec3  uTint;
uniform vec2  uTexOff;
uniform float uTexScale;
uniform float uReveal;
uniform float uAspect;

void main(){
  vec2 uv = vUV;

  float gs = 1.0;
  float hL = texture2D(uField, uv - vec2(gs,0.0)*uTexel).g;
  float hR = texture2D(uField, uv + vec2(gs,0.0)*uTexel).g;
  float hD = texture2D(uField, uv - vec2(0.0,gs)*uTexel).g;
  float hU = texture2D(uField, uv + vec2(0.0,gs)*uTexel).g;
  float crisp = texture2D(uField, uv).r;
  vec2 slope = vec2(hR-hL, hU-hD) * uDepth * 16.0 * uReveal;
  vec3 N = normalize(vec3(-slope.x, -slope.y, 1.0));
  float bevel = clamp(length(slope), 0.0, 1.0);

  vec3 L = normalize(vec3(uLight, uLightZ));
  float diff = dot(N, L);
  float hi = pow(max(diff,0.0), 1.2) * bevel;
  float sh = pow(max(-diff,0.0), 1.0) * bevel;

  // clamped sub-window of the plaster (zoom + pan, no fract wrap) so there is no
  // seam and the texture never tiles across the panel.
  float zoom = max(1.0, uTexScale);
  vec2 span = vec2(1.0 / zoom);
  vec2 origin = clamp(uTexOff, 0.0, 1.0) * (1.0 - span);
  vec2 puv = origin + uv * span;
  float p = texture2D(uPlaster, puv).r;
  p = clamp((p-0.5)*uContrast + 0.5, 0.0, 1.0);
  vec3 base = uTint * p * uBright;

  float face = smoothstep(0.4, 0.62, crisp);
  base *= mix(1.0, 0.86, face * uReveal);

  vec3 c = base;
  c += hi * uHi * uReveal;
  c -= sh * uSh * uReveal;

  float gr = texture2D(uGrunge, uv).r;
  vec3 ov = mix(2.0*c*gr, 1.0-2.0*(1.0-c)*(1.0-gr), step(0.5, c));
  c = mix(c, ov, uGrungeAmt);

  gl_FragColor = vec4(clamp(c,0.0,1.0), 1.0);
}
`;

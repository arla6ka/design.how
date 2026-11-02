// Word stickers (https://design.how/vault/word-stickers), peel-shaders.ts.
// FIXED. Change the VARIABLE values in params instead (STICKERS, GRAB_SCALE, THROW_SCALE, FRICTION, BOUNCE, PEEL_ELEVATION).
export const PEEL_VERT =  `
  attribute vec2 aPosition; // -0.5..0.5 quad space
  attribute vec2 aUV;       // 0..1

  uniform vec2  uGrabUV;    // where the pointer grabbed (uv)
  uniform vec2  uAnchorUV;  // the far anchor the peel rolls toward (uv)
  uniform float uFraction;  // 0..1 peel progress
  uniform float uElevation; // max z lift
  uniform float uPullback;  // how much the lifted part pulls back along the axis
  uniform float uAspect;    // width/height, to keep the pullback isotropic
  uniform vec2  uDragOffset;// xy shift while dragging (quad space)
  uniform mat4  uProj;

  varying vec2  vUV;
  varying float vLift;
  varying vec3  vWorldPos;  // for normal reconstruction in the fragment shader

  float smooth01(float x){ x = clamp(x,0.0,1.0); return x*x*(3.0-2.0*x); }

  // A moving window: as uFraction goes 0→1 the lifted band sweeps from the grab
  // (t=0) outward to t=1. Vertices behind the front are fully lifted, so a real fold
  // rolls across and a corner curls up.
  float valueAt(float fraction, float t){
    float windowSize = 0.85;
    float front = mix(-windowSize, 1.0, fraction);
    float w = clamp((t - front) / windowSize, 0.0, 1.0);
    return 1.0 - smooth01(w);
  }

  void main(){
    vUV = aUV;
    vec3 pos = vec3(aPosition, 0.0);

    vec2 axis = uAnchorUV - uGrabUV;
    float axisLen2 = max(dot(axis, axis), 1e-4);
    float tSigned = dot(aUV - uGrabUV, axis) / axisLen2;
    float t = clamp(abs(tSigned), 0.0, 1.0);

    float lift = valueAt(uFraction, t);
    pos.z += lift * uElevation;

    // curl: pull the lifted part back along the peel axis
    vec2 axisDir = axis / sqrt(axisLen2);
    vec2 shift = vec2(axisDir.x * uAspect, axisDir.y) * lift * uPullback;
    pos.xy -= shift;
    pos.xy += uDragOffset;

    vLift = lift;
    vWorldPos = pos;
    gl_Position = uProj * vec4(pos, 1.0);
  }
`;

export const PEEL_FRAG =  `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform sampler2D uTex;
  uniform float uAlphaCutoff;
  varying vec2  vUV;
  varying float vLift;
  varying vec3  vWorldPos;

  void main(){
    vec4 tex = texture2D(uTex, vUV);
    if (tex.a < uAlphaCutoff) discard;

    // Reconstruct the real surface normal from the peeled geometry (screen-space
    // derivatives of the world position), then light it with one directional light
    // + ambient — a plain, realistic shade, no rainbow/holographic tint. The flat
    // (unlifted) part keeps its normal facing the camera, so it renders unchanged;
    // the curled part turns away and shades naturally.
    vec3 dpx = dFdx(vWorldPos);
    vec3 dpy = dFdy(vWorldPos);
    vec3 N = normalize(cross(dpx, dpy));
    if (N.z < 0.0) N = -N; // face the camera

    vec3 L = normalize(vec3(-0.35, 0.5, 0.8)); // key light from upper-left-front
    float diff = clamp(dot(N, L), 0.0, 1.0);
    // ambient so shadows never go black; light scales gently around 1.0 so a flat
    // sticker (N≈+z, diff≈0.72) reads at full color and the curl darkens/brightens.
    float shade = 0.72 + 0.5 * diff;

    // a soft specular glint on the steepest part of the curl (backing sheen), subtle
    vec3 V = vec3(0.0, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float spec = pow(clamp(dot(N, H), 0.0, 1.0), 24.0) * vLift * 0.25;

    vec3 rgb = clamp(tex.rgb * shade + spec, 0.0, 1.0);
    gl_FragColor = vec4(rgb, tex.a);
  }
`;

export const PEEL_FRAG_FALLBACK =  `
  precision highp float;
  uniform sampler2D uTex;
  uniform float uAlphaCutoff;
  varying vec2  vUV;
  varying float vLift;

  void main(){
    vec4 tex = texture2D(uTex, vUV);
    if (tex.a < uAlphaCutoff) discard;
    // more lift → more turned away from the light → a touch darker, with a small
    // brighten right at the start of the fold. Plain shading, no tint.
    float shade = 1.0 - vLift * 0.22 + smoothstep(0.0, 0.25, vLift) * 0.08;
    gl_FragColor = vec4(clamp(tex.rgb * shade, 0.0, 1.0), tex.a);
  }
`;

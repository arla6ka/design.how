// Folder embroidery (https://design.how/vault/folder-embroidery), shaders.ts.
// FIXED. Change the VARIABLE values in params instead (WORDS, FABRIC, WEAVE_SCALE, REST_ANGLE, LIGHT_Z).
export const EMB_VERT = `
attribute vec2 aPosition;
attribute vec2 aUV;
varying vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const EMB_FRAG = `
// Request highp, but MANY mobile GPUs silently give mediump in the fragment stage. All
// the math below is kept mediump-safe (small coordinates into hash/sin), so the fabric
// texture + grain survive on phones instead of collapsing to a flat shadow.
precision highp float;

varying vec2 vUV;

uniform sampler2D uArt;   // RGB: the flat colored scene (cloth + ink + border)
uniform sampler2D uField; // R coverage/puff, G ink mask, B border ring
uniform sampler2D uWeave; // grayscale fabric weave, tiled
uniform vec2  uTexel;     // 1/fieldSize
uniform vec2  uLight;     // bevel light dir xy (sweeps on hover)
uniform float uLightZ;
uniform vec2  uWash;      // cursor pos for the relight wash
uniform float uHover;     // 0..1 hover amount
uniform float uPress;     // 0..1 press amount (patches press into the cloth on click)
uniform vec2  uPressPos;  // press center (0..1)
uniform float uAspect;    // card aspect (w/h)
uniform vec3  uFabric;    // background cloth color
uniform float uDepth;     // puff relief strength
uniform float uWeaveScale;// weave tiles across the card

// mediump-safe hash: WRAP the cell coord into a small range (mod 137) before the
// sin(dot(...)) so the argument to sin never blows up on mobile (where huge sin args
// return garbage). This is what keeps the grain/mottle alive on phones.
float hash(vec2 p){
  p = mod(p, 137.0);
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p){
  // fold the domain so integer cells stay small (mediump-safe) — the pattern still
  // reads as random at the scales we use it.
  p = mod(p, 137.0);
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
// weave sample: fract() the tiled coord ourselves so REPEAT works identically whether
// the GPU treats the coords as highp or mediump (large coords lose precision on mobile).
float weaveAt(vec2 uv){ return texture2D(uWeave, fract(uv * vec2(uAspect,1.0) * uWeaveScale)).r; }

void main() {
  vec2 uv = vUV;
  vec2 texel = uTexel;

  vec4 fld = texture2D(uField, uv);
  float cover = fld.r; // patch coverage / puff ramp
  float inkM  = fld.g; // dark lettering
  float ringM = fld.b; // white merrow border
  float stitchAng = fld.a * 3.14159; // satin-stitch run direction (0..pi)

  // ---- fabric background (dark cloth + weave + soft mottle + grain) ----
  // The TEXTURE comes primarily from the real WEAVE sample (a texture lookup, which is
  // precision-independent), so the fabric stays textured on mobile even if the noise
  // math degrades. The noise adds soft mottle + grain on top.
  vec2 dp = uv * vec2(uAspect, 1.0);
  float bw = weaveAt(uv + vec2(0.37, 0.11));
  float blotch = noise(dp * 3.0) * 0.1 + noise(dp * 7.0) * 0.05;
  vec3 fabric = uFabric * (0.72 + bw * 0.6 + (blotch - 0.075)); // stronger weave weight
  fabric += (noise(dp * 240.0) - 0.5) * 0.025;
  vec3 col = fabric;

  // press falls off with distance from the click point, so only the patch(es) under
  // the cursor react — the fabric surface itself never moves.
  float pdist = distance(uv * vec2(uAspect, 1.0), uPressPos * vec2(uAspect, 1.0));
  float pressLocal = uPress * (1.0 - smoothstep(0.0, 0.5, pdist));

  // ---- drop shadow: the patches lift off the fabric (tight, close contact shadow).
  // A local press FLATTENS it (offset shrinks + darkens less) so the patch reads as
  // pushed down into the cloth right where you clicked, then it springs back. ----
  float lift = 1.0 - pressLocal * 0.85;
  vec2 shOff = vec2(6.0, -6.0) * texel * lift;
  float shc = texture2D(uField, uv - shOff).r;
  col = mix(col, col * mix(0.42, 0.62, pressLocal), smoothstep(0.2, 0.8, shc) * 0.8);

  if (cover < 0.004) { gl_FragColor = vec4(col, 1.0); return; }

  // ---- weave-driven thread normal (fine stitches) + patch puff bevel ----
  float w0 = weaveAt(uv);
  float wL = weaveAt(uv - vec2(1.,0.)*texel), wR = weaveAt(uv + vec2(1.,0.)*texel);
  float wD = weaveAt(uv - vec2(0.,1.)*texel), wU = weaveAt(uv + vec2(0.,1.)*texel);
  vec2 wslope = vec2(wR - wL, wU - wD) * 22.0;
  vec3 Nw = normalize(vec3(-wslope.x, -wslope.y, 1.0));
  // patch puff (from the blurred coverage in R)
  float cL = texture2D(uField, uv - vec2(1.,0.)*texel).r, cR = texture2D(uField, uv + vec2(1.,0.)*texel).r;
  float cD = texture2D(uField, uv - vec2(0.,1.)*texel).r, cU = texture2D(uField, uv + vec2(0.,1.)*texel).r;
  vec2 pslope = vec2(cR - cL, cU - cD) * uDepth * 16.0;
  vec3 Np = vec3(-pslope.x, -pslope.y, 1.0);
  float bevel = clamp(length(pslope), 0.0, 1.0);
  vec3 N = normalize(Np + Nw * 2.0);

  vec3 L = normalize(vec3(uLight, uLightZ));
  float diff = dot(N, L);
  float hi = pow(max(diff, 0.0), 1.25);
  float sh = pow(max(-diff, 0.0), 1.1);

  // ---- the pre-colored art, modulated by the weave (over/under threads) ----
  vec3 art = texture2D(uArt, uv).rgb;
  vec3 c = art * (0.72 + w0 * 0.6);

  // ---- SATIN STITCH: parallel thread rows running along stitchAng. This is the
  // single biggest "embroidery not graffiti" cue: tight bright/dark bands across each
  // shape, perpendicular to the thread run, so light rakes over rows of thread. ----
  float sc = cos(stitchAng), ss = sin(stitchAng);
  // coordinate across the stitch rows (perpendicular to the run direction)
  float across = (dp.x * ss - dp.y * sc);
  float rows = across * 260.0;                 // stitch row frequency
  // WRAP the phase into [0, 2pi) before sin so the satin bands are identical under
  // mediump (mobile) and highp (desktop) — sin() of a large arg is imprecise on phones.
  float TWO_PI = 6.2831853;
  float satin = sin(mod(rows, TWO_PI));
  // rounded thread ridges + a little jitter so rows aren't ruler-straight
  float ridge = 0.5 + 0.5 * satin;
  ridge = pow(ridge, 1.4);
  float jit = noise(vec2(floor(rows), (dp.x*sc+dp.y*ss)*90.0)) * 0.25;
  float satinShade = mix(0.82, 1.14, clamp(ridge + jit*ridge, 0.0, 1.0));
  // apply satin only on cloth (not the flat ink letters, which are one dark thread mass)
  float clothFace = cover * (1.0 - inkM);
  c *= mix(1.0, satinShade, clothFace * 0.9 + ringM * 0.6);

  // ink letters read matte/darker; white border bead a touch brighter + its own satin
  c *= 1.0 - inkM * 0.05;

  // ---- light the thread (weave normal, tilt slightly along the satin run) ----
  c += hi * 0.46 * (0.5 + bevel * 0.5);
  c -= sh * 0.36;
  // inner shadow at the patch edge — tighter band
  float edge = 1.0 - smoothstep(0.0, 0.32, cover);
  c *= 1.0 - edge * 0.28 * cover;
  // fine thread noise
  c += (noise(dp * 380.0) - 0.5) * 0.045;

  // hover: a tight SPECULAR GLINT that travels the satin threads near the cursor, so
  // the floss sparkles as you move over it. The glint rides the satin ridge (bright
  // thread crowns) and falls off with distance from the pointer -> a moving highlight,
  // not a flat wash.
  if (uHover > 0.001) {
    float d = distance(dp, uWash * vec2(uAspect, 1.0));
    float halo = 1.0 - smoothstep(0.0, 0.42, d);          // soft pool around the cursor
    float crown = smoothstep(0.72, 1.0, ridge);           // only the raised thread crowns
    float glint = halo * halo * (0.35 + crown * 0.9) * uHover;
    c += glint * 0.16 * cover;
  }

  // PRESS DENT: where pressed, the patch is pushed into the cloth — it darkens a touch
  // and its thread highlights dim (less light reaches a recessed surface). Patch-only
  // (multiplied by cover), so the fabric stays put.
  c *= 1.0 - pressLocal * 0.16 * cover;

  c = clamp(c, 0.0, 1.0);
  // crisper patch edge (tighter AA) so it reads as a cut patch, not an airbrush
  float aa = smoothstep(0.06, 0.2, cover);
  gl_FragColor = vec4(mix(col, c, aa), 1.0);
}
`;

const CNOISE3 = `
float latticeHash(vec3 c) {
  vec3 q = fract(c * vec3(0.7548777, 0.5698403, 0.6180340));
  q = fract(q * (q.yzx + 0.4310) * 571.3);
  q = fract(q * (q.zxy + 0.1897) * 433.7);
  return fract(q.x + q.y + q.z);
}
float cornerRamp(vec3 i, vec3 f, vec3 o) {
  vec3 c = i + o;
  float z = latticeHash(c) * 2.0 - 1.0;
  float a = latticeHash(c + vec3(17.0, 31.0, 47.0)) * 6.2831853;
  float r = sqrt(max(0.0, 1.0 - z * z));
  return dot(vec3(r * cos(a), r * sin(a), z), f - o);
}
float cnoise(vec3 p) {
  p *= 0.9;
  vec3 i = floor(p);
  vec3 f = p - i;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float x00 = mix(cornerRamp(i, f, vec3(0.0, 0.0, 0.0)), cornerRamp(i, f, vec3(1.0, 0.0, 0.0)), u.x);
  float x10 = mix(cornerRamp(i, f, vec3(0.0, 1.0, 0.0)), cornerRamp(i, f, vec3(1.0, 1.0, 0.0)), u.x);
  float x01 = mix(cornerRamp(i, f, vec3(0.0, 0.0, 1.0)), cornerRamp(i, f, vec3(1.0, 0.0, 1.0)), u.x);
  float x11 = mix(cornerRamp(i, f, vec3(0.0, 1.0, 1.0)), cornerRamp(i, f, vec3(1.0, 1.0, 1.0)), u.x);
  return 1.54 * mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
}
`;

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
${CNOISE3}
varying vec2 vUv;
uniform vec2 uResolution;
uniform sampler2D uMap;     // previous trail frame
uniform vec2  uPointer;     // cursor in uv (0..1)
uniform float uActive;      // 1 while the cursor is over the card, else 0
uniform float uDt;
uniform float uTime;
uniform float uSize;

void main() {
  vec2 uv = vUv;
  vec2 texel = vec2(1.0) / uResolution;

  // erode: shrink the trail evenly from its edges (min of the 4 neighbours) + a slow
  // global decay. Shrinking-from-edges keeps the trail ONE connected shape as it fades
  // (it retreats inward) instead of breaking into stray islands / circles.
  vec2 t = texel * (uDt * 16.0);
  float c1 = texture2D(uMap, uv + t).r;
  float c2 = texture2D(uMap, uv - t).r;
  float c3 = texture2D(uMap, uv + t * vec2(-1.0, 1.0)).r;
  float c4 = texture2D(uMap, uv + t * vec2(1.0, -1.0)).r;
  float faded = min(min(c1, c2), min(c3, c4)) * (1.0 - uDt * 0.35);

  // paint: a noise-warped spot at the cursor (one gentle scale of warp) -> an organic,
  // living trail edge without breaking into pieces.
  float d = distance(uv, uPointer);
  d += cnoise(vec3(uv * 2.0, uTime * 0.6)) * 0.45 * uSize;
  float paint = smoothstep(uSize, uSize * 0.2, d) * uActive;

  float v = max(faded, paint);
  gl_FragColor = vec4(v, 0.0, 0.0, 1.0);
}
`;

export const BRICK_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uStyleA;  // current style picture
uniform sampler2D uStyleB;  // next style picture (crossfaded to)
uniform float uStyleMix;    // 0 = A, 1 = B (style crossfade)
uniform float uZoomA;       // per-style zoom for A (1 = as-is)
uniform float uZoomB;       // per-style zoom for B
uniform sampler2D uReal;    // the real picture (revealed)
uniform sampler2D uTrail;   // trail buffer (.r = reveal amount)
uniform vec2  uCover;       // cover-fit scale for the source textures
uniform vec2  uRealShift;   // fine alignment of the real picture (uv offset)
uniform float uRealZoom;    // fine scale of the real picture (1: it already lines up)
uniform vec2  uParallax;    // hover parallax: cursor-driven uv offset

// cover-fit uv (center-crop) so a square picture fills a non-square card, with a zoom
// (1.12) so even the stronger autonomous parallax shift never exposes an edge.
vec2 cover(vec2 uv) { return (uv - 0.5) * uCover / 1.12 + 0.5 + uParallax; }

// how many reveal cells across (the reveal snaps to this grid of brick-like blocks)
const float REVEAL_GRID = 24.0;

// signed distance to a rounded box of half-size b and corner radius r (p relative to
// the box centre)
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

// the raw trail value at a cell centre
float cellVal(vec2 gc) {
  vec2 uv = (gc + 0.5) / REVEAL_GRID;
  return texture2D(uTrail, uv).r;
}
// is the cell revealed? A firm threshold, so faint DECAYING trail values don't light
// stray cells (which read as scattered circles around the trail).
float cellOn(float v) { return step(0.5, v); }
// stud-pop: a freshly-revealed cell (trail value just past the threshold, i.e. on the
// advancing front) briefly OVERSHOOTS its size, then settles as it saturates -> the
// block "pops" in like a stud clicking into place.
float cellPop(float v) {
  // peaks just above the 0.5 threshold, back to 0 once the cell is fully lit
  return smoothstep(0.5, 0.62, v) * (1.0 - smoothstep(0.62, 0.82, v));
}

// smooth union of two SDFs (no derivative kink at the seam, so fwidth-based AA does
// not draw a thin line where two merged boxes meet).
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
  // The visible "style" layer: a PUSH crossfade. A single SHARED zoom-pulse is applied to
  // BOTH pictures equally during the switch, so they stay perfectly registered (aligned) —
  // just a subtle synchronized breath that gives the swap a little depth, then settles. It
  // always shows a valid blend of two real textures (can never hide the image). At the ends
  // (uStyleMix 0 or 1) the pulse is 0, so a held style sits perfectly still.
  float push = uStyleMix * (1.0 - uStyleMix) * 4.0;   // 0 at ends, 1 at mid of the fade
  float pz = 1.0 + 0.025 * push;                      // weak, shared zoom pulse
  vec2 uvA = cover((vUv - 0.5) / (uZoomA * pz) + 0.5);
  vec2 uvB = cover((vUv - 0.5) / (uZoomB * pz) + 0.5);
  // uStyleMix already arrives smootherstepped from the engine, so blend with it directly.
  vec3 style = mix(texture2D(uStyleA, uvA).rgb, texture2D(uStyleB, uvB).rgb, uStyleMix);
  // the real picture can be nudged to line up: scale about centre by uRealZoom then
  // shift by uRealShift (1 and 0 here, since every picture is made from one canvas).
  vec2 realUV = cover((vUv - 0.5) / uRealZoom + 0.5) + uRealShift;
  vec3 realCrisp = texture2D(uReal, realUV).rgb;

  // Blocky reveal with ROUNDED OUTER CORNERS that MERGE across neighbours: the reveal
  // is the union of a FIXED-size rounded box per revealed cell (half-size 0.62 > 0.5
  // so neighbours overlap and fuse; only the outer boundary stays rounded). Fixed size
  // -> no strange pulsing; the smoothness comes from the trail itself fading.
  // Loop over the 5x5 neighbourhood (±2): a box reaches up to 0.62+0.14 = 0.76 grid
  // units, so a pixel can be covered by a revealed cell up to 2 away. ±1 missed those
  // and left a thin sliver one block from the trail; ±2 samples every contributing box.
  vec2 g = vUv * REVEAL_GRID;
  vec2 base = floor(g);
  float sd = 1e9;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 gc = base + vec2(float(i), float(j));
      float v = cellVal(gc);
      if (cellOn(v) > 0.5) {
        vec2 c = gc + 0.5;            // cell centre in grid space
        // base half-size 0.62 (>0.5 so neighbours merge), + a pop overshoot on the
        // freshly-revealed front so blocks bounce in
        float hs = 0.62 + 0.14 * cellPop(v);
        float d = sdRoundBox(g - c, vec2(hs), 0.3);
        sd = smin(sd, d, 0.16);       // smooth union -> no seam line between merges
      }
    }
  }
  // Antialias with a FIXED width in grid units (not fwidth): fwidth(sd) spikes wherever
  // the min switches dominant box, which is exactly what drew the thin seam lines. A
  // constant width gives a clean uniform edge.
  float m = 1.0 - smoothstep(-0.06, 0.06, sd);

  vec3 outc = mix(style, realCrisp, m);

  // ── minimal INSET on the revealed blocks ──
  // The reveal reads as peeling the top style away to a layer BELOW, so press the revealed
  // rounded squares IN with a subtle deboss. The edge NORMAL is the gradient of the SDF;
  // we get it derivative-free by re-evaluating the union SDF a hair to each side. A thin
  // band just INSIDE the edge is lit from the top-left: top/left inner edges catch a faint
  // highlight, bottom/right fall to shadow -> the block looks pushed in. Very minimal.
  float e = 0.03;
  float sdx = 1e9, sdy = 1e9;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 gc = base + vec2(float(i), float(j));
      float v = cellVal(gc);
      if (cellOn(v) > 0.5) {
        vec2 c = gc + 0.5;
        float hs = 0.62 + 0.14 * cellPop(v);
        sdx = smin(sdx, sdRoundBox(g + vec2(e, 0.0) - c, vec2(hs), 0.3), 0.16);
        sdy = smin(sdy, sdRoundBox(g + vec2(0.0, e) - c, vec2(hs), 0.3), 0.16);
      }
    }
  }
  vec2 nrm = normalize(vec2(sdx - sd, sdy - sd) + 1e-6); // outward edge normal
  float lightBias = dot(nrm, normalize(vec2(-1.0, 1.0))); // top-left light
  // a narrow band hugging the INSIDE of the reveal edge (sd in ~[-0.16, 0])
  float band = smoothstep(0.0, -0.05, sd) * smoothstep(-0.16, -0.05, sd);
  outc *= 1.0 - band * 0.26 * clamp(-lightBias, 0.0, 1.0);  // shadow side (bottom-right)
  outc += band * 0.13 * clamp(lightBias, 0.0, 1.0) * m;     // highlight side (top-left)

  gl_FragColor = vec4(outc, 1.0);
}
`;

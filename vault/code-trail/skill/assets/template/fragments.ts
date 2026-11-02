// Code trail (https://design.how/vault/code-trail), fragments.ts.
// FIXED. Change the VARIABLE values in params instead (GROUND, FONT_VAR, ROWS, CHASE, MIN_TRAVEL_RATIO, FRAGMENTS, PAIRS).
export type Slot =
  | "expr"
  | "free"
  | "end";

export interface Fragment {
  text: string;
  in: Slot;
  out: Slot;
  comment?: boolean;
}

export const FRAGMENTS: Fragment[] = [
  { text: "field = curl(noise", in: "free", out: "expr" },
  { text: "z = fbm(vec3", in: "free", out: "expr" },
  { text: "(uv * 3.0)", in: "expr", out: "free" },
  { text: " * 0.01)", in: "expr", out: "free" },
  { text: "(target - pos)", in: "free", out: "free" },
  { text: " * sin(time)", in: "free", out: "expr" },
  { text: "warp += noise(p)", in: "free", out: "expr" },
  { text: " * 0.02;", in: "expr", out: "end" },
  { text: "uv = gl_FragCoord", in: "free", out: "expr" },
  { text: " / u_resolution;", in: "expr", out: "end" },
  { text: "float d = length(p", in: "free", out: "expr" },
  { text: " - center);", in: "expr", out: "end" },
  { text: "p = fract(p * 2.31", in: "free", out: "expr" },
  { text: "n = snoise(p * 0.6", in: "free", out: "expr" },
  { text: " + t * 0.15);", in: "expr", out: "end" },
  { text: "col = mix(a, b,", in: "free", out: "expr" },
  { text: " smoothstep(0.0, 1.0", in: "expr", out: "expr" },
  { text: "gl_FragColor = vec4(", in: "free", out: "expr" },
  { text: "col, 1.0);", in: "expr", out: "end" },
  { text: "normalize(grad)", in: "free", out: "free" },
  { text: "dot(n, l)", in: "free", out: "expr" },
  { text: " * 0.5 + 0.5;", in: "expr", out: "end" },
  { text: "flow = rot(angle)", in: "free", out: "expr" },
  { text: " * vel;", in: "expr", out: "end" },
  { text: "uniform float t;", in: "free", out: "end" },

  { text: "w, h = im", in: "free", out: "expr" },
  { text: ".size", in: "expr", out: "free" },
  { text: "pos: float", in: "free", out: "free" },
  { text: "hue = (time * 20.0)", in: "free", out: "expr" },
  { text: " % 360.0", in: "expr", out: "free" },
  { text: "def sample(x, y):", in: "free", out: "end" },
  { text: "def update(dt):", in: "free", out: "end" },
  { text: "[x][y]", in: "expr", out: "free" },
  { text: " = base.copy()", in: "expr", out: "free" },
  { text: "for y in range(h):", in: "free", out: "end" },
  { text: "px = img.load()", in: "free", out: "free" },
  { text: "buf = np.zeros(", in: "free", out: "expr" },
  { text: ", dtype=float)", in: "expr", out: "free" },
  { text: "arr[y, x] = int(", in: "free", out: "expr" },
  { text: "v * 255)", in: "expr", out: "free" },
  { text: "return arr.astype(", in: "free", out: "expr" },
  { text: '"uint8")', in: "expr", out: "free" },
  { text: "with Image.open(", in: "free", out: "expr" },
  { text: "path) as im:", in: "expr", out: "end" },
  { text: "np.clip(v, 0.0, 1.0)", in: "free", out: "free" },
  { text: "seed = random()", in: "free", out: "free" },

  { text: "# Map 0..255", in: "free", out: "end", comment: true },
  { text: "# clamp to the grid", in: "free", out: "end", comment: true },
  { text: "# 0..1", in: "free", out: "end", comment: true },
  { text: "// one octave", in: "free", out: "end", comment: true },
  { text: "// keep it in gamut", in: "free", out: "end", comment: true },
];

export function makeBag<T>(items: T[]): () => T {
  let pool: T[] = [];
  return () => {
    if (!pool.length) {
      pool = items.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    return pool.pop() as T;
  };
}

export function drawMatching(
  next: () => Fragment,
  need: Slot,
  tries = 6,
): Fragment {
  let f = next();
  for (let i = 0; i < tries && (f.in !== need || f.comment); i++) f = next();
  return f;
}

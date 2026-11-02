// Blur glow (https://design.how/vault/blur-glow), params.ts.
// VARIABLE: WORDS, PALETTES, HOLD_MS, HOLD_SCALE, MORPH_SEC, LETTER_SPREAD, GRAIN, WARP_AMP, WARP_RADIUS. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export type Stop = { pos: number; color: [number, number, number] };

export interface Palette {
  name: string;
  stops: Stop[];
  ink: [number, number, number];
  paper: [number, number, number];
}

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

export const PALETTES: Palette[] = [
  {
    name: "Ultraviolet",
    stops: [
      { pos: 0.0, color: rgb("#0c0622") },
      { pos: 0.22, color: rgb("#5b1fd6") },
      { pos: 0.46, color: rgb("#ff3bd4") },
      { pos: 0.72, color: rgb("#ffcf4d") },
      { pos: 1.0, color: rgb("#faf7ff") },
    ],
    ink: rgb("#2a0f66"),
    paper: rgb("#faf7ff"),
  },
  {
    name: "Molten",
    stops: [
      { pos: 0.0, color: rgb("#28060a") },
      { pos: 0.22, color: rgb("#d21414") },
      { pos: 0.46, color: rgb("#ff6a1f") },
      { pos: 0.72, color: rgb("#ffcf52") },
      { pos: 1.0, color: rgb("#fff7ec") },
    ],
    ink: rgb("#7a1410"),
    paper: rgb("#fff7ec"),
  },
  {
    name: "Bubblegum",
    stops: [
      { pos: 0.0, color: rgb("#2a0718") },
      { pos: 0.22, color: rgb("#ff1e8e") },
      { pos: 0.46, color: rgb("#ff7ab0") },
      { pos: 0.72, color: rgb("#ffe0b0") },
      { pos: 1.0, color: rgb("#fff5fa") },
    ],
    ink: rgb("#8a0e52"),
    paper: rgb("#fff5fa"),
  },
  {
    name: "Electric",
    stops: [
      { pos: 0.0, color: rgb("#04102e") },
      { pos: 0.22, color: rgb("#1550ff") },
      { pos: 0.46, color: rgb("#25c8ff") },
      { pos: 0.72, color: rgb("#bff0ff") },
      { pos: 1.0, color: rgb("#f4faff") },
    ],
    ink: rgb("#0a2b8c"),
    paper: rgb("#f4faff"),
  },
  {
    name: "Jade",
    stops: [
      { pos: 0.0, color: rgb("#03170f") },
      { pos: 0.22, color: rgb("#0f7a4a") },
      { pos: 0.46, color: rgb("#1fd88a") },
      { pos: 0.72, color: rgb("#b8f5d8") },
      { pos: 1.0, color: rgb("#f3fbf6") },
    ],
    ink: rgb("#0a3d28"),
    paper: rgb("#f3fbf6"),
  },
  {
    name: "Sunburst",
    stops: [
      { pos: 0.0, color: rgb("#04161c") },
      { pos: 0.22, color: rgb("#0e7d86") },
      { pos: 0.46, color: rgb("#f2a20c") },
      { pos: 0.72, color: rgb("#ffe27a") },
      { pos: 1.0, color: rgb("#fefaf0") },
    ],
    ink: rgb("#0a3a40"),
    paper: rgb("#fefaf0"),
  },
];

export function paletteUniforms(p: Palette): {
  positions: number[];
  colors: number[];
  ink: number[];
  paper: number[];
} {
  const positions: number[] = [];
  const colors: number[] = [];
  for (let i = 0; i < 5; i++) {
    const s = p.stops[Math.min(i, p.stops.length - 1)];
    positions.push(s.pos);
    colors.push(s.color[0], s.color[1], s.color[2]);
  }
  return { positions, colors, ink: p.ink, paper: p.paper };
}

export interface PaletteUniforms {
  positions: number[];
  colors: number[];
  ink: number[];
  paper: number[];
}

const LUMA: readonly [number, number, number] = [0.2126, 0.7152, 0.0722];

function satPreserveLerp(x: number[], y: number[], t: number): number[] {
  const out = x.map((v, i) => v + (y[i] - v) * t);
  const bell = Math.sin(Math.PI * t);
  if (bell < 1e-4) return out;
  const satOf = (c0: number, c1: number, c2: number) => {
    const mx = Math.max(c0, c1, c2);
    return mx === 0 ? 0 : (mx - Math.min(c0, c1, c2)) / mx;
  };
  for (let i = 0; i + 2 < out.length; i += 3) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    const target = Math.max(
      satOf(x[i], x[i + 1], x[i + 2]),
      satOf(y[i], y[i + 1], y[i + 2]),
    );
    const s = satOf(r, g, b);
    if (s < 1e-4 || target < 1e-4) continue;
    const k = (s + (target - s) * bell) / s;
    const L = LUMA[0] * r + LUMA[1] * g + LUMA[2] * b;
    out[i] = Math.min(1, Math.max(0, L + (r - L) * k));
    out[i + 1] = Math.min(1, Math.max(0, L + (g - L) * k));
    out[i + 2] = Math.min(1, Math.max(0, L + (b - L) * k));
  }
  return out;
}

export function lerpPaletteUniforms(a: PaletteUniforms, b: PaletteUniforms, t: number): PaletteUniforms {
  const lerpArr = (x: number[], y: number[]) => x.map((v, i) => v + (y[i] - v) * t);
  return {
    positions: lerpArr(a.positions, b.positions),
    colors: satPreserveLerp(a.colors, b.colors, t),
    ink: satPreserveLerp(a.ink, b.ink, t),
    paper: satPreserveLerp(a.paper, b.paper, t),
  };
}

export const WORDS = ["hello", "pookie", "monkey"];

export const HOLD_SCALE = [1.45, 0.9, 1.0];

export const GRAIN = 0.4;

export const MORPH_LEAD = 0.78;
export const MORPH_LAG = 1.3;

export const CAST_DIR: readonly [number, number] = [0.38, 0.92];
export const CAST_STEP: readonly [number, number, number, number] = [0.0008, 0.0022, 0.0042, 0.0075];

export const LETTER_SPREAD = 0.45;

export const WARP_RADIUS = 0.2;
export const WARP_AMP = 0.013;
export const WARP_SWIRL = 0.6;
export const WARP_DRAG = 0.26;
export const WARP_STRETCH = 0.5;

export const BREATH = 0.22;


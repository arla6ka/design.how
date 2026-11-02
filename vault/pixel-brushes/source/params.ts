export interface Brush {
  id: string;
  name: string;

  spacing: number;
  jitter: number;
  scatter: number;
  follow: number;
  speedSize: number;

  cells: { x: number; y: number; s: number; a: number }[];
  size: number;
  hueDrift: number;
}

const ONE = [{ x: 0, y: 0, s: 1, a: 1 }];

function diagonal(n: number, fade: number) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    out.push({ x: (t - 0.5) * 2, y: (t - 0.5) * 2, s: 1, a: 1 - t * fade });
  }
  return out;
}

const CLUMP = [
  { x: -0.55, y: 0.15, s: 0.9, a: 1 },
  { x: 0.45, y: -0.5, s: 1.05, a: 0.92 },
  { x: 0.3, y: 0.6, s: 0.8, a: 0.85 },
];

function bar(n: number, s: number) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ x: 0, y: (i / (n - 1) - 0.5) * 2, s, a: 1 });
  }
  return out;
}

export const BRUSHES: Brush[] = [
  {
    id: "line-fine",
    name: "Line fine",
    spacing: 0.026,
    jitter: 0,
    scatter: 0,
    follow: 0,
    speedSize: 0,
    cells: ONE,
    size: 0.030,
    hueDrift: 0,
  },
  {
    id: "line-medium",
    name: "Line medium",
    spacing: 0.195,
    jitter: 0,
    scatter: 0,
    follow: 0,
    speedSize: 0,
    cells: ONE,
    size: 0.055,
    hueDrift: 0,
  },
  {
    id: "checker",
    name: "Checkerboard",
    spacing: 0.195,
    jitter: 0,
    scatter: 0,
    follow: 1,
    speedSize: 0,
    cells: diagonal(4, 0.55),
    size: 0.055,
    hueDrift: 0,
  },
  {
    id: "checker-angled",
    name: "Checker angled",
    spacing: 0.130,
    jitter: 0,
    scatter: 0,
    follow: 0,
    speedSize: 0,
    cells: diagonal(3, 0.35),
    size: 0.048,
    hueDrift: 0,
  },
  {
    id: "rows",
    name: "Rows",
    spacing: 0.170,
    jitter: 0.115,
    scatter: 0,
    follow: 1,
    speedSize: 0.563,
    cells: bar(3, 0.8),
    size: 0.055,
    hueDrift: 12,
  },
  {
    id: "bunch",
    name: "Bunch",
    spacing: 0.221,
    jitter: 0.030,
    scatter: 0.042,
    follow: 1,
    speedSize: 0.611,
    cells: CLUMP,
    size: 0.048,
    hueDrift: 0,
  },
  {
    id: "scatter-light",
    name: "Scatter light",
    spacing: 0.304,
    jitter: 0.103,
    scatter: 0,
    follow: 0,
    speedSize: 0.668,
    cells: ONE,
    size: 0.042,
    hueDrift: 0,
  },
  {
    id: "scatter-heavy",
    name: "Scatter heavy",
    spacing: 0.087,
    jitter: 0.184,
    scatter: 0.042,
    follow: 1,
    speedSize: 0.563,
    cells: ONE,
    size: 0.040,
    hueDrift: 0,
  },
  {
    id: "cluster",
    name: "Cluster",
    spacing: 0.195,
    scatter: 1.0,
    jitter: 0,
    follow: 0,
    speedSize: 0,
    cells: ONE,
    size: 0.048,
    hueDrift: 0,
  },
  {
    id: "shader",
    name: "Shader",
    spacing: 0.199,
    jitter: 0.212,
    scatter: 0.5,
    follow: 0.5,
    speedSize: 1.0,
    cells: CLUMP,
    size: 0.055,
    hueDrift: 0,
  },
  {
    id: "paint",
    name: "Paint",
    spacing: 0.114,
    jitter: 0.006,
    scatter: 0,
    follow: 1,
    speedSize: 0.25,
    cells: ONE,
    size: 0.062,
    hueDrift: 16,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    spacing: 0.087,
    jitter: 0.184,
    scatter: 0.042,
    follow: 1,
    speedSize: 0.563,
    cells: ONE,
    size: 0.040,
    hueDrift: 300,
  },
];

export const DEFAULT_BRUSH =
  BRUSHES.find((b) => b.id === "scatter-heavy") ?? BRUSHES[0];

export interface Ink {
  h: number;
  s: number;
  l: number;
}

export const INK: Ink = { h: 336, s: 82, l: 56 };

export const PAPER = "#fdfcfc";

export function inkColor(ink: Ink, hueOffset: number, alpha: number): string {
  const h = (((ink.h + hueOffset) % 360) + 360) % 360;
  return `hsl(${h} ${ink.s}% ${ink.l}% / ${alpha})`;
}

function inkLuma(ink: Ink): number {
  const s = ink.s / 100;
  const l = ink.l / 100;
  return l * (1 - s * 0.35);
}

export function remixPalette(rand: () => number): { ink: Ink; paper: string } {
  const ink: Ink = {
    h: Math.floor(rand() * 360),
    s: 55 + rand() * 40,
    l: 40 + rand() * 20,
  };

  const roll = rand();
  const paperHue =
    rand() < 0.5 ? (ink.h + 180) % 360 : Math.floor(rand() * 360);
  let paperSat: number;
  let paperLight: number;
  if (roll < 0.4) {
    paperSat = rand() < 0.4 ? 0 : 8 + rand() * 16;
    paperLight = 92 + rand() * 6;
  } else if (roll < 0.65) {
    paperSat = 30 + rand() * 45;
    paperLight = 78 + rand() * 12;
  } else if (roll < 0.85) {
    paperSat = 18 + rand() * 40;
    paperLight = 10 + rand() * 14;
  } else {
    paperSat = rand() * 12;
    paperLight = rand() < 0.5 ? 4 + rand() * 6 : 97 + rand() * 3;
  }
  const paper = `hsl(${paperHue} ${paperSat}% ${paperLight}%)`;

  const paperLuma = paperLight / 100;
  const goDark = paperLuma > 0.5;
  let guard = 0;
  while (Math.abs(inkLuma(ink) - paperLuma) < 0.3 && guard++ < 24) {
    ink.l += goDark ? -4 : 4;
    ink.l = Math.min(92, Math.max(12, ink.l));
    if (ink.l <= 12 || ink.l >= 92) ink.s = Math.max(25, ink.s - 6);
  }

  return { ink, paper };
}

type Cells = Brush["cells"];

function ring(n: number, rand: () => number): Cells {
  const out: Cells = [];
  const phase = rand() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    out.push({ x: Math.cos(a), y: Math.sin(a), s: 0.85, a: 1 });
  }
  return out;
}

function comb(n: number, gap: number): Cells {
  const out: Cells = [];
  for (let i = 0; i < n; i++) {
    const t = (i / Math.max(1, n - 1) - 0.5) * 2;
    out.push({ x: t, y: -gap, s: 0.8, a: 1 });
    out.push({ x: t, y: gap, s: 0.8, a: 0.85 });
  }
  return out;
}

function cross(arm: number): Cells {
  const out: Cells = [{ x: 0, y: 0, s: 1, a: 1 }];
  for (let i = 1; i <= arm; i++) {
    const t = i / arm;
    const a = 1 - t * 0.5;
    out.push({ x: t, y: 0, s: 0.75, a });
    out.push({ x: -t, y: 0, s: 0.75, a });
    out.push({ x: 0, y: t, s: 0.75, a });
    out.push({ x: 0, y: -t, s: 0.75, a });
  }
  return out;
}

function cloud(n: number, rand: () => number): Cells {
  const out: Cells = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.6);
    out.push({
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      s: 0.5 + rand() * 0.7,
      a: 0.5 + rand() * 0.5,
    });
  }
  return out;
}

function wedge(n: number): Cells {
  const out: Cells = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    out.push({ x: (t - 0.5) * 2, y: 0, s: 1 - t * 0.7, a: 1 - t * 0.3 });
  }
  return out;
}

const STAMPS: { name: string; make: (rand: () => number) => Cells }[] = [
  { name: "Ring", make: (r) => ring(4 + Math.floor(r() * 4), r) },
  { name: "Comb", make: (r) => comb(2 + Math.floor(r() * 3), 0.5 + r() * 0.5) },
  { name: "Cross", make: (r) => cross(1 + Math.floor(r() * 2)) },
  { name: "Spatter", make: (r) => cloud(3 + Math.floor(r() * 4), r) },
  { name: "Nib", make: (r) => wedge(3 + Math.floor(r() * 3)) },
  { name: "Dot", make: () => [{ x: 0, y: 0, s: 1, a: 1 }] },
  { name: "Weave", make: (r) => diagonal(3 + Math.floor(r() * 3), 0.3 + r() * 0.5) },
];

function describe(b: Omit<Brush, "id" | "name">): string {
  if (b.scatter > 0.6) return "spray";
  if (b.spacing > 0.35) return "dotted";
  if (b.spacing < 0.06) return "solid";
  if (b.jitter > 0.18) return "rough";
  if (b.follow >= 1) return "flowing";
  return "even";
}

export function remixBrush(rand: () => number): Brush {
  const stamp = STAMPS[Math.floor(rand() * STAMPS.length)];
  const cells = stamp.make(rand);

  const spacing = 0.02 + Math.pow(rand(), 1.8) * 0.55;
  const scatter = rand() < 0.45 ? 0 : Math.pow(rand(), 1.4) * 1.0;
  const jitter = rand() < 0.4 ? 0 : Math.pow(rand(), 1.5) * 0.3;
  const follow = rand() < 0.45 ? 0 : rand() < 0.75 ? 1 : 0.5;
  const speedSize = rand() < 0.5 ? 0 : rand();
  const bulk = Math.min(1, cells.length / 8);
  const size = 0.026 + rand() * 0.055 * (1 - bulk * 0.45);
  const hueDrift = rand() < 0.75 ? 0 : Math.floor(rand() * 320);

  const parts = { spacing, jitter, scatter, follow, speedSize, cells, size, hueDrift };
  return {
    id: "remix",
    name: `${stamp.name} ${describe(parts)}`,
    ...parts,
  };
}

export const SHOWN = ['rows', 'scatter-heavy', 'cluster'];

export const TWEAKS: Record<string, Partial<Brush>> = {
  'scatter-heavy': {size: 0.075, spacing: 0.4},
};

export const PAPER_BG = '#fbf9f7';
export const INKS: Ink[] = [
  {h: 336, s: 82, l: 56},
  {h: 212, s: 84, l: 52},
  {h: 152, s: 62, l: 40},
];

export const DRAW_MS = 900;
export const STAGGER_MS = 180;
export const SPIRAL_RADIUS = 0.38;

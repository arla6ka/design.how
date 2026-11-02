// Smooth corners (https://design.how/vault/squircle), superellipse.ts.
// FIXED. Change the VARIABLE values in params instead (radiusFor, SMOOTHING, EXPONENT, BUTTON_W, CONTROL_H, LABEL, GROUND, FONT_VAR).
export interface SquircleOptions {
  width: number;
  height: number;
  radius: number;
  smoothing: number;
  exponent?: number;
}

const DEFAULT_EXPONENT = 5;

const n = (v: number) => v.toFixed(4);

const CORNER: readonly [number, number][][] = [
  [ [0.3, 0],       [0.473, 0],     [0.619, 0.039] ],
  [ [0.804, 0.088], [0.912, 0.196], [0.961, 0.381] ],
  [ [1, 0.527],     [1, 0.7],       [1, 1] ],
];

function rot90([x, y]: [number, number], k: number): [number, number] {
  switch (((k % 4) + 4) % 4) {
    case 1: return [y, -x];
    case 2: return [-x, -y];
    case 3: return [-y, x];
    default: return [x, y];
  }
}

function cornerCubics(sx: number, sy: number, radius: number, k: number): string {
  const put = (p: [number, number]) => {
    const [rx, ry] = rot90(p, k);
    return `${n(sx + rx * radius)} ${n(sy + ry * radius)}`;
  };
  return CORNER.map(([c1, c2, end]) => `C ${put(c1)} ${put(c2)} ${put(end)}`).join(" ");
}

function cornerSampled(sx: number, sy: number, radius: number, k: number, exponent: number): string {
  const STEPS = 32;
  const e = 2 / exponent;
  const pts: string[] = [];
  for (let i = 1; i <= STEPS; i++) {
    const t = (i / STEPS) * (Math.PI / 2);
    const ux = Math.pow(Math.sin(t), e);
    const uy = 1 - Math.pow(Math.cos(t), e);
    const [rx, ry] = rot90([ux, uy], k);
    pts.push(`L ${n(sx + rx * radius)} ${n(sy + ry * radius)}`);
  }
  return pts.join(" ");
}

export function squirclePath({ width, height, radius, smoothing, exponent = DEFAULT_EXPONENT }: SquircleOptions): string {
  const budget = Math.min(width, height) / 2;
  const s = Math.max(0, Math.min(1, smoothing));
  const r = Math.max(0, Math.min(radius, budget)) * (0.4 + 0.6 * s);

  if (r <= 0) {
    return `M 0 0 L ${n(width)} 0 L ${n(width)} ${n(height)} L 0 ${n(height)} Z`;
  }

  const useBezier = Math.abs(exponent - DEFAULT_EXPONENT) < 0.05;
  const corner = (sx: number, sy: number, k: number) =>
    useBezier ? cornerCubics(sx, sy, r, k) : cornerSampled(sx, sy, r, k, exponent);

  return [
    `M ${n(r)} 0`,
    `L ${n(width - r)} 0`,
    corner(width - r, 0, 0),
    `L ${n(width)} ${n(height - r)}`,
    corner(width, height - r, 3),
    `L ${n(r)} ${n(height)}`,
    corner(r, height, 2),
    `L 0 ${n(r)}`,
    corner(0, r, 1),
    "Z",
  ].join(" ");
}

export function roundRectPath(w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  return `M ${rr} 0 L ${w - rr} 0 A ${rr} ${rr} 0 0 1 ${w} ${rr} L ${w} ${h - rr} A ${rr} ${rr} 0 0 1 ${w - rr} ${h} L ${rr} ${h} A ${rr} ${rr} 0 0 1 0 ${h - rr} L 0 ${rr} A ${rr} ${rr} 0 0 1 ${rr} 0 Z`;
}

export function shapePath(o: SquircleOptions & { plain?: boolean }): string {
  return o.plain
    ? roundRectPath(o.width, o.height, o.radius)
    : squirclePath(o);
}

export function nativeCornerShape(radius: number): { borderRadius: string; cornerShape: string } {
  return { borderRadius: `${radius}px`, cornerShape: "squircle" };
}

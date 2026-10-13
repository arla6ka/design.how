import {countUnitFor, durationUnitFor, fixed} from '../lib/format';

type ChartRow = Record<string, unknown>;

type ChartUnit = 'duration' | 'count';

type Curve = 'linear' | 'monotone' | 'step';

type Point = {x: number; y: number};

function niceScale(min: number, max: number, count = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1; }
  if (min > max) [min, max] = [max, min];
  count = Math.max(1, Math.round(count) || 1);
  if (min === max) { max = min === 0 ? 1 : min + Math.abs(min); }
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const n = raw / magnitude;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * magnitude;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
  return {min: lo, max: hi, ticks};
}

const compact = new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1});

function formatCompact(value: number) {
  return compact.format(value);
}

function unitFormat(unit: ChartUnit | undefined, values: number[]): ((v: number) => string) | undefined {
  if (!unit) return undefined;
  const {unit: name, size} = unit === 'duration' ? durationUnitFor(values) : countUnitFor(values);
  const plain = new Intl.NumberFormat('en-US', {maximumFractionDigits: 0, signDisplay: 'negative'});
  return v => {
    const x = v / size;
    if (size === 1) return `${unit === 'duration' ? fixed(x, 0) : plain.format(x)}${name}`;
    return `${fixed(x, Math.abs(Number(x.toFixed(1))) >= 10 ? 0 : 1)}${name}`;
  };
}

function numberAt(row: ChartRow | undefined, key: string): number | null {
  const v = row?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function monotonePath(points: Point[]) {
  if (points.length < 3) return linearPath(points);
  const n = points.length;
  const dx: number[] = [], slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    slope.push((points[i + 1].y - points[i].y) / (dx[i] || 1));
  }
  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i++) tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
  tangent.push(slope[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) { tangent[i] = 0; tangent[i + 1] = 0; continue; }
    const a = tangent[i] / slope[i], b = tangent[i + 1] / slope[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); tangent[i] = t * a * slope[i]; tangent[i + 1] = t * b * slope[i]; }
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const p = points[i], q = points[i + 1], h = dx[i] / 3;
    d += `C${p.x + h},${p.y + tangent[i] * h},${q.x - h},${q.y - tangent[i + 1] * h},${q.x},${q.y}`;
  }
  return d;
}

function linearPath(points: Point[]) {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join('');
}

function stepPath(points: Point[]) {
  return points.map((p, i) => i ? `H${(points[i - 1].x + p.x) / 2}V${p.y}` : `M${p.x},${p.y}`).join('') + (points.length ? `H${points[points.length - 1].x}` : '');
}

export {
  niceScale, formatCompact, unitFormat, numberAt, monotonePath, linearPath, stepPath,
  type ChartRow, type ChartUnit, type Curve, type Point,
};

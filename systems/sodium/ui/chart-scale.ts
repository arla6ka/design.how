type ChartRow = Record<string, unknown>;

type ChartUnit = 'duration' | 'count' | 'bytes';

type Curve = 'linear' | 'step';

type Point = {x: number; y: number};

const EMPTY_VALUE = 'None';

const CHART_EMPTY = 'No data in this range.';

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

function tickCount(plotHeight: number) {
  return Math.min(4, Math.max(1, Math.floor(plotHeight / 28)));
}

const compact = new Intl.NumberFormat('en-US', {notation: 'compact', maximumFractionDigits: 1});

function formatCompact(value: number) {
  return compact.format(value);
}

const exact = new Intl.NumberFormat('en-US', {maximumFractionDigits: 2});
function formatExact(value: number) {
  return exact.format(value);
}

const UNITS: Record<ChartUnit, {name: string; size: number}[]> = {
  duration: [{name: 'ms', size: 1}, {name: 's', size: 1000}, {name: 'min', size: 60_000}, {name: 'h', size: 3_600_000}],
  count: [{name: '', size: 1}, {name: 'K', size: 1000}, {name: 'M', size: 1_000_000}, {name: 'B', size: 1_000_000_000}],
  bytes: [{name: ' B', size: 1}, {name: ' KB', size: 1024}, {name: ' MB', size: 1024 ** 2}, {name: ' GB', size: 1024 ** 3}, {name: ' TB', size: 1024 ** 4}],
};

function unitFormat(unit: ChartUnit | undefined, values: number[]): ((v: number) => string) | undefined {
  if (!unit) return undefined;
  const top = Math.max(0, ...values.map(Math.abs));
  const steps = UNITS[unit];
  let pick = steps[0];
  for (const step of steps) if (top >= step.size) pick = step;
  return v => {
    if (v === 0) return '0';
    const x = v / pick.size;
    const digits = pick.size === 1 || Math.abs(Number(x.toFixed(1))) >= 10 ? 0 : 1;
    const text = x.toFixed(digits);
    return `${Number(text) === 0 ? (0).toFixed(digits) : text}${pick.name}`;
  };
}

function numberAt(row: ChartRow | undefined, key: string): number | null {
  const v = row?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function linearPath(points: Point[]) {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join('');
}

function stepPath(points: Point[]) {
  return points.map((p, i) => i ? `H${(points[i - 1].x + p.x) / 2}V${p.y}` : `M${p.x},${p.y}`).join('') + (points.length ? `H${points[points.length - 1].x}` : '');
}

export {
  niceScale, tickCount, formatCompact, formatExact, unitFormat, numberAt, linearPath, stepPath, EMPTY_VALUE, CHART_EMPTY,
  type ChartRow, type ChartUnit, type Curve, type Point,
};

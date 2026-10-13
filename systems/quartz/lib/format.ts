type Unit = {unit: string; size: number};

const durationUnits: readonly Unit[] = [
  {unit: 'ms', size: 1},
  {unit: 's', size: 1_000},
  {unit: 'min', size: 60_000},
  {unit: 'h', size: 3_600_000},
];

export const EMPTY_VALUE = 'None';

export const CHART_EMPTY = 'No data in this range';

const largest = (values: readonly number[]) => values.reduce((max, v) => (Number.isFinite(v) ? Math.max(max, Math.abs(v)) : max), 0);

const roundTo = (x: number, digits: number) => Number(x.toFixed(digits));

export function fixed(x: number, digits: number) {
  const s = x.toFixed(digits);
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
}

function pickUnit(max: number, units: readonly Unit[], threshold: (i: number) => number, digits: (i: number) => number) {
  let i = 0;
  while (i < units.length - 1 && max >= threshold(i + 1)) i++;
  while (i < units.length - 1 && roundTo(max / units[i].size, digits(i)) * units[i].size >= threshold(i + 1)) i++;
  return i;
}

export function durationUnitFor(values: readonly number[], digits = 1): Unit & {digits: number} {
  const digitsAt = (i: number) => (i === 0 ? 0 : digits);
  const i = pickUnit(largest(values), durationUnits, j => durationUnits[j].size, digitsAt);
  return {...durationUnits[i], digits: digitsAt(i)};
}

export function formatDurations(values: readonly number[], {digits = 1}: {digits?: number} = {}) {
  const {unit, size, digits: d} = durationUnitFor(values, digits);
  return {unit, values: values.map(v => (Number.isFinite(v) ? `${fixed(v / size, d)}${unit}` : EMPTY_VALUE))};
}

const countUnits: readonly Unit[] = [
  {unit: '', size: 1},
  {unit: 'k', size: 1_000},
  {unit: 'M', size: 1_000_000},
  {unit: 'B', size: 1_000_000_000},
];

export function countUnitFor(values: readonly number[], digits = 1): Unit & {digits: number} {
  const digitsAt = (i: number) => (i === 0 ? 0 : digits);
  const i = pickUnit(largest(values), countUnits, j => countUnits[j].size * 10, digitsAt);
  return {...countUnits[i], digits: digitsAt(i)};
}

export function formatCounts(values: readonly number[], {digits = 1, locale = 'en-US'}: {digits?: number; locale?: string} = {}) {
  const {unit, size, digits: d} = countUnitFor(values, digits);
  const format = new Intl.NumberFormat(locale, {maximumFractionDigits: d, minimumFractionDigits: d, signDisplay: 'negative'});
  return {unit, values: values.map(v => (Number.isFinite(v) ? `${format.format(v / size)}${unit}` : EMPTY_VALUE))};
}

export function formatElapsed(ms: number) {
  const v = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  if (Math.round(v) < 1000) return `${Math.round(v)}ms`;
  const tenths = Math.round(v / 100);
  if (tenths < 600) return `${(tenths / 10).toFixed(1)}s`;
  const pad = (n: number) => String(n).padStart(2, '0');
  const secs = Math.round(v / 1000);
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${pad(secs % 60)}s`;
  const mins = Math.round(v / 60_000);
  if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
  const hours = Math.round(v / 3_600_000);
  return `${Math.floor(hours / 24)}d ${pad(hours % 24)}h`;
}

export function formatCount(n: number) {
  return Number.isFinite(n) ? n.toLocaleString('en-US') : EMPTY_VALUE;
}

const byteUnits: readonly Unit[] = [
  {unit: 'B', size: 1},
  {unit: 'KB', size: 1e3},
  {unit: 'MB', size: 1e6},
  {unit: 'GB', size: 1e9},
  {unit: 'TB', size: 1e12},
];

function bytesIn(bytes: number, i: number) {
  if (i === 0) return Math.round(bytes);
  const v = bytes / byteUnits[i].size;
  const tenths = roundTo(v, 1);
  return tenths < 10 ? tenths : Math.round(v);
}

function byteUnitFor(bytes: number) {
  let i = 0;
  while (i < byteUnits.length - 1 && bytesIn(bytes, i) >= 1000) i++;
  return i;
}

const bytesText = (bytes: number, i: number) => {
  const v = bytesIn(bytes, i);
  return i > 0 && v < 10 ? v.toFixed(1) : String(v);
};

const sizeOf = (bytes: number) => (Number.isFinite(bytes) ? Math.max(0, bytes) : 0);

export function formatBytes(bytes: number) {
  const size = sizeOf(bytes);
  const i = byteUnitFor(size);
  return `${bytesText(size, i)} ${byteUnits[i].unit}`;
}

export function formatByteProgress(loaded: number, total: number) {
  const whole = sizeOf(total);
  const i = byteUnitFor(whole);
  return `${bytesText(Math.min(sizeOf(loaded), whole), i)} of ${bytesText(whole, i)} ${byteUnits[i].unit}`;
}

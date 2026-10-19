'use client';

import {useEffect, useRef, useState, type RefObject} from 'react';

type Unit = {unit: string; size: number};

export const EMPTY_VALUE = 'None';

export const CHART_EMPTY = 'No data in this range';

const durationUnits: readonly Unit[] = [
  {unit: 'ms', size: 1},
  {unit: 's', size: 1_000},
  {unit: 'min', size: 60_000},
  {unit: 'h', size: 3_600_000},
];

const countUnits: readonly Unit[] = [
  {unit: '', size: 1},
  {unit: 'k', size: 1_000},
  {unit: 'M', size: 1_000_000},
  {unit: 'B', size: 1_000_000_000},
];

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

export function countUnitFor(values: readonly number[], digits = 1): Unit & {digits: number} {
  const digitsAt = (i: number) => (i === 0 ? 0 : digits);
  const i = pickUnit(largest(values), countUnits, j => countUnits[j].size * 10, digitsAt);
  return {...countUnits[i], digits: digitsAt(i)};
}

export function formatCounts(values: readonly number[], {digits = 1}: {digits?: number} = {}) {
  const {unit, size, digits: d} = countUnitFor(values, digits);
  const format = new Intl.NumberFormat('en-US', {maximumFractionDigits: d, minimumFractionDigits: d, signDisplay: 'negative'});
  return {unit, values: values.map(v => (Number.isFinite(v) ? `${format.format(v / size)}${unit}` : EMPTY_VALUE))};
}

export function cssNumber(el: Element | null | undefined, name: string, fallback: number): number {
  if (!el || typeof getComputedStyle === 'undefined') return fallback;
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const match = raw.match(/^(-?[\d.]+)(px|ms|s)?$/);
  if (!match) return fallback;
  const n = parseFloat(match[1]);
  return match[2] === 's' ? n * 1000 : n;
}

export function useScrollTabStop(ref: RefObject<HTMLElement | null>, enabled = true): 0 | undefined {
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) { setScrolls(false); return; }
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const resize = new ResizeObserver(measure);
    const watch = () => {
      resize.disconnect();
      resize.observe(el);
      for (const child of el.children) resize.observe(child);
      measure();
    };
    const swap = new MutationObserver(watch);
    swap.observe(el, {childList: true});
    watch();
    return () => { resize.disconnect(); swap.disconnect(); };
  }, [ref, enabled]);
  return scrolls ? 0 : undefined;
}

export function useLoadingPhase(loading: boolean, ref: RefObject<HTMLElement | null>) {
  const [phase, setPhase] = useState<'wait' | 'shown' | 'off'>(loading ? 'wait' : 'off');
  const shownAt = useRef(0);
  useEffect(() => {
    if (!loading) { setPhase(p => (p === 'wait' ? 'off' : p)); return; }
    setPhase(p => (p === 'shown' ? p : 'wait'));
    const t = window.setTimeout(() => setPhase(p => {
      if (p !== 'shown') shownAt.current = Date.now();
      return 'shown';
    }), cssNumber(ref.current, '--wait-show', 150));
    return () => window.clearTimeout(t);
  }, [loading, ref]);
  useEffect(() => {
    if (loading || phase !== 'shown') return;
    const left = cssNumber(ref.current, '--wait-hold', 400) - (Date.now() - shownAt.current);
    const t = window.setTimeout(() => setPhase('off'), Math.max(0, left));
    return () => window.clearTimeout(t);
  }, [loading, phase, ref]);
  return phase;
}

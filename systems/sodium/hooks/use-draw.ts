'use client';

import {useCallback, useRef, type RefObject} from 'react';
import {easeOut, useMotionToken, useTimeline, type TimelineOptions} from './use-timeline';

export function drawAt(elapsed: number, count: number, hop: number = 300, starts?: readonly number[]): number[] {
  return Array.from({length: count}, (_, i) => {
    if (elapsed === Number.POSITIVE_INFINITY || hop <= 0) return 1;
    const start = starts?.[i];
    if (starts && start === undefined) return 0;
    return easeOut((elapsed - (start ?? i * hop)) / hop);
  });
}

export type DrawOptions = TimelineOptions & {
  ref?: RefObject<Element | null>;
  hop?: number;
};

const FRAME = 16;

export function useDraw(count: number, {ref, hop, clock, play, restart}: DrawOptions = {}): number[] {
  const token = useMotionToken(ref, '--dur-draw');
  const each = hop ?? token.ms;
  const controlled = clock !== undefined;
  const starts = useRef<number[]>([]);
  const last = useRef(0);
  const key = useRef(restart);
  if (!Object.is(key.current, restart)) { key.current = restart; starts.current = []; last.current = 0; }
  if (!controlled) {
    for (let i = starts.current.length; i < count; i++) starts.current.push(Math.max(i === 0 ? 0 : starts.current[i - 1] + each, i === 0 ? 0 : last.current));
    if (starts.current.length > count) starts.current.length = count;
  }
  const total = controlled ? count * each : (starts.current.at(-1) ?? 0) + (count ? each : 0);
  const step = useCallback((ms: number) => ms >= total ? -1 : Math.floor(ms / FRAME), [total]);
  const elapsed = useTimeline({total, step, clock, play, restart, reduced: token.reduced});
  if (Number.isFinite(elapsed)) last.current = elapsed;
  return drawAt(elapsed, count, each, controlled ? undefined : starts.current);
}

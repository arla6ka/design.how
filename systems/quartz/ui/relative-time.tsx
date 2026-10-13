'use client';

import {useEffect, useState} from 'react';
import {TextHint} from './truncate';
import {cn} from '../lib/utils';

type Style = 'short' | 'long';

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const NOW = 45 * SECOND;

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

const TO_HOURS = HOUR - MINUTE / 2;
const TO_DAYS = DAY - HOUR / 2;
const unitOf = (abs: number) => (abs < TO_HOURS ? MINUTE : abs < TO_DAYS ? HOUR : DAY);

function formatRelative(date: Date, now: number | null, style: Style = 'short', timeZone?: string) {
  const diff = now === null ? Infinity : date.getTime() - now;
  const abs = Math.abs(diff);
  if (abs < NOW) return 'now';
  if (abs >= WEEK) {
    const year = (d: Date | number) => new Intl.DateTimeFormat('en', {year: 'numeric', timeZone}).format(d);
    const sameYear = now !== null && year(date) === year(now);
    return new Intl.DateTimeFormat('en', {month: 'short', day: 'numeric', year: sameYear ? undefined : 'numeric', timeZone}).format(date);
  }
  const size = unitOf(abs);
  const value = Math.max(1, Math.round(abs / size));
  const [unit, short] = size === MINUTE ? ['minute', 'm'] as const : size === HOUR ? ['hour', 'h'] as const : ['day', 'd'] as const;
  if (style === 'long') return new Intl.RelativeTimeFormat('en', {numeric: 'auto'}).format(Math.sign(diff) * value, unit);
  return diff < 0 ? `${value}${short} ago` : `in ${value}${short}`;
}

function untilChange(date: Date, now: number) {
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const past = diff <= 0;
  if (abs >= WEEK) return past ? HOUR : Math.min(HOUR, abs - WEEK + SECOND);
  if (abs < NOW) return past ? NOW - abs : abs + SECOND;
  const size = unitOf(abs);
  const value = Math.round(abs / size);
  const thresholds = [NOW, TO_HOURS, TO_DAYS, WEEK];
  const wait = past
    ? Math.min((value + 0.5) * size - abs, ...thresholds.filter(t => t > abs).map(t => t - abs))
    : Math.min(abs - (value - 0.5) * size, ...thresholds.filter(t => t <= abs).map(t => abs - t + 1));
  return Math.max(SECOND, Math.ceil(wait) + 50);
}

const exact = (date: Date, timeZone?: string) => new Intl.DateTimeFormat('en', {dateStyle: 'medium', timeStyle: 'medium', timeZone}).format(date);

type RelativeTimeProps = Omit<React.ComponentProps<'time'>, 'children' | 'dateTime'> & {
  date: Date | string | number;
  format?: Style;
  now?: Date | string | number;
  hint?: boolean;
};

function RelativeTime({date, format = 'short', now: fixedNow, hint = true, className, ...props}: RelativeTimeProps) {
  const at = toDate(date);
  const time = at.getTime();
  const frozen = fixedNow === undefined ? null : toDate(fixedNow).getTime();
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (frozen !== null || Number.isNaN(time)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      clearTimeout(timer);
      if (document.hidden) return;
      const current = Date.now();
      setClock(current);
      timer = setTimeout(tick, untilChange(new Date(time), current));
    };
    tick();
    document.addEventListener('visibilitychange', tick);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', tick); };
  }, [time, frozen]);

  if (Number.isNaN(time)) return <span data-slot="relative-time" data-invalid="" className={cn('text-text-3', className)}>Unknown time</span>;

  const now = frozen ?? clock;
  const zone = mounted ? undefined : 'UTC';
  const utc = `${exact(at, 'UTC')} UTC`;
  const local = mounted ? exact(at) : utc;
  const node = <time
    data-slot="relative-time"
    dateTime={at.toISOString()}
    tabIndex={hint ? 0 : undefined}
    className={cn('relative inline-block whitespace-nowrap data focus-visible:rounded-soft', className)}
    {...props}
  >
    <span aria-hidden>{formatRelative(at, now, format, zone)}</span>
    <span className="sr-only">{formatRelative(at, now, 'long', zone)}, {local}</span>
  </time>;

  if (!hint) return node;
  return <TextHint content={<span className="flex flex-col data">
    <span>{local}</span>
    {mounted && <span className="text-text-2">{utc}</span>}
  </span>}>{node}</TextHint>;
}

export {RelativeTime, formatRelative, untilChange, type RelativeTimeProps};

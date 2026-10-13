'use client';

import {useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode} from 'react';
import {Popover as PopoverPrimitive} from '@base-ui/react/popover';
import {Input as InputPrimitive} from '@base-ui/react/input';
import {Icon, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronSort, Time} from '../icon';
import {Button} from './button';
import {fieldBoxVariants, fieldControlVariants, useFieldDisabled, type ControlSize} from './field';
import {fieldActionClass} from './input/parts';
import {useQuartzPortal} from '../lib/portal';
import {overlayMotion, overlaySurface} from '../lib/overlay';
import {cn} from '../lib/utils';

type DateRange = {from?: Date; to?: Date};
type Matcher = ((date: Date) => boolean) | {before?: Date; after?: Date};

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const utcToday = () => { const d = new Date(); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function daysBetween(a: Date, b: Date) {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.abs(Math.round((ub - ua) / 86_400_000)) + 1;
}
const dayCount = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'day' : 'days'}`;

function isDisabled(date: Date, matcher?: Matcher) {
  if (!matcher) return false;
  if (typeof matcher === 'function') return matcher(date);
  if (matcher.before && date < day(matcher.before)) return true;
  if (matcher.after && date > day(matcher.after)) return true;
  return false;
}

function weeksOf(month: Date, weekStartsOn: number) {
  const first = monthStart(month);
  const start = addDays(first, -((first.getDay() - weekStartsOn + 7) % 7));
  return Array.from({length: 6}, (_, w) => Array.from({length: 7}, (_, d) => addDays(start, w * 7 + d)));
}

type CalendarBaseProps = {
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  disabled?: Matcher;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  numberOfMonths?: 1 | 2;
  showOutsideDays?: boolean;
  locale?: string;
  autoFocus?: boolean;
  footer?: ReactNode;
  today?: Date;
  className?: string;
};

type CalendarSingleProps = CalendarBaseProps & {mode?: 'single'; selected?: Date | null; defaultSelected?: Date | null; onSelect?: (date: Date) => void};
type CalendarRangeProps = CalendarBaseProps & {mode: 'range'; selected?: DateRange; defaultSelected?: DateRange; onSelect?: (range: DateRange) => void};
type CalendarProps = CalendarSingleProps | CalendarRangeProps;

function Calendar(props: CalendarProps) {
  const {month: monthProp, defaultMonth, onMonthChange, disabled, weekStartsOn = 0, numberOfMonths = 1, showOutsideDays = true, locale = 'en-US', autoFocus, footer, className} = props;
  const range = props.mode === 'range';

  const [innerSelected, setInnerSelected] = useState<Date | DateRange | null | undefined>(props.defaultSelected);
  const selected = props.selected !== undefined ? props.selected : innerSelected;
  const single = range ? null : (selected as Date | null | undefined) ?? null;
  const span = range ? ((selected as DateRange | undefined) ?? {}) : {};

  const [clock, setToday] = useState<Date | null>(null);
  const today = props.today ? day(props.today) : clock;
  const given = monthProp ?? defaultMonth ?? single ?? span.from;
  const [innerMonth, setInnerMonth] = useState(monthStart(given ?? props.today ?? utcToday()));
  const month = monthProp ? monthStart(monthProp) : innerMonth;
  const setMonth = (m: Date) => { const s = monthStart(m); if (!monthProp) setInnerMonth(s); onMonthChange?.(s); };

  const [focusDate, setFocusDate] = useState<Date>(() => day(single ?? span.from ?? monthProp ?? defaultMonth ?? props.today ?? utcToday()));
  useEffect(() => {
    const now = day(props.today ?? new Date());
    setToday(now);
    if (given) return;
    setInnerMonth(monthStart(now));
    setFocusDate(now);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [hover, setHover] = useState<Date | null>(null);
  const shouldFocus = useRef(!!autoFocus);
  const gridRef = useRef<HTMLDivElement>(null);
  const captionId = useId();

  const months = useMemo(() => Array.from({length: numberOfMonths}, (_, i) => addMonths(month, i)), [month, numberOfMonths]);
  const visible = (d: Date) => months.some(m => sameMonth(m, d));
  const tabDate = (() => {
    const ok = (d?: Date | null): d is Date => !!d && visible(d) && !isDisabled(d, disabled);
    if (ok(focusDate)) return focusDate;
    for (const c of [single, span.from, today]) if (ok(c)) return c;
    for (const m of months) for (const week of weeksOf(m, weekStartsOn)) for (const d of week) if (sameMonth(d, m) && !isDisabled(d, disabled)) return d;
    return months[0];
  })();

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${key(tabDate)}"]`)?.focus();
  });

  const fmtMonth = new Intl.DateTimeFormat(locale, {month: 'long', year: 'numeric'});
  const fmtWeekday = new Intl.DateTimeFormat(locale, {weekday: 'short'});
  const fmtWeekdayLong = new Intl.DateTimeFormat(locale, {weekday: 'long'});
  const fmtFull = new Intl.DateTimeFormat(locale, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
  const weekdays = weeksOf(month, weekStartsOn)[0];

  const choose = (date: Date) => {
    if (range) {
      const {from, to} = span;
      const next: DateRange = !from || to ? {from: date, to: undefined} : date < from ? {from: date, to: from} : {from, to: date};
      if (props.selected === undefined) setInnerSelected(next);
      (props as CalendarRangeProps).onSelect?.(next);
    } else {
      if (props.selected === undefined) setInnerSelected(date);
      (props as CalendarSingleProps).onSelect?.(date);
    }
    setFocusDate(date);
    if (!visible(date)) setMonth(date);
  };

  const move = (to: Date) => {
    setFocusDate(to);
    if (range && span.from && !span.to) setHover(to);
    shouldFocus.current = true;
    if (!visible(to)) setMonth(to < months[0] ? to : addMonths(to, -(numberOfMonths - 1)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    const dow = (date.getDay() - weekStartsOn + 7) % 7;
    const rtl = !!e.currentTarget.closest('[dir=rtl]');
    const walk = (step: (d: Date) => Date, max = 400) => { const out: Date[] = []; for (let c = step(date), i = 0; i < max; c = step(c), i++) out.push(c); return out; };
    const toward = (end: Date) => { const out: Date[] = []; const dir = end < date ? 1 : -1; for (let c = end; !same(c, date); c = addDays(c, dir)) out.push(c); return out; };
    const byMonths = (n: number) => Array.from({length: 24}, (_, i) => addMonths(date, n * (i + 1)));
    const moves: Record<string, () => Date[]> = {
      ArrowLeft: () => walk(d => addDays(d, rtl ? 1 : -1)),
      ArrowRight: () => walk(d => addDays(d, rtl ? -1 : 1)),
      ArrowUp: () => walk(d => addDays(d, -7), 60),
      ArrowDown: () => walk(d => addDays(d, 7), 60),
      Home: () => toward(addDays(date, -dow)),
      End: () => toward(addDays(date, 6 - dow)),
      PageUp: () => byMonths(e.shiftKey ? -12 : -1),
      PageDown: () => byMonths(e.shiftKey ? 12 : 1),
    };
    const fn = moves[e.key];
    if (!fn) return;
    e.preventDefault();
    const to = fn().find(d => !isDisabled(d, disabled));
    if (to) move(to);
  };

  const open = range && !!span.from && !span.to;
  const [lo, hi] = (() => {
    const from = span.from;
    const to = span.to ?? (from && hover && !isDisabled(hover, disabled) ? hover : undefined);
    if (!from) return [undefined, undefined];
    if (!to) return [from, from];
    return from <= to ? [from, to] : [to, from];
  })();
  const count = range && lo && hi ? daysBetween(lo, hi) : 0;

  return <div data-slot="calendar" data-mode={range ? 'range' : 'single'} className={cn('inline-flex w-fit max-w-full flex-col gap-3 text-text-1', className)}>
    <div ref={gridRef} className="flex flex-col gap-6 sm:flex-row" onMouseLeave={() => range && setHover(null)}>
      {months.map((m, mi) => {
        const id = `${captionId}-${mi}`;
        return <div key={key(m)} data-slot="calendar-month" className="flex flex-col gap-2">
          <div className="flex h-(--control-sm) items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() => setMonth(addMonths(month, -1))}
              className={cn('bg-transparent hover:not-data-disabled:bg-hover', mi > 0 && 'invisible')}
            ><Icon icon={ChevronLeft} size={16} className="rtl:-scale-x-100"/></Button>
            <div id={id} aria-live="polite" className="type-label">{fmtMonth.format(m)}</div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next month"
              onClick={() => setMonth(addMonths(month, 1))}
              className={cn('bg-transparent hover:not-data-disabled:bg-hover', mi < numberOfMonths - 1 && 'invisible')}
            ><Icon icon={ChevronRight} size={16} className="rtl:-scale-x-100"/></Button>
          </div>
          <table role="grid" aria-labelledby={id} aria-multiselectable={range || undefined} className="border-separate border-spacing-y-0.5">
            <thead>
              <tr>{weekdays.map(w => <th key={w.getDay()} scope="col" abbr={fmtWeekdayLong.format(w)} className="h-(--control-sm) w-(--control) type-label-sm font-normal text-text-3">
                {fmtWeekday.format(w).slice(0, 2)}
              </th>)}</tr>
            </thead>
            <tbody>
              {weeksOf(m, weekStartsOn).map(week => <tr key={key(week[0])}>
                {week.map(d => {
                  const outside = !sameMonth(d, m);
                  if (outside && !showOutsideDays) return <td key={key(d)} role="presentation"/>;
                  const off = isDisabled(d, disabled);
                  const isToday = same(d, today);
                  const inRange = range && !outside && !!lo && !!hi && d >= lo && d <= hi;
                  const stretched = inRange && !same(lo, hi);
                  const end = !outside && (range ? same(d, lo) || same(d, hi) : same(d, single));
                  return <td
                    key={key(d)}
                    role="gridcell"
                    aria-selected={inRange || end || undefined}
                    className={cn(
                      'p-0',
                      stretched && 'bg-accent-wash forced-colors:bg-[Highlight]',
                      stretched && same(d, lo) && 'rounded-s-soft',
                      stretched && same(d, hi) && 'rounded-e-soft',
                    )}
                  >
                    <button
                      type="button"
                      data-slot="calendar-day"
                      data-day={key(d)}
                      data-outside={outside || undefined}
                      data-today={(isToday && !outside) || undefined}
                      data-selected={end || undefined}
                      tabIndex={same(d, tabDate) ? 0 : -1}
                      disabled={off}
                      aria-label={`${fmtFull.format(d)}${isToday ? ', today' : ''}`}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={() => choose(d)}
                      onKeyDown={e => onKeyDown(e, d)}
                      onFocus={() => setFocusDate(d)}
                      onMouseEnter={() => range && setHover(d)}
                      className={cn(
                        'relative flex size-(--control) items-center justify-center rounded-soft type-label data text-text-1',
                        'transition-colors duration-(--dur-fast) ease-(--ease-step)',
                        'focus-visible:focus-ring-inset data-selected:focus-visible:focus-ring-ink',
                        'hover:not-disabled:not-data-selected:bg-hover',
                        'data-outside:text-text-3',
                        "data-today:after:absolute data-today:after:bottom-1.5 data-today:after:h-0.5 data-today:after:w-3 data-today:after:bg-current data-today:after:content-['']",
                        'data-selected:bg-ink data-selected:text-text-inverse forced-colors:data-selected:border-2',
                        stretched && same(d, lo) && 'rounded-e-none',
                        stretched && same(d, hi) && 'rounded-s-none',
                        'disabled:cursor-not-allowed disabled:text-text-disabled disabled:line-through disabled:decoration-1',
                      )}
                    >{d.getDate()}</button>
                  </td>;
                })}
              </tr>)}
            </tbody>
          </table>
        </div>;
      })}
    </div>
    {range && <p data-slot="calendar-count" role="status" className="flex h-5 items-center justify-between gap-3 type-label-sm text-text-2">
      {(!span.from || open) && <span>{!span.from ? 'Pick a start date' : 'Pick an end date'}</span>}
      {count > 0 && <span className="ms-auto text-text-1 [unicode-bidi:plaintext]">{dayCount(count)}</span>}
    </p>}
    {footer}
  </div>;
}

const toMinutes = (v: string) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

function parseTime(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  const mer = s.match(/(a|p)\.?m?\.?$/);
  const body = mer ? s.slice(0, mer.index) : s;
  let h: number, m: number;
  const parts = body.split(/[:.h]/);
  if (parts.length > 2) return null;
  if (parts.length === 2 && parts[1] !== '') {
    if (!/^\d{1,2}$/.test(parts[0]) || !/^\d{2}$/.test(parts[1])) return null;
    h = Number(parts[0]); m = Number(parts[1]);
  }
  else {
    const d = parts[0];
    if (!/^\d{1,4}$/.test(d)) return null;
    if (d.length <= 2) { h = Number(d); m = 0; }
    else if (d.length === 3) { h = Number(d[0]); m = Number(d.slice(1)); }
    else { h = Number(d.slice(0, 2)); m = Number(d.slice(2)); }
  }
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m > 59) return null;
  if (mer) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (mer[1] === 'p' ? 12 : 0);
  }
  if (h > 23) return null;
  return fromMinutes(h * 60 + m);
}

function formatTime(v: string | null | undefined, hourCycle: 12 | 24) {
  if (!v) return '';
  if (hourCycle === 24) return v;
  const [h, m] = v.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

type TimeFieldProps = {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  step?: 5 | 10 | 15 | 30 | 60;
  hourCycle?: 12 | 24;
  min?: string;
  max?: string;
  list?: boolean;
  placeholder?: string;
  disabled?: boolean;
  size?: ControlSize;
  name?: string;
  id?: string;
  className?: string;
  groupClassName?: string;
  draftText?: string;
  detached?: boolean;
  onEnter?: (value: string | null) => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

function TimeField({
  value: valueProp, defaultValue = null, onValueChange, step = 15, hourCycle = 24, min, max, list = true, placeholder, disabled: disabledProp, size = 'default', name, id,
  className, groupClassName, detached = false, draftText, onEnter, 'aria-label': ariaLabel, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid,
}: TimeFieldProps) {
  const inFieldOff = useFieldDisabled();
  const disabled = disabledProp || (inFieldOff && !detached);
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const [text, setText] = useState(draftText ?? formatTime(value, hourCycle));
  const [unreadable, setUnreadable] = useState(draftText !== undefined && !parseTime(draftText));
  const [open, setOpen] = useState(false);
  const container = useQuartzPortal();
  const groupRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const errorId = useId();

  const seen = useRef({value, hourCycle});
  useEffect(() => {
    if (seen.current.value === value && seen.current.hourCycle === hourCycle) return;
    seen.current = {value, hourCycle};
    setText(formatTime(value, hourCycle));
    setUnreadable(false);
  }, [value, hourCycle]);

  const set = (next: string | null) => { if (valueProp === undefined) setInner(next); onValueChange?.(next); };
  const inRange = (v: string) => (!min || toMinutes(v) >= toMinutes(min)) && (!max || toMinutes(v) <= toMinutes(max));

  const options = useMemo(() => {
    const out: string[] = [];
    for (let n = 0; n < 24 * 60; n += step) { const v = fromMinutes(n); if (inRange(v)) out.push(v); }
    return out;
  }, [step, min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (): string | null | undefined => {
    if (!text.trim()) { setUnreadable(false); if (value !== null) set(null); return null; }
    const parsed = parseTime(text);
    if (!parsed || !inRange(parsed)) { setUnreadable(true); return undefined; }
    setUnreadable(false);
    if (parsed !== value) set(parsed); else setText(formatTime(parsed, hourCycle));
    return parsed;
  };

  const nearest = () => {
    if (!options.length) return null;
    const target = value ? toMinutes(value) : 9 * 60;
    return options.reduce((a, b) => Math.abs(toMinutes(b) - target) < Math.abs(toMinutes(a) - target) ? b : a);
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = [...(listRef.current?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (j: number) => { e.preventDefault(); items[Math.max(0, Math.min(items.length - 1, j))]?.focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'PageDown') go(i + 4);
    else if (e.key === 'PageUp') go(i - 4);
  };

  const invalid = ariaInvalid || unreadable;
  const why = unreadable ? (parseTime(text) ? `Pick a time between ${formatTime(min ?? '00:00', hourCycle)} and ${formatTime(max ?? '23:59', hourCycle)}` : 'Not a time. Try 9:30 or 21:00') : '';

  const controlProps = {
    id,
    'data-slot': 'time-field-input',
    'data-control': '',
    value: text,
    onBlur: commit,
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { e.preventDefault(); const done = commit(); if (done !== undefined) onEnter?.(done); }
      else if (e.key === 'Escape' && text !== formatTime(value, hourCycle)) { e.preventDefault(); e.stopPropagation(); setText(formatTime(value, hourCycle)); setUnreadable(false); }
      else if (e.key === 'ArrowDown' && e.altKey && list) { e.preventDefault(); setOpen(true); }
    },
    disabled,
    placeholder: placeholder ?? (hourCycle === 12 ? '9:30 AM' : '09:30'),
    'aria-label': ariaLabel,
    'aria-describedby': cn(describedBy, unreadable && errorId) || undefined,
    'aria-invalid': invalid || undefined,
    autoComplete: 'off',
    spellCheck: false,
    inputMode: 'text' as const,
    className: cn(
      'h-full min-w-0 flex-1 bg-transparent ps-3 type-label data pointer-coarse:text-base placeholder:text-text-3 disabled:cursor-not-allowed',
      size === 'sm' && 'ps-2', size === 'lg' && 'ps-4', !list && 'pe-3',
    ),
  };

  const box = <div
    ref={groupRef}
    data-slot="time-field"
    data-size={size}
    data-disabled={disabled || undefined}
    data-status={invalid ? 'fail' : undefined}
    className={cn(fieldBoxVariants({size}), 'sm:w-40', className)}
  >
    {detached
      ? <input {...controlProps} onChange={e => { setText(e.target.value); if (unreadable) setUnreadable(false); }}/>
      : <InputPrimitive {...controlProps} onValueChange={v => { setText(v); if (unreadable) setUnreadable(false); }}/>}
    {list && <PopoverPrimitive.Trigger
      data-slot="time-field-trigger"
      disabled={disabled}
      aria-label="Choose a time"
      className={cn(
        'me-1 data-popup-open:bg-pressed data-popup-open:text-text-1 data-disabled:cursor-not-allowed',
        fieldActionClass(size),
      )}
    ><Icon icon={Time} size={16}/></PopoverPrimitive.Trigger>}
    {name && <input type="hidden" name={name} value={value ?? ''} disabled={disabled}/>}
  </div>;

  const field = <div data-slot="time-field-group" className={cn('flex min-w-0 flex-col gap-2', groupClassName)}>
    {box}
    <p
      id={errorId}
      role="status"
      data-slot="time-field-reason"
      data-status={why ? 'fail' : undefined}
      className={cn(
        why
          ? 'flex min-w-0 basis-full items-start gap-2 type-body-sm text-fail-text'
          : 'sr-only',
      )}
    >{why}</p>
  </div>;

  if (!list) return field;
  return <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
    {field}
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Positioner anchor={groupRef} sideOffset={6} align="start" collisionPadding={16} className="z-(--z-overlay)">
        <PopoverPrimitive.Popup
          data-slot="time-field-popup"
          initialFocus={() => listRef.current?.querySelector<HTMLElement>('[aria-selected=true]') ?? listRef.current?.querySelector<HTMLElement>(`[data-time="${nearest()}"]`) ?? true}
          className={cn(
            'w-(--anchor-width) min-w-32 p-1', overlaySurface, overlayMotion,
          )}
        >
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Times"
            onKeyDown={onListKeyDown}
            className="flex max-h-[min(--spacing(64),var(--available-height))] flex-col overflow-y-auto overscroll-contain"
          >
            {options.map(v => {
              const selected = v === value;
              return <li key={v} role="presentation">
                <button
                  type="button"
                  role="option"
                  data-time={v}
                  aria-selected={selected}
                  tabIndex={-1}
                  onClick={() => { set(v); setOpen(false); }}
                  ref={el => { if (el && (selected || (!value && v === nearest())) && open) el.scrollIntoView({block: 'center'}); }}
                  className={cn(
                    'flex h-(--row-sm) w-full shrink-0 items-center rounded-inner px-2 text-start type-label data text-text-1',
                    'hover:bg-hover focus-visible:focus-ring-inset',
                    selected && 'bg-accent-wash hover:bg-accent-wash',
                  )}
                >{formatTime(v, hourCycle)}</button>
              </li>;
            })}
          </ul>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>;
}

type Preset = {label: string; range: DateRange};

type BaseProps = {
  placeholder?: string;
  disabled?: boolean;
  size?: ControlSize;
  disabledDays?: Matcher;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  locale?: string;
  format?: Intl.DateTimeFormatOptions;
  name?: string;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  align?: 'start' | 'center' | 'end';
  today?: Date;
  clearable?: boolean;
  [forced: `data-force-${string}`]: unknown;
};

type SingleProps = BaseProps & {granularity?: 'date'; mode?: 'single'; value?: Date | null; defaultValue?: Date | null; onValueChange?: (date: Date | null) => void};
type RangeProps = BaseProps & {granularity?: 'date'; mode: 'range'; value?: DateRange; defaultValue?: DateRange; onValueChange?: (range: DateRange) => void; presets?: Preset[]};
type DateTimeProps = BaseProps & {granularity: 'datetime'; mode?: 'single'; value?: Date | null; defaultValue?: Date | null; onValueChange?: (date: Date | null) => void; hourCycle?: 12 | 24};
type TimeProps = Omit<TimeFieldProps, 'list' | 'onEnter'> & {granularity: 'time'};
type DatePickerProps = SingleProps | RangeProps | DateTimeProps | TimeProps;

const NARROW = 640;

function containerWidth(el: HTMLElement | null) {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    if (getComputedStyle(node).containerType !== 'normal') return node.clientWidth;
  }
  return document.documentElement.clientWidth;
}

const iso = (d?: Date | null) => d ? key(d) : '';
const isoTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

function DatePicker(props: DatePickerProps) {
  if (props.granularity === 'time') {
    const {granularity: _g, ...rest} = props;
    return <TimeField {...rest}/>;
  }
  return <DateField {...props}/>;
}

function DateField(props: SingleProps | RangeProps | DateTimeProps) {
  const {placeholder, disabled: disabledProp, size = 'default', disabledDays, weekStartsOn, locale = 'en-US', name, id, className, align = 'start', clearable} = props;
  const disabled = useFieldDisabled() || !!disabledProp;
  const range = props.mode === 'range';
  const datetime = props.granularity === 'datetime';
  const hourCycle = datetime ? (props as DateTimeProps).hourCycle ?? 24 : 24;
  const format = props.format ?? {month: 'short', day: 'numeric', year: 'numeric'};
  const container = useQuartzPortal();
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [draft, setDraft] = useState<Date | DateRange | null>(null);
  const onOpenChange = (next: boolean) => {
    if (next) setNarrow(containerWidth(triggerRef.current) < NARROW);
    setDraft(null);
    setOpen(next);
  };
  const close = () => onOpenChange(false);
  const autoId = useId();
  const triggerId = id ?? autoId;

  const [fieldIds, setFieldIds] = useState<{label?: string; described?: string}>({});
  useEffect(() => {
    const trigger = triggerRef.current;
    const field = trigger?.closest('[data-slot=field]');
    if (!trigger || !field) return;
    const update = () => {
      const label = field.querySelector('[data-slot=field-label]')?.id || undefined;
      const described = [...field.querySelectorAll('[data-slot=field-description], [data-slot=field-error]')].map(e => e.id).filter(Boolean).join(' ') || undefined;
      setFieldIds(prev => prev.label === label && prev.described === described ? prev : {label, described});
    };
    const focus = () => trigger.focus();
    const labelEl = field.querySelector('[data-slot=field-label]');
    labelEl?.addEventListener('click', focus);
    update();
    const observer = new MutationObserver(update);
    observer.observe(field, {childList: true, subtree: true});
    return () => { observer.disconnect(); labelEl?.removeEventListener('click', focus); };
  }, []);

  const [inner, setInner] = useState<Date | DateRange | null | undefined>(props.defaultValue);
  const value = props.value !== undefined ? props.value : inner;
  const set = (next: Date | DateRange | null) => {
    if (props.value === undefined) setInner(next);
    (props.onValueChange as ((v: typeof next) => void) | undefined)?.(next);
  };

  const fmt = new Intl.DateTimeFormat(locale, format);
  const span = range ? ((value as DateRange | undefined) ?? {}) : {};
  const single = range ? null : (value as Date | null | undefined) ?? null;
  const label = range
    ? span.from ? `${fmt.format(span.from)} – ${span.to ? fmt.format(span.to) : '…'}` : ''
    : single ? `${fmt.format(single)}${datetime ? `, ${formatTime(isoTime(single), hourCycle)}` : ''}` : '';
  const count = range && span.from && span.to ? daysBetween(span.from, span.to) : 0;
  const presets = range ? (props as RangeProps).presets : undefined;
  const invalid = props['aria-invalid'];

  const draftSingle = datetime ? (draft as Date | null) ?? single : single;
  const pickDay = (d: Date) => {
    if (!datetime) { set(d); close(); return; }
    const time = draftSingle ? [draftSingle.getHours(), draftSingle.getMinutes()] : [9, 0];
    setDraft(new Date(d.getFullYear(), d.getMonth(), d.getDate(), time[0], time[1]));
  };
  const withTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const base = draftSingle ?? day(props.today ?? new Date());
    return new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, m);
  };
  const pickTime = (t: string | null) => { if (t) setDraft(withTime(t)); };
  const confirm = (time?: string | null) => {
    const next = time ? withTime(time) : draftSingle;
    if (next) set(next);
    close();
  };
  const shown = range ? ((draft as DateRange | null) ?? span) : span;

  const forced = Object.fromEntries(Object.entries(props).filter(([k]) => k.startsWith('data-force-')));
  return <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <PopoverPrimitive.Trigger
      {...forced}
      ref={triggerRef}
      id={triggerId}
      data-slot="date-picker-trigger"
      data-size={size}
      data-status={invalid ? 'fail' : undefined}
      disabled={disabled}
      aria-label={props['aria-label'] ? `${props['aria-label']}, ${label || 'empty'}` : undefined}
      aria-labelledby={props['aria-label'] || !fieldIds.label ? undefined : `${fieldIds.label} ${triggerId}`}
      aria-describedby={props['aria-describedby'] ?? fieldIds.described}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldControlVariants({size}),
        'inline-flex max-w-full items-center gap-2 text-start sm:w-fit sm:min-w-56',
        'data-popup-open:[--frame-color:var(--border-focus)]! data-popup-open:[--control-lift:var(--focus-halo)]',
        'in-data-[status=fail]:[--frame-color:var(--fail-line)] in-data-[status=fail]:hover:[--frame-color:var(--fail-line)]',
        className,
      )}
    >
      <Icon icon={CalendarIcon} size={16} className="text-text-2"/>
      <span className="flex max-h-(--line-box) min-w-0 flex-1 flex-wrap justify-between gap-x-2 overflow-hidden">
        <span className={cn('max-w-full min-w-0 truncate data', !label && 'text-text-3')}>{label || placeholder || (range ? 'Pick a range' : datetime ? 'Pick a date and time' : 'Pick a date')}</span>
        {count > 0 && <span data-slot="date-picker-count" className="shrink-0 type-label-sm text-text-3 [unicode-bidi:plaintext]">{dayCount(count)}</span>}
      </span>
      <Icon icon={ChevronSort} size={16} className="text-text-2"/>
    </PopoverPrimitive.Trigger>
    {name && (range
      ? <><input type="hidden" name={`${name}-from`} value={iso(span.from)} disabled={disabled}/><input type="hidden" name={`${name}-to`} value={iso(span.to)} disabled={disabled}/></>
      : <input type="hidden" name={name} value={single ? (datetime ? `${iso(single)}T${isoTime(single)}` : iso(single)) : ''} disabled={disabled}/>)}
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Positioner sideOffset={6} align={align} collisionPadding={16} className="z-(--z-overlay)">
        <PopoverPrimitive.Popup
          ref={popupRef}
          data-slot="date-picker-popup"
          data-narrow={narrow || undefined}
          initialFocus={() => popupRef.current?.querySelector<HTMLElement>('[data-day][tabindex="0"]') ?? true}
          className={cn(
            'flex max-h-(--available-height) max-w-[calc(100vw-2*var(--gutter-sm))] flex-col gap-3 overflow-y-auto p-3', overlaySurface, overlayMotion,
            !narrow && 'flex-row',
          )}
        >
          {presets && <ul aria-label="Presets" className={cn('flex gap-1', narrow ? 'flex-wrap' : 'w-36 flex-col')}>
            {presets.map(p => {
              const active = same(p.range.from, span.from) && same(p.range.to, span.to);
              return <li key={p.label} className="shrink-0">
                <button
                  type="button"
                  data-slot="date-picker-preset"
                  aria-pressed={active}
                  onClick={() => { set(p.range); close(); }}
                  className={cn(
                    'flex h-(--row-sm) w-full items-center justify-between gap-2 rounded-inner px-2 text-start type-label whitespace-nowrap text-text-1 focus-visible:focus-ring-inset',
                    active ? 'bg-accent-wash' : 'hover:bg-hover',
                  )}
                >{p.label}{p.range.from && p.range.to && !/\d/.test(p.label) && <span className="type-label-sm text-text-3">{daysBetween(p.range.from, p.range.to)}d</span>}</button>
              </li>;
            })}
          </ul>}
          <div className="flex min-w-0 flex-col gap-3">
            {range
              ? <Calendar
                  mode="range"
                  selected={shown}
                  onSelect={next => { if (next.from && next.to) { set(next); close(); } else setDraft(next); }}
                  numberOfMonths={narrow ? 1 : 2}
                  disabled={disabledDays}
                  weekStartsOn={weekStartsOn}
                  locale={locale}
                  today={props.today}
                  defaultMonth={span.from}
                />
              : <Calendar
                  selected={draftSingle}
                  onSelect={pickDay}
                  disabled={disabledDays}
                  weekStartsOn={weekStartsOn}
                  locale={locale}
                  today={props.today}
                  defaultMonth={single ?? undefined}
                  footer={datetime && <div className="flex flex-col gap-3 rule-top pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                      <span className="type-label text-text-2">Time</span>
                      <TimeField detached list={false} groupClassName="contents" value={draftSingle ? isoTime(draftSingle) : null} onValueChange={pickTime} hourCycle={hourCycle} size="sm" aria-label="Time" className="w-28 sm:w-28" onEnter={confirm}/>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" data-slot="date-picker-confirm" disabled={!draftSingle} onClick={() => confirm()}>Set</Button>
                    </div>
                  </div>}
                />}
            {clearable && (range ? span.from : single) && <div className="flex justify-end">
              <Button variant="ghost" size="sm" data-slot="date-picker-clear" onClick={() => { set(range ? {} : null); close(); }}>Clear</Button>
            </div>}
          </div>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>;
}

export {
  Calendar,
  DatePicker,
  TimeField,
  addDays,
  addMonths,
  daysBetween,
  formatTime,
  parseTime,
  type CalendarProps,
  type DatePickerProps,
  type DateRange,
  type Matcher,
  type Preset,
  type TimeFieldProps,
};

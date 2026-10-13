'use client';

import * as React from 'react';
import {useVirtualizer} from '@tanstack/react-virtual';
import type {Kind} from '../lib/kind';
import {durationUnitFor, formatDurations} from '../lib/format';
import {useOffscreen} from '../lib/use-offscreen';
import {cn} from '../lib/utils';
import {niceScale} from './chart-scale';
import {Status, statusLabels} from './status';

type TimelineStatus = 'queued' | 'running' | 'ok' | 'warn' | 'fail' | 'waiting';

type TimelineSpan = {
  id: string;
  label: string;
  start: number;
  end?: number;
  status?: TimelineStatus;
  waitingLabel?: string;
  kind?: Kind;
  depth?: number;
  meta?: React.ReactNode;
  figure?: React.ReactNode;
};

type TimelineProps = Omit<React.ComponentProps<'section'>, 'children'> & {
  label: string;
  spans: TimelineSpan[];
  now?: number;
  activeId?: string;
  onSpanClick?: (span: TimelineSpan) => void;
  kind?: Kind;
  maxHeight?: number;
  loading?: boolean;
  bars?: 'kind' | 'quiet';
  footer?: React.ReactNode;
  size?: 'default' | 'sm';
};

const ROW = {default: 40, sm: 32} as const;
const WINDOW_FROM = 200;
const statusWord = (s: TimelineSpan) => (s.status === 'waiting' ? s.waitingLabel ?? statusLabels.waiting : s.status ? statusLabels[s.status] : '');

function Timeline({label, spans, now, activeId, onSpanClick, kind, maxHeight, loading = false, bars = 'kind', footer, size = 'default', className, ...props}: TimelineProps) {
  const ends = spans.map(s => s.end ?? now ?? s.start);
  const total = Math.max(1, ...ends, now ?? 0);
  const {unit, size: unitSize} = durationUnitFor([total]);
  const unitScale = niceScale(0, total / unitSize, 4);
  const ticks = unitScale.ticks.filter(t => t * unitSize <= total + 1e-6);
  const scale = {max: total, ticks: ticks.map(t => t * unitSize)};
  const span = scale.max || 1;
  const frac = (ms: number) => Math.min(Math.max(ms, 0), span) / span;
  const at = (ms: number) => `${frac(ms) * 100}%`;
  const durations = formatDurations(spans.map((s, i) => ends[i] - s.start)).values;
  const tickLabels = ticks.map(t => `${t.toLocaleString('en-US')}${unit}`);
  const totalLabel = formatDurations([total]).values[0];
  const running = spans.some(s => s.status === 'running' || (s.end === undefined && s.status !== 'waiting' && s.status !== 'queued'));
  const failed = spans.some(s => s.status === 'fail');
  const frameRef = useOffscreen<HTMLElement>(running);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const windowed = !!maxHeight && spans.length >= WINDOW_FROM;
  const virtualizer = useVirtualizer({count: windowed ? spans.length : 0, getScrollElement: () => scrollRef.current, estimateSize: () => ROW[size], overscan: 10});
  const rows = windowed ? virtualizer.getVirtualItems().map(item => ({index: item.index, start: item.start})) : spans.map((_, index) => ({index, start: 0}));
  const [focusIndex, setFocusIndex] = React.useState<number | null>(null);
  const activeIndex = activeId === undefined ? -1 : spans.findIndex(s => s.id === activeId);
  const tabRow = focusIndex ?? Math.max(activeIndex, 0);

  const trackRef = React.useRef<HTMLSpanElement>(null);
  const [trackPx, setTrackPx] = React.useState(0);
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setTrackPx(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const show = (index: number) => {
    if (windowed) virtualizer.scrollToIndex(index, {align: 'center'});
    else scrollRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView({block: 'nearest'});
  };
  const focusRow = (index: number) => {
    const next = Math.max(0, Math.min(spans.length - 1, index));
    setFocusIndex(next);
    show(next);
    requestAnimationFrame(() => scrollRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.focus());
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, index: number) => {
    const moves: Record<string, number> = {ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: spans.length - 1};
    if (event.key in moves) { event.preventDefault(); focusRow(moves[event.key]); return; }
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) { event.preventDefault(); onSpanClick?.(spans[index]); }
  };
  const step = scale.ticks.length > 1 ? scale.ticks[1] - scale.ticks[0] : span;
  const grid = {backgroundImage: 'linear-gradient(to right, var(--line-row) var(--line-hair), transparent var(--line-hair))', backgroundSize: `${(step / span) * 100}% 100%`} as React.CSSProperties;
  const marked = spans.some(s => s.status === 'warn' || s.status === 'fail' || s.status === 'waiting');
  const columns = cn('grid items-center grid-cols-[minmax(0,max(var(--timeline-name-min),40%))_minmax(0,1fr)]', marked
    ? '@xl/timeline:grid-cols-[minmax(0,clamp(var(--timeline-name-min),30%,var(--timeline-name)))_minmax(0,1fr)_var(--status-column)]'
    : '@xl/timeline:grid-cols-[minmax(0,clamp(var(--timeline-name-min),30%,var(--timeline-name)))_minmax(0,1fr)]');
  const glide = running ? 'transition-[inset-inline-start,inset-inline-end,width] duration-1000 ease-linear motion-reduce:transition-none' : '';

  const row = (index: number, top: number) => {
    const s = spans[index];
    const end = ends[index];
    const open = s.id === activeId;
    const trouble = s.status === 'warn' || s.status === 'fail' ? s.status : undefined;
    const isRunning = s.end === undefined && s.status !== 'waiting' && s.status !== 'queued';
    const charPx = 6.5;
    const labelPx = durations[index].length * charPx + (s.status === 'waiting' ? (statusWord(s).length + 2) * charPx : 0);
    const gap = 8;
    const barPx = (frac(end) - frac(s.start)) * trackPx;
    const place: 'in' | 'after' | 'before' = trackPx === 0
      ? (s.status !== 'waiting' && frac(end) - frac(s.start) >= 0.22 ? 'in' : frac(end) <= 0.84 ? 'after' : 'before')
      : s.status !== 'waiting' && barPx >= labelPx + gap * 2 ? 'in'
      : (1 - frac(end)) * trackPx >= labelPx + gap ? 'after'
      : 'before';
    const colored = bars === 'kind' || open || !!trouble;
    const name = `${s.label}, started at ${formatDurations([s.start]).values[0]}, ${isRunning || s.status === 'waiting' ? 'so far' : 'took'} ${durations[index]}${s.status && s.status !== 'ok' ? `, ${statusWord(s).toLowerCase()}` : ''}`;
    return <div
      key={s.id}
      data-index={index}
      data-slot="timeline-row"
      data-kind={s.kind}
      data-status={trouble}
      data-open={open || undefined}
      role={onSpanClick ? 'option' : 'listitem'}
      aria-selected={onSpanClick ? open : undefined}
      aria-label={name}
      tabIndex={onSpanClick ? (index === tabRow ? 0 : -1) : undefined}
      onFocus={onSpanClick ? () => setFocusIndex(index) : undefined}
      onKeyDown={onSpanClick ? event => onKeyDown(event, index) : undefined}
      onClick={onSpanClick ? () => onSpanClick(s) : undefined}
      className={cn(
        columns, 'min-h-(--timeline-row) rule-row transition-colors duration-(--dur-fast) ease-(--ease-step)',
        trouble === 'fail' && 'wash-row',
        onSpanClick && 'cursor-pointer hover:bg-hover focus-visible:focus-ring-inset',
        windowed && 'absolute inset-x-0 top-0',
      )}
      style={windowed ? {transform: `translateY(${top}px)`} : undefined}
    >
      <span aria-hidden data-slot="timeline-name" className="@container/name relative flex h-(--timeline-row) min-w-0 items-center gap-2 ps-4 pe-3" style={{paddingInlineStart: `calc(var(--space-4) + ${s.depth ?? 0} * var(--space-4))`}}>
        {Array.from({length: s.depth ?? 0}, (_, d) => <span key={d} data-slot="timeline-guide" className="absolute inset-y-0 w-px bg-line-row" style={{insetInlineStart: `calc(var(--space-4) + ${d} * var(--space-4) + var(--space-1))`}}/>)}
        <span className="min-w-(--timeline-label-min) truncate type-label text-text-1">{s.label}</span>
        {s.meta != null && <span className="min-w-0 shrink truncate type-tag text-text-3 @max-md/timeline:hidden">{s.meta}</span>}
        {s.figure != null && <span data-slot="timeline-figure" className="ms-auto shrink-0 type-tag data text-text-3 @max-md/timeline:hidden @max-[16rem]/name:hidden">{s.figure}</span>}
      </span>
      <span aria-hidden data-slot="timeline-track" className="relative me-4 h-(--timeline-row)" style={grid}>
        {s.status === 'waiting'
          ? <span data-slot="timeline-wait" className={cn('absolute top-1/2 h-4 -translate-y-1/2 rounded-inner bg-page control-edge [--frame-color:var(--ink)]', glide)} style={{insetInlineStart: at(s.start), width: `calc(${at(end)} - ${at(s.start)})`, minWidth: 'var(--space-1)'}}/>
          : <span data-slot="timeline-bar" data-status={trouble} data-kind={bars === 'quiet' && open && !trouble ? kind ?? 'run' : undefined} className={cn('absolute top-1/2 h-4 -translate-y-1/2 rounded-inner forced-colors:bg-[CanvasText]', colored ? 'bg-accent-mark' : 'bg-(--line-control-hover)', glide)} style={{insetInlineStart: at(s.start), width: `calc(${at(end)} - ${at(s.start)})`, minWidth: 'var(--space-1)'}}/>}
        <span
          data-slot="timeline-duration"
          data-place={place}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 whitespace-nowrap type-label-sm data',
            place === 'in' ? (colored ? 'text-on-field' : 'text-text-1') : trouble === 'fail' ? 'text-fail-text' : trouble === 'warn' ? 'text-warn-text' : 'text-text-2',
            glide,
          )}
          style={place === 'after'
            ? {insetInlineStart: `calc(${at(end)} + var(--space-2))`}
            : {insetInlineEnd: `calc(100% - ${at(place === 'in' ? end : s.start)} + var(--space-2))`}}
        >
          <span className={cn(s.status === 'waiting' && '@max-xl/timeline:hidden')}>{durations[index]}</span>
          {s.status === 'waiting' && <Status status="waiting" className="type-label-sm @xl/timeline:hidden">{statusWord(s)}</Status>}
        </span>
      </span>
      <span aria-hidden className="flex justify-end pe-4 empty:hidden @max-xl/timeline:hidden">
        {s.status === 'waiting'
          ? <Status status="waiting" className="type-label-sm">{statusWord(s)}</Status>
          : trouble && <Status status={trouble} className="type-label-sm">{statusWord(s)}</Status>}
      </span>
    </div>;
  };

  return <section
    ref={frameRef}
    data-slot="timeline"
    data-kind={kind}
    data-status={failed ? 'fail' : undefined}
    aria-label={label}
    aria-busy={loading || undefined}
    data-size={size}
    className={cn('@container/timeline frame flex min-w-0 flex-col bg-page text-text-1 [--timeline-row:var(--row)] data-[size=sm]:[--timeline-row:var(--row-sm)]', className)}
    {...props}
  >
    <header data-slot="timeline-header" className="frame-head rule-row">
      <span className="min-w-0 truncate type-label text-text-1">{label}</span>
      {!loading && spans.length > 0 && <span className="shrink-0 type-label text-text-3 data">{totalLabel}</span>}
      <span className="frame-head-action">
        {failed ? <Status status="fail">Failed</Status> : running && <Status status="running"/>}
      </span>
    </header>
    <div data-slot="timeline-inset" className="flex min-h-0 min-w-0 flex-col">
    <div aria-hidden className={cn(columns, 'h-(--row-sm) shrink-0 rule-row')}>
      <span className="ps-4 type-label-sm text-text-3">Step</span>
      <span ref={trackRef} className="relative me-4 h-full">
        {scale.ticks.map((t, i) => <span key={t} className={cn('absolute top-1/2 -translate-y-1/2 type-label-sm text-text-3 data', i > 0 && '-translate-x-1/2 rtl:translate-x-1/2', scale.ticks[i] / span > 0.92 && 'hidden')} style={{insetInlineStart: at(t)}}>{tickLabels[i]}</span>)}
      </span>
      <span className="@max-xl/timeline:hidden"/>
    </div>
    <div className="relative min-h-0">
      <div
        ref={scrollRef}
        role={onSpanClick ? 'listbox' : 'list'}
        aria-label={`Steps in ${label}`}
        className="relative overflow-auto overscroll-contain [scrollbar-width:thin]"
        style={maxHeight ? {maxHeight} : undefined}
      >
        {loading
          ? Array.from({length: 4}, (_, i) => <div key={i} aria-hidden className={cn(columns, 'h-(--timeline-row) rule-row')}>
              <span className="ps-4"><span className="block h-2 w-2/3 bg-(--surface-skeleton)"/></span>
              <span className="relative h-full"><span className="absolute top-1/2 h-3 -translate-y-1/2 bg-(--surface-skeleton)" style={{insetInlineStart: `${i * 18}%`, width: `${30 - i * 4}%`}}/></span>
              <span className="@max-xl/timeline:hidden"/>
            </div>)
          : spans.length === 0
            ? <p className="px-4 py-6 type-body text-text-2">No steps yet.</p>
            : windowed
              ? <div className="relative" style={{height: virtualizer.getTotalSize()}}>{rows.map(r => row(r.index, r.start))}</div>
              : rows.map(r => row(r.index, 0))}
      </div>
    </div>
    </div>
    {footer != null && <div data-slot="timeline-footer" className={'shrink-0 rule-top'}>{footer}</div>}
    <table className="sr-only">
      <caption>{label}</caption>
      <thead><tr><th scope="col">Step</th><th scope="col">Started at</th><th scope="col">Took</th><th scope="col">Status</th></tr></thead>
      <tbody>{spans.map((s, i) => <tr key={s.id}><th scope="row">{s.label}</th><td>{formatDurations([s.start]).values[0]}</td><td>{durations[i]}</td><td>{statusWord(s) || statusLabels.ok}</td></tr>)}</tbody>
    </table>
  </section>;
}

export {Timeline, type TimelineProps, type TimelineSpan, type TimelineStatus};

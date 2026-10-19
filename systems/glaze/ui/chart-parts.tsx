'use client';

import {createContext, memo, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {cva, type VariantProps} from 'class-variance-authority';
import {useGlazePortal} from '../lib/portal';
import {useDomDirection} from '../lib/direction';
import {CHART_EMPTY, EMPTY_VALUE, useScrollTabStop} from '../lib/data';
import {cn} from '../lib/utils';
import {tooltipPopupClass} from './tooltip';

type ChartStatus = 'ok' | 'warn' | 'fail';

type ChartSeriesConfig = {
  label: string;
  status?: ChartStatus;
  dashed?: boolean;
};

type ChartConfig = Record<string, ChartSeriesConfig>;

type ChartContextValue = {
  config: ChartConfig;
  keys: string[];
  hidden: ReadonlySet<string>;
  toggle: (key: string) => void;
  highlight: string | null;
  setHighlight: (key: string | null) => void;
};

const ChartContext = createContext<ChartContextValue | null>(null);

function useChart() {
  const context = useContext(ChartContext);
  if (!context) throw new Error('useChart must be used within a <ChartContainer/>');
  return context;
}

function useOptionalChart() {
  return useContext(ChartContext);
}

type ChartContainerProps = React.ComponentProps<'div'> & {
  config: ChartConfig;
  xKey?: string;
  defaultHidden?: string[];
};

function ChartContainer({config, xKey, defaultHidden, className, children, ...props}: ChartContainerProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set(defaultHidden));
  const [highlight, setHighlight] = useState<string | null>(null);
  const toggle = useCallback((key: string) => setHidden(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  }), []);
  const value = useMemo(() => ({config, keys: Object.keys(config).filter(k => k !== xKey), hidden, toggle, highlight, setHighlight}), [config, xKey, hidden, toggle, highlight]);
  return <ChartContext.Provider value={value}>
    <div data-slot="chart" className={cn('flex w-full min-w-0 flex-col', className)} {...props}>{children}</div>
  </ChartContext.Provider>;
}

function WithChart({config, xKey, children}: {config?: ChartConfig; xKey?: string; children: ReactNode}) {
  const context = useOptionalChart();
  if (context || !config) return children;
  return <ChartContainer config={config} xKey={xKey}>{children}</ChartContainer>;
}

type Tone = 'ink' | 'ink-2' | ChartStatus;

const toneClass: Record<Tone, string> = {ink: 'text-text-1', 'ink-2': 'text-text-2', ok: 'text-ok', warn: 'text-warn', fail: 'text-fail'};
const toneOnInk: Record<Tone, string> = {ink: 'text-text-inverse', 'ink-2': 'text-text-inverse/60', ok: 'text-ok', warn: 'text-warn', fail: 'text-fail'};

function seriesTone(config: ChartConfig, key: string, keys: string[] = Object.keys(config)): {tone: Tone; dashed: boolean} {
  const {status, dashed = false} = config[key] ?? {};
  if (status) return {tone: status, dashed};
  const inkIndex = Math.max(0, keys.filter(k => !config[k]?.status).indexOf(key));
  return {tone: inkIndex % 2 === 0 ? 'ink' : 'ink-2', dashed: dashed || inkIndex >= 2};
}

function seriesClass(config: ChartConfig, key: string, onInk = false, keys?: string[]) {
  const {tone} = seriesTone(config, key, keys);
  return (onInk ? toneOnInk : toneClass)[tone];
}

function ChartSwatch({config, series, onInk, off, className}: {config: ChartConfig; series: string; onInk?: boolean; off?: boolean; className?: string}) {
  const keys = useOptionalChart()?.keys;
  const {dashed} = seriesTone(config, series, keys);
  return <svg
    data-slot="chart-swatch"
    aria-hidden
    focusable="false"
    width={8}
    height={8}
    viewBox="0 0 8 8"
    className={cn('shrink-0', off ? 'text-text-3' : seriesClass(config, series, onInk, keys), className)}
  >
    <line x1={0} y1={4} x2={8} y2={4} strokeWidth={2} strokeDasharray={dashed ? '3 2' : undefined} className="stroke-current forced-colors:stroke-[CanvasText]"/>
  </svg>;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function useElementDirection(ref: React.RefObject<HTMLElement | null>): 'ltr' | 'rtl' {
  return useDomDirection(ref);
}

function useRovingPoints(count: number, onMove: (index: number, el: HTMLElement | null) => void) {
  const [current, setCurrent] = useState(count - 1);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const safe = Math.min(Math.max(current, 0), count - 1);
  const move = (index: number) => {
    const next = Math.min(Math.max(index, 0), count - 1);
    setCurrent(next);
    const el = refs.current[next];
    el?.focus();
    onMove(next, el ?? null);
  };
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step = event.shiftKey ? 7 : 1;
    const back = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
    const keys: Record<string, number> = {ArrowRight: index + step * back, ArrowDown: index + step, ArrowLeft: index - step * back, ArrowUp: index - step, Home: 0, End: count - 1};
    if (!(event.key in keys)) return;
    event.preventDefault();
    move(keys[event.key]);
  };
  return {
    current: safe,
    setCurrent,
    onKeyDown,
    tabIndex: (index: number) => (index === safe ? 0 : -1),
    ref: (index: number) => (el: HTMLElement | null) => { refs.current[index] = el; },
  };
}

const GAP = 8;
const EDGE = 8;

type ChartTooltipProps = {
  anchor: {x: number; y: number} | null;
  children?: ReactNode;
  className?: string;
};

function ChartTooltip({anchor, children, className}: ChartTooltipProps) {
  const container = useGlazePortal();
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{left: number; top: number} | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!anchor || !el) { setPlace(null); return; }
    const {width, height} = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const top = anchor.y - GAP - height < EDGE ? anchor.y + GAP : anchor.y - GAP - height;
    const left = Math.min(Math.max(anchor.x - width / 2, EDGE), vw - width - EDGE);
    setPlace({left, top});
  }, [anchor, children]);

  if (!anchor || container === null) return null;
  const tooltip = <div
    ref={ref}
    data-slot="chart-tooltip"
    aria-hidden
    className={cn(tooltipPopupClass, 'pointer-events-none fixed z-(--z-overlay) min-w-32 flex-col items-stretch gap-1 py-1.5', !place && 'invisible', className)}
    style={{left: place?.left ?? 0, top: place?.top ?? 0}}
  >{children}</div>;
  return container ? createPortal(tooltip, container) : tooltip;
}

function ChartTooltipContent({title, children, className}: {title?: ReactNode; children?: ReactNode; className?: string}) {
  return <div data-slot="chart-tooltip-content" className={cn('flex flex-col gap-1', className)}>
    {title && <div data-slot="chart-tooltip-title" className="type-label-sm text-text-inverse/70">{title}</div>}
    {children}
  </div>;
}

function ChartTooltipRow({indicator, label, value, className}: {indicator?: ReactNode; label: ReactNode; value: ReactNode; className?: string}) {
  return <div data-slot="chart-tooltip-row" className={cn('flex items-center gap-2 type-label-sm', className)}>
    {indicator}
    <span className="min-w-0 flex-1 truncate text-text-inverse/70">{label}</span>
    <span className="data text-text-inverse">{value}</span>
  </div>;
}

type ChartDataTableColumn = {key: string; label: ReactNode};
type ChartDataTableRow = {key: string; label: ReactNode; values: Record<string, ReactNode>};

type ChartDataTableProps = {
  caption: ReactNode;
  empty?: ReactNode;
  rowHeader?: ReactNode;
  columns: ChartDataTableColumn[];
  rows: ChartDataTableRow[];
  visible?: boolean;
  className?: string;
};

const thClass = 'sticky top-0 h-8 border-b border-line-faint bg-paper px-3 align-middle type-label-sm text-text-2';
const tdClass = 'h-8 px-3 align-middle type-label-sm';

const ChartDataTable = memo(function ChartDataTable({caption, rowHeader = 'Date', columns, rows, empty = CHART_EMPTY, visible, className}: ChartDataTableProps) {
  const box = useRef<HTMLDivElement>(null);
  const tab = useScrollTabStop(box, !!visible);
  const captionId = useId();
  const named = tab === 0 ? (typeof caption === 'string' ? {'aria-label': caption} : {'aria-labelledby': captionId}) : {};
  return <div
    ref={box}
    data-slot="chart-data-table"
    data-visible={visible || undefined}
    tabIndex={tab}
    role={tab === 0 ? 'region' : undefined}
    {...named}
    className={cn(visible ? 'max-h-(--popup-max) overflow-auto focus-visible:focus-ring-inset' : 'sr-only', className)}
  >
    <table className="w-full border-separate border-spacing-0 text-start">
      <caption id={captionId} className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" className={cn(thClass, 'text-start')}>{rowHeader}</th>
          {columns.map(column => <th key={column.key} scope="col" className={cn(thClass, 'text-end')}>{column.label}</th>)}
        </tr>
      </thead>
      <tbody className="[&>tr:not(:last-child)>*]:border-b [&>tr:not(:last-child)>*]:border-line-faint">
        {rows.length === 0 && <tr data-slot="chart-data-table-empty">
          <td colSpan={columns.length + 1} className={cn(tdClass, 'text-start text-text-2')}>{empty}</td>
        </tr>}
        {rows.map(row => <tr key={row.key}>
          <th scope="row" className={cn(tdClass, 'text-start font-normal whitespace-nowrap text-text-2')}>{row.label}</th>
          {columns.map(column => <td key={column.key} className={cn(tdClass, 'data text-end text-text-1')}>{row.values[column.key] ?? EMPTY_VALUE}</td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
});

const chartLegendVariants = cva('flex min-w-0', {
  variants: {
    layout: {
      row: 'flex-wrap items-center gap-0.5',
      column: 'flex-col gap-0.5',
    },
  },
  defaultVariants: {layout: 'row'},
});

type ChartLegendProps = Omit<React.ComponentProps<'ul'>, 'children'> & VariantProps<typeof chartLegendVariants> & {
  series?: string[];
  values?: Record<string, ReactNode>;
  toggle?: boolean;
};

function ChartLegend({series, values, toggle = true, layout = 'row', className, ...props}: ChartLegendProps) {
  const {config, keys, hidden, toggle: flip, highlight, setHighlight} = useChart();
  const list = series ?? keys;
  return <ul data-slot="chart-legend" data-layout={layout} className={cn(chartLegendVariants({layout}), className)} {...props}>
    {list.map(key => {
      const off = hidden.has(key);
      const dim = highlight !== null && highlight !== key;
      const body = <>
        <ChartSwatch config={config} series={key} off={off}/>
        <span className={cn('min-w-0 truncate', off ? 'text-text-2 line-through decoration-1' : 'text-text-1')}>{config[key]?.label ?? key}</span>
        {values?.[key] !== undefined && <span className="data ms-auto ps-2 text-text-2">{values[key]}</span>}
      </>;
      const item = 'flex h-(--control-sm) w-full min-w-0 items-center gap-1.5 rounded-pill px-2 type-label-sm';
      return <li key={key} className={cn('min-w-0 transition-opacity duration-(--dur-state)', dim && 'opacity-(--stale)', layout === 'column' && 'w-full')}>
        {toggle
          ? <button
              type="button"
              data-slot="chart-legend-item"
              aria-pressed={!off}
              onClick={() => flip(key)}
              onPointerEnter={() => !off && setHighlight(key)}
              onPointerLeave={() => setHighlight(null)}
              onFocus={() => !off && setHighlight(key)}
              onBlur={() => setHighlight(null)}
              onKeyDown={event => { if (event.key === 'Escape') setHighlight(null); }}
              className={cn(item, 'transition-colors duration-(--dur-state) ease-out hover:bg-hover')}
            >{body}</button>
          : <span data-slot="chart-legend-item" className={item}>{body}</span>}
      </li>;
    })}
  </ul>;
}

export {
  ChartContainer, WithChart, useChart, useOptionalChart, useElementWidth, useElementDirection, useRovingPoints,
  seriesTone, seriesClass, ChartSwatch,
  ChartTooltip, ChartTooltipContent, ChartTooltipRow,
  ChartDataTable,
  ChartLegend, chartLegendVariants,
  type ChartConfig, type ChartSeriesConfig, type ChartStatus, type ChartContextValue, type Tone,
  type ChartTooltipProps, type ChartDataTableProps, type ChartDataTableColumn, type ChartDataTableRow, type ChartLegendProps,
};

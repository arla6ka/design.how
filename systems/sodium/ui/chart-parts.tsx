'use client';

import {createContext, memo, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {useSodiumPortal} from '../lib/portal';
import {useDomDirection} from '../lib/direction';
import {cn} from '../lib/utils';
import {CHART_EMPTY, EMPTY_VALUE} from './chart-scale';

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
  accent: string | null;
  hidden: ReadonlySet<string>;
  toggle: (key: string) => void;
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

function accentKey(config: ChartConfig, keys: string[], accent: string | false | undefined) {
  if (accent === false) return null;
  if (accent && keys.includes(accent)) return accent;
  return keys.find(k => !config[k]?.status) ?? null;
}

type ChartContainerProps = React.ComponentProps<'div'> & {
  config: ChartConfig;
  xKey?: string;
  accent?: string | false;
  defaultHidden?: string[];
};

function ChartContainer({config, xKey, accent, defaultHidden, className, children, ...props}: ChartContainerProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set(defaultHidden));
  const toggle = useCallback((key: string) => setHidden(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  }), []);
  const value = useMemo(() => {
    const keys = Object.keys(config).filter(k => k !== xKey);
    return {config, keys, accent: accentKey(config, keys, accent), hidden, toggle};
  }, [config, xKey, accent, hidden, toggle]);
  return <ChartContext.Provider value={value}>
    <div data-slot="chart" className={cn('flex w-full min-w-0 flex-col', className)} {...props}>{children}</div>
  </ChartContext.Provider>;
}

function WithChart({config, xKey, accent, children}: {config?: ChartConfig; xKey?: string; accent?: string | false; children: ReactNode}) {
  const context = useOptionalChart();
  if (context || !config) return children;
  return <ChartContainer config={config} xKey={xKey} accent={accent}>{children}</ChartContainer>;
}

type Tone = 'accent' | 'ink' | 'ink-2' | ChartStatus;

const toneClass: Record<Tone, string> = {
  accent: 'text-accent-text', ink: 'text-text-1', 'ink-2': 'text-text-3', ok: 'text-ok', warn: 'text-warn', fail: 'text-fail',
};

const toneFill: Record<Tone, string> = {
  accent: 'fill-data-1', ink: 'fill-current', 'ink-2': 'fill-current', ok: 'fill-current', warn: 'fill-current', fail: 'fill-current',
};

const toneArea: Record<Tone, string> = {
  accent: 'fill-data-1/25', ink: 'fill-text-1/6', 'ink-2': 'fill-text-3/8', ok: 'fill-ok/10', warn: 'fill-warn/10', fail: 'fill-fail/10',
};

function seriesTone(context: Pick<ChartContextValue, 'config' | 'keys' | 'accent'>, key: string): {tone: Tone; dashed: boolean} {
  const {config, keys, accent} = context;
  const {status, dashed = false} = config[key] ?? {};
  if (status) return {tone: status, dashed};
  if (key === accent) return {tone: 'accent', dashed};
  const inkIndex = Math.max(0, keys.filter(k => !config[k]?.status && k !== accent).indexOf(key));
  return {tone: inkIndex % 2 === 0 ? 'ink' : 'ink-2', dashed: dashed || inkIndex >= 2};
}

function ChartSwatch({series, off, className}: {series: string; off?: boolean; className?: string}) {
  const chart = useChart();
  const {tone, dashed} = seriesTone(chart, series);
  return <svg
    data-slot="chart-swatch"
    aria-hidden
    focusable="false"
    width={8}
    height={8}
    viewBox="0 0 8 8"
    className={cn('shrink-0', off ? 'text-text-3' : toneClass[tone], className)}
  >
    {off
      ? <rect x={0.5} y={0.5} width={7} height={7} fill="none" strokeWidth={1} className="stroke-current"/>
      : dashed
        ? <line x1={0} y1={4} x2={8} y2={4} strokeWidth={2} strokeDasharray="3 2" className="stroke-current forced-colors:stroke-[CanvasText]"/>
        : <rect x={0.5} y={0.5} width={7} height={7} strokeWidth={1} className={cn(toneFill[tone], 'stroke-current forced-colors:fill-[CanvasText]')}/>}
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

function useDrawn(ready = true) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (!ready || drawn) return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setDrawn(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [ready, drawn]);
  return drawn;
}

function useRovingPoints(count: number, onMove: (index: number) => void) {
  const [current, setCurrent] = useState(count - 1);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const safe = Math.min(Math.max(current, 0), count - 1);
  const move = (index: number) => {
    const next = Math.min(Math.max(index, 0), count - 1);
    setCurrent(next);
    refs.current[next]?.focus();
    onMove(next);
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
  const container = useSodiumPortal();
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
    className={cn('overlay pointer-events-none fixed z-(--z-overlay) flex min-w-40 flex-col', !place && 'invisible', className)}
    style={{left: place?.left ?? 0, top: place?.top ?? 0}}
  >{children}</div>;
  return container ? createPortal(tooltip, container) : tooltip;
}

function ChartTooltipContent({title, children, className}: {title?: ReactNode; children?: ReactNode; className?: string}) {
  return <div data-slot="chart-tooltip-content" className={cn('flex flex-col', className)}>
    {title && <div data-slot="chart-tooltip-title" className="border-b border-line px-3 py-1.5 type-label-sm text-text-2">{title}</div>}
    <div className="flex flex-col gap-1 px-3 py-2">{children}</div>
  </div>;
}

function ChartTooltipRow({indicator, label, value, className}: {indicator?: ReactNode; label: ReactNode; value: ReactNode; className?: string}) {
  return <div data-slot="chart-tooltip-row" className={cn('flex items-center gap-2', className)}>
    {indicator}
    <span className="min-w-0 flex-1 truncate type-label-sm text-text-2">{label}</span>
    <span className="type-code-sm text-text-1">{value}</span>
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
  className?: string;
};

const ChartDataTable = memo(function ChartDataTable({caption, rowHeader = 'Date', columns, rows, empty = CHART_EMPTY, className}: ChartDataTableProps) {
  const captionId = useId();
  return <div data-slot="chart-data-table" className={cn('sr-only', className)}>
    <table aria-labelledby={captionId}>
      <caption id={captionId}>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{rowHeader}</th>
          {columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && <tr data-slot="chart-data-table-empty"><td colSpan={columns.length + 1}>{empty}</td></tr>}
        {rows.map(row => <tr key={row.key}>
          <th scope="row">{row.label}</th>
          {columns.map(column => <td key={column.key}>{row.values[column.key] ?? EMPTY_VALUE}</td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
});

type ChartLegendProps = Omit<React.ComponentProps<'ul'>, 'children'> & {
  series?: string[];
  values?: Record<string, ReactNode>;
  toggle?: boolean;
};

function ChartLegend({series, values, toggle = true, className, ...props}: ChartLegendProps) {
  const {config, keys, hidden, toggle: flip} = useChart();
  const list = series ?? keys;
  return <ul data-slot="chart-legend" className={cn('flex min-w-0 flex-wrap items-center gap-x-1', className)} {...props}>
    {list.map(key => {
      const off = hidden.has(key);
      const body = <>
        <ChartSwatch series={key} off={off}/>
        <span className={cn('min-w-0 truncate', off ? 'text-text-3' : 'text-text-2')}>{config[key]?.label ?? key}</span>
        {values?.[key] !== undefined && <span className="type-code-sm text-text-1">{values[key]}</span>}
      </>;
      const item = 'flex h-(--control-sm) min-w-0 items-center gap-1.5 px-1.5 type-label-sm';
      return <li key={key} className="min-w-0">
        {toggle
          ? <button
              type="button"
              data-slot="chart-legend-item"
              aria-pressed={!off}
              onClick={() => flip(key)}
              className={cn(item, 'quiet')}
            >{body}</button>
          : <span data-slot="chart-legend-item" className={item}>{body}</span>}
      </li>;
    })}
  </ul>;
}

export {
  ChartContainer, WithChart, useChart, useOptionalChart, useElementWidth, useElementDirection, useRovingPoints, useDrawn,
  seriesTone, toneClass, toneFill, toneArea, ChartSwatch,
  ChartTooltip, ChartTooltipContent, ChartTooltipRow,
  ChartDataTable,
  ChartLegend,
  type ChartConfig, type ChartSeriesConfig, type ChartStatus, type ChartContextValue, type Tone,
  type ChartTooltipProps, type ChartDataTableProps, type ChartDataTableColumn, type ChartDataTableRow, type ChartLegendProps,
};

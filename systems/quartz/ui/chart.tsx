'use client';

import {useEffect, useRef, useState, type ReactNode} from 'react';
import {cva} from 'class-variance-authority';
import {Icon, Renew, ChartLine, DataTable} from '../icon';
import type {Kind} from '../lib/kind';
import {useOffscreen} from '../lib/use-offscreen';
import {cn} from '../lib/utils';
import {CHART_EMPTY, EMPTY_VALUE} from '../lib/format';
import {Button, ButtonSize} from './button';
import {SegmentedControl, SegmentedControlItem} from './segmented-control';
import {Status} from './status';
import {
  ChartContainer, ChartDataTable, ChartLegend, ChartSwatch, ChartTooltip, ChartTooltipContent, ChartTooltipRow, WithChart,
  chartLegendVariants, inkSteps, seriesTone, useChart, useElementDirection, useElementWidth, useOptionalChart, useRovingPoints,
  type ChartConfig, type ChartContextValue, type ChartDataTableColumn, type ChartDataTableProps, type ChartDataTableRow,
  type ChartLegendProps, type ChartSeriesConfig, type ChartTooltipProps,
} from './chart-parts';
import {BarChart, ChartPlot, LineChart, type BarChartProps, type ChartPlotProps, type ChartScale, type LineChartProps} from './chart-plot';
import {formatCompact, linearPath, monotonePath, niceScale, numberAt, stepPath, unitFormat, type ChartRow, type ChartUnit, type Curve} from './chart-scale';
import {Sparkline, StatusBar, sparklineVariants, statusBarVariants, type SparklineProps, type StatusBarBucket, type StatusBarProps} from './chart-strip';

const panelFrame = 'overflow-hidden bg-(--surface-frame) frame forced-colors:outline forced-colors:outline-1';
const chartFrameVariants = cva('flex min-w-0 flex-col', {
  variants: {
    variant: {
      panel: panelFrame,
      card: panelFrame,
      plain: 'gap-4',
    },
  },
  defaultVariants: {variant: 'panel'},
});

type ChartFrameStyle = 'panel' | 'plain';

type ChartFrameProps = Omit<React.ComponentProps<'section'>, 'title'> & {
  frame?: ChartFrameStyle | 'card';
  /** @deprecated Use `frame`. `card` is `panel`. */
  variant?: ChartFrameStyle | 'card';
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  height?: number;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  empty?: ReactNode;
  table?: ReactNode;
  shape?: 'bar' | 'line' | 'status' | 'sparkline';
  kind?: Kind;
  live?: boolean;
};

const silhouette = [38, 52, 44, 66, 58, 72, 49, 61, 80, 68, 74, 90];

function Silhouette({shape}: {shape: 'bar' | 'line' | 'status' | 'sparkline'}) {
  if (shape === 'bar') return <>{silhouette.map((h, i) => <span key={i} aria-hidden className="flex-1 bg-(--surface-skeleton) forced-colors:bg-[GrayText]" style={{height: `${h}%`}}/>)}</>;
  if (shape === 'status') return <span aria-hidden className="flex h-(--row-sm) w-full gap-0.5 self-center">{Array.from({length: 30}, (_, i) => <span key={i} className="min-w-1 flex-1 bg-cell-quiet forced-colors:bg-[GrayText]"/>)}</span>;
  const points = silhouette.map((h, i) => `${(i / (silhouette.length - 1)) * 100},${100 - h}`).join(' ');
  return <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full overflow-visible">
    <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="stroke-(--surface-skeleton) forced-colors:stroke-[GrayText]" style={{strokeWidth: shape === 'line' ? 'var(--space-1)' : 'var(--line-accent)'}}/>
  </svg>;
}

function ChartFrame({title, description, actions, footer, height = 200, loading, error, onRetry, retrying, empty, table, shape = 'bar', frame: frameProp, variant, kind, live, className, children, ...props}: ChartFrameProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const state = loading ? 'loading' : error ? 'error' : empty ? 'empty' : 'ready';
  const titleRef = useRef<HTMLHeadingElement>(null);
  const retryFocused = useRef(false);
  useEffect(() => {
    if (state === 'error' || !retryFocused.current) return;
    retryFocused.current = false;
    if (!document.activeElement || document.activeElement === document.body) titleRef.current?.focus();
  }, [state]);
  const showTable = table && view === 'table' && state === 'ready';
  const card = (frameProp ?? variant ?? 'panel') !== 'plain';
  const frameRef = useOffscreen<HTMLElement>(!!live && card);

  return <section
    ref={frameRef}
    data-slot="chart-frame"
    data-state={state}
    data-kind={kind}
    data-status={state === 'error' ? 'fail' : undefined}
    aria-busy={loading || undefined}
    className={cn(chartFrameVariants({variant: card ? 'panel' : 'plain'}), className)}
    {...props}
  >
    <header data-slot="chart-frame-header" className={cn(card ? 'frame-head justify-between' : 'flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2')}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 ref={titleRef} tabIndex={-1} data-slot="chart-frame-title" className={cn('type-label text-text-1', card && 'truncate')}>{title}</h3>
        {description && !card && <p data-slot="chart-frame-description" className="type-body-sm text-text-3">{description}</p>}
      </div>
      {(actions || table || live) && <div data-slot="chart-frame-actions" className="flex shrink-0 items-center gap-2">
        <ButtonSize size="xs">
          {live && <Status status="running" label="Live"/>}
          {actions}
        </ButtonSize>
        {table && <SegmentedControl size="xs" aria-label="View" value={view} onValueChange={next => setView(next as 'chart' | 'table')}>
          <SegmentedControlItem value="chart" aria-label="Chart"><Icon icon={ChartLine} size={16}/></SegmentedControlItem>
          <SegmentedControlItem value="table" aria-label="Table"><Icon icon={DataTable} size={16}/></SegmentedControlItem>
        </SegmentedControl>}
      </div>}
    </header>
    <div data-slot={card ? 'chart-frame-inset' : undefined} className={cn(card && 'frame mx-1 mb-1 min-w-0 bg-page [--frame-color:var(--line-row)] [--frame-radius:calc(var(--radius-frame)-4px)] has-[+[data-slot=chart-frame-footer]]:mb-0')}>
    {description && card && <p data-slot="chart-frame-description" className="px-4 pt-3 type-body-sm text-text-3">{description}</p>}
    <div data-slot="chart-frame-plot" className={cn('min-w-0', card && 'px-4 pt-3 pb-4')}>
    <div data-slot="chart-frame-body" className="relative min-w-0" style={showTable ? undefined : {height}}>
      {state === 'loading' && <div data-slot="chart-frame-loading" data-shape={shape} className="flex h-full items-end gap-1">
        <span className="sr-only">Loading {typeof title === 'string' ? title : 'chart'}</span>
        <Silhouette shape={shape}/>
      </div>}
      {state === 'error' && <div role="status" className="flex h-full flex-col items-start gap-3 pt-1">
        <Status status="fail">{error}</Status>
        {onRetry && <Button size="sm" variant="secondary" pending={!!retrying} onFocus={() => { retryFocused.current = true; }} onBlur={event => { if (event.relatedTarget) retryFocused.current = false; }} onClick={onRetry}><Icon icon={Renew} size={16}/>Retry</Button>}
      </div>}
      {state === 'empty' && <div className="relative h-full type-body text-text-2">
        {empty}
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-line-row"/>
      </div>}
      {state === 'ready' && (showTable ? table : children)}
    </div>
    </div>
    </div>
    {footer && !showTable && <footer data-slot="chart-frame-footer" aria-hidden={state !== 'ready' || undefined} inert={state !== 'ready' || undefined} className={cn('min-w-0', card && 'px-2 py-1.5', state !== 'ready' && 'invisible')}>{footer}</footer>}
  </section>;
}

type ChartCommon = {
  label: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  frame?: 'panel' | 'plain' | 'none' | 'card';
  kind?: Kind;
  live?: boolean;
  height?: number;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  empty?: ReactNode;
  unit?: ChartUnit;
  valueFormat?: (value: number) => string;
  className?: string;
};

type CartesianChartProps = ChartCommon & {
  type: 'line' | 'bar';
  data: ChartRow[];
  xKey: string;
  config: ChartConfig;
  series?: string[];
  xFormat?: (value: unknown, index: number) => string;
  legend?: boolean;
  table?: boolean;
  defaultHidden?: string[];
  curve?: Curve;
  area?: boolean;
  zero?: boolean;
  stacked?: boolean;
};

type SparklineChartProps = ChartCommon & Omit<SparklineProps, 'label' | 'className' | 'size' | 'valueFormat'> & {
  type: 'sparkline';
  size?: SparklineProps['size'];
};

type StatusChartProps = ChartCommon & Omit<StatusBarProps, 'label' | 'className' | 'size' | 'data' | 'unit'> & {
  type: 'status';
  data: StatusBarBucket[];
  size?: StatusBarProps['size'];
  noun?: [string, string];
};

type ChartProps = CartesianChartProps | SparklineChartProps | StatusChartProps;

function Chart(props: ChartProps) {
  const {type, label, title, description, actions, height, loading, error, onRetry, retrying, empty, unit, className} = props;
  const frameKind = props.type === 'line' || props.type === 'bar' ? props.kind : undefined;
  const live = props.live;
  const frameProp = props.frame ?? (type === 'sparkline' ? 'none' : 'panel');
  const frame = frameProp === 'card' ? 'panel' : frameProp;
  let values: number[];
  if (props.type === 'line' || props.type === 'bar') {
    const keys = props.series ?? Object.keys(props.config);
    values = [];
    for (const row of props.data as ChartRow[]) for (const key of keys) { const v = numberAt(row, key); if (v !== null) values.push(v); }
  } else if (props.type === 'sparkline') values = props.data.filter((v): v is number => typeof v === 'number');
  else values = (props.data as StatusBarBucket[]).map(b => b.count);
  const format = props.valueFormat ?? unitFormat(unit, values);
  const isEmpty = !loading && !error && props.data.length === 0;
  const emptyText = empty ?? CHART_EMPTY;
  const emptyColumns = props.type === 'line' || props.type === 'bar'
    ? (props.series ?? Object.keys(props.config)).map(key => ({key, label: props.config[key]?.label ?? key}))
    : props.type === 'status' ? [{key: 'count', label: 'Count'}, {key: 'status', label: 'Status'}] : [{key: 'v', label}];
  const emptyState = isEmpty
    ? <><span aria-hidden>{emptyText}</span><ChartDataTable caption={label} rowHeader={props.type === 'line' || props.type === 'bar' ? props.config[props.xKey]?.label ?? 'Date' : props.type === 'status' ? 'Bucket' : 'Point'} columns={emptyColumns} rows={[]} empty={emptyText}/></>
    : undefined;
  const bodyHeight = height ?? (type === 'status' ? (props.size === 'sm' ? 16 : props.size === 'lg' ? 40 : 32) + 24 : type === 'sparkline' ? 24 : 200);

  let chart: ReactNode;
  let footer: ReactNode = null;
  let tableNode: ReactNode = null;
  if (type === 'line' || type === 'bar') {
    const {data, xKey, config, series, xFormat, curve, area, zero, stacked, defaultHidden} = props;
    const shown = series ?? Object.keys(config);
    const showLegend = props.legend ?? shown.length > 1;
    chart = type === 'line'
      ? <LineChart data={data} xKey={xKey} series={series} label={label} height={bodyHeight} curve={curve} area={area} zero={zero} xFormat={xFormat} valueFormat={format} empty={empty}/>
      : <BarChart data={data} xKey={xKey} series={series} label={label} height={bodyHeight} stacked={stacked} xFormat={xFormat} valueFormat={format} empty={empty}/>;
    if (showLegend) footer = <ChartLegend series={series}/>;
    if (props.table) {
      const f = format ?? formatCompact;
      tableNode = <ChartDataTable visible caption={label} rowHeader={config[xKey]?.label ?? 'Date'} columns={shown.map(key => ({key, label: config[key]?.label ?? key}))}
        rows={data.map((row, i) => ({key: String(i), label: (xFormat ?? (v => String(v)))(row[xKey], i), values: Object.fromEntries(shown.map(key => { const v = numberAt(row, key); return [key, v === null ? EMPTY_VALUE : f(v)]; }))}))}/>;
    }
    const inner = <ChartFrame title={title ?? label} description={description} actions={actions} footer={footer} height={bodyHeight} loading={loading} error={error} onRetry={onRetry} retrying={retrying} empty={emptyState} table={tableNode} shape={type} frame={frame === 'panel' ? 'panel' : 'plain'} kind={frameKind} live={live} data-chart-type={type} className={className}>{chart}</ChartFrame>;
    return <ChartContainer config={config} defaultHidden={defaultHidden} className="min-w-0">{inner}</ChartContainer>;
  }

  if (props.type === 'sparkline') {
    const {data, kind, variant, area, end, labels, interactive, size} = props;
    chart = <Sparkline data={data} label={label} kind={kind} variant={variant} area={area} end={end} labels={labels} interactive={interactive} size={size} valueFormat={format} className={frame === 'none' ? className : 'w-full'}/>;
  } else if (props.type === 'status') {
    const {data, kind, noun, range, onBucketClick, size} = props;
    chart = <StatusBar data={data} label={label} kind={kind} unit={noun} range={range} onBucketClick={onBucketClick} size={size} className={frame === 'none' ? className : undefined}/>;
  }
  if (frame === 'none') {
    if (loading) return <span data-slot="chart-frame-loading" data-shape={type} aria-busy className={cn('inline-flex', type === 'sparkline' ? 'h-(--control-xs) w-24' : 'h-(--row-sm) w-full', className)} style={{height: type === 'status' ? bodyHeight - 24 : undefined}}><span className="sr-only">Loading {label}</span><Silhouette shape={type}/></span>;
    return chart;
  }
  return <ChartFrame title={title ?? label} description={description} actions={actions} height={bodyHeight} loading={loading} error={error} onRetry={onRetry} retrying={retrying} empty={emptyState} shape={type} frame={frame === 'panel' ? 'panel' : 'plain'} kind={props.kind} live={live} data-chart-type={type} className={className}>{chart}</ChartFrame>;
}

export {
  Chart, unitFormat,
  ChartContainer, ChartPlot, ChartSwatch, WithChart, useChart, useOptionalChart, useElementWidth, useElementDirection, useRovingPoints,
  seriesTone, inkSteps, niceScale, formatCompact, numberAt,
  ChartTooltip, ChartTooltipContent, ChartTooltipRow,
  ChartDataTable,
  ChartLegend, chartLegendVariants,
  LineChart, monotonePath, linearPath, stepPath,
  BarChart,
  Sparkline, sparklineVariants,
  StatusBar, statusBarVariants,
  ChartFrame, chartFrameVariants,
  type ChartProps, type ChartUnit, type ChartConfig, type ChartSeriesConfig, type ChartContextValue, type ChartRow, type ChartScale, type ChartPlotProps,
  type ChartTooltipProps, type ChartDataTableProps, type ChartDataTableColumn, type ChartDataTableRow, type ChartLegendProps,
  type LineChartProps, type Curve, type BarChartProps, type SparklineProps, type StatusBarProps, type StatusBarBucket, type ChartFrameProps,
};

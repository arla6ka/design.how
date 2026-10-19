'use client';

import {useEffect, useRef, useState, type ReactNode} from 'react';
import {Icon, ChartLine, Retry, TableView} from '../icon';
import {CHART_EMPTY, EMPTY_VALUE} from '../lib/data';
import {cn} from '../lib/utils';
import {Button} from './button';
import {SegmentedControl, SegmentedControlItem} from './segmented-control';
import {Skeleton} from './skeleton';
import {Status} from './status';
import {
  ChartContainer, ChartDataTable, ChartLegend, ChartSwatch, ChartTooltip, ChartTooltipContent, ChartTooltipRow, WithChart,
  chartLegendVariants, seriesClass, seriesTone, useChart, useElementDirection, useElementWidth, useOptionalChart, useRovingPoints,
  type ChartConfig, type ChartContextValue, type ChartDataTableColumn, type ChartDataTableProps, type ChartDataTableRow,
  type ChartLegendProps, type ChartSeriesConfig, type ChartStatus, type ChartTooltipProps,
} from './chart-parts';
import {BarChart, ChartPlot, LineChart, type BarChartProps, type ChartPlotProps, type ChartScale, type LineChartProps} from './chart-plot';
import {formatCompact, linearPath, monotonePath, niceScale, numberAt, stepPath, unitFormat, type ChartRow, type ChartUnit, type Curve} from './chart-scale';
import {Sparkline, StatusBar, sparklineVariants, statusBarVariants, type SparklineProps, type StatusBarBucket, type StatusBarProps} from './chart-strip';

type ChartFrameStyle = 'card' | 'plain';
type Shape = 'bar' | 'line' | 'status' | 'sparkline';

type ChartFrameProps = Omit<React.ComponentProps<'section'>, 'title'> & {
  frame?: ChartFrameStyle;
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
  shape?: Shape;
  live?: boolean;
};

const silhouette = [38, 52, 44, 66, 58, 72, 49, 61, 80, 68, 74, 90];

function Silhouette({shape}: {shape: Shape}) {
  if (shape === 'bar') return <>{silhouette.map((h, i) => <Skeleton key={i} className="flex-1 rounded-b-none" style={{height: `${h}%`}}/>)}</>;
  if (shape === 'status') return <span aria-hidden className="flex h-(--control-sm) w-full gap-0.5 self-center">{Array.from({length: 30}, (_, i) => <Skeleton key={i} className="h-full min-w-1 flex-1 rounded-pill"/>)}</span>;
  const points = silhouette.map((h, i) => `${(i / (silhouette.length - 1)) * 100},${100 - h}`).join(' ');
  return <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full overflow-visible text-field">
    <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" strokeWidth={shape === 'line' ? 4 : 2} className="stroke-current forced-colors:stroke-[GrayText]"/>
  </svg>;
}

function ChartFrame({title, description, actions, footer, height = 200, loading, error, onRetry, retrying, empty, table, shape = 'bar', frame = 'card', live, className, children, ...props}: ChartFrameProps) {
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
  const card = frame === 'card';

  const header = <header data-slot="chart-frame-header" className={cn('flex min-w-0 items-start justify-between gap-3', card ? 'p-3' : 'pb-3')}>
    <div className="flex min-w-0 flex-col gap-0.5">
      <h3 ref={titleRef} tabIndex={-1} data-slot="chart-frame-title" className="min-w-0 truncate type-label text-text-1 outline-none">{title}</h3>
      {description && <p data-slot="chart-frame-description" className="type-body-sm text-text-2">{description}</p>}
    </div>
    {(actions || table || live) && <div data-slot="chart-frame-actions" className="-my-0.5 flex shrink-0 items-center gap-2">
      {live && <Status status="running" size="sm">Live</Status>}
      {actions}
      {table && <SegmentedControl size="sm" aria-label="View" value={view} onValueChange={next => setView(next as 'chart' | 'table')}>
        <SegmentedControlItem value="chart" aria-label="Chart"><Icon icon={ChartLine}/></SegmentedControlItem>
        <SegmentedControlItem value="table" aria-label="Table"><Icon icon={TableView}/></SegmentedControlItem>
      </SegmentedControl>}
    </div>}
  </header>;

  const body = <div data-slot="chart-frame-plot" className={cn('min-w-0', card && (showTable ? 'border-t border-line-faint' : 'px-3 pb-3'))}>
    <div data-slot="chart-frame-body" className="relative min-w-0" style={showTable ? undefined : {height}}>
      {state === 'loading' && <div data-slot="chart-frame-loading" data-shape={shape} className="flex h-full items-end gap-1">
        <span className="sr-only">Loading {typeof title === 'string' ? title : 'chart'}</span>
        <Silhouette shape={shape}/>
      </div>}
      {state === 'error' && <div role="status" className="flex h-full flex-col items-start gap-2">
        <Status status="fail">{error}</Status>
        {onRetry && <Button size="sm" variant="secondary" pending={!!retrying} pendingLabel="Retrying" onFocus={() => { retryFocused.current = true; }} onBlur={event => { if (event.relatedTarget) retryFocused.current = false; }} onClick={onRetry}><Icon icon={Retry}/>Retry</Button>}
      </div>}
      {state === 'empty' && <div className="relative h-full type-body-sm text-text-2">
        {empty}
        <span aria-hidden className="absolute inset-x-0 bottom-6 h-px bg-line"/>
      </div>}
      {state === 'ready' && (showTable ? table : children)}
    </div>
  </div>;

  const foot = footer && !showTable ? <div data-slot="chart-frame-footer" aria-hidden={state !== 'ready' || undefined} inert={state !== 'ready' || undefined} className={cn(card ? 'shell-foot ps-0.5' : 'pt-2', state !== 'ready' && 'invisible')}>{footer}</div> : null;

  return <section
    data-slot="chart-frame"
    data-state={state}
    data-frame={frame}
    aria-busy={loading || undefined}
    className={cn('flex min-w-0 flex-col text-text-1', card && 'shell forced-colors:border-[CanvasText]', className)}
    {...props}
  >
    {card
      ? <div data-slot="chart-frame-panel" className="panel flex min-w-0 flex-col overflow-hidden forced-colors:border-[CanvasText]">{header}{body}</div>
      : <>{header}{body}</>}
    {foot}
  </section>;
}

type ChartCommon = {
  label: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  frame?: 'card' | 'plain' | 'none';
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
  const {type, label, title, description, actions, height, loading, error, onRetry, retrying, empty, unit, className, live} = props;
  const frame = props.frame ?? (type === 'sparkline' ? 'none' : 'card');
  let values: number[];
  if (props.type === 'line' || props.type === 'bar') {
    const keys = props.series ?? Object.keys(props.config);
    values = [];
    for (const row of props.data as ChartRow[]) for (const key of keys) if (key !== props.xKey) { const v = numberAt(row, key); if (v !== null) values.push(v); }
  } else if (props.type === 'sparkline') values = props.data.filter((v): v is number => typeof v === 'number');
  else values = (props.data as StatusBarBucket[]).map(b => b.count);
  const format = props.valueFormat ?? unitFormat(unit, values);
  const isEmpty = !loading && !error && props.data.length === 0;
  const emptyText = empty ?? CHART_EMPTY;
  const emptyColumns = props.type === 'line' || props.type === 'bar'
    ? (props.series ?? Object.keys(props.config).filter(k => k !== props.xKey)).map(key => ({key, label: props.config[key]?.label ?? key}))
    : props.type === 'status' ? [{key: 'count', label: 'Count'}, {key: 'status', label: 'Status'}] : [{key: 'v', label}];
  const emptyState = isEmpty
    ? <><span aria-hidden>{emptyText}</span><ChartDataTable caption={label} rowHeader={props.type === 'line' || props.type === 'bar' ? props.config[props.xKey]?.label ?? 'Date' : props.type === 'status' ? 'Bucket' : 'Point'} columns={emptyColumns} rows={[]} empty={emptyText}/></>
    : undefined;
  const bodyHeight = height ?? (type === 'status' ? (props.size === 'sm' ? 16 : props.size === 'lg' ? 32 : 26) + 24 : type === 'sparkline' ? 26 : 200);

  if (type === 'line' || type === 'bar') {
    const {data, xKey, config, series, xFormat, curve, area, zero, stacked, defaultHidden} = props as CartesianChartProps;
    const shown = series ?? Object.keys(config).filter(k => k !== xKey);
    const showLegend = (props as CartesianChartProps).legend ?? shown.length > 1;
    const chart = type === 'line'
      ? <LineChart data={data} xKey={xKey} series={series} label={label} height={bodyHeight} curve={curve} area={area} zero={zero} xFormat={xFormat} valueFormat={format} empty={empty}/>
      : <BarChart data={data} xKey={xKey} series={series} label={label} height={bodyHeight} stacked={stacked} xFormat={xFormat} valueFormat={format} empty={empty}/>;
    let tableNode: ReactNode = null;
    if ((props as CartesianChartProps).table) {
      const f = format ?? formatCompact;
      tableNode = <ChartDataTable visible caption={label} rowHeader={config[xKey]?.label ?? 'Date'} columns={shown.map(key => ({key, label: config[key]?.label ?? key}))}
        rows={data.map((row, i) => ({key: String(i), label: (xFormat ?? (v => String(v)))(row[xKey], i), values: Object.fromEntries(shown.map(key => { const v = numberAt(row, key); return [key, v === null ? EMPTY_VALUE : f(v)]; }))}))}/>;
    }
    return <ChartContainer config={config} xKey={xKey} defaultHidden={defaultHidden} className="min-w-0">
      <ChartFrame title={title ?? label} description={description} actions={actions} footer={showLegend ? <ChartLegend series={series}/> : null} height={bodyHeight} loading={loading} error={error} onRetry={onRetry} retrying={retrying} empty={emptyState} table={tableNode} shape={type} frame={frame === 'card' ? 'card' : 'plain'} live={live} data-chart-type={type} className={className}>{chart}</ChartFrame>
    </ChartContainer>;
  }

  let chart: ReactNode = null;
  if (props.type === 'sparkline') {
    const {data, status, variant, area, end, labels, interactive, size} = props;
    chart = <Sparkline data={data} label={label} status={status} variant={variant} area={area} end={end} labels={labels} interactive={interactive} size={size} valueFormat={format} className={frame === 'none' ? className : 'w-full'}/>;
  } else if (props.type === 'status') {
    const {data, noun, range, onBucketClick, size} = props;
    chart = <StatusBar data={data} label={label} unit={noun} range={range} onBucketClick={onBucketClick} size={size} className={frame === 'none' ? className : undefined}/>;
  }
  if (frame === 'none') {
    if (loading) return <span data-slot="chart-frame-loading" data-shape={type} aria-busy className={cn('inline-flex', type === 'sparkline' ? 'h-(--control-sm) w-24' : 'h-(--control-sm) w-full', className)}><span className="sr-only">Loading {label}</span><Silhouette shape={type}/></span>;
    return chart;
  }
  return <ChartFrame title={title ?? label} description={description} actions={actions} height={bodyHeight} loading={loading} error={error} onRetry={onRetry} retrying={retrying} empty={emptyState} shape={type} frame={frame} live={live} data-chart-type={type} className={className}>{chart}</ChartFrame>;
}

export {
  Chart, unitFormat,
  ChartContainer, ChartPlot, ChartSwatch, WithChart, useChart, useOptionalChart, useElementWidth, useElementDirection, useRovingPoints,
  seriesTone, seriesClass, niceScale, formatCompact, numberAt,
  ChartTooltip, ChartTooltipContent, ChartTooltipRow,
  ChartDataTable,
  ChartLegend, chartLegendVariants,
  LineChart, monotonePath, linearPath, stepPath,
  BarChart,
  Sparkline, sparklineVariants,
  StatusBar, statusBarVariants,
  ChartFrame,
  type ChartProps, type ChartUnit, type ChartConfig, type ChartSeriesConfig, type ChartStatus, type ChartContextValue, type ChartRow, type ChartScale, type ChartPlotProps,
  type ChartTooltipProps, type ChartDataTableProps, type ChartDataTableColumn, type ChartDataTableRow, type ChartLegendProps,
  type LineChartProps, type Curve, type BarChartProps, type SparklineProps, type StatusBarProps, type StatusBarBucket, type ChartFrameProps,
};

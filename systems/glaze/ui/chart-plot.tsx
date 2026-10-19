'use client';

import {useEffect, useRef, useState, type ReactNode} from 'react';
import {CHART_EMPTY, EMPTY_VALUE, cssNumber} from '../lib/data';
import {cn} from '../lib/utils';
import {
  ChartDataTable, ChartSwatch, ChartTooltip, ChartTooltipContent, ChartTooltipRow, WithChart,
  seriesClass, seriesTone, useChart, useElementDirection, useElementWidth, useRovingPoints, type ChartConfig,
} from './chart-parts';
import {formatCompact, linearPath, monotonePath, niceScale, numberAt, stepPath, type ChartRow, type Curve, type Point} from './chart-scale';

type ChartScale = {
  width: number;
  height: number;
  plot: {left: number; right: number; top: number; bottom: number};
  x: (index: number) => number;
  y: (value: number) => number;
  band: number;
  active: number | null;
  rtl: boolean;
};

type ChartPlotProps = {
  data: ChartRow[];
  xKey: string;
  series: string[];
  config: ChartConfig;
  mode: 'point' | 'band';
  extent: [number, number];
  height: number;
  label: string;
  xFormat: (value: unknown, index: number) => string;
  valueFormat: (value: number) => string;
  tooltipFormat?: (value: number) => string;
  tooltipFooter?: (row: ChartRow) => ReactNode;
  children: (scale: ChartScale) => ReactNode;
  overlay?: (scale: ChartScale) => ReactNode;
  empty?: ReactNode;
  className?: string;
};

const X_LABEL_ROOM = 24;
const TICK_CHAR = 7;
const X_LABEL_MIN = 72;
const TICK_SPACE = 28;

function ChartPlot({data, xKey, series, config, mode, extent, height, label, xFormat, valueFormat, tooltipFormat = valueFormat, tooltipFooter, children, overlay, empty = CHART_EMPTY, className}: ChartPlotProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const rtl = useElementDirection(ref) === 'rtl';
  const [active, setActive] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<{x: number; y: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const n = data.length;

  const scale = niceScale(extent[0], extent[1], Math.min(4, Math.max(1, Math.floor((height - X_LABEL_ROOM) / TICK_SPACE))));
  const tickLabels = scale.ticks.map(valueFormat);
  const gap = width ? cssNumber(ref.current, '--space-2', 8) : 8;
  const axisRoom = Math.max(...tickLabels.map(t => t.length)) * TICK_CHAR + gap;
  const endRoom = mode === 'point' ? gap : 0;
  const plot = rtl
    ? {left: endRoom, right: Math.max(endRoom + 1, width - axisRoom), top: gap, bottom: height - X_LABEL_ROOM}
    : {left: axisRoom, right: Math.max(axisRoom + 1, width - endRoom), top: gap, bottom: height - X_LABEL_ROOM};
  const plotWidth = plot.right - plot.left;
  const band = mode === 'band' ? plotWidth / Math.max(n, 1) : plotWidth / Math.max(n - 1, 1);
  const origin = rtl ? plot.right : plot.left;
  const forward = rtl ? -1 : 1;
  const x = (i: number) => mode === 'band' ? origin + forward * band * (i + 0.5) : n === 1 ? plot.left + plotWidth / 2 : origin + forward * band * i;
  const y = (v: number) => plot.bottom - ((v - scale.min) / (scale.max - scale.min)) * (plot.bottom - plot.top);
  const s: ChartScale = {width, height, plot, x, y, band, active, rtl};

  const anchorFor = (index: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const values = series.map(key => numberAt(data[index], key)).filter((v): v is number => v !== null);
    const top = values.length ? y(Math.max(...values)) : plot.top;
    return {x: rect.left + x(index), y: rect.top + Math.min(top, plot.bottom)};
  };
  const show = (index: number) => { setActive(index); setAnchor(anchorFor(index)); };
  const hide = () => { setActive(null); setAnchor(null); };
  const roving = useRovingPoints(n, index => show(index));

  useEffect(() => {
    if (active === null) return;
    const close = () => { if (!ref.current?.contains(document.activeElement)) hide(); };
    window.addEventListener('scroll', close, {capture: true, passive: true});
    return () => window.removeEventListener('scroll', close, {capture: true});
  }, [active, ref]);

  const xLabelEvery = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(plotWidth / X_LABEL_MIN))));
  const pointName = (index: number) => {
    const row = data[index];
    const values = series.map(key => {
      const v = numberAt(row, key);
      return `${config[key]?.label ?? key} ${v === null ? 'no data' : tooltipFormat(v)}`;
    });
    return `${xFormat(row?.[xKey], index)}: ${values.join(', ')}`;
  };

  const table = <ChartDataTable
    caption={label}
    empty={empty}
    rowHeader={config[xKey]?.label ?? 'Date'}
    columns={series.map(key => ({key, label: config[key]?.label ?? key}))}
    rows={data.map((row, i) => ({key: String(i), label: xFormat(row[xKey], i), values: Object.fromEntries(series.map(key => {
      const v = numberAt(row, key);
      return [key, v === null ? EMPTY_VALUE : tooltipFormat(v)];
    }))}))}
  />;

  const box = {height};

  if (n === 0) {
    return <div ref={ref} data-slot="chart-plot" className={cn('relative type-body-sm text-text-2', className)} style={box}>
      {table}
      <span aria-hidden className="block pt-2">{empty}</span>
      <span aria-hidden className="absolute inset-x-0 bottom-6 h-px bg-line"/>
    </div>;
  }

  return <div ref={ref} data-slot="chart-plot" className={cn('relative w-full min-w-0', className)} style={box}>
    {table}
    {width > 0 && <>
      <svg ref={svgRef} aria-hidden direction="ltr" width={width} height={height} className="block overflow-visible">
        {mode === 'band' && active !== null && <rect x={x(active) - band / 2} y={plot.top} width={band} height={plot.bottom - plot.top} rx={4} className="fill-hover"/>}
        {scale.ticks.map((tick, i) => <g key={tick}>
          <line x1={plot.left} x2={plot.right} y1={y(tick)} y2={y(tick)} strokeWidth={1} className={tick === 0 ? 'stroke-line' : 'stroke-line-faint'} shapeRendering="crispEdges"/>
          <text x={rtl ? plot.right + gap : plot.left - gap} y={y(tick)} dy="0.32em" textAnchor={rtl ? 'start' : 'end'} className="fill-text-2 type-caption">{tickLabels[i]}</text>
        </g>)}
        {data.map((row, i) => {
          if ((n - 1 - i) % xLabelEvery !== 0) return null;
          if (mode === 'point' && i !== n - 1 && Math.abs(x(n - 1) - x(i)) < X_LABEL_MIN) return null;
          const first = rtl ? 'end' : 'start', last = rtl ? 'start' : 'end';
          const at = mode === 'point' && n > 1 ? (i === 0 ? first : i === n - 1 ? last : 'middle') : 'middle';
          return <text key={i} x={x(i)} y={height - 6} textAnchor={at} className="fill-text-2 type-caption">{xFormat(row[xKey], i)}</text>;
        })}
        {mode === 'point' && active !== null && <line x1={x(active)} x2={x(active)} y1={plot.top} y2={plot.bottom} strokeWidth={1} className="stroke-line-strong" shapeRendering="crispEdges"/>}
        {children(s)}
        {overlay?.(s)}
      </svg>
      <div
        role="group"
        aria-label={label}
        aria-roledescription="chart"
        className="absolute flex"
        style={{left: mode === 'band' || n === 1 ? plot.left : plot.left - band / 2, top: plot.top, width: mode === 'band' || n === 1 ? plotWidth : plotWidth + band, height: plot.bottom - plot.top}}
        onPointerLeave={() => { if (!ref.current?.contains(document.activeElement)) hide(); }}
      >
        {data.map((_, i) => <button
          key={i}
          ref={roving.ref(i)}
          type="button"
          tabIndex={roving.tabIndex(i)}
          aria-label={pointName(i)}
          onPointerEnter={() => { roving.setCurrent(i); show(i); }}
          onFocus={() => { roving.setCurrent(i); show(i); }}
          onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) hide(); }}
          onKeyDown={event => { if (event.key === 'Escape') hide(); else roving.onKeyDown(event, i); }}
          className="h-full min-w-0 flex-1 cursor-crosshair rounded-tag focus-visible:focus-ring-inset"
        />)}
      </div>
      <ChartTooltip anchor={active !== null ? anchor : null}>
        {active !== null && <ChartTooltipContent title={xFormat(data[active]?.[xKey], active)}>
          {series.map(key => {
            const v = numberAt(data[active], key);
            return <ChartTooltipRow key={key} indicator={<ChartSwatch config={config} series={key} onInk/>} label={config[key]?.label ?? key} value={v === null ? EMPTY_VALUE : tooltipFormat(v)}/>;
          })}
          {tooltipFooter?.(data[active])}
        </ChartTooltipContent>}
      </ChartTooltip>
    </>}
  </div>;
}

type LineChartProps = {
  data: ChartRow[];
  xKey: string;
  series?: string[];
  config?: ChartConfig;
  label: string;
  height?: number;
  curve?: Curve;
  area?: boolean;
  zero?: boolean;
  xFormat?: (value: unknown, index: number) => string;
  valueFormat?: (value: number) => string;
  tooltipFormat?: (value: number) => string;
  empty?: React.ReactNode;
  className?: string;
};

const paths = {linear: linearPath, monotone: monotonePath, step: stepPath};

function runs(data: ChartRow[], key: string, x: (i: number) => number, y: (v: number) => number) {
  const out: Point[][] = [];
  let current: Point[] = [];
  data.forEach((row, i) => {
    const v = numberAt(row, key);
    if (v === null) { if (current.length) out.push(current); current = []; return; }
    current.push({x: x(i), y: y(v)});
  });
  if (current.length) out.push(current);
  return out;
}

const LINE = 1.5;
const DASH = '4 3';

function LineChartPlot({data, xKey, series, label, height = 200, curve = 'monotone', area, zero = true, xFormat = v => String(v), valueFormat = formatCompact, tooltipFormat, empty, className}: Omit<LineChartProps, 'config'>) {
  const {config, keys, hidden, highlight} = useChart();
  const shown = (series ?? keys).filter(key => !hidden.has(key));
  const values = data.flatMap(row => shown.map(key => numberAt(row, key)).filter((v): v is number => v !== null));
  const extent: [number, number] = [zero ? Math.min(0, ...values) : Math.min(...values), Math.max(...values, zero ? 0 : -Infinity)];
  const toPath = paths[curve];

  return <ChartPlot
    data={data} xKey={xKey} series={shown} config={config} mode="point" extent={extent} height={height} label={label}
    xFormat={xFormat} valueFormat={valueFormat} tooltipFormat={tooltipFormat} empty={empty} className={className}
    overlay={s => s.active !== null && shown.map(key => {
      const v = numberAt(data[s.active!], key);
      if (v === null) return null;
      return <rect key={key} x={s.x(s.active!) - 3.5} y={s.y(v) - 3.5} width={7} height={7} strokeWidth={2} className={cn('fill-current stroke-paper', seriesClass(config, key, false, keys))}/>;
    })}
  >
    {s => shown.map(key => {
      const {dashed} = seriesTone(config, key, keys);
      const segments = runs(data, key, s.x, s.y);
      const dim = highlight !== null && highlight !== key;
      const base = Math.min(Math.max(s.y(0), s.plot.top), s.plot.bottom);
      return <g key={key} data-slot="line-chart-series" data-series={key} className={cn(seriesClass(config, key, false, keys), 'transition-opacity duration-(--dur-state)', dim && 'opacity-(--stale)')}>
        {area && shown.length === 1 && segments.map((pts, i) => pts.length > 1 && <path
          key={`a${i}`}
          d={`${toPath(pts)}L${pts[pts.length - 1].x},${base}L${pts[0].x},${base}Z`}
          className="fill-hover stroke-none"
        />)}
        {segments.map((pts, i) => pts.length === 1
          ? <rect key={i} x={pts[0].x - 2} y={pts[0].y - 2} width={4} height={4} className="fill-current"/>
          : <path key={i} d={toPath(pts)} fill="none" strokeWidth={LINE} strokeDasharray={dashed ? DASH : undefined} strokeLinejoin="round" strokeLinecap="round" className="stroke-current forced-colors:stroke-[CanvasText]"/>)}
      </g>;
    })}
  </ChartPlot>;
}

function LineChart({config, ...props}: LineChartProps) {
  return <WithChart config={config} xKey={props.xKey}><LineChartPlot {...props}/></WithChart>;
}

type BarChartProps = {
  data: ChartRow[];
  xKey: string;
  series?: string[];
  config?: ChartConfig;
  label: string;
  height?: number;
  stacked?: boolean;
  fill?: number;
  xFormat?: (value: unknown, index: number) => string;
  valueFormat?: (value: number) => string;
  tooltipFormat?: (value: number) => string;
  empty?: React.ReactNode;
  total?: boolean;
  className?: string;
};

const SEGMENT_GAP = 1;
const GROUP_GAP = 2;
const BAR_RADIUS = 2;

function Bar({x, width, y, height, up, hollow, className, ...props}: Omit<React.SVGProps<SVGPathElement>, 'x' | 'y' | 'width' | 'height'> & {x: number; width: number; y: number; height: number; up: boolean; hollow?: boolean}) {
  const r = Math.min(BAR_RADIUS, width / 2, height);
  const inset = hollow ? 0.5 : 0;
  const x0 = x + inset, x1 = x + width - inset, y0 = y + inset, y1 = y + height - inset;
  const d = up
    ? `M${x0},${y1}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x1 - r}Q${x1},${y0} ${x1},${y0 + r}V${y1}Z`
    : `M${x0},${y0}V${y1 - r}Q${x0},${y1} ${x0 + r},${y1}H${x1 - r}Q${x1},${y1} ${x1},${y1 - r}V${y0}Z`;
  return <path d={d} strokeWidth={hollow ? 1 : 0} className={cn(hollow ? 'fill-paper stroke-current' : 'fill-current', 'forced-colors:fill-[CanvasText]', className)} {...props}/>;
}

function BarChartPlot({data, xKey, series, label, height = 200, stacked, fill = 0.64, xFormat = v => String(v), valueFormat = formatCompact, tooltipFormat, total = stacked, empty, className}: Omit<BarChartProps, 'config'>) {
  const {config, keys, hidden, highlight} = useChart();
  const shown = (series ?? keys).filter(key => !hidden.has(key));
  const sum = (row: ChartRow, sign: 1 | -1) => shown.reduce((acc, key) => {
    const v = numberAt(row, key) ?? 0;
    return sign > 0 ? acc + Math.max(v, 0) : acc + Math.min(v, 0);
  }, 0);
  const values = stacked ? data.flatMap(row => [sum(row, 1), sum(row, -1)]) : data.flatMap(row => shown.map(key => numberAt(row, key) ?? 0));
  const extent: [number, number] = [Math.min(0, ...values), Math.max(0, ...values)];
  const format = tooltipFormat ?? valueFormat;

  return <ChartPlot
    data={data} xKey={xKey} series={shown} config={config} mode="band" extent={extent} height={height} label={label}
    xFormat={xFormat} valueFormat={valueFormat} tooltipFormat={tooltipFormat} empty={empty} className={className}
    tooltipFooter={total && shown.length > 1 ? row => <ChartTooltipRow className="mt-0.5 border-t border-text-inverse/20 pt-1" label="Total" value={format(sum(row, 1) + sum(row, -1))}/> : undefined}
  >
    {s => {
      const width = Math.max(1, s.band * fill);
      const zero = s.y(0);
      const dimmed = (key: string) => highlight !== null && highlight !== key;
      if (stacked) {
        return data.map((row, i) => {
          let up = 0, down = 0;
          const x0 = s.x(i) - width / 2;
          const lastUp = [...shown].reverse().find(key => (numberAt(row, key) ?? 0) > 0);
          const lastDown = [...shown].reverse().find(key => (numberAt(row, key) ?? 0) < 0);
          return <g key={i}>
            {shown.map(key => {
              const v = numberAt(row, key);
              if (!v) return null;
              const from = v > 0 ? up : down;
              const to = from + v;
              if (v > 0) up = to; else down = to;
              const top = Math.min(s.y(from), s.y(to));
              const h = Math.abs(s.y(to) - s.y(from)) - (from === 0 ? 0 : SEGMENT_GAP);
              const outer = key === (v > 0 ? lastUp : lastDown);
              return <g key={key} className={cn(seriesClass(config, key, false, keys), 'transition-opacity duration-(--dur-state)', dimmed(key) && 'opacity-(--stale)')}>
                {outer
                  ? <Bar data-series={key} x={x0} width={width} y={v > 0 ? top : top + (from === 0 ? 0 : SEGMENT_GAP)} height={Math.max(h, 1)} up={v > 0} hollow={seriesTone(config, key, keys).dashed}/>
                  : <rect data-series={key} x={x0} width={width} y={v > 0 ? top : top + (from === 0 ? 0 : SEGMENT_GAP)} height={Math.max(h, 1)} shapeRendering="crispEdges" className={seriesTone(config, key, keys).dashed ? 'fill-paper stroke-current' : 'fill-current'}/>}
              </g>;
            })}
          </g>;
        });
      }
      const each = (width - GROUP_GAP * (shown.length - 1)) / Math.max(shown.length, 1);
      return data.map((row, i) => <g key={i}>
        {shown.map((key, j) => {
          const v = numberAt(row, key);
          if (v === null || v === 0) return null;
          return <g key={key} className={cn(seriesClass(config, key, false, keys), 'transition-opacity duration-(--dur-state)', dimmed(key) && 'opacity-(--stale)')}>
            <Bar
              data-series={key}
              x={s.x(i) - width / 2 + (s.rtl ? shown.length - 1 - j : j) * (each + GROUP_GAP)}
              width={Math.max(each, 1)}
              y={Math.min(s.y(v), zero)}
              height={Math.max(Math.abs(zero - s.y(v)), 1)}
              up={v >= 0}
              hollow={seriesTone(config, key, keys).dashed}
            />
          </g>;
        })}
      </g>);
    }}
  </ChartPlot>;
}

function BarChart({config, ...props}: BarChartProps) {
  return <WithChart config={config} xKey={props.xKey}><BarChartPlot {...props}/></WithChart>;
}

export {
  ChartPlot, LineChart, BarChart,
  type ChartScale, type ChartPlotProps, type LineChartProps, type BarChartProps,
};

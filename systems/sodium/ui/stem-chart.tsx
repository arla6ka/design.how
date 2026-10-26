'use client';

import {useState, type ReactNode} from 'react';
import {cn} from '../lib/utils';
import {ChartDataTable, useDrawn, useElementDirection, useElementWidth, useRovingPoints} from './chart-parts';
import {CHART_EMPTY, EMPTY_VALUE, formatExact, niceScale, numberAt, tickCount, unitFormat, type ChartRow, type ChartUnit} from './chart-scale';

type StemChartProps = {
  label: string;
  data: ChartRow[];
  xKey: string;
  valueKey: string;
  xLabel?: string;
  valueLabel?: string;
  tone?: 'accent' | 'ink';
  area?: boolean;
  height?: number;
  xFormat?: (value: unknown, index: number) => string;
  valueFormat?: (value: number) => string;
  unit?: ChartUnit;
  empty?: ReactNode;
  className?: string;
};

const MICRO_CHAR = 7.3;
const CODE_CHAR = 7.2;
const GAP = 8;
const HEAD = 8;

function StemChart({label, data, xKey, valueKey, xLabel = 'Period', valueLabel = 'Value', tone = 'accent', area = true, height = 240, xFormat = v => String(v), valueFormat, unit, empty = CHART_EMPTY, className}: StemChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const rtl = useElementDirection(ref) === 'rtl';
  const drawn = useDrawn(width > 0);
  const [active, setActive] = useState<number | null>(null);
  const n = data.length;
  const values = data.map(row => numberAt(row, valueKey));
  const known = values.filter((v): v is number => v !== null);
  const format = valueFormat ?? unitFormat(unit, known) ?? formatExact;
  const roving = useRovingPoints(n, setActive);

  const valueText = values.map(v => v === null ? EMPTY_VALUE : format(v));
  const xText = data.map((row, i) => xFormat(row[xKey], i));
  const table = <ChartDataTable
    caption={label}
    empty={empty}
    rowHeader={xLabel}
    columns={[{key: 'v', label: valueLabel}]}
    rows={data.map((_, i) => ({key: String(i), label: xText[i], values: {v: valueText[i]}}))}
  />;

  const box = {height};

  if (n === 0) {
    return <div ref={ref} data-slot="stem-chart" className={cn('relative type-body-sm text-text-2', className)} style={box}>
      {table}
      <span aria-hidden className="block pt-2">{empty}</span>
      <span aria-hidden className="absolute inset-x-0 bottom-6 h-px bg-line"/>
    </div>;
  }

  const topRoom = Math.max(...valueText.map(t => t.length)) * CODE_CHAR + GAP;
  const bottomRoom = Math.max(...xText.map(t => t.length)) * MICRO_CHAR + GAP;
  const plot = {left: GAP, right: Math.max(GAP + 1, width - GAP), top: topRoom, bottom: height - bottomRoom};
  const plotWidth = plot.right - plot.left;
  const band = plotWidth / Math.max(n - 1, 1);
  const x = (i: number) => n === 1 ? plot.left + plotWidth / 2 : rtl ? plot.right - band * i : plot.left + band * i;
  const scale = niceScale(Math.min(0, ...known), Math.max(0, ...known), tickCount(plot.bottom - plot.top));
  const y = (v: number) => plot.bottom - ((v - scale.min) / (scale.max - scale.min || 1)) * (plot.bottom - plot.top);
  const base = y(Math.max(scale.min, 0));

  const heads = values.map((v, i) => v === null ? null : {x: x(i), y: y(v)});
  const runs: {x: number; y: number}[][] = [];
  let run: {x: number; y: number}[] = [];
  for (const head of heads) { if (head) run.push(head); else { if (run.length) runs.push(run); run = []; } }
  if (run.length) runs.push(run);

  const accent = tone === 'accent';
  const hitWidth = n === 1 ? plotWidth : band;

  return <div ref={ref} data-slot="stem-chart" data-state={drawn ? 'drawn' : 'start'} data-tone={tone} className={cn('relative w-full min-w-0', className)} style={box}>
    {table}
    {width > 0 && <>
      <svg aria-hidden direction="ltr" width={width} height={height} className="block overflow-visible">
        {area && <g style={{
          clipPath: drawn ? 'inset(0)' : rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
          transition: 'clip-path var(--dur-wipe) var(--ease-linear) var(--dur-wipe)',
        }}>
          {runs.map((pts, i) => pts.length > 1 && <path
            key={i}
            d={`${pts.map((p, j) => `${j ? 'L' : 'M'}${p.x},${p.y}`).join('')}L${pts[pts.length - 1].x},${base}L${pts[0].x},${base}Z`}
            className="fill-well stroke-none forced-colors:hidden"
          />)}
        </g>}
        {scale.ticks.map(tick => <line key={tick} x1={plot.left} x2={plot.right} y1={y(tick)} y2={y(tick)} strokeWidth={1} className={tick === 0 ? 'stroke-line' : 'stroke-line-faint'} shapeRendering="crispEdges"/>)}
        {data.map((_, i) => {
          const head = heads[i];
          const on = active === i;
          const cx = x(i);
          return <g key={i} data-slot="stem" data-active={on || undefined}>
            {head && <line
              x1={cx} x2={cx} y1={plot.top} y2={head.y - HEAD / 2}
              strokeWidth={1.5} strokeDasharray="1.5 2.5"
              className={cn(on ? 'stroke-text-2' : 'stroke-data-3', 'forced-colors:stroke-[CanvasText]')}
              style={{opacity: drawn ? 1 : 0, transition: 'opacity var(--dur-state) var(--ease-out) var(--dur-wipe)'}}
            />}
            <line
              x1={cx} x2={cx} y1={base} y2={head ? head.y : base}
              strokeWidth={1.5}
              className={cn(on ? 'stroke-text-1' : 'stroke-data-3', 'forced-colors:stroke-[CanvasText]')}
              style={{transformBox: 'fill-box', transformOrigin: 'bottom', scale: drawn ? '1' : '1 0', transition: 'scale var(--dur-wipe) var(--ease-linear)'}}
            />
            {head && <rect
              x={cx - HEAD / 2 + 0.5} y={head.y - HEAD / 2 + 0.5} width={HEAD - 1} height={HEAD - 1} strokeWidth={1}
              className={cn(accent ? 'fill-data-1 stroke-accent-text' : 'fill-text-1 stroke-text-1', 'forced-colors:fill-[CanvasText]')}
              style={{translate: drawn ? '0 0' : `0 ${plot.top - head.y}px`, opacity: drawn ? 1 : 0, transition: 'translate var(--dur-draw) var(--ease-out) var(--dur-wipe), opacity var(--dur-state) var(--ease-out) var(--dur-wipe)'}}
            />}
            <text
              x={cx} y={0} transform={`rotate(90 ${cx} 0)`} dominantBaseline="central"
              className={cn('type-code-sm', on ? 'fill-text-1' : 'fill-text-2')}
            >{valueText[i]}</text>
            <text
              x={cx} y={plot.bottom + GAP} transform={`rotate(90 ${cx} ${plot.bottom + GAP})`} dominantBaseline="central"
              className={cn('type-micro', on ? 'fill-text-1' : 'fill-text-3')}
            >{xText[i]}</text>
          </g>;
        })}
      </svg>
      <div
        role="group"
        aria-label={label}
        aria-roledescription="chart"
        className={cn('absolute inset-y-0 flex', rtl && 'flex-row-reverse')}
        style={{left: n === 1 ? plot.left : plot.left - band / 2, width: n === 1 ? plotWidth : plotWidth + band}}
        onPointerLeave={() => { if (!ref.current?.contains(document.activeElement)) setActive(null); }}
      >
        {data.map((_, i) => <button
          key={i}
          ref={roving.ref(i)}
          type="button"
          tabIndex={roving.tabIndex(i)}
          aria-label={`${xText[i]}: ${values[i] === null ? 'no data' : valueText[i]}`}
          onPointerEnter={() => { roving.setCurrent(i); setActive(i); }}
          onFocus={() => { roving.setCurrent(i); setActive(i); }}
          onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) setActive(null); }}
          onKeyDown={event => { if (event.key === 'Escape') setActive(null); else roving.onKeyDown(event, i); }}
          className="h-full min-w-0 shrink-0 cursor-crosshair focus-visible:focus-ring-inset"
          style={{width: hitWidth}}
        />)}
      </div>
    </>}
  </div>;
}

export {StemChart, type StemChartProps};

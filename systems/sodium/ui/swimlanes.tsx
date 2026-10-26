'use client';

import {useRef, type ReactNode} from 'react';
import {cva} from 'class-variance-authority';
import {cn} from '../lib/utils';
import {useDrawn, useElementDirection} from './chart-parts';

type SwimlaneTone = 'well' | 'accent';

type Swimlane = {id: string; label: string};

type SwimlaneStep = {
  label: string;
  from: string;
  to?: string;
  tone?: SwimlaneTone;
  meta?: ReactNode;
};

const stepVariants = cva('relative flex h-(--row-sm) min-w-0 items-center justify-between gap-2 border border-line px-2', {
  variants: {
    tone: {
      accent: 'bg-primary text-primary-foreground',
      well: 'bg-well text-text-1',
    },
  },
  defaultVariants: {tone: 'well'},
});

const HEAD = 32;
const ROW = 32;
const GAP = 4;

type SwimlanesProps = Omit<React.ComponentProps<'figure'>, 'children'> & {
  label: string;
  lanes: Swimlane[];
  steps: SwimlaneStep[];
};

function Swimlanes({label, lanes, steps, className, ...props}: SwimlanesProps) {
  const ref = useRef<HTMLElement>(null);
  const rtl = useElementDirection(ref) === 'rtl';
  const drawn = useDrawn();
  const n = Math.max(lanes.length, 1);
  const index = (id: string | undefined) => Math.max(0, lanes.findIndex(lane => lane.id === id));
  const spans = steps.map(step => {
    const a = index(step.from), b = step.to === undefined ? a : index(step.to);
    return {start: Math.min(a, b), end: Math.max(a, b)};
  });
  const pct = (lane: number) => ((lane + 0.5) / n) * 100;
  const edge = (lane: number) => (lane / n) * 100;

  const connectors = steps.map((_, i) => {
    if (i === 0) return null;
    const prev = spans[i - 1], next = spans[i];
    const lane = prev.end;
    if (lane >= next.start && lane <= next.end) return null;
    const x = pct(lane);
    const back = next.end < lane;
    const to = back ? edge(next.end + 1) : edge(next.start);
    const row = HEAD + (ROW + GAP) * i;
    const top = row - GAP;
    const mid = row + ROW / 2;
    return {x, to, back, top, mid, i};
  });

  const columns = {gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`};

  return <figure ref={ref} data-slot="swimlanes" data-state={drawn ? 'drawn' : 'start'} className={cn('relative min-w-0', className)} {...props}>
    <figcaption className="sr-only">{label}</figcaption>
    <div aria-hidden data-slot="swimlanes-head" className="relative grid h-(--row-sm)" style={columns}>
      {lanes.map(lane => <span key={lane.id} className="mx-2 flex min-w-0 items-center">
        <span className="truncate type-micro text-text-2">{lane.label}</span>
      </span>)}
    </div>
    <ol className="relative grid gap-y-1" style={columns}>
      {steps.map((step, i) => {
        const {start, end} = spans[i];
        const lanesText = start === end ? lanes[start]?.label : `${lanes[start]?.label} to ${lanes[end]?.label}`;
        return <li
          key={i}
          data-slot="swimlane-step"
          data-tone={step.tone ?? 'well'}
          className={stepVariants({tone: step.tone})}
          style={{
            gridColumn: `${start + 1} / ${end + 2}`,
            gridRow: i + 1,
            clipPath: drawn ? 'inset(0)' : rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
            transition: `clip-path var(--dur-wipe) var(--ease-linear) calc(var(--dur-wipe) * ${i})`,
          }}
        >
          <span className="max-w-full min-w-0 shrink-0 truncate type-micro">{step.label}</span>
          <span className="sr-only">, {lanesText}</span>
          {step.meta !== undefined && <span className="min-w-0 truncate type-code-sm">{step.meta}</span>}
        </li>;
      })}
    </ol>
    {connectors.map(c => c && <div key={c.i} aria-hidden data-slot="swimlane-connector">
      <span
        className="absolute w-px bg-line-control"
        style={{
          insetInlineStart: `${c.x}%`, top: c.top, height: c.mid - c.top,
          transformOrigin: 'top', scale: drawn ? '1' : '1 0',
          transition: `scale var(--dur-draw) var(--ease-out) calc(var(--dur-wipe) * ${c.i})`,
        }}
      />
      <span
        className="absolute h-px bg-line-control"
        style={{
          insetInlineStart: `${Math.min(c.x, c.to)}%`, width: `${Math.abs(c.x - c.to)}%`, top: c.mid,
          transformOrigin: c.back !== rtl ? 'right' : 'left', scale: drawn ? '1' : '0 1',
          transition: `scale var(--dur-draw) var(--ease-out) calc(var(--dur-wipe) * ${c.i} + var(--dur-draw))`,
        }}
      />
      <span
        className="absolute size-1.5 -translate-y-1/2 bg-line-control"
        style={{
          insetInlineStart: c.back ? `${c.to}%` : `calc(${c.to}% - var(--space-1-5))`, top: c.mid + 0.5,
          opacity: drawn ? 1 : 0,
          transition: `opacity 0ms linear calc(var(--dur-wipe) * ${c.i} + var(--dur-draw) * 2)`,
        }}
      />
    </div>)}
  </figure>;
}

export {Swimlanes, stepVariants, type SwimlanesProps, type Swimlane, type SwimlaneStep, type SwimlaneTone};

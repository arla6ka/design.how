'use client';

import {cn} from '../lib/utils';
import {Button} from '../ui/button';

type InsightProps = Omit<React.ComponentProps<'div'>, 'children' | 'title'> & {
  title: string;
  figure: string;
  basis?: string;
  points: number[];
  action?: string;
  onAction?: () => void;
};

function Sparkline({points}: {points: number[]}) {
  const w = 64, h = 24, pad = 3;
  const min = Math.min(...points), max = Math.max(...points);
  const span = max - min || 1;
  const xy = points.map((p, i) => [pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1), h - pad - ((p - min) / span) * (h - pad * 2)] as const);
  const [lx, ly] = xy[xy.length - 1] ?? [0, 0];
  return (
    <svg aria-hidden="true" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible text-fg-3">
      <polyline points={xy.map(p => p.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r={3} className="fill-fg"/>
    </svg>
  );
}

function Insight({title, figure, basis, points, action, onAction, className, ...props}: InsightProps) {
  return (
    <div data-slot="insight" className={cn('flex w-full min-w-0 flex-col gap-1', className)} {...props}>
      <div className="flex min-w-0 items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
        {points.length > 1 && <Sparkline points={points}/>}
      </div>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="shrink-0 text-xl font-semibold tracking-tight tabular-nums">{figure}</span>
        {basis && <span className="min-w-0 flex-1 truncate text-xs text-fg-3">{basis}</span>}
        {action && <Button variant="link" size="sm" className="ms-auto shrink-0" onClick={onAction}>{action}</Button>}
      </div>
    </div>
  );
}

export {Insight, type InsightProps};

'use client';

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {cn} from '../lib/utils';

const WAIT_SHOW = 150;
const WAIT_HOLD = 400;

function Skeleton({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="skeleton"
    aria-hidden
    className={cn('shrink-0 bg-well forced-colors:bg-[GrayText]', className)}
    {...props}
  />;
}

type TextRole = 'heading' | 'heading-sm' | 'body' | 'body-sm' | 'caption' | 'label' | 'label-sm' | 'micro' | 'code' | 'code-sm';

const roles: Record<TextRole, string> = {
  heading: 'type-heading', 'heading-sm': 'type-heading-sm', body: 'type-body', 'body-sm': 'type-body-sm', caption: 'type-caption',
  label: 'type-label', 'label-sm': 'type-label-sm', micro: 'type-micro', code: 'type-code', 'code-sm': 'type-code-sm',
};

type SkeletonTextProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  type?: TextRole;
  lines?: number;
  last?: number;
};

function SkeletonText({className, type = 'body', lines = 1, last = 0.6, ...props}: SkeletonTextProps) {
  const count = Math.max(1, Math.floor(lines));
  return <div data-slot="skeleton-text" data-type={type} aria-hidden className={cn('flex w-full flex-col', roles[type], className)} {...props}>
    {Array.from({length: count}, (_, i) => <div key={i} className="flex h-lh items-center">
      <Skeleton
        className="h-1/2 w-full data-last:w-(--last)"
        data-last={count > 1 && i === count - 1 ? '' : undefined}
        style={{'--last': `${Math.min(1, Math.max(0.1, last)) * 100}%`} as CSSProperties}
      />
    </div>)}
  </div>;
}

type SkeletonRowsProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  rows?: number;
};

function SkeletonRows({className, rows = 4, ...props}: SkeletonRowsProps) {
  const widths = ['w-2/5', 'w-1/2', 'w-1/3', 'w-2/5', 'w-1/4'];
  return <div data-slot="skeleton-rows" aria-hidden className={cn('flex w-full min-w-0 flex-col', className)} {...props}>
    {Array.from({length: Math.max(1, rows)}, (_, i) => <div key={i} className="flex min-h-(--row) items-center gap-3 px-inset rule-row">
      <Skeleton className="size-(--marker)"/>
      <Skeleton className={cn('h-2.5', widths[i % widths.length])}/>
      <Skeleton className="ms-auto h-2 w-12"/>
    </div>)}
  </div>;
}

type SkeletonSwapProps = {
  loading: boolean;
  fallback: ReactNode;
  children: ReactNode;
  delay?: number;
  minDuration?: number;
  label?: string;
  className?: string;
};

function SkeletonSwap({loading, fallback, children, delay = WAIT_SHOW, minDuration = WAIT_HOLD, label = 'Loading', className}: SkeletonSwapProps) {
  const [phase, setPhase] = useState<'hidden' | 'shown' | 'done'>(loading ? 'hidden' : 'done');
  const [hasContent, setHasContent] = useState(!loading);
  const shownAt = useRef(0);

  useEffect(() => {
    if (loading) {
      if (hasContent) return;
      setPhase('hidden');
      const t = setTimeout(() => { shownAt.current = Date.now(); setPhase('shown'); }, delay);
      return () => clearTimeout(t);
    }
    setPhase(p => (p === 'shown' ? p : 'done'));
  }, [loading, delay, hasContent]);

  useEffect(() => {
    if (loading || phase !== 'shown') return;
    const t = setTimeout(() => setPhase('done'), Math.max(0, minDuration - (Date.now() - shownAt.current)));
    return () => clearTimeout(t);
  }, [loading, phase, minDuration]);

  useEffect(() => { if (phase === 'done' && !loading) setHasContent(true); }, [phase, loading]);

  const refreshing = loading && hasContent;
  const holding = !refreshing && phase !== 'done';
  return <div
    data-slot="skeleton-swap"
    data-phase={refreshing ? 'stale' : phase}
    aria-busy={holding || refreshing || undefined}
    className={className}
  >
    {holding
      ? <><div className={cn(phase === 'hidden' && 'invisible')}>{fallback}</div><span className="sr-only" role="status">{phase === 'shown' ? label : ''}</span></>
      : children}
  </div>;
}

export {Skeleton, SkeletonText, SkeletonRows, SkeletonSwap, type SkeletonTextProps, type SkeletonRowsProps, type SkeletonSwapProps, type TextRole};

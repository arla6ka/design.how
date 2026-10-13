'use client';

import {useEffect, useRef, useState, type ReactNode} from 'react';
import {cn} from '../lib/utils';
import {cssNumber} from '../lib/css-var';

function Skeleton({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="skeleton"
    aria-hidden
    className={cn(
      'relative shrink-0 overflow-hidden rounded-soft bg-(--surface-skeleton)',
      'forced-colors:bg-[GrayText]',
      className,
    )}
    {...props}
  />;
}

type TextRole = 'display' | 'heading-lg' | 'heading' | 'heading-sm' | 'body-lg' | 'body' | 'body-sm' | 'label' | 'label-sm' | 'code' | 'code-sm';

const roles: Record<TextRole, string> = {
  display: 'type-display', 'heading-lg': 'type-heading-lg', heading: 'type-heading', 'heading-sm': 'type-heading-sm',
  'body-lg': 'type-body-lg', body: 'type-body', 'body-sm': 'type-body-sm', label: 'type-label', 'label-sm': 'type-label-sm',
  code: 'type-code', 'code-sm': 'type-code-sm',
};

type SkeletonTextProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  type?: TextRole;
  lines?: number;
  last?: number;
};

function SkeletonText({className, type = 'body', lines = 1, last = 0.6, ...props}: SkeletonTextProps) {
  return <div data-slot="skeleton-text" data-type={type} aria-hidden className={cn('flex w-full flex-col', roles[type], className)} {...props}>
    {Array.from({length: Math.max(1, lines)}, (_, i) => <div key={i} className="flex h-lh items-center">
      <Skeleton
        className="h-(--skeleton-text) rounded-inner"
        style={{width: lines > 1 && i === lines - 1 ? `${last * 100}%` : '100%'}}
      />
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

function SkeletonSwap({loading, fallback, children, delay: delayProp, minDuration: holdProp, label = 'Loading', className}: SkeletonSwapProps) {
  const [phase, setPhase] = useState<'hidden' | 'shown' | 'done'>(loading ? 'hidden' : 'done');
  const [hasContent, setHasContent] = useState(!loading);
  const shownAt = useRef(0);
  const ref = useRef<HTMLDivElement>(null);
  const delay = delayProp ?? cssNumber(ref.current, '--dur-skeleton-delay', 150);
  const minDuration = holdProp ?? cssNumber(ref.current, '--dur-skeleton-hold', 400);

  useEffect(() => {
    if (loading) {
      if (hasContent) return;
      setPhase('hidden');
      const t = setTimeout(() => { shownAt.current = Date.now(); setPhase('shown'); }, delay);
      return () => clearTimeout(t);
    }
    setPhase(p => {
      if (p !== 'shown') return 'done';
      return p;
    });
  }, [loading, delay, hasContent]);

  useEffect(() => {
    if (loading || phase !== 'shown') return;
    const left = minDuration - (Date.now() - shownAt.current);
    const t = setTimeout(() => setPhase('done'), Math.max(0, left));
    return () => clearTimeout(t);
  }, [loading, phase, minDuration]);

  useEffect(() => { if (phase === 'done' && !loading) setHasContent(true); }, [phase, loading]);

  const reloading = loading && hasContent;
  const [dim, setDim] = useState(false);
  useEffect(() => {
    if (!reloading) { setDim(false); return; }
    const t = setTimeout(() => setDim(true), delay);
    return () => clearTimeout(t);
  }, [reloading, delay]);
  const holding = !reloading && phase !== 'done';
  return <div ref={ref} data-slot="skeleton-swap" data-phase={reloading ? 'stale' : phase} data-stale={(reloading && dim) || undefined} aria-busy={holding || reloading || undefined} className={cn('data-stale:opacity-(--stale-opacity)', className)}>
    {holding
      ? <><div className={cn(phase === 'hidden' && 'invisible')}>{fallback}</div><span className="sr-only" role="status">{phase === 'shown' ? label : ''}</span></>
      : children}
  </div>;
}

export {Skeleton, SkeletonText, SkeletonSwap, type SkeletonTextProps, type SkeletonSwapProps, type TextRole};

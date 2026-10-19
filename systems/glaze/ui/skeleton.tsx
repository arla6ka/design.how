'use client';

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {cn} from '../lib/utils';

function Skeleton({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="skeleton"
    aria-hidden
    className={cn('shrink-0 rounded-tag bg-field forced-colors:bg-[GrayText]', className)}
    {...props}
  />;
}

type TextRole = 'heading' | 'heading-sm' | 'body' | 'body-sm' | 'label' | 'label-sm' | 'caption' | 'code' | 'code-sm';

const roles: Record<TextRole, string> = {
  heading: 'type-heading', 'heading-sm': 'type-heading-sm', body: 'type-body', 'body-sm': 'type-body-sm',
  label: 'type-label', 'label-sm': 'type-label-sm', caption: 'type-caption', code: 'type-code', 'code-sm': 'type-code-sm',
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

type SkeletonSwapProps = {
  loading: boolean;
  fallback: ReactNode;
  children: ReactNode;
  delay?: number;
  minDuration?: number;
  label?: string;
  className?: string;
};

function timeToken(el: HTMLElement | null, name: string, fallback: number) {
  const raw = el ? getComputedStyle(el).getPropertyValue(name).trim() : '';
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}

function SkeletonSwap({loading, fallback, children, delay: delayProp, minDuration: minProp, label = 'Loading', className}: SkeletonSwapProps) {
  const root = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<'hidden' | 'shown' | 'done'>(loading ? 'hidden' : 'done');
  const [hasContent, setHasContent] = useState(!loading);
  const shownAt = useRef(0);

  useEffect(() => {
    if (loading) {
      if (hasContent) return;
      setPhase('hidden');
      const t = setTimeout(() => { shownAt.current = Date.now(); setPhase('shown'); }, delayProp ?? timeToken(root.current, '--wait-show', 150));
      return () => clearTimeout(t);
    }
    setPhase(p => (p === 'shown' ? p : 'done'));
  }, [loading, delayProp, hasContent]);

  useEffect(() => {
    if (loading || phase !== 'shown') return;
    const t = setTimeout(() => setPhase('done'), Math.max(0, minProp ?? timeToken(root.current, '--wait-hold', 400) - (Date.now() - shownAt.current)));
    return () => clearTimeout(t);
  }, [loading, phase, minProp]);

  useEffect(() => { if (phase === 'done' && !loading) setHasContent(true); }, [phase, loading]);

  const reloading = loading && hasContent;
  const [dim, setDim] = useState(false);
  useEffect(() => {
    if (!reloading) { setDim(false); return; }
    const t = setTimeout(() => setDim(true), delayProp ?? timeToken(root.current, '--wait-show', 150));
    return () => clearTimeout(t);
  }, [reloading, delayProp]);
  const holding = !reloading && phase !== 'done';
  return <div
    ref={root}
    data-slot="skeleton-swap"
    data-phase={reloading ? 'stale' : phase}
    data-stale={(reloading && dim) || undefined}
    aria-busy={holding || reloading || undefined}
    className={cn('transition-opacity duration-(--dur-state) ease-out data-stale:opacity-(--stale)', className)}
  >
    {holding
      ? <><div className={cn(phase === 'hidden' && 'invisible')}>{fallback}</div><span className="sr-only" role="status">{phase === 'shown' ? label : ''}</span></>
      : children}
  </div>;
}

export {Skeleton, SkeletonText, SkeletonSwap, type SkeletonTextProps, type SkeletonSwapProps, type TextRole};

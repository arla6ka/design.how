'use client';

import {ButtonSize} from './button';
import {createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, mergeRefs} from '../lib/utils';
import type {Kind} from '../lib/kind';

type Registry = {setTitle: (n: ReactNode) => void; setActions: (n: ReactNode) => void} | null;
const RegistryContext = createContext<Registry>(null);

const pageHeaderVariants = cva('group/page-header @container flex w-full flex-col', {
  variants: {
    size: {
      default: 'gap-6',
      sm: 'gap-4',
    },
  },
  defaultVariants: {size: 'default'},
});

type PageHeaderProps = React.ComponentProps<'header'> & VariantProps<typeof pageHeaderVariants> & {
  kind?: Kind;
  condense?: boolean;
  condenseTop?: string;
  condenseInset?: string;
};

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if (o === 'auto' || o === 'scroll') return p;
  }
  return null;
}

function PageHeader({className, size = 'default', kind, condense = false, condenseTop = '0px', condenseInset = '0px', children, ref, ...props}: PageHeaderProps) {
  const header = useRef<HTMLElement>(null);
  const headerRefs = useMemo(() => mergeRefs(header, ref), [ref]);
  const anchor = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState<ReactNode>(null);
  const [actions, setActions] = useState<ReactNode>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    if (!condense) return;
    const target = header.current?.querySelector('[data-slot=page-header-title]');
    if (!target) return;
    const root = scrollParent(header.current);
    const top = anchor.current ? parseFloat(getComputedStyle(anchor.current).top) || 0 : 0;
    const io = new IntersectionObserver(([entry]) => {
      setStuck(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) + top);
    }, {root, rootMargin: `-${top}px 0px 0px 0px`});
    io.observe(target);
    return () => io.disconnect();
  }, [condense]);

  const registry = useMemo(() => condense ? {setTitle, setActions} : null, [condense]);
  return <RegistryContext.Provider value={registry}>
    <header
      ref={headerRefs}
      data-slot="page-header"
      data-size={size}
      data-kind={kind}
      className={cn(pageHeaderVariants({size}), className)}
      {...props}
    >{children}</header>
    {condense && <div ref={anchor} data-slot="page-header-condensed-anchor" className="sticky z-(--z-above) h-0" style={{top: condenseTop, '--page-header-inset': condenseInset} as React.CSSProperties}>
      <div
        data-slot="page-header-condensed"
        data-stuck={stuck || undefined}
        aria-hidden={!stuck}
        inert={!stuck}
        className={cn(
          'absolute -inset-x-(--page-header-inset) top-0 flex h-(--topbar) items-center justify-between gap-4 bg-page px-(--page-header-inset) rule-row-frame',
          'transition-opacity duration-(--dur-base) ease-(--ease-step) motion-reduce:transition-none',
          stuck ? 'opacity-100' : 'pointer-events-none opacity-0',
          'forced-colors:border-b forced-colors:border-[CanvasText]',
        )}
      >
        <p className="min-w-0 truncate type-label">{title}</p>
        <ButtonSize size="sm"><div className="flex shrink-0 items-center gap-2">{actions}</div></ButtonSize>
      </div>
    </div>}
  </RegistryContext.Provider>;
}

function PageHeaderRow({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="page-header-row" className={cn('flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:gap-8', className)} {...props}/>;
}

function PageHeaderContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="page-header-content" className={cn('flex min-w-0 max-w-(--page-header-max) flex-col gap-2', className)} {...props}/>;
}

function PageHeaderTitle({className, children, ...props}: React.ComponentProps<'h1'>) {
  const registry = useContext(RegistryContext);
  useLayoutEffect(() => { registry?.setTitle(children); }, [registry, children]);
  return <h1 data-slot="page-header-title" className={cn('type-heading-lg text-pretty break-words @3xl:type-display group-data-[size=sm]/page-header:@3xl:type-heading-lg',
    'has-data-[slot=badge]:flex has-data-[slot=badge]:flex-wrap has-data-[slot=badge]:items-center has-data-[slot=badge]:gap-x-3', className)} {...props}>
    {children}
  </h1>;
}

function PageHeaderDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="page-header-description" className={cn('max-w-(--measure-hint) type-body text-text-2', className)} {...props}/>;
}

function PageHeaderActions({className, children, ...props}: React.ComponentProps<'div'>) {
  const registry = useContext(RegistryContext);
  useLayoutEffect(() => { registry?.setActions(children); }, [registry, children]);
  return <div data-slot="page-header-actions" className={cn('flex shrink-0 flex-wrap items-center gap-2', className)} {...props}>{children}</div>;
}

function PageHeaderStats({className, ...props}: React.ComponentProps<'dl'>) {
  return <dl data-slot="page-header-stats" className={cn('grid w-full grid-cols-2 gap-px bg-line-row frame [&>:last-child:nth-child(odd)]:col-span-2 @xl:flex @xl:w-fit', className)} {...props}/>;
}

function PageHeaderStat({className, label, value, detail, ...props}: Omit<React.ComponentProps<'div'>, 'children'> & {label: React.ReactNode; value: React.ReactNode; detail?: React.ReactNode}) {
  return <div data-slot="page-header-stat" className={cn('flex min-w-0 flex-col gap-1 bg-page px-4 py-3 @xl:min-w-36', className)} {...props}>
    <dt className="type-label-sm text-text-3">{label}</dt>
    <dd className="flex min-w-0 flex-wrap items-baseline gap-x-2">
      <span className="type-stat">{value}</span>
      {detail && <span className="type-label-sm text-text-2">{detail}</span>}
    </dd>
  </div>;
}

export {PageHeader, PageHeaderRow, PageHeaderContent, PageHeaderTitle, PageHeaderDescription, PageHeaderActions, PageHeaderStats, PageHeaderStat, pageHeaderVariants, type PageHeaderProps};

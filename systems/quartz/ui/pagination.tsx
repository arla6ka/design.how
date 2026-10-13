'use client';

import * as React from 'react';
import {Icon, ChevronLeft, ChevronRight, OverflowMenuHorizontal} from '../icon';
import {cn} from '../lib/utils';

function Pagination({className, ...props}: React.ComponentProps<'nav'>) {
  return <nav aria-label="Pagination" data-slot="pagination" className={cn('@container/pagination flex w-full min-w-0 items-center justify-center', className)} {...props}/>;
}

function PaginationContent({className, ...props}: React.ComponentProps<'ul'>) {
  return <ul data-slot="pagination-content" className={cn('flex items-center', className)} {...props}/>;
}

function PaginationItem({className, ...props}: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" className={cn('frame-shared flex has-[a:hover:not([aria-disabled])]:frame-ink has-[a:hover:not([aria-disabled])]:[--frame-color:var(--line-control-hover)]! has-[[aria-current=page]]:frame-ink has-[[aria-current=page]]:[--frame-color:var(--line-control-hover)]!', className)} {...props}/>;
}

type PaginationLinkProps = {
  isActive?: boolean;
  disabled?: boolean;
  size?: 'default' | 'icon';
} & React.ComponentProps<'a'>;

function PaginationLink({className, isActive, disabled, size = 'icon', href, children, ...props}: PaginationLinkProps) {
  return <a
    aria-current={isActive ? 'page' : undefined}
    aria-disabled={disabled || undefined}
    href={disabled ? undefined : href}
    data-slot="pagination-link"
    data-active={isActive || undefined}
    data-disabled={disabled || undefined}
    className={cn(
      'inline-flex h-(--control) min-w-(--control) items-center justify-center rounded-[inherit] whitespace-nowrap px-2 type-label text-text-1 transition-[background-color] duration-(--dur-fast) ease-(--ease-step) hover:bg-hover focus-visible:focus-ring-inset',
      size === 'icon' && 'px-1',
      isActive && 'pointer-events-none bg-selected forced-colors:outline forced-colors:outline-1',
      disabled && 'pointer-events-none text-text-disabled',
      className,
    )}
    {...props}
  >{typeof children === 'string' || typeof children === 'number' ? <span className="data">{children}</span> : children}</a>;
}

function PaginationPrevious({className, text = 'Previous', ...props}: React.ComponentProps<typeof PaginationLink> & {text?: string}) {
  return <PaginationLink aria-label="Previous page" size="default" className={cn('gap-1 ps-2 pe-3 @max-md/pagination:px-2', className)} {...props}>
    <Icon icon={ChevronLeft} size={16} data-icon="inline-start" className="rtl:-scale-x-100"/>
    <span className="hidden @md/pagination:block">{text}</span>
  </PaginationLink>;
}

function PaginationNext({className, text = 'Next', ...props}: React.ComponentProps<typeof PaginationLink> & {text?: string}) {
  return <PaginationLink aria-label="Next page" size="default" className={cn('gap-1 ps-3 pe-2 @max-md/pagination:px-2', className)} {...props}>
    <span className="hidden @md/pagination:block">{text}</span>
    <Icon icon={ChevronRight} size={16} data-icon="inline-end" className="rtl:-scale-x-100"/>
  </PaginationLink>;
}

function PaginationEllipsis({className, ...props}: React.ComponentProps<'span'>) {
  return <span aria-hidden data-slot="pagination-ellipsis" className={cn('flex h-(--control) min-w-(--control) items-center justify-center text-text-3', className)} {...props}>
    <Icon icon={OverflowMenuHorizontal} size={16}/>
  </span>;
}

function PaginationInfo({className, from, to, total, noun, page, ...props}: React.ComponentProps<'p'> & {from: number; to: number; total?: number | null; noun?: string; page?: number}) {
  const f = (n: number) => n.toLocaleString('en-US');
  return <p data-slot="pagination-info" className={cn('type-body-sm text-text-3 data', className)} {...props}>
    <span className="text-text-1">{f(from)}–{f(to)}</span>
    {total !== undefined && total !== null ? <> of {f(total)}{noun ? ` ${noun}` : ''}</> : <>{noun ? ` ${noun}` : ''}{page ? `, page ${f(page)}` : ''}</>}
  </p>;
}

function paginationRange(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({length: pages}, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, null, pages];
  if (page >= pages - 3) return [1, null, pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, null, page - 1, page, page + 1, null, pages];
}

type PaginationNavProps = Omit<React.ComponentProps<'nav'>, 'onChange'> & {
  page: number;
  pages?: number;
  getHref?: (page: number) => string;
  hrefPattern?: string;
  hasNext?: boolean;
  onPageClick?: (page: number, event: React.MouseEvent<HTMLAnchorElement>) => void;
};

function PaginationNav({page, pages, getHref: getHrefProp, hrefPattern, hasNext, onPageClick, className, ...props}: PaginationNavProps) {
  const getHref = getHrefProp ?? ((p: number) => (hrefPattern ?? '?page={page}').replaceAll('{page}', String(p)));
  const cursor = pages === undefined;
  const nav = React.useRef<HTMLElement>(null);
  const measureRef = React.useRef<HTMLUListElement>(null);
  const [compact, setCompact] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = nav.current;
    const r = measureRef.current;
    if (!el || !r) return;
    const fit = () => setCompact(r.getBoundingClientRect().width > el.clientWidth + 0.5);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    ro.observe(r);
    return () => ro.disconnect();
  }, [pages]);
  const last = pages ?? Infinity;
  const canNext = cursor ? !!hasNext : page < last;
  const digits = (pages ?? page).toLocaleString('en-US').length;
  const slot = {minWidth: `max(var(--control), calc(${digits}ch + var(--space-4)))`};
  const go = (p: number) => onPageClick ? (event: React.MouseEvent<HTMLAnchorElement>) => onPageClick(p, event) : undefined;
  const numbers = (live: boolean) => paginationRange(page, last).map((p, i) => <PaginationItem key={p ?? `gap-${i}`}>
    {p === null
      ? <PaginationEllipsis style={slot}/>
      : <PaginationLink href={live ? getHref(p) : undefined} isActive={p === page} style={slot} aria-label={`Page ${p}`} onClick={live ? go(p) : undefined}>{p.toLocaleString('en-US')}</PaginationLink>}
  </PaginationItem>);
  return <Pagination ref={nav} data-mode={cursor ? 'cursor' : compact ? 'compact' : 'numbered'} className={cn('relative', className)} {...props}>
    <PaginationContent className="min-w-0">
      <PaginationItem className="shrink-0"><PaginationPrevious href={getHref(page - 1)} disabled={page <= 1} onClick={go(page - 1)}/></PaginationItem>
      {!cursor && !compact && numbers(true)}
      {!cursor && compact && <PaginationItem className="min-w-0"><span data-slot="pagination-page" className="flex h-(--control) min-w-0 items-center px-2 type-label text-text-1"><span className="truncate data">Page {page.toLocaleString('en-US')} of {last.toLocaleString('en-US')}</span></span></PaginationItem>}
      {cursor && <PaginationItem><span data-slot="pagination-page" aria-current="page" className="flex h-(--control) items-center whitespace-nowrap px-2 type-label text-text-1"><span className="data">Page {page.toLocaleString('en-US')}</span></span></PaginationItem>}
      <PaginationItem className="shrink-0"><PaginationNext href={getHref(page + 1)} disabled={!canNext} onClick={go(page + 1)}/></PaginationItem>
    </PaginationContent>
    {!cursor && <div aria-hidden inert className="pointer-events-none invisible absolute start-0 top-0 size-0 overflow-hidden">
      <PaginationContent ref={measureRef} className="w-max">
        <PaginationItem><PaginationPrevious/></PaginationItem>
        {numbers(false)}
        <PaginationItem><PaginationNext/></PaginationItem>
      </PaginationContent>
    </div>}
  </Pagination>;
}

export {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationInfo, PaginationNav, paginationRange, type PaginationNavProps};

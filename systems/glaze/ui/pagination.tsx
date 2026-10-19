'use client';

import * as React from 'react';
import {Icon, ChevronLeft, ChevronRight, More} from '../icon';
import {cn} from '../lib/utils';

type PaginationSize = 'sm' | 'default';
const SizeContext = React.createContext<PaginationSize>('default');

function Pagination({className, size = 'default', ...props}: React.ComponentProps<'nav'> & {size?: PaginationSize}) {
  return <SizeContext.Provider value={size}>
    <nav aria-label="Pagination" data-slot="pagination" data-size={size} className={cn('@container/pagination flex w-full min-w-0 items-center', className)} {...props}/>
  </SizeContext.Provider>;
}

function PaginationContent({className, ...props}: React.ComponentProps<'ul'>) {
  return <ul data-slot="pagination-content" className={cn('flex min-w-0 items-center gap-0.5', className)} {...props}/>;
}

function PaginationItem({className, ...props}: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" className={cn('flex min-w-0', className)} {...props}/>;
}

const heights: Record<PaginationSize, string> = {
  sm: 'h-(--control-sm) min-w-(--control-sm) type-label-sm [&_svg]:size-(--icon-sm)',
  default: 'h-(--control) min-w-(--control) type-label [&_svg]:size-(--icon)',
};

type PaginationLinkProps = React.ComponentProps<'a'> & {
  isActive?: boolean;
  disabled?: boolean;
};

function PaginationLink({className, isActive, disabled, href, children, ...props}: PaginationLinkProps) {
  const size = React.useContext(SizeContext);
  return <a
    aria-current={isActive ? 'page' : undefined}
    aria-disabled={disabled || undefined}
    href={disabled ? undefined : href}
    data-slot="pagination-link"
    data-active={isActive || undefined}
    data-disabled={disabled || undefined}
    className={cn(
      'inline-flex shrink-0 items-center justify-center gap-1 rounded-pill px-2 whitespace-nowrap text-text-1 no-underline select-none',
      'transition-[background-color,color] duration-(--dur-state) ease-out hover:bg-hover active:bg-pressed focus-visible:focus-ring-inset',
      '[&_svg]:shrink-0',
      heights[size],
      isActive && 'pointer-events-none bg-pressed forced-colors:outline-solid forced-colors:outline-1',
      disabled && 'pointer-events-none text-text-disabled',
      className,
    )}
    {...props}
  >{typeof children === 'string' || typeof children === 'number' ? <span className="data">{children}</span> : children}</a>;
}

function PaginationPrevious({className, text = 'Previous', ...props}: PaginationLinkProps & {text?: string}) {
  return <PaginationLink aria-label="Previous page" className={cn('ps-1.5 pe-2.5 @max-md/pagination:px-1.5', className)} {...props}>
    <Icon icon={ChevronLeft} className="rtl:-scale-x-100"/>
    <span className="@max-md/pagination:hidden">{text}</span>
  </PaginationLink>;
}

function PaginationNext({className, text = 'Next', ...props}: PaginationLinkProps & {text?: string}) {
  return <PaginationLink aria-label="Next page" className={cn('ps-2.5 pe-1.5 @max-md/pagination:px-1.5', className)} {...props}>
    <span className="@max-md/pagination:hidden">{text}</span>
    <Icon icon={ChevronRight} className="rtl:-scale-x-100"/>
  </PaginationLink>;
}

function PaginationEllipsis({className, ...props}: React.ComponentProps<'span'>) {
  const size = React.useContext(SizeContext);
  return <span aria-hidden data-slot="pagination-ellipsis" className={cn('flex shrink-0 items-center justify-center text-text-3', heights[size], className)} {...props}>
    <Icon icon={More}/>
  </span>;
}

type PaginationInfoProps = React.ComponentProps<'p'> & {
  from: number;
  to: number;
  total?: number | null;
  noun?: string;
};

function PaginationInfo({className, from, to, total, noun, ...props}: PaginationInfoProps) {
  const f = (n: number) => n.toLocaleString('en-US');
  return <p data-slot="pagination-info" className={cn('min-w-0 truncate type-caption text-text-2 data', className)} {...props}>
    <span className="text-text-1">{f(from)}–{f(to)}</span>
    {total != null ? ` of ${f(total)}${noun ? ` ${noun}` : ''}` : noun ? ` ${noun}` : ''}
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
  hasNext?: boolean;
  getHref?: (page: number) => string;
  hrefPattern?: string;
  onPageChange?: (page: number, event: React.MouseEvent<HTMLAnchorElement>) => void;
  size?: PaginationSize;
};

function PaginationNav({page, pages, hasNext, getHref: getHrefProp, hrefPattern, onPageChange, size = 'default', className, ...props}: PaginationNavProps) {
  const getHref = getHrefProp ?? ((p: number) => (hrefPattern ?? '?page={page}').replaceAll('{page}', String(p)));
  const cursor = pages === undefined;
  const nav = React.useRef<HTMLElement>(null);
  const measure = React.useRef<HTMLUListElement>(null);
  const [compact, setCompact] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = nav.current;
    const row = measure.current;
    if (!el || !row) return;
    const fit = () => setCompact(row.getBoundingClientRect().width > el.clientWidth + 0.5);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    ro.observe(row);
    return () => ro.disconnect();
  }, [pages]);
  const last = pages ?? Infinity;
  const canNext = cursor ? !!hasNext : page < last;
  const digits = (pages ?? page).toLocaleString('en-US').length;
  const slot = {minWidth: `max(var(${size === 'sm' ? '--control-sm' : '--control'}), calc(${digits}ch + var(--space-4)))`};
  const go = (p: number) => onPageChange ? (event: React.MouseEvent<HTMLAnchorElement>) => onPageChange(p, event) : undefined;
  const numbers = (live: boolean) => paginationRange(page, last).map((p, i) => <PaginationItem key={p ?? `gap-${i}`}>
    {p === null
      ? <PaginationEllipsis style={slot}/>
      : <PaginationLink href={live ? getHref(p) : undefined} isActive={p === page} style={slot} aria-label={`Page ${p}`} onClick={live ? go(p) : undefined}>{p.toLocaleString('en-US')}</PaginationLink>}
  </PaginationItem>);
  const word = size === 'sm' ? 'type-label-sm h-(--control-sm)' : 'type-label h-(--control)';
  return <Pagination ref={nav} size={size} data-mode={cursor ? 'cursor' : compact ? 'compact' : 'numbered'} className={cn('relative', className)} {...props}>
    <PaginationContent>
      <PaginationItem className="shrink-0"><PaginationPrevious href={getHref(page - 1)} disabled={page <= 1} onClick={go(page - 1)}/></PaginationItem>
      {!cursor && !compact && numbers(true)}
      {!cursor && compact && <PaginationItem><span data-slot="pagination-page" className={cn('flex min-w-0 items-center px-2 text-text-1', word)}><span className="truncate data">Page {page.toLocaleString('en-US')} of {last.toLocaleString('en-US')}</span></span></PaginationItem>}
      {cursor && <PaginationItem><span data-slot="pagination-page" aria-current="page" className={cn('flex items-center px-2 whitespace-nowrap text-text-1', word)}><span className="data">Page {page.toLocaleString('en-US')}</span></span></PaginationItem>}
      <PaginationItem className="shrink-0"><PaginationNext href={getHref(page + 1)} disabled={!canNext} onClick={go(page + 1)}/></PaginationItem>
    </PaginationContent>
    {!cursor && <div aria-hidden inert className="pointer-events-none invisible absolute start-0 top-0 size-0 overflow-hidden">
      <PaginationContent ref={measure} className="w-max">
        <PaginationItem><PaginationPrevious/></PaginationItem>
        {numbers(false)}
        <PaginationItem><PaginationNext/></PaginationItem>
      </PaginationContent>
    </div>}
  </Pagination>;
}

export {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis, PaginationInfo, PaginationNav,
  paginationRange, type PaginationLinkProps, type PaginationNavProps, type PaginationInfoProps, type PaginationSize,
};

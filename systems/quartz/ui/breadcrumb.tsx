'use client';

import * as React from 'react';
import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {Icon, OverflowMenuHorizontal} from '../icon';
import {cn} from '../lib/utils';
import {DropdownMenu, DropdownMenuContent, DropdownMenuLinkItem, DropdownMenuTrigger} from './dropdown-menu';

function Breadcrumb({className, ...props}: React.ComponentProps<'nav'>) {
  return <nav aria-label="Breadcrumb" data-slot="breadcrumb" className={cn('min-w-0', className)} {...props}/>;
}

function BreadcrumbList({className, ...props}: React.ComponentProps<'ol'>) {
  return <ol
    data-slot="breadcrumb-list"
    className={cn('flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 type-label text-text-2 wrap-break-word', className)}
    {...props}
  />;
}

function BreadcrumbItem({className, ...props}: React.ComponentProps<'li'>) {
  return <li data-slot="breadcrumb-item" className={cn('inline-flex min-w-0 items-center gap-1.5', className)} {...props}/>;
}

function BreadcrumbLink({className, render, ...props}: useRender.ComponentProps<'a'>) {
  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>({
      className: cn(
        'inline-flex min-h-6 min-w-0 items-center gap-1.5 rounded-inner text-text-2 decoration-1 underline-offset-4',
        'hover:text-text-1 hover:underline',
        '[&_svg]:shrink-0',
        className,
      ),
      'data-slot': 'breadcrumb-link',
    } as React.ComponentProps<'a'>, props),
    render,
  });
}

function BreadcrumbPage({className, ...props}: React.ComponentProps<'span'>) {
  return <span
    data-slot="breadcrumb-page"
    aria-current="page"
    className={cn('inline-flex min-w-0 items-center gap-1.5 text-text-1 [&_svg]:shrink-0', className)}
    {...props}
  />;
}

function BreadcrumbSeparator({children, className, ...props}: React.ComponentProps<'li'>) {
  return <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    className={cn('text-text-3 select-none', className)}
    {...props}
  >{children ?? '/'}</li>;
}

function BreadcrumbEllipsis({className, ...props}: React.ComponentProps<'span'>) {
  return <span
    data-slot="breadcrumb-ellipsis"
    className={cn('flex size-6 items-center justify-center rounded-soft text-text-2', className)}
    {...props}
  >
    <Icon icon={OverflowMenuHorizontal} size={16}/>
    <span className="sr-only">More</span>
  </span>;
}

function shortId(id: string) {
  if (id.length <= 18) return null;
  const prefix = id.indexOf('_');
  const headLength = prefix > 0 && prefix < 10 ? prefix + 5 : 10;
  return {head: id.slice(0, headLength), tail: id.slice(-6)};
}

function BreadcrumbId({children, className, ...props}: Omit<React.ComponentProps<'span'>, 'children'> & {children: string}) {
  const cut = shortId(children);
  return <span data-slot="breadcrumb-id" title={cut ? children : undefined} className={cn('type-tag [overflow-wrap:anywhere]', className)} {...props}>
    {cut ? <><span aria-hidden>{cut.head}…{cut.tail}</span><span className="sr-only">{children}</span></> : children}
  </span>;
}

type Crumb = {
  label: string;
  href?: string;
  id?: boolean;
};

type BreadcrumbTrailProps = Omit<React.ComponentProps<'nav'>, 'children'> & {
  items: Crumb[];
  renderLink?: (href: string) => React.ReactElement;
};

const crumbLabel = (c: Crumb) => c.id ? <BreadcrumbId>{c.label}</BreadcrumbId> : c.label;

type Fit = {
  folded: number;
  root: boolean;
  cut: boolean;
};

function BreadcrumbTrail({items, renderLink, className, ...props}: BreadcrumbTrailProps) {
  const nav = React.useRef<HTMLElement>(null);
  const measureRef = React.useRef<HTMLOListElement>(null);
  const [fit, setFit] = React.useState<Fit>({folded: 0, root: true, cut: false});
  const last = items.length - 1;
  const middle = Math.max(0, last - 1);

  React.useLayoutEffect(() => {
    const el = nav.current;
    const r = measureRef.current;
    if (!el || !r) return;
    const measure = () => {
      const width = el.clientWidth;
      const w = (q: string) => (r.querySelector(q) as HTMLElement | null)?.getBoundingClientRect().width ?? 0;
      const crumbs = items.map((_, i) => w(`[data-crumb="${i}"]`));
      const sep = w('[data-sep]');
      const menu = w('[data-menu]');
      const floor = Math.min(crumbs[last] ?? 0, w('[data-floor]'));
      const gap = parseFloat(getComputedStyle(r).columnGap) || 0;
      const row = (folded: number, root: boolean, page: number) => {
        const parts: number[] = [];
        if (last > 0 && root) parts.push(crumbs[0]);
        if (folded > 0 || (last > 0 && !root)) parts.push(menu);
        for (let i = 1 + folded; i < last; i += 1) parts.push(crumbs[i]);
        parts.push(page);
        return parts.reduce((s, x) => s + x, 0) + (parts.length - 1) * (sep + 2 * gap);
      };
      const fits = (x: number) => x <= width + 0.5;
      let next: Fit = {folded: middle, root: false, cut: !fits(row(middle, false, crumbs[last]))};
      for (let n = 0; n <= middle; n += 1) {
        if (fits(row(n, true, crumbs[last]))) { next = {folded: n, root: true, cut: false}; break; }
      }
      if (!next.root && fits(row(middle, true, floor))) next = {folded: middle, root: true, cut: true};
      if (last === 0) next = {folded: 0, root: true, cut: !fits(crumbs[0])};
      setFit(f => f.folded === next.folded && f.root === next.root && f.cut === next.cut ? f : next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items, last, middle]);

  const link = (c: Crumb) => <BreadcrumbLink href={c.href ?? '#'} render={c.href && renderLink ? renderLink(c.href) : undefined}>{crumbLabel(c)}</BreadcrumbLink>;
  const hidden = [...(fit.root || last === 0 ? [] : [items[0]]), ...items.slice(1, 1 + fit.folded)];
  const page = items[last];

  return <Breadcrumb ref={nav} data-folded={hidden.length || undefined} data-cut={fit.cut || undefined} className={cn('relative', className)} {...props}>
    <BreadcrumbList className="flex-nowrap">
      {last > 0 && fit.root && <>
        <BreadcrumbItem className="shrink-0">{link(items[0])}</BreadcrumbItem>
        <BreadcrumbSeparator/>
      </>}
      {hidden.length > 0 && <>
        <BreadcrumbItem className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger data-slot="breadcrumb-fold" aria-label={`${hidden.length} more ${hidden.length === 1 ? 'level' : 'levels'}`} className="flex size-6 items-center justify-center rounded-soft text-text-2 hover:bg-hover hover:text-text-1 data-popup-open:bg-pressed focus-visible:focus-ring">
              <Icon icon={OverflowMenuHorizontal} size={16}/>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-slot="breadcrumb-fold-menu" sideOffset={4} className="max-w-(--popover)">
              {hidden.map((h, i) => <DropdownMenuLinkItem
                key={h.label + i}
                render={h.href && renderLink ? renderLink(h.href) : <a href={h.href ?? '#'}/>}
                className="min-w-0"
              ><span className="truncate">{crumbLabel(h)}</span></DropdownMenuLinkItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
      </>}
      {items.slice(1 + fit.folded, last).map((c, i) => <React.Fragment key={c.label + i}>
        <BreadcrumbItem className="shrink-0">{link(c)}</BreadcrumbItem>
        <BreadcrumbSeparator/>
      </React.Fragment>)}
      {page && <BreadcrumbItem className="min-w-0">
        <BreadcrumbPage className="min-w-0" title={fit.cut ? page.label : undefined}><span dir="auto" className="truncate">{crumbLabel(page)}</span></BreadcrumbPage>
      </BreadcrumbItem>}
    </BreadcrumbList>
    <div aria-hidden className="pointer-events-none invisible absolute start-0 top-0 size-0 overflow-hidden" inert>
      <ol ref={measureRef} className="flex w-max flex-nowrap items-center gap-x-2 type-label">
        {items.map((c, i) => <li key={c.label + i} data-crumb={i} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap">{crumbLabel(c)}</li>)}
        <li data-sep className="shrink-0">/</li>
        <li data-menu className="size-6 shrink-0"/>
        <li data-floor className="w-(--crumb-floor) shrink-0"/>
      </ol>
    </div>
  </Breadcrumb>;
}

export {Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis, BreadcrumbId, BreadcrumbTrail, type Crumb, type BreadcrumbTrailProps};

'use client';

import * as React from 'react';
import {Icon, ArrowDown, ArrowUp, ChevronSort, More} from '../icon';
import {useScrollTabStop} from '../lib/data';
import {cn} from '../lib/utils';
import {Button, type ButtonProps} from './button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from './dropdown-menu';
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle, type EmptyReason} from './empty-state';
import {Skeleton} from './skeleton';

type TableFrame = 'card' | 'none';

function TableTitle({title, count, actions, id, className}: {title: React.ReactNode; count?: React.ReactNode; actions?: React.ReactNode; id?: string; className?: string}) {
  return <div data-slot="table-title" className={cn('flex min-h-(--row) min-w-0 shrink-0 items-center gap-2 border-b border-line-faint ps-3 pe-1.5', className)}>
    <span id={id} className="min-w-0 truncate type-label text-text-1">{title}</span>
    {count != null && <span data-slot="table-count" className="shrink-0 type-label text-text-2 data">{count}</span>}
    {actions != null && <div data-slot="table-actions" className="ms-auto flex shrink-0 items-center gap-1">{actions}</div>}
  </div>;
}

function TableToolbar({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="table-toolbar" className={cn('flex min-h-(--row) min-w-0 shrink-0 flex-wrap items-center gap-2 border-b border-line-faint px-1.5 py-1', className)} {...props}/>;
}

function TableFrameBox({frame = 'card', footer, className, children, ...props}: React.ComponentProps<'div'> & {frame?: TableFrame; footer?: React.ReactNode}) {
  if (frame === 'none') return <div data-slot="table-frame" data-frame="none" className={cn('flex min-w-0 flex-col', className)} {...props}>
    {children}
    {footer != null && <div data-slot="table-footer-row" className="flex min-h-(--row) min-w-0 items-center gap-2 border-t border-line-faint px-3 type-caption text-text-2">{footer}</div>}
  </div>;
  return <div data-slot="table-frame" data-frame="card" className={cn('shell text-text-1 forced-colors:border-[CanvasText]', className)} {...props}>
    <div data-slot="table-panel" className="panel flex min-w-0 flex-col overflow-hidden forced-colors:border-[CanvasText]">{children}</div>
    {footer != null && <div data-slot="table-footer-row" className="shell-foot [&>:first-child]:me-auto">{footer}</div>}
  </div>;
}

type TableProps = Omit<React.ComponentProps<'table'>, 'title' | 'frame'> & {
  frame?: TableFrame;
  title?: React.ReactNode;
  count?: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  frameClassName?: string;
  containerClassName?: string;
  scrollFocus?: boolean;
};

function Table({className, frame = 'card', title, count, actions, toolbar, footer, stickyHeader = false, maxHeight, frameClassName, containerClassName, scrollFocus = true, ...props}: TableProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const tab = useScrollTabStop(box, scrollFocus);
  const titleId = React.useId();
  const name = props['aria-label'];
  const labelledBy = !name && title ? titleId : undefined;
  return <TableFrameBox frame={frame} footer={footer} className={frameClassName}>
    {title != null && <TableTitle id={titleId} title={title} count={count} actions={actions}/>}
    {toolbar != null && <TableToolbar>{toolbar}</TableToolbar>}
    <div
      ref={box}
      data-slot="table-container"
      data-sticky-header={stickyHeader || undefined}
      tabIndex={tab}
      role={tab === 0 && (name || labelledBy) ? 'region' : undefined}
      aria-label={tab === 0 && name ? name : undefined}
      aria-labelledby={tab === 0 ? labelledBy : undefined}
      className={cn('group/table relative w-full min-w-0 overflow-auto overscroll-contain focus-visible:focus-ring-inset', containerClassName)}
      style={maxHeight !== undefined ? {maxHeight} : undefined}
    >
      <table data-slot="table" aria-labelledby={labelledBy} className={cn(tableClassName, className)} {...props}/>
    </div>
  </TableFrameBox>;
}

const tableClassName = 'w-full caption-bottom border-separate border-spacing-0 text-start type-body-sm text-text-1';

function TableHeader({className, ...props}: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={className} {...props}/>;
}

function TableBody({className, ...props}: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn(bodyClassName, className)} {...props}/>;
}

const bodyClassName = '[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-line-faint [&>tr:not(:last-child)>th]:border-b [&>tr:not(:last-child)>th]:border-line-faint';

function TableFooter({className, ...props}: React.ComponentProps<'tfoot'>) {
  return <tfoot data-slot="table-footer" className={cn('type-label text-text-1 [&>tr>td]:border-t [&>tr>td]:border-line-faint', className)} {...props}/>;
}

const rowClassName = cn(
  'group/row transition-colors duration-(--dur-state) ease-out',
  '[tbody>&]:hover:bg-hover-row has-aria-expanded:bg-hover-row',
  'data-selected:bg-pressed data-selected:hover:bg-pressed data-open:bg-pressed data-open:hover:bg-pressed',
  'forced-colors:data-selected:outline-1 forced-colors:data-selected:-outline-offset-1 forced-colors:data-selected:outline-[Highlight] forced-colors:data-open:outline-2 forced-colors:data-open:-outline-offset-2 forced-colors:data-open:outline-[Highlight]',
);

type TableRowProps = React.ComponentProps<'tr'> & {
  selected?: boolean;
  open?: boolean;
};

function TableRow({className, selected, open, ...props}: TableRowProps) {
  return <tr
    data-slot="table-row"
    data-selected={selected || undefined}
    data-open={open || undefined}
    aria-selected={selected === undefined ? undefined : selected}
    aria-current={open ? 'true' : undefined}
    className={cn(rowClassName, className)}
    {...props}
  />;
}

const headClassName = cn(
  'h-8 border-b border-line-faint bg-paper px-3 text-start align-middle type-label-sm whitespace-nowrap text-text-2',
  '[&:has([role=checkbox])]:w-10 [&:has([role=checkbox])]:pe-0',
  'group-data-sticky-header/table:sticky group-data-sticky-header/table:top-0 group-data-sticky-header/table:z-(--z-raised)',
);

const cellClassName = 'h-(--row) px-3 align-middle whitespace-nowrap text-text-1 [&:has([role=checkbox])]:pe-0';

type TableHeadProps = React.ComponentProps<'th'> & {
  numeric?: boolean;
  sort?: 'asc' | 'desc' | false;
  onSort?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

function TableHead({className, numeric, sort, onSort, children, ...props}: TableHeadProps) {
  const sortable = !!onSort || sort !== undefined;
  return <th
    data-slot="table-head"
    scope="col"
    aria-sort={sortable ? (sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none') : undefined}
    className={cn(headClassName, numeric && 'text-end', className)}
    {...props}
  >
    {sortable ? <TableSortButton sort={sort ?? false} numeric={numeric} onClick={onSort}>{children}</TableSortButton> : children}
  </th>;
}

function TableSortButton({sort, numeric, className, children, ...props}: React.ComponentProps<'button'> & {sort: 'asc' | 'desc' | false; numeric?: boolean}) {
  const icon = sort === 'asc' ? ArrowUp : sort === 'desc' ? ArrowDown : ChevronSort;
  return <button
    type="button"
    data-slot="table-sort"
    data-sorted={sort || undefined}
    className={cn(
      'group/sort -mx-1.5 inline-flex h-(--control-sm) items-center gap-1 rounded-pill px-1.5 type-label-sm text-text-2',
      'transition-colors duration-(--dur-state) ease-out hover:bg-hover hover:text-text-1 data-sorted:text-text-1',
      numeric && 'flex-row-reverse',
      className,
    )}
    {...props}
  >
    <span className="whitespace-nowrap">{children}</span>
    <Icon icon={icon} size={12} className={cn('shrink-0', !sort && 'text-text-3 opacity-0 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100 pointer-coarse:opacity-100')}/>
  </button>;
}

type TableCellProps = React.ComponentProps<'td'> & {
  numeric?: boolean;
  mono?: boolean;
};

function TableCell({className, numeric, mono, ...props}: TableCellProps) {
  return <td data-slot="table-cell" className={cn(cellClassName, numeric && 'text-end data', mono && 'type-code-sm', className)} {...props}/>;
}

function TableCaption({className, ...props}: React.ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('border-t border-line-faint px-3 py-2 text-start type-caption text-text-2', className)} {...props}/>;
}

type TableEmptyProps = Omit<React.ComponentProps<'td'>, 'title'> & {
  colSpan: number;
  reason?: Extract<EmptyReason, 'empty' | 'no-results' | 'error'>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

function TableEmpty({colSpan, reason = 'empty', title, description, action, className, ...props}: TableEmptyProps) {
  return <tr data-slot="table-empty">
    <td colSpan={colSpan} className={cn('p-0 whitespace-normal', className)} {...props}>
      <Empty variant="plain" size="sm" reason={reason}>
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          {description != null && <EmptyDescription>{description}</EmptyDescription>}
        </EmptyHeader>
        {action != null && <EmptyContent>{action}</EmptyContent>}
      </Empty>
    </td>
  </tr>;
}

type TableLoadingProps = {
  rows?: number;
  columns: number | {numeric?: boolean; checkbox?: boolean}[];
  hidden?: boolean;
};

function TableLoading({rows = 5, columns, hidden}: TableLoadingProps) {
  const cols = typeof columns === 'number' ? Array.from({length: columns}, () => ({})) as {numeric?: boolean; checkbox?: boolean}[] : columns;
  const widths = ['w-3/4', 'w-1/2', 'w-2/3'];
  return <>{Array.from({length: rows}, (_, r) => <tr key={r} aria-hidden data-slot="table-loading-row" className={cn(hidden && 'invisible')}>
    {cols.map((col, c) => <td key={c} className={cn(cellClassName, col.checkbox && 'w-10 pe-0')}>
      <Skeleton className={cn('h-2 rounded-pill', col.checkbox ? 'size-4 rounded-tag' : col.numeric ? 'ms-auto w-1/3' : widths[(r + c) % 3])}/>
    </td>)}
  </tr>)}</>;
}

const RowActionsContext = React.createContext<((open: boolean) => void) | null>(null);

type TableRowActionsProps = React.ComponentProps<'div'> & {
  indicator?: React.ReactNode;
  revealOnHover?: boolean;
};

function TableRowActions({indicator, revealOnHover = true, className, children, 'aria-label': ariaLabel = 'Row actions', ...props}: TableRowActionsProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const shown = menuOpen || !revealOnHover;
  return <RowActionsContext.Provider value={setMenuOpen}>
    <div data-slot="table-row-actions" data-open={shown || undefined} className={cn("group/actions grid shrink-0 items-center justify-items-end [grid-template-areas:'stack']", className)} {...props}>
      {indicator != null && <span className="[grid-area:stack] type-caption whitespace-nowrap text-text-2 transition-opacity duration-(--dur-state) group-hover/row:opacity-0 group-focus-within/row:opacity-0 group-data-open/actions:opacity-0 pointer-coarse:opacity-0">{indicator}</span>}
      <div role="group" aria-label={ariaLabel} className={cn('flex items-center gap-0.5 [grid-area:stack] transition-opacity duration-(--dur-state)', revealOnHover && 'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-open/actions:opacity-100 pointer-coarse:opacity-100')}>{children}</div>
    </div>
  </RowActionsContext.Provider>;
}

function TableRowAction({size = 'icon-sm', variant = 'ghost', ...props}: ButtonProps) {
  return <Button data-slot="table-row-action" variant={variant} size={size} {...props}/>;
}

function TableRowActionsMenu({label, children, align = 'end'}: {label: string; children: React.ReactNode; align?: 'start' | 'end'}) {
  const setOpen = React.useContext(RowActionsContext);
  return <DropdownMenu onOpenChange={open => setOpen?.(open)}>
    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"/>} aria-label={label} data-slot="table-row-actions-trigger" className="data-popup-open:bg-pressed">
      <Icon icon={More} size={12}/>
    </DropdownMenuTrigger>
    <DropdownMenuContent size="sm" align={align}>{children}</DropdownMenuContent>
  </DropdownMenu>;
}

const TableRowActionsItem = DropdownMenuItem;
const TableRowActionsSeparator = DropdownMenuSeparator;

export {
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption, TableEmpty, TableLoading,
  TableTitle, TableToolbar, TableFrameBox, TableSortButton,
  TableRowActions, TableRowAction, TableRowActionsMenu, TableRowActionsItem, TableRowActionsSeparator,
  tableClassName, bodyClassName, rowClassName, headClassName, cellClassName,
  type TableProps, type TableRowProps, type TableHeadProps, type TableCellProps, type TableEmptyProps, type TableLoadingProps, type TableRowActionsProps, type TableFrame,
};

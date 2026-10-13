'use client';

import * as React from 'react';
import {Menu as MenuPrimitive} from '@base-ui/react/menu';
import {
  flexRender, getCoreRowModel, getSortedRowModel, useReactTable,
  type Column, type ColumnDef, type Header, type OnChangeFn, type Row, type RowSelectionState, type SortingFn, type SortingState,
  type Table as TanTable, type VisibilityState,
} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {Icon, ArrowDown, ArrowUp, ChevronSort, Checkmark, OverflowMenuHorizontal, WarningDiamond} from '../icon';
import type {Kind} from '../lib/kind';
import {cssNumber} from '../lib/css-var';
import {EMPTY_VALUE, formatCounts, formatDurations} from '../lib/format';
import {overlayMotion, overlaySurface} from '../lib/overlay';
import {useQuartzPortal} from '../lib/portal';
import {useScrollTabStop} from '../lib/scroll-focus';
import {useOffscreen} from '../lib/use-offscreen';
import {cn} from '../lib/utils';
import {Button, ButtonSize, type ButtonProps} from './button';
import {Checkbox} from './checkbox';
import {CodeTag} from './badge';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from './dropdown-menu';
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle} from './empty-state';
import {Status, statusRank} from './status';

const statusSeverity: Record<string, number> = {
  ...statusRank,
  failed: statusRank.fail, error: statusRank.fail,
  'needs approval': statusRank.waiting,
  warning: statusRank.warn,
  done: statusRank.ok, cancelled: statusRank.idle,
};
const severityOf = (value: unknown) => statusSeverity[String(value).toLowerCase()] ?? -1;

const severitySort: SortingFn<unknown> = (a, b, id) => severityOf(a.getValue(id)) - severityOf(b.getValue(id));

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    numeric?: boolean;
    mono?: boolean;
    label?: string;
    hideBelow?: number;
    severity?: boolean;
    unit?: 'duration' | 'count';
    time?: boolean;
  }
}

type TableSize = 'sm' | 'default' | 'lg';

type FrameHeaderProps = {
  title: React.ReactNode;
  count?: React.ReactNode;
  actions?: React.ReactNode;
  live?: boolean;
  id?: string;
  className?: string;
};

function TableFrameHeader({title, count, actions, live, id, className}: FrameHeaderProps) {
  return <div data-slot="table-frame-header" className={cn('frame-head rule-row', className)}>
    <span id={id} className="min-w-0 truncate type-label text-text-1">{title}</span>
    {count != null && <span data-slot="table-frame-count" className="shrink-0 type-label text-text-3 data">{count}</span>}
    {live && <Status status="running" label="Live" className={cn('type-label-sm', actions == null && 'ms-auto')}/>}
    {actions != null && <div data-slot="table-frame-actions" className="frame-head-action"><ButtonSize size="xs">{actions}</ButtonSize></div>}
  </div>;
}

function TableFrameFooter({children}: {children: React.ReactNode}) {
  return <div data-slot="table-frame-footer" className="frame-foot shrink-0 rule-top"><ButtonSize size="sm">{children}</ButtonSize></div>;
}

function TableToolbar({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="table-toolbar" className={cn('flex min-h-10 min-w-0 shrink-0 flex-wrap items-center rule-row', className)} {...props}/>;
}

const frameLook = () => 'frame min-w-0 bg-page';

type TableProps = Omit<React.ComponentProps<'table'>, 'title'> & {
  size?: TableSize;
  stickyHeader?: boolean;
  kind?: Kind;
  title?: React.ReactNode;
  count?: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  status?: 'warn' | 'fail';
  live?: boolean;
  footer?: React.ReactNode;
  containerClassName?: string;
  frameClassName?: string;
  scrollFocus?: boolean;
};

function Table({className, size = 'default', stickyHeader = false, kind, title, count, actions, toolbar, status, live, footer, containerClassName, frameClassName: frameClass, scrollFocus = true, ...props}: TableProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const tab = useScrollTabStop(box, scrollFocus);
  const frameRef = useOffscreen<HTMLDivElement>(!!live);
  const titleId = React.useId();
  const name = props['aria-label'];
  const labelledBy = !name && title ? titleId : undefined;
  const grid = <div
    ref={box}
    data-slot="table-container"
    data-size={size}
    data-sticky-header={stickyHeader || undefined}
    tabIndex={tab}
    role={tab === 0 && (name || labelledBy) ? 'region' : undefined}
    aria-label={tab === 0 && name ? name : undefined}
    aria-labelledby={tab === 0 ? labelledBy : undefined}
    className={cn('group/table relative w-full overflow-x-auto focus-visible:focus-ring-inset', containerClassName)}
  >
    <table data-slot="table" aria-labelledby={labelledBy} className={cn('w-full caption-bottom border-separate border-spacing-0 text-start type-body group-data-[size=sm]/table:type-body-sm', className)} {...props}/>
  </div>;
  return <div
    ref={frameRef}
    data-slot="table-frame"
    data-kind={kind}
    data-status={status}
    className={cn(frameLook(), frameClass)}
  >
    {title != null && <TableFrameHeader id={titleId} title={title} count={count} actions={actions} live={live}/>}
    {toolbar != null && <TableToolbar>{toolbar}</TableToolbar>}
    {grid}
    {footer != null && <TableFrameFooter>{footer}</TableFrameFooter>}
  </div>;
}

function TableHeader({className, ...props}: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={cn('[&>tr]:shadow-[inset_0_-1px_0_var(--line-row)]', className)} {...props}/>;
}

function TableBody({className, ...props}: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn('[&>tr]:rule-row', className)} {...props}/>;
}

function TableFooter({className, ...props}: React.ComponentProps<'tfoot'>) {
  return <tfoot data-slot="table-footer" className={cn('type-label text-text-1 [&>tr]:rule-top', className)} {...props}/>;
}

const rowClassName = cn(
  'group/row transition-colors duration-(--dur-fast) ease-(--ease-step)',
  '[tbody>&]:hover:bg-hover has-aria-expanded:bg-hover',
  'data-[state=selected]:bg-accent-wash data-[state=selected]:hover:bg-accent-wash',
  'data-[status=fail]:wash-row data-[status=fail]:hover:wash-row-hover',
  'data-open:bg-selected data-open:hover:bg-selected',
  'data-[status=warn]:data-[state=selected]:bg-selected data-[status=warn]:data-[state=selected]:hover:bg-selected',
  'forced-colors:data-[state=selected]:outline-1 forced-colors:data-[state=selected]:-outline-offset-1 forced-colors:data-[state=selected]:outline-[Highlight] forced-colors:data-open:outline-2 forced-colors:data-open:-outline-offset-2 forced-colors:data-open:outline-[Highlight]',
);

type TableRowProps = React.ComponentProps<'tr'> & {
  open?: boolean;
  status?: 'warn' | 'fail';
};

function TableRow({className, open, status, ...props}: TableRowProps) {
  return <tr
    data-slot="table-row"
    data-open={open || undefined}
    data-status={status}
    aria-current={open ? 'true' : undefined}
    className={cn(rowClassName, className)}
    {...props}
  />;
}

function TableHead({className, ...props}: React.ComponentProps<'th'>) {
  return <th
    data-slot="table-head"
    scope="col"
    className={cn(
      'h-(--row-sm) px-3 text-start align-middle type-label-sm font-normal whitespace-nowrap text-text-3',
      'first:ps-4 last:pe-4 [&:has([role=checkbox])]:w-10 [&:has([role=checkbox])]:pe-0',
      'group-data-sticky-header/table:sticky group-data-sticky-header/table:top-0 group-data-sticky-header/table:z-(--z-raised) group-data-sticky-header/table:bg-page group-data-sticky-header/table:shadow-[inset_0_-1px_0_var(--line-row)]',
      className,
    )}
    {...props}
  />;
}

function TableCell({className, ...props}: React.ComponentProps<'td'>) {
  return <td
    data-slot="table-cell"
    className={cn(
      'h-(--row) px-3 align-middle whitespace-nowrap text-text-1',
      'first:ps-4 last:pe-4 [&:has([role=checkbox])]:pe-0',
      'group-data-[size=sm]/table:h-(--row-sm) group-data-[size=lg]/table:h-(--row-lg)',
      className,
    )}
    {...props}
  />;
}

function TableCaption({className, ...props}: React.ComponentProps<'caption'>) {
  return <caption data-slot="table-caption" className={cn('px-4 py-3 text-start type-body-sm text-text-3 rule-top', className)} {...props}/>;
}

type TableEmptyProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  title?: React.ReactNode;
  query?: React.ReactNode;
  action?: React.ReactNode;
};

function TableEmpty({title, query, action, className, children, ...props}: TableEmptyProps) {
  return <Empty variant="plain" data-slot="table-empty" className={cn('whitespace-normal', className)} {...props}>
    {(title != null || children != null || query != null) && <EmptyHeader>
      {title != null && <EmptyTitle>{title}</EmptyTitle>}
      {(children != null || query != null) && <EmptyDescription className="flex flex-wrap items-center gap-1.5">
        {children}{query != null && <CodeTag>{query}</CodeTag>}
      </EmptyDescription>}
    </EmptyHeader>}
    {action != null && <EmptyContent>{action}</EmptyContent>}
  </Empty>;
}

type RowActionsContextValue = {setMenuOpen: (open: boolean) => void};
const RowActionsContext = React.createContext<RowActionsContextValue | null>(null);

type TableRowActionsProps = React.ComponentProps<'div'> & {
  indicator?: React.ReactNode;
  open?: boolean;
  revealOnHover?: boolean;
};

function TableRowActions({indicator, open, revealOnHover = true, className, children, 'aria-label': ariaLabel = 'Row actions', ...props}: TableRowActionsProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const shown = open || menuOpen || !revealOnHover;
  const value = React.useMemo(() => ({setMenuOpen}), []);
  return <RowActionsContext.Provider value={value}>
    <div
      data-slot="table-row-actions"
      data-open={shown || undefined}
      className={cn("group/row-actions grid shrink-0 items-center justify-items-end [grid-template-areas:'stack']", className)}
      {...props}
    >
      {indicator != null && <span
        data-slot="table-row-actions-indicator"
        className={cn(
          '[grid-area:stack] type-body-sm whitespace-nowrap text-text-3 transition-opacity duration-(--dur-fast)',
          'group-hover/row:opacity-0 group-focus-within/row:opacity-0 group-data-open/row-actions:opacity-0 touch:opacity-0 max-md:opacity-0',
        )}
      >{indicator}</span>}
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn(
          'flex items-center gap-0.5 [grid-area:stack] transition-opacity duration-(--dur-fast)',
          revealOnHover && 'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-open/row-actions:opacity-100 touch:opacity-100 max-md:opacity-100',
        )}
      >{children}</div>
    </div>
  </RowActionsContext.Provider>;
}

function TableRowAction({className, size = 'icon-sm', ...props}: ButtonProps) {
  return <Button data-slot="table-row-action" variant="ghost" size={size} className={className} {...props}/>;
}

type TableRowActionsMenuProps = Omit<MenuPrimitive.Trigger.Props, 'children' | 'render' | 'className'> & {
  label: string;
  children: React.ReactNode;
  align?: 'start' | 'end';
  className?: string;
};

const menuPopupClassName = cn('menu-popup', overlaySurface, overlayMotion);
const menuItemClassName = 'menu-item';

function TableRowActionsMenu({label, children, align = 'end', className, ...props}: TableRowActionsMenuProps) {
  const ctx = React.useContext(RowActionsContext);
  return <DropdownMenu onOpenChange={o => ctx?.setMenuOpen(o)}>
    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"/>} aria-label={label} data-slot="table-row-actions-trigger" className={cn('data-popup-open:bg-ghost-hover', className)} {...props}>
      <Icon icon={OverflowMenuHorizontal} size={16}/>
    </DropdownMenuTrigger>
    <DropdownMenuContent data-slot="table-row-actions-content" align={align} sideOffset={4}>{children}</DropdownMenuContent>
  </DropdownMenu>;
}

function TableRowActionsItem({className, variant = 'default', ...props}: MenuPrimitive.Item.Props & {variant?: 'default' | 'destructive'}) {
  return <DropdownMenuItem data-slot="table-row-actions-item" variant={variant} className={className} {...props}/>;
}

function TableRowActionsSeparator({className, ...props}: MenuPrimitive.Separator.Props) {
  return <DropdownMenuSeparator data-slot="table-row-actions-separator" className={className} {...props}/>;
}

function useWindowedRows({count, scrollRef, estimateSize, overscan = 10, gap = 0, follow = false, enabled = true, getItemKey}: {
  count: number;
  scrollRef: React.RefObject<HTMLElement | null>;
  estimateSize: number;
  overscan?: number;
  gap?: number;
  follow?: boolean;
  enabled?: boolean;
  getItemKey?: (index: number) => string | number;
}) {
  const virtualizer = useVirtualizer({
    count: enabled ? count : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    gap,
    getItemKey,
  });
  const placedAt = React.useRef(estimateSize);
  React.useLayoutEffect(() => {
    if (placedAt.current === estimateSize) return;
    placedAt.current = estimateSize;
    virtualizer.measure();
  }, [estimateSize, virtualizer]);
  const atBottomRef = React.useRef(true);
  const [atBottom, setAtBottom] = React.useState(true);
  const onScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
  }, [scrollRef]);
  const toEnd = React.useCallback(() => {
    if (!count) return;
    if (enabled) { virtualizer.scrollToIndex(count - 1, {align: 'end'}); return; }
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [enabled, count, virtualizer, scrollRef]);
  React.useLayoutEffect(() => {
    if (follow && atBottomRef.current) toEnd();
  }, [follow, toEnd]);
  const jump = React.useCallback(() => {
    atBottomRef.current = true;
    setAtBottom(true);
    toEnd();
  }, [toEnd]);
  return {virtualizer, items: virtualizer.getVirtualItems(), total: virtualizer.getTotalSize(), onScroll, atBottom, jump};
}

function DataTableCheckbox({checked, indeterminate, onCheckedChange, ...props}: Omit<React.ComponentProps<typeof Checkbox>, 'onCheckedChange' | 'checked' | 'indeterminate'> & {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean, event: MouseEvent) => void;
}) {
  return <Checkbox
    data-slot="table-checkbox"
    checked={checked}
    indeterminate={indeterminate}
    onCheckedChange={(value, details) => onCheckedChange(value, details.event as MouseEvent)}
    {...props}
  />;
}

function selectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select',
    size: 44,
    minSize: 44,
    maxSize: 44,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    meta: {label: 'Select'},
    header: ({table}) => <DataTableCheckbox
      aria-label="Select all rows"
      checked={table.getIsAllRowsSelected()}
      indeterminate={table.getIsSomeRowsSelected()}
      onCheckedChange={value => table.toggleAllRowsSelected(value)}
    />,
    cell: ({row, table}) => <DataTableCheckbox
      aria-label={`Select row ${row.index + 1}`}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value, event) => {
        const anchor = (table.options.meta as {anchor?: React.RefObject<{index: number; value: boolean} | null>} | undefined)?.anchor;
        const to = anchor?.current?.value ?? value;
        if (event.shiftKey && anchor?.current != null) {
          const rows = table.getRowModel().rows;
          const from = rows.findIndex(r => r.index === anchor.current!.index);
          const at = rows.findIndex(r => r.id === row.id);
          const [a, b] = from < at ? [from, at] : [at, from];
          const next = {...table.getState().rowSelection};
          for (const r of rows.slice(a, b + 1)) if (r.getCanSelect()) { if (to) next[r.id] = true; else delete next[r.id]; }
          table.setRowSelection(next);
          if (anchor) anchor.current = {index: row.index, value: to};
        } else {
          row.toggleSelected(value);
          if (anchor) anchor.current = {index: row.index, value};
        }
      }}
    />,
  };
}

function MenuPopup({children, align = 'start'}: {children: React.ReactNode; align?: 'start' | 'end'}) {
  const container = useQuartzPortal();
  return <MenuPrimitive.Portal container={container}>
    <MenuPrimitive.Positioner side="bottom" align={align} sideOffset={4} collisionPadding={8} className="z-(--z-overlay) outline-none">
      <MenuPrimitive.Popup data-slot="table-menu" className={menuPopupClassName}>{children}</MenuPrimitive.Popup>
    </MenuPrimitive.Positioner>
  </MenuPrimitive.Portal>;
}

function columnLabel<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header;
  return column.columnDef.meta?.label ?? (typeof header === 'string' ? header : column.id);
}

function sortWords<TData>(column: Column<TData, unknown>, sorted: false | 'asc' | 'desc') {
  if (!sorted) return 'not sorted';
  if (column.columnDef.meta?.severity) return sorted === 'desc' ? 'sorted worst first' : 'sorted best first';
  return sorted === 'asc' ? 'sorted ascending' : 'sorted descending';
}

function DataTableColumnHeader<TData>({header}: {header: Header<TData, unknown>}) {
  const column = header.column;
  const headRef = React.useRef<HTMLDivElement>(null);
  const hide = () => {
    const th = headRef.current?.closest('th');
    const row = th?.parentElement;
    const at = th && row ? Array.from(row.children).indexOf(th) : -1;
    column.toggleVisibility(false);
    if (!row || at < 0) return;
    const land = () => {
      const heads = Array.from(row.children) as HTMLElement[];
      const near = [heads[at], heads[at - 1], ...heads.slice(at + 1), ...heads.slice(0, at - 1).reverse()];
      for (const head of near) {
        const target = head?.querySelector<HTMLElement>('[data-slot=table-sort], [data-slot=table-column-menu], input, button');
        if (target) { target.focus(); return; }
      }
    };
    setTimeout(() => requestAnimationFrame(land), 0);
  };
  const label = columnLabel(column);
  const sorted = column.getIsSorted();
  const meta = column.columnDef.meta;
  const fitHead = (header.getContext().table.options.meta as {fitHead?: (id: string, px: number) => void} | undefined)?.fitHead;
  React.useLayoutEffect(() => {
    const row = headRef.current;
    const th = row?.closest('th');
    if (!row || !th || !fitHead) return;
    const measure = () => {
      const style = getComputedStyle(th);
      const previous = row.style.width;
      row.style.width = 'max-content';
      const natural = row.getBoundingClientRect().width;
      row.style.width = previous;
      fitHead(column.id, Math.ceil(natural + parseFloat(style.paddingInlineStart) + parseFloat(style.paddingInlineEnd)));
    };
    measure();
    let live = true;
    document.fonts?.ready.then(() => { if (live) measure(); });
    return () => { live = false; };
  }, [fitHead, column.id, label]);
  const severity = meta?.severity;
  const sortIcon = !sorted ? ChevronSort : severity ? (sorted === 'desc' ? WarningDiamond : ArrowUp) : sorted === 'asc' ? ArrowUp : ArrowDown;

  if (!column.getCanSort() && !column.getCanHide()) return <span className="truncate">{label}</span>;

  return <div ref={headRef} className={cn('group/head relative flex min-w-0 items-center', (meta?.numeric || meta?.severity) && 'justify-end gap-1')}>
    {column.getCanSort()
      ? <button
          type="button"
          data-slot="table-sort"
          onClick={event => column.toggleSorting(undefined, event.shiftKey)}
          aria-label={`${label}, ${sortWords(column, sorted)}. Sort`}
          className={cn(
            '-mx-1.5 inline-flex h-(--control-sm) min-w-0 items-center gap-1 rounded-soft px-1.5 hover:bg-hover hover:text-text-1 focus-visible:focus-ring-inset',
            sorted && 'text-text-1',
            (meta?.numeric || meta?.severity) && 'flex-row-reverse',
          )}
        >
          <span className="truncate">{label}</span>
          <Icon icon={sortIcon} size={12} className={cn('shrink-0', !sorted && 'opacity-0 group-hover/head:opacity-100 group-focus-within/head:opacity-100 touch:opacity-100')}/>
        </button>
      : <span className="truncate">{label}</span>}
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        data-slot="table-column-menu"
        aria-label={`${label} column options`}
        render={<Button variant="ghost" size="icon-xs"/>}
        className={cn(
          'bg-transparent text-text-3 opacity-0 transition-[opacity,background-color,color] duration-(--dur-fast) ease-(--ease-step) motion-reduce:transition-none',
          'group-hover/head:opacity-100 group-focus-within/head:opacity-100 hover:text-text-1 data-popup-open:opacity-100 focus-visible:opacity-100 focus-visible:focus-ring-inset touch:opacity-100',
          meta?.numeric || meta?.severity ? 'order-first' : 'ms-1',
        )}
      ><Icon icon={OverflowMenuHorizontal} size={16}/></MenuPrimitive.Trigger>
      <MenuPopup align={meta?.numeric || meta?.severity ? 'end' : 'start'}>
        {column.getCanSort() && <>
          <MenuPrimitive.Item className={menuItemClassName} onClick={() => column.toggleSorting(!!severity)}>{severity ? 'Worst first' : 'Sort ascending'}</MenuPrimitive.Item>
          <MenuPrimitive.Item className={menuItemClassName} onClick={() => column.toggleSorting(!severity)}>{severity ? 'Best first' : 'Sort descending'}</MenuPrimitive.Item>
          {sorted && <MenuPrimitive.Item className={menuItemClassName} onClick={() => column.clearSorting()}>Clear sort</MenuPrimitive.Item>}
        </>}
        {column.getCanSort() && column.getCanHide() && <MenuPrimitive.Separator className="menu-separator"/>}
        {column.getCanHide() && <MenuPrimitive.Item className={menuItemClassName} onClick={hide}>Hide column</MenuPrimitive.Item>}
      </MenuPopup>
    </MenuPrimitive.Root>
  </div>;
}

function DataTableColumnsMenu<TData>({table, className}: {table: TanTable<TData>; className?: string}) {
  const columns = table.getAllLeafColumns().filter(c => c.getCanHide());
  return <MenuPrimitive.Root>
    <MenuPrimitive.Trigger
      data-slot="table-columns"
      className={cn('frame [--frame-radius:var(--radius-soft)] inline-flex h-(--control-sm) items-center gap-1.5 bg-page px-3 type-label text-text-1 [--frame-color:var(--line-control)] hover:frame-ink data-popup-open:frame-ink', className)}
    >Columns</MenuPrimitive.Trigger>
    <MenuPopup align="end">
      <MenuPrimitive.Group>
      <MenuPrimitive.GroupLabel className="menu-label">Show columns</MenuPrimitive.GroupLabel>
      {columns.map(column => <MenuPrimitive.CheckboxItem
        key={column.id}
        className={menuItemClassName}
        checked={column.getIsVisible()}
        onCheckedChange={value => column.toggleVisibility(value)}
        closeOnClick={false}
      >
        <span className="grid size-4 place-items-center"><MenuPrimitive.CheckboxItemIndicator><Icon icon={Checkmark} size={16}/></MenuPrimitive.CheckboxItemIndicator></span>
        {columnLabel(column)}
      </MenuPrimitive.CheckboxItem>)}
      </MenuPrimitive.Group>
    </MenuPopup>
  </MenuPrimitive.Root>;
}

function ResizeHandle<TData>({header, table}: {header: Header<TData, unknown>; table: TanTable<TData>}) {
  const column = header.column;
  const min = column.columnDef.minSize ?? 60;
  const max = column.columnDef.maxSize ?? 800;
  const nudge = (by: number) => {
    const size = Math.min(max, Math.max(min, column.getSize() + by));
    table.setColumnSizing(s => ({...s, [column.id]: size}));
  };
  return <div
    role="separator"
    aria-orientation="vertical"
    aria-label={`Resize ${columnLabel(column)}`}
    aria-valuenow={Math.round(column.getSize())}
    aria-valuemin={min}
    aria-valuemax={max}
    tabIndex={0}
    data-slot="table-resize"
    data-resizing={column.getIsResizing() || undefined}
    onMouseDown={header.getResizeHandler()}
    onTouchStart={header.getResizeHandler()}
    onDoubleClick={() => column.resetSize()}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const grow = (event.key === 'ArrowRight') !== rtl;
        nudge((grow ? 1 : -1) * (event.shiftKey ? 64 : 16));
      }
      if (event.key === 'Enter') { event.preventDefault(); column.resetSize(); }
    }}
    className={cn(
      'absolute inset-y-0 -end-1 z-(--z-raised) w-2 cursor-col-resize touch-none select-none',
      'after:absolute after:inset-y-2 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-line-row after:opacity-0',
      'group-hover/th:after:opacity-100 hover:after:w-(--line-accent) hover:after:bg-ink focus-visible:after:opacity-100 focus-visible:after:w-(--line-accent) focus-visible:after:bg-ink focus-visible:outline-none',
      'data-resizing:after:w-(--line-accent) data-resizing:after:bg-ink data-resizing:after:opacity-100',
      'touch:after:opacity-100',
    )}
  />;
}

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  'aria-label': string;
  loading?: boolean;
  loadingRows?: number;
  empty?: React.ReactNode;
  maxHeight?: number | string;
  virtualizeFrom?: number;
  size?: 'sm' | 'default';
  kind?: Kind;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  live?: boolean;
  follow?: boolean;
  rowStatus?: (row: TData) => 'warn' | 'fail' | undefined;
  sorting?: SortingState;
  defaultSorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  columnVisibility?: VisibilityState;
  defaultColumnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  enableColumnResizing?: boolean;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  onRowClick?: (row: TData) => void;
  activeRowId?: string;
  rowActions?: (row: TData) => React.ReactNode;
  rowIndicator?: (row: TData) => React.ReactNode;
  rowActionsWidth?: number;
  toolbar?: (table: TanTable<TData>) => React.ReactNode;
  count?: React.ReactNode | false;
  className?: string;
} & Omit<React.ComponentProps<'div'>, 'children' | 'aria-label' | 'title'>;

function useControlled<T>(value: T | undefined, onChange: OnChangeFn<T> | undefined, initial: T) {
  const [inner, setInner] = React.useState<T>(initial);
  const current = value ?? inner;
  const set: OnChangeFn<T> = React.useCallback(updater => {
    if (value === undefined) setInner(updater);
    onChange?.(updater);
  }, [value, onChange]);
  return [current, set] as const;
}

function useLoadingPhase(loading: boolean, ref: React.RefObject<HTMLElement | null>) {
  const [phase, setPhase] = React.useState<'wait' | 'shown' | 'off'>(loading ? 'wait' : 'off');
  const shownAt = React.useRef(0);
  React.useEffect(() => {
    if (!loading) { setPhase(p => (p === 'wait' ? 'off' : p)); return; }
    setPhase(p => (p === 'shown' ? p : 'wait'));
    const t = window.setTimeout(() => setPhase(p => {
      if (p !== 'shown') shownAt.current = Date.now();
      return 'shown';
    }), cssNumber(ref.current, '--dur-skeleton-delay', 150));
    return () => window.clearTimeout(t);
  }, [loading, ref]);
  React.useEffect(() => {
    if (loading || phase !== 'shown') return;
    const left = cssNumber(ref.current, '--dur-skeleton-hold', 400) - (Date.now() - shownAt.current);
    const t = window.setTimeout(() => setPhase('off'), Math.max(0, left));
    return () => window.clearTimeout(t);
  }, [loading, phase, ref]);
  return phase;
}

function columnKey<TData>(c: ColumnDef<TData, any>) {
  return c.id ?? (c as {accessorKey?: string}).accessorKey;
}

function DataTable<TData>({
  columns: columnsProp, data, getRowId, loading = false, loadingRows = 6, empty = 'No rows.', maxHeight, virtualizeFrom = 200,
  size = 'default', kind, sorting: sortingProp, defaultSorting = [], onSortingChange, rowSelection: selectionProp, onRowSelectionChange,
  columnVisibility: visibilityProp, defaultColumnVisibility = {}, onColumnVisibilityChange, enableColumnResizing = true, enableRowSelection = true,
  onRowClick, activeRowId, rowActions, rowIndicator, rowActionsWidth = 72, toolbar, title, count, actions, footer, live = false, follow = false, rowStatus,
  className, 'aria-label': ariaLabel, ...props
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useControlled<SortingState>(sortingProp, onSortingChange, defaultSorting);
  const [rowSelection, setRowSelection] = useControlled<RowSelectionState>(selectionProp, onRowSelectionChange, {});
  const [userVisibility, setUserVisibility] = useControlled<VisibilityState>(visibilityProp, onColumnVisibilityChange, defaultColumnVisibility);
  const anchor = React.useRef<{index: number; value: boolean} | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [headWidths, setHeadWidths] = React.useState<Record<string, number>>({});
  const fitHead = React.useCallback((id: string, px: number) => {
    setHeadWidths(w => (w[id] === px ? w : {...w, [id]: px}));
  }, []);
  const [statusWidth, setStatusWidth] = React.useState(128);
  React.useLayoutEffect(() => setStatusWidth(cssNumber(scrollRef.current, '--status-column', 128)), []);
  const [timeWidth, setTimeWidth] = React.useState<number | null>(null);
  const hasTime = columnsProp.some(c => c.meta?.time);
  React.useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!box || !hasTime) return;
    const measure = () => {
      const probe = document.createElement('span');
      probe.className = cn('invisible absolute block w-(--time-column) px-3', size === 'sm' ? 'type-body-sm' : 'type-body');
      box.appendChild(probe);
      setTimeWidth(Math.ceil(probe.getBoundingClientRect().width));
      probe.remove();
    };
    measure();
    let live = true;
    document.fonts?.ready.then(() => { if (live) measure(); });
    return () => { live = false; };
  }, [hasTime, size]);

  const columns = React.useMemo(() => {
    const out: ColumnDef<TData, any>[] = columnsProp.map(c => {
      const meta = c.meta;
      const key = columnKey(c);
      const head = key ? headWidths[key] : undefined;
      if (!meta?.severity && !meta?.unit && !meta?.time && head === undefined) return c;
      const next: ColumnDef<TData, any> = {...c};
      if (meta?.time && timeWidth !== null && c.size === undefined) next.size = timeWidth;
      if (meta?.severity && c.size === undefined) next.size = statusWidth;
      if (head !== undefined) next.minSize = Math.min(Math.max(c.minSize ?? 60, head), c.maxSize ?? 800);
      if (!meta?.severity && !meta?.unit) return next;
      if (meta.severity) { next.sortingFn = c.sortingFn ?? (severitySort as SortingFn<TData>); next.sortDescFirst = c.sortDescFirst ?? true; }
      if (meta.unit) {
        next.meta = {numeric: true, ...meta};
        next.minSize = Math.max(next.minSize ?? 0, c.minSize ?? 120);
        if (!c.cell) next.cell = ({row, column, table: t}) => (t.options.meta as {units?: Map<string, Map<number, string>>}).units?.get(column.id)?.get(row.index) ?? null;
      }
      return next;
    });
    if (rowActions) out.push({
      id: 'actions',
      size: rowActionsWidth,
      minSize: rowActionsWidth,
      maxSize: rowActionsWidth,
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      meta: {label: 'Actions'},
      header: () => <span className="sr-only">Actions</span>,
      cell: ({row}) => <TableRowActions indicator={rowIndicator?.(row.original)}>{rowActions(row.original)}</TableRowActions>,
    });
    return out;
  }, [columnsProp, rowActions, rowIndicator, rowActionsWidth, headWidths, timeWidth, statusWidth]);

  const unitText = React.useMemo(() => {
    const map = new Map<string, Map<number, string>>();
    for (const c of columns) {
      const unit = c.meta?.unit;
      const key = (c as {accessorKey?: string}).accessorKey;
      if (!unit || !key) continue;
      const raw = data.map(row => (row as Record<string, unknown>)[key]);
      const present = raw.map(v => (v === null || v === undefined || v === '' ? NaN : Number(v)));
      const known = present.filter(Number.isFinite);
      const formatted = unit === 'duration' ? formatDurations(known).values : formatCounts(known).values;
      let next = 0;
      map.set(columnKey(c)!, new Map(present.map((n, i) => [i, Number.isFinite(n) ? formatted[next++] : EMPTY_VALUE])));
    }
    return map;
  }, [columns, data]);

  const [boxWidth, setBoxWidth] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const autoHidden = React.useMemo(() => {
    if (boxWidth === null) return [];
    return columns.filter(c => c.meta?.hideBelow && boxWidth < c.meta.hideBelow).map(columnKey).filter((id): id is string => !!id);
  }, [columns, boxWidth]);
  const columnVisibility = React.useMemo(() => {
    const merged = {...userVisibility};
    for (const id of autoHidden) if (userVisibility[id] !== true) merged[id] = false;
    return merged;
  }, [userVisibility, autoHidden]);
  const setColumnVisibility: OnChangeFn<VisibilityState> = updater => {
    const next = typeof updater === 'function' ? updater(columnVisibility) : updater;
    const stored = {...next};
    for (const id of autoHidden) if (stored[id] === false && userVisibility[id] === undefined) delete stored[id];
    setUserVisibility(stored);
  };

  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {sorting, rowSelection, columnVisibility},
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    enableMultiSort: true,
    sortDescFirst: false,
    isMultiSortEvent: event => (event as MouseEvent).shiftKey,
    defaultColumn: {size: 160, minSize: 60, maxSize: 800},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {anchor, units: unitText, fitHead},
  });

  const rows = table.getRowModel().rows;
  const rowToken = size === 'sm' ? '--row-sm' : '--row';
  const rowFallback = size === 'sm' ? 32 : 40;
  const [rowHeight, setRowHeight] = React.useState(rowFallback);
  React.useLayoutEffect(() => setRowHeight(cssNumber(scrollRef.current, rowToken, rowFallback)), [rowToken, rowFallback]);
  const phase = useLoadingPhase(loading, scrollRef);
  const placeholders = phase === 'shown' || (phase === 'wait' && rows.length === 0);
  const scrollTab = useScrollTabStop(scrollRef);
  const virtual = !!maxHeight && rows.length >= virtualizeFrom;
  const windowed = useWindowedRows({count: rows.length, scrollRef, estimateSize: rowHeight, enabled: virtual, follow: follow && !!maxHeight});
  const items = virtual ? windowed.items : [];
  const padTop = virtual && items.length ? items[0].start : 0;
  const padBottom = virtual && items.length ? windowed.total - items[items.length - 1].end : 0;
  const visible = virtual ? items.map(item => rows[item.index]) : rows;
  const indexOf = React.useMemo(() => new Map(rows.map((r, i) => [r.id, i])), [rows]);

  const severityId = columns.map(c => (c.meta?.severity ? columnKey(c) : undefined)).find(Boolean);
  const troubleOf = React.useCallback((row: Row<TData>): 'warn' | 'fail' | undefined => {
    if (rowStatus) return rowStatus(row.original);
    if (!severityId) return undefined;
    const rank = severityOf(row.getValue(severityId));
    return rank === statusRank.fail ? 'fail' : rank === statusRank.warn ? 'warn' : undefined;
  }, [severityId, rowStatus]);

  const leafCount = table.getVisibleLeafColumns().length;
  const pinActions = !!rowActions && boxWidth !== null && table.getTotalSize() > boxWidth + 1;
  const selectedCount = Object.keys(rowSelection).length;

  const [focusIndex, setFocusIndex] = React.useState<number | null>(null);
  const activeIndex = activeRowId === undefined ? -1 : rows.findIndex(r => r.id === activeRowId);
  const tabIndexRow = focusIndex ?? (activeIndex >= 0 ? activeIndex : 0);
  const focusRow = (index: number) => {
    const next = Math.max(0, Math.min(rows.length - 1, index));
    setFocusIndex(next);
    if (virtual) windowed.virtualizer.scrollToIndex(next, {align: 'auto'});
    requestAnimationFrame(() => scrollRef.current?.querySelector<HTMLElement>(`tr[data-index="${next}"]`)?.focus());
  };
  const onRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, index: number, row: TData) => {
    if (event.target !== event.currentTarget) return;
    const page = Math.max(1, Math.floor((scrollRef.current?.clientHeight ?? 400) / rowHeight) - 1);
    const moves: Record<string, number> = {ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: rows.length - 1, PageDown: index + page, PageUp: index - page};
    if (event.key in moves) { event.preventDefault(); focusRow(moves[event.key]); return; }
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) { event.preventDefault(); onRowClick?.(row); }
  };

  const sortAnnouncement = sorting.map(s => {
    const column = table.getColumn(s.id);
    if (!column) return '';
    return `${columnLabel(column)} ${column.columnDef.meta?.severity ? (s.desc ? 'worst first' : 'best first') : s.desc ? 'descending' : 'ascending'}`;
  }).filter(Boolean).join(', then ');

  const frameRef = useOffscreen<HTMLDivElement>(live);
  const titleId = React.useId();
  const headClassName = 'group/th sticky top-0 z-(--z-raised) bg-page px-3 align-middle type-label-sm font-normal whitespace-nowrap text-text-3 shadow-[inset_0_-1px_0_var(--line-row)]';

  return <div
    ref={frameRef}
    data-slot="data-table"
    data-size={size}
    data-kind={kind}
    className={cn(frameLook(), 'flex flex-col', className)}
    {...props}
  >
    {title != null && <TableFrameHeader id={titleId} title={title} count={count === false || loading ? undefined : count ?? rows.length.toLocaleString('en-US')} actions={actions} live={live}/>}
    {toolbar && <TableToolbar>{toolbar(table)}</TableToolbar>}
    <div data-slot="table-body-frame" className={'relative min-h-0'}>
    <div
      ref={scrollRef}
      onScroll={virtual || follow ? windowed.onScroll : undefined}
      data-slot="table-container"
      tabIndex={scrollTab}
      role={scrollTab === 0 ? 'region' : undefined}
      aria-label={scrollTab === 0 ? ariaLabel : undefined}
      className={cn('relative overflow-auto overscroll-contain focus-visible:focus-ring-inset [scrollbar-width:thin] w-full')}
      style={{maxHeight}}
    >
      <table
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        aria-rowcount={loading ? undefined : rows.length + 1}
        data-slot="table"
        className="table-fixed border-separate border-spacing-0 text-start type-body"
        style={{width: table.getTotalSize(), minWidth: '100%'}}
      >
        <colgroup>
          {table.getVisibleLeafColumns().map(column => <col key={column.id} style={{width: column.getSize()}}/>)}
        </colgroup>
        <thead data-slot="table-header">
          {table.getHeaderGroups().map(group => <tr key={group.id} aria-rowindex={1}>
            {group.headers.map((header, i) => {
              const meta = header.column.columnDef.meta;
              const sorted = header.column.getIsSorted();
              const isString = typeof header.column.columnDef.header === 'string';
              return <th
                key={header.id}
                scope="col"
                data-slot="table-head"
                style={{zIndex: `calc(var(--z-raised) + ${pinActions && header.column.id === 'actions' ? group.headers.length + 1 : group.headers.length - i})`}}
                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : header.column.getCanSort() ? 'none' : undefined}
                className={cn(
                  headClassName,
                  'h-(--row-sm) first:ps-4 last:pe-4',
                  meta?.numeric && 'text-end',
                  meta?.severity && 'text-end [&>*]:justify-end',
                  (header.column.id === 'select' || header.column.id === 'actions') && 'px-0! text-center [&>*]:mx-auto',
                  pinActions && header.column.id === 'actions' && 'end-0 shadow-[inset_0_-1px_0_var(--line-row),inset_1px_0_0_var(--line-row)] rtl:shadow-[inset_0_-1px_0_var(--line-row),inset_-1px_0_0_var(--line-row)]',
                )}
              >
                {header.isPlaceholder ? null : isString ? <DataTableColumnHeader header={header}/> : flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanResize() && <ResizeHandle header={header} table={table}/>}
              </th>;
            })}
          </tr>)}
        </thead>
        <tbody data-slot="table-body">
          {placeholders
            ? Array.from({length: loadingRows}, (_, i) => <tr key={i} aria-hidden data-slot="table-loading-row" className={cn('rule-row', phase === 'wait' && 'invisible')}>
                {table.getVisibleLeafColumns().map((column, c) => <td key={column.id} className={cn('px-3 first:ps-4 last:pe-4', size === 'sm' ? 'h-(--row-sm)' : 'h-(--row)')}>
                  <span className={cn('block h-2 bg-(--surface-skeleton)', column.id === 'select' ? 'mx-auto size-4' : column.id === 'actions' ? 'hidden' : c % 3 === 0 ? 'w-3/4' : c % 3 === 1 ? 'w-1/2' : 'w-2/3', column.columnDef.meta?.numeric && 'ms-auto w-1/3')}/>
                </td>)}
              </tr>)
            : rows.length === 0 && !loading
              ? <tr><td colSpan={leafCount} className="p-0">
                  <div className="sticky start-0" style={{width: boxWidth ?? undefined}}>
                    {typeof empty === 'string' ? <TableEmpty>{empty}</TableEmpty> : empty}
                  </div>
                </td></tr>
              : <>
                  {padTop > 0 && <tr aria-hidden><td colSpan={leafCount} style={{height: padTop, padding: 0}}/></tr>}
                  {visible.map(row => {
                    const index = indexOf.get(row.id) ?? 0;
                    const open = row.id === activeRowId;
                    return <tr
                      key={row.id}
                      data-slot="table-row"
                      data-index={index}
                      aria-rowindex={index + 2}
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      data-status={troubleOf(row)}
                      data-open={open || undefined}
                      aria-current={open ? 'true' : undefined}
                      aria-selected={enableRowSelection ? row.getIsSelected() : undefined}
                      tabIndex={onRowClick ? (index === tabIndexRow ? 0 : -1) : undefined}
                      onFocus={onRowClick ? () => setFocusIndex(index) : undefined}
                      onKeyDown={onRowClick ? event => onRowKeyDown(event, index, row.original) : undefined}
                      onClick={onRowClick ? event => { if (!(event.target as HTMLElement).closest('button, a, input, [role=checkbox], [role=separator]')) onRowClick(row.original); } : undefined}
                      className={cn(
                        rowClassName,
                        'rule-row',
                        onRowClick && 'cursor-pointer focus-visible:focus-ring-inset',
                      )}
                    >
                      {row.getVisibleCells().map(cell => {
                        const meta = cell.column.columnDef.meta;
                        return <td
                          key={cell.id}
                          data-slot="table-cell"
                          onPointerEnter={event => {
                            const td = event.currentTarget;
                            const cut = td.scrollWidth > td.clientWidth || Array.from(td.querySelectorAll<HTMLElement>('.truncate')).some(el => el.scrollWidth > el.clientWidth);
                            td.title = cut ? (td.textContent ?? '') : '';
                          }}
                          className={cn(
                            'truncate px-3 align-middle text-text-1 first:ps-4 last:pe-4',
                            size === 'sm' ? 'h-(--row-sm) type-body-sm' : 'h-(--row)',
                            meta?.numeric && 'data text-end',
                            meta?.severity && 'text-end',
                            meta?.mono && 'type-tag',
                            (cell.column.id === 'select' || cell.column.id === 'actions') && 'px-0! [&>*]:mx-auto',
                            cell.column.id === 'actions' && 'overflow-visible pe-2!',
                            pinActions && cell.column.id === 'actions' && [
                              'sticky end-0 z-(--z-raised) bg-page [--row-wash:transparent]',
                              'group-hover/row:[--row-wash:var(--surface-hover)] group-has-aria-expanded/row:[--row-wash:var(--surface-hover)]',
                              'group-data-[state=selected]/row:[--row-wash:var(--accent-wash)] group-data-open/row:[--row-wash:var(--accent-wash)] group-data-[status=fail]/row:[--row-wash:color-mix(in_oklch,var(--accent-wash)_40%,transparent)]',
                              'shadow-[inset_1px_0_0_var(--line-row),inset_0_0_0_100vmax_var(--row-wash)] rtl:shadow-[inset_-1px_0_0_var(--line-row),inset_0_0_0_100vmax_var(--row-wash)]',
                            ],
                          )}
                        >{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>;
                      })}
                    </tr>;
                  })}
                  {padBottom > 0 && <tr aria-hidden><td colSpan={leafCount} style={{height: padBottom, padding: 0}}/></tr>}
                </>}
        </tbody>
      </table>
    </div>
    </div>
    {footer != null && <TableFrameFooter>{footer}</TableFrameFooter>}
    <p role="status" className="sr-only">
      {loading ? 'Loading rows' : `${rows.length} rows${selectedCount ? `, ${selectedCount} selected` : ''}${sortAnnouncement ? `, sorted by ${sortAnnouncement}` : ''}`}
    </p>
  </div>;
}

export {
  Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption, TableEmpty, TableFrameHeader, TableToolbar, frameLook as tableFrameClassName, rowClassName as tableRowClassName,
  TableRowActions, TableRowAction, TableRowActionsMenu, TableRowActionsItem, TableRowActionsSeparator,
  DataTable, DataTableCheckbox, DataTableColumnHeader, DataTableColumnsMenu, selectColumn,
  severitySort, statusSeverity, useWindowedRows,
  type DataTableProps, type TableEmptyProps, type TableProps, type TableRowProps, type TableRowActionsProps, type TableRowActionsMenuProps, type TableSize,
};
export type {ColumnDef, RowSelectionState, SortingState, VisibilityState} from '@tanstack/react-table';

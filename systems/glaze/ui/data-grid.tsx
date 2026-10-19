'use client';

import * as React from 'react';
import {
  flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type Column, type ColumnDef, type Header, type OnChangeFn, type PaginationState, type Row, type RowSelectionState, type SortingFn, type SortingState,
  type Table as TanTable, type VisibilityState,
} from '@tanstack/react-table';
import {useVirtualizer} from '@tanstack/react-virtual';
import {Icon, ArrowDown, ArrowUp, ChevronSort, Columns, More} from '../icon';
import {EMPTY_VALUE, cssNumber, formatCounts, formatDurations, useLoadingPhase, useScrollTabStop} from '../lib/data';
import {cn} from '../lib/utils';
import {Button} from './button';
import {Checkbox} from './checkbox';
import {DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from './dropdown-menu';
import {PaginationInfo, PaginationNav} from './pagination';
import {statusRank} from './status';
import {
  TableEmpty, TableFrameBox, TableRowActions, TableTitle, TableToolbar, bodyClassName, cellClassName, headClassName, rowClassName, tableClassName,
  type TableFrame,
} from './table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    numeric?: boolean;
    mono?: boolean;
    label?: string;
    hideBelow?: number;
    severity?: boolean;
    unit?: 'duration' | 'count';
  }
}

const statusSeverity: Record<string, number> = {
  ...statusRank, failed: statusRank.fail, error: statusRank.fail, passed: statusRank.ok, done: statusRank.ok,
  warning: statusRank.warn, 'waiting on you': statusRank.waiting, cancelled: statusRank.idle,
};
const severityOf = (value: unknown) => statusSeverity[String(value).toLowerCase()] ?? -1;
const severitySort: SortingFn<unknown> = (a, b, id) => severityOf(a.getValue(id)) - severityOf(b.getValue(id));

function selectColumn<TData>(): ColumnDef<TData> {
  return {
    id: 'select', size: 40, minSize: 40, maxSize: 40,
    enableSorting: false, enableHiding: false, enableResizing: false,
    meta: {label: 'Select'},
    header: ({table}) => <Checkbox
      data-slot="data-grid-checkbox"
      aria-label="Select all rows"
      checked={table.getIsAllRowsSelected()}
      indeterminate={table.getIsSomeRowsSelected()}
      onCheckedChange={value => table.toggleAllRowsSelected(value)}
    />,
    cell: ({row, table}) => <Checkbox
      data-slot="data-grid-checkbox"
      aria-label={`Select ${(table.options.meta as GridMeta | undefined)?.rowName?.(row) ?? `row ${row.index + 1}`}`}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value, details) => {
        const meta = table.options.meta as GridMeta;
        const anchor = meta.anchor;
        const shift = (details.event as MouseEvent | undefined)?.shiftKey;
        if (shift && anchor.current) {
          const to = anchor.current.value;
          const rows = table.getRowModel().rows;
          const from = rows.findIndex(r => r.id === anchor.current!.id);
          const at = rows.findIndex(r => r.id === row.id);
          if (from >= 0) {
            const [a, b] = from < at ? [from, at] : [at, from];
            const next = {...table.getState().rowSelection};
            for (const r of rows.slice(a, b + 1)) if (r.getCanSelect()) { if (to) next[r.id] = true; else delete next[r.id]; }
            table.setRowSelection(next);
            return;
          }
        }
        row.toggleSelected(value);
        anchor.current = {id: row.id, value};
      }}
    />,
  };
}

type GridMeta = {
  anchor: React.RefObject<{id: string; value: boolean} | null>;
  units: Map<string, Map<number, string>>;
  fitHead: (id: string, px: number) => void;
  rowName?: (row: Row<unknown>) => string;
};

function columnLabel<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header;
  return column.columnDef.meta?.label ?? (typeof header === 'string' ? header : column.id);
}

function sortWords<TData>(column: Column<TData, unknown>, sorted: false | 'asc' | 'desc') {
  if (!sorted) return 'not sorted';
  if (column.columnDef.meta?.severity) return sorted === 'desc' ? 'sorted worst first' : 'sorted best first';
  return sorted === 'asc' ? 'sorted ascending' : 'sorted descending';
}

function DataGridColumnHeader<TData>({header}: {header: Header<TData, unknown>}) {
  const column = header.column;
  const headRef = React.useRef<HTMLDivElement>(null);
  const label = columnLabel(column);
  const sorted = column.getIsSorted();
  const meta = column.columnDef.meta;
  const end = meta?.numeric || meta?.severity || meta?.unit;
  const fitHead = (header.getContext().table.options.meta as GridMeta | undefined)?.fitHead;
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
  const hide = () => {
    const th = headRef.current?.closest('th');
    const row = th?.parentElement;
    const at = th && row ? Array.from(row.children).indexOf(th) : -1;
    column.toggleVisibility(false);
    if (!row || at < 0) return;
    setTimeout(() => requestAnimationFrame(() => {
      const heads = Array.from(row.children) as HTMLElement[];
      for (const head of [heads[at], heads[at - 1], ...heads.slice(at + 1)]) {
        const target = head?.querySelector<HTMLElement>('[data-slot=table-sort], [data-slot=data-grid-column-menu], button');
        if (target) { target.focus(); return; }
      }
    }), 0);
  };
  const severity = meta?.severity;
  const icon = !sorted ? ChevronSort : sorted === 'asc' ? ArrowUp : ArrowDown;

  if (!column.getCanSort() && !column.getCanHide()) return <span className="truncate">{label}</span>;
  return <div ref={headRef} className={cn('group/head flex min-w-0 items-center gap-0.5', end && 'flex-row-reverse')}>
    {column.getCanSort()
      ? <button
          type="button"
          data-slot="table-sort"
          data-sorted={sorted || undefined}
          onClick={event => column.toggleSorting(undefined, event.shiftKey)}
          aria-label={`${label}, ${sortWords(column, sorted)}. Sort`}
          className={cn(
            'group/sort -mx-1.5 inline-flex h-(--control-sm) min-w-0 items-center gap-1 rounded-pill px-1.5 type-label-sm text-text-2',
            'transition-colors duration-(--dur-state) ease-out hover:bg-hover hover:text-text-1 data-sorted:text-text-1',
            end && 'flex-row-reverse',
          )}
        >
          <span className="truncate">{label}</span>
          <Icon icon={icon} size={12} className={cn('shrink-0', !sorted && 'text-text-3 opacity-0 group-hover/head:opacity-100 group-focus-within/head:opacity-100 pointer-coarse:opacity-100')}/>
        </button>
      : <span className="truncate">{label}</span>}
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="data-grid-column-menu"
        aria-label={`${label} column options`}
        render={<Button variant="ghost" size="icon-sm"/>}
        className={cn(
          'shrink-0 text-text-3 opacity-0 transition-opacity duration-(--dur-state) hover:text-text-1',
          'group-hover/head:opacity-100 group-focus-within/head:opacity-100 data-popup-open:opacity-100 data-popup-open:bg-pressed focus-visible:opacity-100 pointer-coarse:opacity-100',
          end ? 'me-1' : 'ms-1',
        )}
      ><Icon icon={More} size={12}/></DropdownMenuTrigger>
      <DropdownMenuContent size="sm" align={end ? 'end' : 'start'}>
        {column.getCanSort() && <>
          <DropdownMenuItem onClick={() => column.toggleSorting(!!severity)}>{severity ? 'Worst first' : 'Sort ascending'}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(!severity)}>{severity ? 'Best first' : 'Sort descending'}</DropdownMenuItem>
          {sorted && <DropdownMenuItem onClick={() => column.clearSorting()}>Clear sort</DropdownMenuItem>}
        </>}
        {column.getCanSort() && column.getCanHide() && <DropdownMenuSeparator/>}
        {column.getCanHide() && <DropdownMenuItem onClick={hide}>Hide column</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}

function DataGridColumnsMenu<TData>({table, className}: {table: TanTable<TData>; className?: string}) {
  const columns = table.getAllLeafColumns().filter(c => c.getCanHide());
  return <DropdownMenu>
    <DropdownMenuTrigger data-slot="data-grid-columns" render={<Button variant="secondary" size="sm"/>} className={className}>
      <Icon icon={Columns} size={12}/>Columns
    </DropdownMenuTrigger>
    <DropdownMenuContent size="sm" align="end">
      <DropdownMenuGroup>
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        {columns.map(column => <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()} onCheckedChange={value => column.toggleVisibility(value)} closeOnClick={false}>
          {columnLabel(column)}
        </DropdownMenuCheckboxItem>)}
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}

function ResizeHandle<TData>({header, table}: {header: Header<TData, unknown>; table: TanTable<TData>}) {
  const column = header.column;
  const min = column.columnDef.minSize ?? 60;
  const max = column.columnDef.maxSize ?? 800;
  const nudge = (by: number) => table.setColumnSizing(s => ({...s, [column.id]: Math.min(max, Math.max(min, column.getSize() + by))}));
  return <div
    role="separator"
    aria-orientation="vertical"
    aria-label={`Resize ${columnLabel(column)}`}
    aria-valuenow={Math.round(column.getSize())}
    aria-valuemin={min}
    aria-valuemax={max}
    tabIndex={0}
    data-slot="data-grid-resize"
    data-resizing={column.getIsResizing() || undefined}
    onMouseDown={header.getResizeHandler()}
    onTouchStart={header.getResizeHandler()}
    onDoubleClick={() => column.resetSize()}
    onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        nudge(((event.key === 'ArrowRight') !== rtl ? 1 : -1) * (event.shiftKey ? 64 : 16));
      }
      if (event.key === 'Enter') { event.preventDefault(); column.resetSize(); }
    }}
    className={cn(
      'absolute inset-y-0 -end-1 z-(--z-raised) w-2 cursor-col-resize touch-none select-none outline-none',
      'after:absolute after:inset-y-2 after:start-1/2 after:w-px after:bg-line after:opacity-0 after:transition-opacity after:duration-(--dur-state)',
      'group-hover/th:after:opacity-100 hover:after:bg-ink hover:after:opacity-100 focus-visible:after:bg-ink focus-visible:after:opacity-100 data-resizing:after:bg-ink data-resizing:after:opacity-100',
    )}
  />;
}

type DataGridProps<TData> = Omit<React.ComponentProps<'div'>, 'children' | 'aria-label' | 'title'> & {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  getRowId?: (row: TData, index: number) => string;
  'aria-label': string;
  frame?: TableFrame;
  title?: React.ReactNode;
  count?: React.ReactNode | false;
  actions?: React.ReactNode;
  toolbar?: (table: TanTable<TData>) => React.ReactNode;
  footer?: React.ReactNode;
  pageSize?: number;
  noun?: string;
  loading?: boolean;
  loadingRows?: number;
  empty?: React.ReactNode;
  maxHeight?: number | string;
  virtualizeFrom?: number;
  sorting?: SortingState;
  defaultSorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  columnVisibility?: VisibilityState;
  defaultColumnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  enableColumnResizing?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  rowName?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  activeRowId?: string;
  rowActions?: (row: TData) => React.ReactNode;
  rowIndicator?: (row: TData) => React.ReactNode;
  rowActionsWidth?: number;
};

function useControlled<T>(value: T | undefined, onChange: OnChangeFn<T> | undefined, initial: T) {
  const [inner, setInner] = React.useState<T>(initial);
  const current = value ?? inner;
  const set: OnChangeFn<T> = React.useCallback(updater => {
    if (value === undefined) setInner(updater);
    onChange?.(updater);
  }, [value, onChange]);
  return [current, set] as const;
}

const columnKey = <TData,>(c: ColumnDef<TData, any>) => c.id ?? (c as {accessorKey?: string}).accessorKey;

function DataGrid<TData>({
  columns: columnsProp, data, getRowId, 'aria-label': ariaLabel, frame = 'card', title, count, actions, toolbar, footer, pageSize, noun,
  loading = false, loadingRows = 5, empty = 'No rows', maxHeight, virtualizeFrom = 200,
  sorting: sortingProp, defaultSorting = [], onSortingChange, rowSelection: selectionProp, onRowSelectionChange, enableRowSelection = true,
  columnVisibility: visibilityProp, defaultColumnVisibility = {}, onColumnVisibilityChange, enableColumnResizing = true,
  pagination: paginationProp, onPaginationChange, rowName, onRowClick, activeRowId, rowActions, rowIndicator, rowActionsWidth = 72,
  className, ...props
}: DataGridProps<TData>) {
  const [sorting, setSorting] = useControlled<SortingState>(sortingProp, onSortingChange, defaultSorting);
  const [rowSelection, setRowSelection] = useControlled<RowSelectionState>(selectionProp, onRowSelectionChange, {});
  const [userVisibility, setUserVisibility] = useControlled<VisibilityState>(visibilityProp, onColumnVisibilityChange, defaultColumnVisibility);
  const [pagination, setPagination] = useControlled<PaginationState>(paginationProp, onPaginationChange, {pageIndex: 0, pageSize: pageSize ?? 50});
  const anchor = React.useRef<{id: string; value: boolean} | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [headWidths, setHeadWidths] = React.useState<Record<string, number>>({});
  const fitHead = React.useCallback((id: string, px: number) => setHeadWidths(w => (w[id] === px ? w : {...w, [id]: px})), []);

  const columns = React.useMemo(() => {
    const out: ColumnDef<TData, any>[] = columnsProp.map(c => {
      const meta = c.meta;
      const key = columnKey(c);
      const head = key ? headWidths[key] : undefined;
      if (!meta?.severity && !meta?.unit && head === undefined) return c;
      const next: ColumnDef<TData, any> = {...c};
      if (head !== undefined) next.minSize = Math.min(Math.max(c.minSize ?? 60, head), c.maxSize ?? 800);
      if (meta?.severity) { next.sortingFn = c.sortingFn ?? (severitySort as SortingFn<TData>); next.sortDescFirst = c.sortDescFirst ?? true; }
      if (meta?.unit) {
        next.meta = {numeric: true, ...meta};
        if (!c.cell) next.cell = ({row, column, table: t}) => {
          const value = (t.options.meta as GridMeta).units.get(column.id)?.get(row.index);
          return value === EMPTY_VALUE ? <span data-slot="data-grid-empty-value" className="type-body-sm text-text-2">{value}</span> : value ?? null;
        };
      }
      return next;
    });
    if (rowActions) out.push({
      id: 'actions', size: rowActionsWidth, minSize: rowActionsWidth, maxSize: rowActionsWidth,
      enableSorting: false, enableHiding: false, enableResizing: false,
      meta: {label: 'Actions'},
      header: () => <span className="sr-only">Actions</span>,
      cell: ({row}) => <TableRowActions indicator={rowIndicator?.(row.original)}>{rowActions(row.original)}</TableRowActions>,
    });
    return out;
  }, [columnsProp, rowActions, rowIndicator, rowActionsWidth, headWidths]);

  const units = React.useMemo(() => {
    const map = new Map<string, Map<number, string>>();
    for (const c of columns) {
      const key = (c as {accessorKey?: string}).accessorKey;
      if (!c.meta?.unit || !key) continue;
      const raw = data.map(row => (row as Record<string, unknown>)[key]);
      const present = raw.map(v => (v === null || v === undefined || v === '' ? NaN : Number(v)));
      const known = present.filter(Number.isFinite);
      const formatted = c.meta.unit === 'duration' ? formatDurations(known).values : formatCounts(known).values;
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
  const autoHidden = React.useMemo(() => boxWidth === null ? [] : columns.filter(c => c.meta?.hideBelow && boxWidth < c.meta.hideBelow).map(columnKey).filter((id): id is string => !!id), [columns, boxWidth]);
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

  const paged = pageSize !== undefined || paginationProp !== undefined;
  const table = useReactTable({
    data, columns, getRowId,
    state: {sorting, rowSelection, columnVisibility, ...(paged ? {pagination} : {})},
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    enableRowSelection, enableColumnResizing,
    columnResizeMode: 'onChange',
    enableMultiSort: true,
    sortDescFirst: false,
    isMultiSortEvent: event => (event as MouseEvent).shiftKey,
    autoResetPageIndex: true,
    defaultColumn: {size: 160, minSize: 60, maxSize: 800},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(paged ? {getPaginationRowModel: getPaginationRowModel()} : {}),
    meta: {anchor, units, fitHead, rowName: rowName ? (row: Row<unknown>) => rowName(row.original as TData) : undefined} satisfies GridMeta,
  });

  const rows = table.getRowModel().rows;
  const allRows = table.getPrePaginationRowModel().rows.length;
  const [rowHeight, setRowHeight] = React.useState(36);
  React.useLayoutEffect(() => setRowHeight(cssNumber(scrollRef.current, '--row', 36)), []);
  const phase = useLoadingPhase(loading, scrollRef);
  const placeholders = phase === 'shown' || (phase === 'wait' && rows.length === 0);
  const scrollTab = useScrollTabStop(scrollRef, !onRowClick);
  const virtual = !!maxHeight && rows.length >= virtualizeFrom;
  const virtualizer = useVirtualizer({count: virtual ? rows.length : 0, getScrollElement: () => scrollRef.current, estimateSize: () => rowHeight, overscan: 10});
  const items = virtual ? virtualizer.getVirtualItems() : [];
  const padTop = items.length ? items[0].start : 0;
  const padBottom = items.length ? virtualizer.getTotalSize() - items[items.length - 1].end : 0;
  const visible = virtual ? items.map(item => rows[item.index]) : rows;
  const indexOf = React.useMemo(() => new Map(rows.map((r, i) => [r.id, i])), [rows]);
  const leafCount = table.getVisibleLeafColumns().length;
  const selectedCount = Object.keys(rowSelection).length;

  const [focusIndex, setFocusIndex] = React.useState<number | null>(null);
  const activeIndex = activeRowId === undefined ? -1 : rows.findIndex(r => r.id === activeRowId);
  const tabRow = focusIndex ?? (activeIndex >= 0 ? activeIndex : 0);
  const focusRow = (index: number) => {
    const next = Math.max(0, Math.min(rows.length - 1, index));
    setFocusIndex(next);
    if (virtual) virtualizer.scrollToIndex(next, {align: 'auto'});
    requestAnimationFrame(() => scrollRef.current?.querySelector<HTMLElement>(`tr[data-index="${next}"]`)?.focus());
  };
  const onRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, index: number, row: TData) => {
    if (event.target !== event.currentTarget) return;
    const page = Math.max(1, Math.floor((scrollRef.current?.clientHeight ?? 360) / rowHeight) - 1);
    const moves: Record<string, number> = {ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: rows.length - 1, PageDown: index + page, PageUp: index - page};
    if (event.key in moves) { event.preventDefault(); focusRow(moves[event.key]); return; }
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) { event.preventDefault(); onRowClick?.(row); }
  };

  const sortWordsAll = sorting.map(s => {
    const column = table.getColumn(s.id);
    if (!column) return '';
    return `${columnLabel(column)} ${column.columnDef.meta?.severity ? (s.desc ? 'worst first' : 'best first') : s.desc ? 'descending' : 'ascending'}`;
  }).filter(Boolean).join(', then ');

  const {pageIndex, pageSize: size} = table.getState().pagination;
  const pageCount = table.getPageCount();
  const pageFooter = paged && !loading && allRows > 0 ? <>
    <PaginationInfo from={pageIndex * size + 1} to={Math.min(allRows, (pageIndex + 1) * size)} total={allRows} noun={noun}/>
    {pageCount > 1 && <PaginationNav size="sm" page={pageIndex + 1} pages={pageCount} className="flex-1 justify-end" onPageChange={(p, event) => { event.preventDefault(); table.setPageIndex(p - 1); }}/>}
  </> : undefined;
  const titleId = React.useId();

  return <TableFrameBox frame={frame} footer={footer ?? pageFooter} data-slot="data-grid" className={className} {...props}>
    {title != null && <TableTitle id={titleId} title={title} count={count === false || loading ? undefined : count ?? allRows.toLocaleString('en-US')} actions={actions}/>}
    {toolbar && <TableToolbar>{toolbar(table)}</TableToolbar>}
    <div
      ref={scrollRef}
      data-slot="table-container"
      data-sticky-header=""
      tabIndex={scrollTab}
      role={scrollTab === 0 ? 'region' : undefined}
      aria-label={scrollTab === 0 ? ariaLabel : undefined}
      className="group/table relative w-full min-w-0 overflow-auto overscroll-contain focus-visible:focus-ring-inset"
      style={maxHeight !== undefined ? {maxHeight} : undefined}
    >
      <table
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        aria-rowcount={loading ? undefined : allRows + 1}
        data-slot="table"
        className={cn(tableClassName, 'table-fixed')}
        style={{width: table.getTotalSize(), minWidth: '100%'}}
      >
        <colgroup>
          {table.getVisibleLeafColumns().map(column => <col key={column.id} style={{width: column.getSize()}}/>)}
        </colgroup>
        <thead data-slot="table-header">
          {table.getHeaderGroups().map(group => <tr key={group.id} aria-rowindex={1}>
            {group.headers.map(header => {
              const meta = header.column.columnDef.meta;
              const sorted = header.column.getIsSorted();
              const fixed = header.column.id === 'select' || header.column.id === 'actions';
              return <th
                key={header.id}
                scope="col"
                data-slot="table-head"
                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : header.column.getCanSort() ? 'none' : undefined}
                className={cn(headClassName, 'group/th relative', (meta?.numeric || meta?.severity) && 'text-end [&>*]:justify-end', fixed && 'px-0 text-center [&>*]:mx-auto', header.column.id === 'select' && 'ps-3 text-start [&>*]:mx-0')}
              >
                {header.isPlaceholder ? null : typeof header.column.columnDef.header === 'string' ? <DataGridColumnHeader header={header}/> : flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanResize() && <ResizeHandle header={header} table={table}/>}
              </th>;
            })}
          </tr>)}
        </thead>
        <tbody data-slot="table-body" className={bodyClassName}>
          {placeholders
            ? Array.from({length: loadingRows}, (_, r) => <tr key={r} aria-hidden data-slot="table-loading-row" className={cn(phase === 'wait' && 'invisible')}>
                {table.getVisibleLeafColumns().map((column, c) => <td key={column.id} className={cn(cellClassName, column.id === 'select' && 'ps-3')}>
                  <span className={cn('block h-2 rounded-pill bg-field', column.id === 'select' ? 'size-4 rounded-tag' : column.id === 'actions' ? 'hidden' : column.columnDef.meta?.numeric || column.columnDef.meta?.unit ? 'ms-auto w-1/3' : ['w-3/4', 'w-1/2', 'w-2/3'][(r + c) % 3])}/>
                </td>)}
              </tr>)
            : rows.length === 0 && !loading
              ? (typeof empty === 'string' ? <TableEmpty colSpan={leafCount} title={empty}/> : empty)
              : <>
                  {padTop > 0 && <tr aria-hidden><td colSpan={leafCount} className="p-0" style={{height: padTop}}/></tr>}
                  {visible.map(row => {
                    const index = indexOf.get(row.id) ?? 0;
                    const open = row.id === activeRowId;
                    return <tr
                      key={row.id}
                      data-slot="table-row"
                      data-index={index}
                      aria-rowindex={pageIndex * (paged ? size : 0) + index + 2}
                      data-selected={row.getIsSelected() || undefined}
                      data-open={open || undefined}
                      aria-current={open ? 'true' : undefined}
                      aria-selected={enableRowSelection ? row.getIsSelected() : undefined}
                      tabIndex={onRowClick ? (index === tabRow ? 0 : -1) : undefined}
                      onFocus={onRowClick ? () => setFocusIndex(index) : undefined}
                      onKeyDown={onRowClick ? event => onRowKeyDown(event, index, row.original) : undefined}
                      onClick={onRowClick ? event => { if (!(event.target as HTMLElement).closest('button, a, input, [role=checkbox], [role=separator]')) onRowClick(row.original); } : undefined}
                      className={cn(rowClassName, onRowClick && 'cursor-pointer focus-visible:focus-ring-row')}
                    >
                      {row.getVisibleCells().map(cell => {
                        const meta = cell.column.columnDef.meta;
                        return <td
                          key={cell.id}
                          data-slot="table-cell"
                          onPointerEnter={event => { const td = event.currentTarget; td.title = td.scrollWidth > td.clientWidth ? (td.textContent ?? '') : ''; }}
                          className={cn(
                            cellClassName, 'truncate',
                            (meta?.numeric || meta?.unit) && 'data text-end',
                            meta?.severity && 'text-end',
                            meta?.mono && 'type-code-sm',
                            cell.column.id === 'select' && 'ps-3',
                            cell.column.id === 'actions' && 'overflow-visible px-1.5',
                          )}
                        >{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>;
                      })}
                    </tr>;
                  })}
                  {padBottom > 0 && <tr aria-hidden><td colSpan={leafCount} className="p-0" style={{height: padBottom}}/></tr>}
                </>}
        </tbody>
      </table>
    </div>
    <p role="status" className="sr-only">
      {loading ? 'Loading rows' : `${allRows} rows${selectedCount ? `, ${selectedCount} selected` : ''}${sortWordsAll ? `, sorted by ${sortWordsAll}` : ''}${paged && pageCount > 1 ? `, page ${pageIndex + 1} of ${pageCount}` : ''}`}
    </p>
  </TableFrameBox>;
}

export {DataGrid, DataGridColumnHeader, DataGridColumnsMenu, selectColumn, severitySort, statusSeverity, type DataGridProps};
export type {ColumnDef, PaginationState, RowSelectionState, SortingState, VisibilityState} from '@tanstack/react-table';

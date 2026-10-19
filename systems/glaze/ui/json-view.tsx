'use client';

import {useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject} from 'react';
import {Icon, ChevronRight, Close, CollapseAll, ExpandAll, Search} from '../icon';
import {Button} from './button';
import {CopyCodeButton, TokenLine, tokenize} from './code-block';
import {cn} from '../lib/utils';

type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
type Row = {path: string; parent?: string; key?: string | number; value: unknown; type: JsonType; depth: number; size: number; last: boolean};

const typeOf = (v: unknown): JsonType =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v === 'object' ? 'object' : typeof v === 'string' ? 'string' : typeof v === 'number' || typeof v === 'bigint' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'null';

const stringify = (v: unknown, space?: number): string | undefined =>
  JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x), space);

function flatten(value: unknown): Row[] {
  const rows: Row[] = [];
  const walk = (v: unknown, segments: (string | number)[], depth: number, key: string | number | undefined, parent: string | undefined, last: boolean) => {
    const type = typeOf(v);
    const path = JSON.stringify(segments);
    const entries = type === 'object' ? Object.entries(v as object) : type === 'array' ? (v as unknown[]).map((x, i) => [i, x] as const) : [];
    rows.push({path, parent, key, value: v, type, depth, size: entries.length, last});
    entries.forEach(([k, x], i) => walk(x, [...segments, k], depth + 1, k, path, i === entries.length - 1));
  };
  walk(value, [], 0, undefined, undefined, true);
  return rows;
}
const ROOT = '[]';

function pathOf(row: Row, byPath: Map<string, Row>): string {
  const parts: string[] = [];
  for (let r: Row | undefined = row; r && r.key !== undefined; r = r.parent ? byPath.get(r.parent) : undefined) {
    parts.unshift(typeof r.key === 'number' ? `[${r.key}]` : /^[A-Za-z_$][\w$]*$/.test(r.key) ? `.${r.key}` : `[${JSON.stringify(r.key)}]`);
  }
  return '$' + parts.join('');
}

const FOLD_AT = 120;
const FOLD_TO = 80;

const isBranch = (row: Row) => (row.type === 'object' || row.type === 'array') && row.size > 0;
const literal = (row: Row) =>
  row.type === 'object' ? '{}' : row.type === 'array' ? '[]' : typeof row.value === 'bigint' ? row.value.toString() : (stringify(row.value) ?? 'null');

function findAll(text: string, q: string): [number, number][] {
  if (!q) return [];
  const out: [number, number][] = [];
  const hay = text.toLowerCase();
  let at = hay.indexOf(q);
  while (at >= 0) { out.push([at, at + q.length]); at = hay.indexOf(q, at + q.length); }
  return out;
}

function useScrollTabStop(ref: RefObject<HTMLElement | null>): 0 | undefined {
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    for (const child of el.children) resize.observe(child);
    measure();
    return () => resize.disconnect();
  }, [ref]);
  return scrolls ? 0 : undefined;
}

type JsonViewProps = Omit<React.ComponentProps<'div'>, 'children' | 'onCopy'> & {
  data: unknown;
  defaultExpandDepth?: number;
  toolbar?: boolean;
  copy?: boolean;
  label?: string;
  maxRows?: number;
  path?: boolean;
};

function JsonView({data, defaultExpandDepth = 2, toolbar = true, copy = true, label = 'JSON', maxRows = 16, path, className, ...props}: JsonViewProps) {
  const rows = useMemo(() => flatten(data), [data]);
  const byPath = useMemo(() => new Map(rows.map(r => [r.path, r])), [rows]);
  const [open, setOpen] = useState(() => new Set(rows.filter(r => isBranch(r) && r.depth < defaultExpandDepth).map(r => r.path)));
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(0);
  const [focused, setFocused] = useState(ROOT);
  const [unfolded, setUnfolded] = useState<ReadonlySet<string>>(() => new Set());
  const treeRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bodyTab = useScrollTabStop(bodyRef);
  const pressedFocused = useRef(false);
  const q = query.trim().toLowerCase();

  const {matches, keep, ancestors} = useMemo(() => {
    const matches: string[] = [];
    const keep = new Set<string>();
    const ancestors = new Set<string>();
    if (!q) return {matches, keep, ancestors};
    for (const row of rows) {
      const hit = (row.key !== undefined && String(row.key).toLowerCase().includes(q)) || (!isBranch(row) && literal(row).toLowerCase().includes(q));
      if (!hit) continue;
      matches.push(row.path);
      keep.add(row.path);
      for (let p = row.parent; p; p = byPath.get(p)?.parent) { keep.add(p); ancestors.add(p); }
    }
    return {matches, keep, ancestors};
  }, [q, rows, byPath]);

  const isOpen = (p: string) => (q ? ancestors.has(p) : open.has(p));

  const {visible, items} = useMemo(() => {
    const visible: Row[] = [];
    const items: {row: Row; close?: boolean}[] = [];
    const stack: Row[] = [];
    let closedDepth = Infinity;
    for (const row of rows) {
      if (row.depth > closedDepth) continue;
      closedDepth = Infinity;
      if (q && !keep.has(row.path)) continue;
      while (stack.length && stack[stack.length - 1].depth >= row.depth) items.push({row: stack.pop()!, close: true});
      visible.push(row);
      items.push({row});
      if (isBranch(row)) { if (isOpen(row.path)) stack.push(row); else closedDepth = row.depth; }
    }
    while (stack.length) items.push({row: stack.pop()!, close: true});
    return {visible, items};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, open, q, keep, ancestors]);

  const currentPath = matches.length ? matches[Math.min(current, matches.length - 1)] : undefined;
  const focusPath = visible.some(r => r.path === focused) ? focused : visible[0]?.path;

  const toggle = (p: string, to?: boolean) => setOpen(prev => {
    const next = new Set(prev);
    if (to ?? !next.has(p)) next.add(p); else next.delete(p);
    return next;
  });
  const moveTo = (p: string) => {
    setFocused(p);
    requestAnimationFrame(() => treeRef.current?.querySelector<HTMLElement>(`[data-path="${CSS.escape(p)}"]`)?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = visible.findIndex(r => r.path === focusPath);
    const row = visible[i];
    if (!row) return;
    const go = (j: number) => { const r = visible[Math.max(0, Math.min(visible.length - 1, j))]; if (r) moveTo(r.path); };
    switch (e.key) {
      case 'ArrowDown': go(i + 1); break;
      case 'ArrowUp': go(i - 1); break;
      case 'Home': go(0); break;
      case 'End': go(visible.length - 1); break;
      case 'ArrowRight':
        if (isBranch(row) && !isOpen(row.path)) toggle(row.path, true); else if (isBranch(row)) go(i + 1);
        break;
      case 'ArrowLeft':
        if (isBranch(row) && isOpen(row.path) && !q) toggle(row.path, false); else if (row.parent) moveTo(row.parent);
        break;
      case 'Enter': case ' ':
        if (e.repeat) break;
        if (isBranch(row) && !q) toggle(row.path);
        else if (row.type === 'string' && literal(row).length > FOLD_AT) setUnfolded(prev => { const next = new Set(prev); if (next.has(row.path)) next.delete(row.path); else next.add(row.path); return next; });
        break;
      default: return;
    }
    e.preventDefault();
  };

  const step = (by: number) => {
    if (!matches.length) return;
    const next = (current + by + matches.length) % matches.length;
    setCurrent(next);
    requestAnimationFrame(() => treeRef.current?.querySelector(`[data-path="${CSS.escape(matches[next])}"]`)?.scrollIntoView({block: 'nearest'}));
  };

  const text = useMemo(() => stringify(data, 2) ?? 'null', [data]);
  const focusRow = focusPath ? byPath.get(focusPath) : undefined;
  const focusJsonPath = focusRow ? pathOf(focusRow, byPath) : '$';
  const punct = 'text-text-2';

  return <div
    data-slot="json-view"
    className={cn('code-surface flex min-w-0 flex-col overflow-hidden rounded-overlay text-text-1 forced-colors:border forced-colors:border-[CanvasText]', className)}
    style={{'--json-rows': maxRows} as CSSProperties}
    {...props}
  >
    {(toolbar || copy) && <div data-slot="json-view-toolbar" className="flex min-h-(--control) shrink-0 items-center gap-1 border-b border-line-faint py-1 ps-1 pe-1">
      {toolbar && <label className="field min-w-0 flex-1 gap-1.5 px-2.5 [--field-h:var(--control-sm)]">
        <Icon icon={Search} size={12} className="text-text-3"/>
        <input
          ref={searchRef}
          type="search"
          data-control=""
          aria-label={`Search ${label}`}
          value={query}
          onChange={e => { setQuery(e.target.value); setCurrent(0); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
            if (e.key === 'Escape' && query) { e.preventDefault(); setQuery(''); }
          }}
          placeholder="Search keys and values"
          className="min-w-0 flex-1 bg-transparent type-label-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {q && <span aria-live="polite" className="shrink-0 type-caption text-text-2">{matches.length ? `${Math.min(current, matches.length - 1) + 1} of ${matches.length}` : 'No matches'}</span>}
        {query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); searchRef.current?.focus(); }} className="-me-1 flex size-5 shrink-0 items-center justify-center rounded-pill text-text-2 hover:bg-hover hover:text-text-1"><Icon icon={Close} size={12}/></button>}
      </label>}
      {!toolbar && <span className="min-w-0 flex-1 ps-2 type-caption text-text-2">{label}</span>}
      {toolbar && <>
        <Button variant="ghost" size="icon-sm" aria-label="Open all" disabled={!!q} onClick={() => setOpen(new Set(rows.filter(isBranch).map(r => r.path)))}><Icon icon={ExpandAll} size={12}/></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Close all" disabled={!!q} onClick={() => setOpen(new Set())}><Icon icon={CollapseAll} size={12}/></Button>
      </>}
      {copy && <CopyCodeButton text={text} label="Copy JSON"/>}
    </div>}
    <div
      ref={bodyRef}
      data-slot="json-view-body"
      dir="ltr"
      tabIndex={bodyTab}
      role={bodyTab === 0 ? 'region' : undefined}
      aria-label={bodyTab === 0 ? label : undefined}
      className="max-h-[calc(var(--json-rows)*var(--control-sm)+var(--space-4))] min-h-0 overflow-auto p-2 [container-type:inline-size] focus-visible:focus-ring-inset"
    >
      {q && !matches.length
        ? <p className="flex flex-wrap items-center gap-1.5 px-2 py-3 type-body-sm text-text-2">Nothing matches <code className="text-text-1">{query.trim()}</code></p>
        : <div ref={treeRef} role="tree" aria-label={label} onKeyDown={onKeyDown} className="w-max min-w-full type-code-block">
          {items.map(({row, close}) => {
            const indent = {'--depth': row.depth} as CSSProperties;
            if (close) return <div key={row.path + '/'} aria-hidden className={cn('flex h-(--control-sm) items-center whitespace-pre ps-[calc(var(--depth)*var(--space-4)+var(--space-6))]', punct)} style={indent}>{row.type === 'array' ? ']' : '}'}{!row.last && row.depth > 0 && ','}</div>;
            const branch = isBranch(row);
            const opened = branch && isOpen(row.path);
            const keyText = row.key === undefined ? '' : typeof row.key === 'number' ? String(row.key) : JSON.stringify(row.key);
            const keyMarks = q && row.key !== undefined ? findAll(keyText, q) : undefined;
            const valueText = branch ? '' : literal(row);
            const valueMarks = q && !branch ? findAll(valueText, q) : undefined;
            const isCurrent = row.path === currentPath;
            const folded = row.type === 'string' && valueText.length > FOLD_AT && !unfolded.has(row.path) && !q;
            return <div
              key={row.path}
              role="treeitem"
              data-path={row.path}
              data-current={isCurrent || undefined}
              aria-level={row.depth + 1}
              aria-expanded={branch ? opened : undefined}
              aria-selected={row.path === focusPath}
              tabIndex={row.path === focusPath ? 0 : -1}
              onFocus={() => setFocused(row.path)}
              onPointerDown={event => { pressedFocused.current = document.activeElement === event.currentTarget; }}
              onClick={event => {
                const onCaret = (event.target as HTMLElement).closest('[data-slot=json-view-caret]');
                if (branch && !q && (onCaret || (pressedFocused.current && row.depth > 0))) toggle(row.path);
                pressedFocused.current = false;
                setFocused(row.path);
              }}
              data-slot="json-view-row"
              className={cn(
                'flex h-(--control-sm) cursor-default items-center rounded-tag ps-[calc(var(--depth)*var(--space-4)+var(--space-1))] pe-2 whitespace-pre',
                'transition-[background-color] duration-(--dur-state) ease-out hover:bg-hover focus-visible:focus-ring-inset',
                folded && 'max-w-[calc(100cqw-var(--space-3))]',
                branch && !q && 'cursor-pointer',
                isCurrent && 'bg-pressed forced-colors:outline forced-colors:outline-1',
              )}
              style={indent}
            >
              <span aria-hidden data-slot="json-view-caret" className="relative inline-flex w-5 shrink-0 items-center justify-center self-stretch text-text-2">
                {branch && <Icon icon={ChevronRight} size={12} className={cn('transition-[rotate] duration-(--dur-state) ease-out', opened && 'rotate-90')}/>}
              </span>
              {row.key !== undefined && <>
                <span className={typeof row.key === 'number' ? 'text-text-2' : 'text-text-1'}><TokenLine tokens={[{type: 'key', value: keyText}]} marks={keyMarks} current={isCurrent ? 0 : undefined}/></span>
                <span className={punct}>: </span>
              </>}
              {branch
                ? <>
                  <span className={punct}>{row.type === 'array' ? '[' : '{'}</span>
                  {!opened && <>
                    <span className={punct}>…{row.type === 'array' ? ']' : '}'}{!row.last && row.depth > 0 && ','}</span>
                    <span className="ms-2 type-caption text-text-2">{row.size} {row.type === 'array' ? (row.size === 1 ? 'item' : 'items') : (row.size === 1 ? 'key' : 'keys')}</span>
                  </>}
                </>
                : <>
                  {folded
                    ? <>
                      <span className="min-w-0 truncate"><TokenLine tokens={tokenize(valueText.slice(0, FOLD_TO) + '…', 'json')[0]}/></span>
                      <button type="button" data-slot="json-view-unfold" tabIndex={-1} onClick={event => { event.stopPropagation(); setUnfolded(prev => new Set(prev).add(row.path)); }} className="ms-2 inline-flex h-5 shrink-0 items-center rounded-tag px-1 type-caption text-text-2 hover:bg-hover hover:text-text-1">+{(valueText.length - FOLD_TO).toLocaleString('en-US')} chars</button>
                    </>
                    : <TokenLine tokens={row.type === 'string' ? tokenize(valueText, 'json')[0] : [{type: row.type === 'boolean' || row.type === 'null' ? 'keyword' : row.type === 'object' || row.type === 'array' ? 'punct' : 'number', value: valueText}]} marks={valueMarks} current={isCurrent && !keyMarks?.length ? 0 : undefined}/>}
                  {!row.last && row.depth > 0 && <span className={punct}>,</span>}
                </>}
            </div>;
          })}
        </div>}
    </div>
    {(path ?? toolbar) && <div data-slot="json-view-path" className="flex min-h-(--control) shrink-0 items-center gap-2 border-t border-line-faint ps-3 pe-1">
      <span className="type-caption text-text-2">Path</span>
      <code dir="ltr" className="min-w-0 flex-1 truncate type-code-block text-text-1">{focusJsonPath}</code>
      <CopyCodeButton text={focusJsonPath} label="Copy path"/>
    </div>}
  </div>;
}

export {JsonView, pathOf, type JsonViewProps};

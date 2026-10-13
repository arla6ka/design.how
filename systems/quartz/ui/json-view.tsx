'use client';

import {useMemo, useRef, useState, type KeyboardEvent} from 'react';
import {Icon, CollapseAll, ExpandAll, ChevronRight, Search, Close} from '../icon';
import {CodeTag} from './badge';
import {Button} from './button';
import {CopyCodeButton, TokenLine, tokenize, type CodeRef} from './code-block';
import {CopyButton} from './copy-button';
import {useScrollTabStop} from '../lib/scroll-focus';
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

type JsonViewProps = Omit<React.ComponentProps<'div'>, 'children' | 'onCopy'> & {
  data: unknown;
  defaultExpandDepth?: number;
  toolbar?: boolean;
  copy?: boolean;
  label?: string;
  refs?: CodeRef[];
  maxHeight?: number;
  path?: boolean;
};

function JsonView({data, defaultExpandDepth = 2, toolbar = true, copy = true, label = 'JSON', refs, maxHeight = 420, path, className, ...props}: JsonViewProps) {
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

  const isOpen = (path: string) => (q ? ancestors.has(path) : open.has(path));

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
  }, [rows, open, q, keep, ancestors]);

  const currentPath = matches.length ? matches[Math.min(current, matches.length - 1)] : undefined;
  const focusPath = visible.some(r => r.path === focused) ? focused : visible[0]?.path;

  const toggle = (path: string, to?: boolean) => setOpen(prev => {
    const next = new Set(prev);
    if (to ?? !next.has(path)) next.add(path); else next.delete(path);
    return next;
  });
  const moveTo = (path: string) => {
    setFocused(path);
    requestAnimationFrame(() => treeRef.current?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`)?.focus());
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

  return <div data-slot="json-view" className={cn('frame flex min-w-0 flex-col bg-page text-text-1', className)} {...props}>
    {(toolbar || copy) && <div data-slot="json-view-toolbar" className="flex min-h-10 shrink-0 items-stretch rule-row">
      {toolbar && <label className="search-row min-w-32 flex-1">
        <Icon icon={Search} size={16}/>
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
          placeholder="Search"
          className="search-field"
        />
        {q && <span aria-live="polite" className="shrink-0 type-label-sm text-text-3">{matches.length ? `${Math.min(current, matches.length - 1) + 1} of ${matches.length}` : 'No matches'}</span>}
        {query && <Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => { setQuery(''); searchRef.current?.focus(); }} className="bg-transparent text-text-2 hover:text-text-1"><Icon icon={Close} size={16}/></Button>}
      </label>}
      <div data-slot="json-view-actions" className={cn('frame-head-action min-h-10 px-2', toolbar && 'rule-col')}>
        {toolbar && <>
          <Button variant="ghost" size="icon-xs" aria-label="Open all" disabled={!!q} onClick={() => setOpen(new Set(rows.filter(isBranch).map(r => r.path)))} className="bg-transparent"><Icon icon={ExpandAll} size={16}/></Button>
          <Button variant="ghost" size="icon-xs" aria-label="Close all" disabled={!!q} onClick={() => setOpen(new Set())} className="bg-transparent"><Icon icon={CollapseAll} size={16}/></Button>
        </>}
        {copy && <CopyCodeButton size="icon-xs" text={text} label="Copy JSON"/>}
      </div>
    </div>}
    <div ref={bodyRef} data-slot="json-view-body" dir="ltr" tabIndex={bodyTab} role={bodyTab === 0 ? 'region' : undefined} aria-label={bodyTab === 0 ? label : undefined} className="well min-h-0 overflow-auto p-2 text-(--code-text) [container-type:inline-size] [scrollbar-width:thin]" style={{maxHeight}}>
      {q && !matches.length
        ? <p className="flex flex-wrap items-center gap-1.5 px-2 py-4 type-body text-text-2">Nothing matches <CodeTag>{query.trim()}</CodeTag></p>
        : <div ref={treeRef} role="tree" aria-label={label} onKeyDown={onKeyDown} className="w-max min-w-full type-code">
          {items.map(({row, close}) => {
            if (close) return <div key={row.path + '/'} aria-hidden className="flex h-6 items-center whitespace-pre text-(--code-string)" style={{paddingLeft: row.depth * 16 + 24}}>{row.type === 'array' ? ']' : '}'}{!row.last && row.depth > 0 && ','}</div>;
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
                  'flex h-6 cursor-default items-center rounded-inner pr-2 whitespace-pre transition-colors duration-(--dur-fast) ease-(--ease-step) focus-visible:focus-ring-inset hover:bg-hover',
                  folded && 'max-w-[calc(100cqw-var(--space-3))]',
                  branch && !q && 'cursor-pointer',
                  isCurrent && 'bg-pressed forced-colors:outline forced-colors:outline-1',
                )}
                style={{paddingLeft: row.depth * 16 + 4}}
              >
                <span aria-hidden data-slot="json-view-caret" className="relative inline-flex w-5 shrink-0 items-center justify-center self-stretch text-text-3 after:absolute after:inset-y-0 after:-inset-x-0.5">
                  {branch && <Icon icon={ChevronRight} size={12} className={cn(opened && 'rotate-90')}/>}
                </span>
                {row.key !== undefined && <>
                  <span className={typeof row.key === 'number' ? 'text-(--code-comment)' : 'text-(--code-text)'}><TokenLine tokens={[{type: 'key', value: keyText}]} marks={keyMarks} current={isCurrent ? 0 : undefined}/></span>
                  <span className="text-(--code-string)">: </span>
                </>}
                {branch
                  ? <>
                    <span className="text-(--code-string)">{row.type === 'array' ? '[' : '{'}</span>
                    {!opened && <>
                      <span className="text-(--code-comment)">…{row.type === 'array' ? ']' : '}'}{!row.last && row.depth > 0 && ','}</span>
                      <span className="ml-2 type-label-sm text-text-3">{row.size} {row.type === 'array' ? (row.size === 1 ? 'item' : 'items') : (row.size === 1 ? 'key' : 'keys')}</span>
                    </>}
                  </>
                  : <>
                    {folded
                      ? <>
                          <span className="min-w-0 truncate"><TokenLine tokens={tokenize(valueText.slice(0, FOLD_TO) + '…', 'json', {refs})[0]}/></span>
                          <button type="button" data-slot="json-view-unfold" tabIndex={-1} onClick={event => { event.stopPropagation(); setUnfolded(prev => new Set(prev).add(row.path)); }} className="ms-2 inline-flex shrink-0 h-(--control-xs) items-center rounded-inner px-1 type-label-sm text-text-3 hover:bg-hover hover:text-text-1">+{(valueText.length - FOLD_TO).toLocaleString('en-US')} chars</button>
                        </>
                      : <TokenLine tokens={row.type === 'string' ? tokenize(valueText, 'json', {refs})[0] : [{type: row.type === 'boolean' || row.type === 'null' ? 'keyword' : row.type === 'object' || row.type === 'array' ? 'punct' : 'number', value: valueText}]} marks={valueMarks} current={isCurrent && !keyMarks?.length ? 0 : undefined}/>}
                    {!row.last && row.depth > 0 && <span className="text-(--code-string)">,</span>}
                  </>}
              </div>;
          })}
        </div>}
    </div>
    {(path ?? toolbar) && <div data-slot="json-view-path" className="flex h-(--row-sm) shrink-0 items-center gap-2 ps-4 pe-1 rule-top">
      <span className="type-label-sm text-text-3">Path</span>
      <code dir="ltr" className="min-w-0 flex-1 truncate type-tag text-text-1" title={focusJsonPath}>{focusJsonPath}</code>
      <CopyButton data-slot="json-view-copy-path" value={focusJsonPath} label="path" className="bg-transparent"/>
    </div>}
  </div>;
}

export {JsonView, pathOf, type JsonViewProps};

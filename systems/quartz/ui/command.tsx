'use client';

import * as React from 'react';
import {Dialog, DialogContent, DialogDescription, DialogTitle} from './dialog';
import {Icon, Search, CircleDash} from '../icon';
import {cn, mergeRefs} from '../lib/utils';
import {fadeClass, useScrollFade} from '../lib/overlay';
import {Empty, EmptyDescription, EmptyHeader, EmptyTitle} from './empty-state';
import {Kbd, KbdGroup} from './kbd';

type Filter = (value: string, search: string, keywords?: string[]) => number;

const words = (search: string) => search.toLowerCase().split(/\s+/).filter(Boolean);

const escapeRe = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function scoreWord(value: string, word: string, keywords: string[]) {
  const v = value.toLowerCase();
  const at = v.indexOf(word);
  if (at === 0) return 4;
  if (at > 0 && new RegExp(`(^|[\\s\\-_/.:])${escapeRe(word)}`).test(v)) return 3;
  if (at > 0) return 2;
  return keywords.some(k => k.toLowerCase().includes(word)) ? 1 : 0;
}

const defaultFilter: Filter = (value, search, keywords = []) => {
  let total = 0;
  for (const word of words(search)) {
    const score = scoreWord(value, word, keywords);
    if (!score) return 0;
    total += score;
  }
  return total;
};

function matchRanges(text: string, search: string): [number, number][] {
  const lower = text.toLowerCase();
  const ranges: [number, number][] = [];
  for (const word of words(search)) {
    const start = new RegExp(`(^|[\\s\\-_/.:])${escapeRe(word)}`).exec(lower);
    const at = start ? start.index + start[1].length : lower.indexOf(word);
    if (at >= 0) ranges.push([at, at + word.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

type CommandContextValue = {
  search: string;
  query: string;
  setSearch: (search: string) => void;
  active: string | null;
  setActive: (id: string | null) => void;
  matches: (value: string, keywords?: string[]) => boolean;
  rank: (value: string, keywords?: string[]) => number;
  count: number;
  listId: string;
  label: string;
  loading: boolean;
  setLoading: (loading: string | null) => void;
};

const CommandContext = React.createContext<CommandContextValue | null>(null);

function useCommand() {
  const context = React.useContext(CommandContext);
  if (!context) throw new Error('Command parts must be inside <Command>.');
  return context;
}

const ITEM = '[data-slot="command-item"]';

type CommandProps = Omit<React.ComponentProps<'div'>, 'onKeyDown'> & {
  label?: string;
  shouldFilter?: boolean;
  filter?: Filter;
  loop?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
};

function Command({className, label = 'Commands', shouldFilter = true, filter = defaultFilter, loop = false, onKeyDown, children, ref, ...props}: CommandProps) {
  const [search, setSearch] = React.useState('');
  const [active, setActive] = React.useState<string | null>(null);
  const [count, setCount] = React.useState(0);
  const [unavailable, setUnavailable] = React.useState(0);
  const [loadingText, setLoading] = React.useState<string | null>(null);
  const loading = loadingText !== null;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();
  const query = search.trim();

  const matches = React.useCallback(
    (value: string, keywords?: string[]) => !shouldFilter || !query || filter(value, query, keywords) > 0,
    [shouldFilter, query, filter],
  );
  const rank = React.useCallback(
    (value: string, keywords?: string[]) => (!shouldFilter || !query ? 0 : filter(value, query, keywords)),
    [shouldFilter, query, filter],
  );

  const ordered = () => {
    const root = rootRef.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(ITEM))
      .map((el, i) => ({el, i, r: Number(el.dataset.rank ?? 0)}))
      .sort((a, b) => b.r - a.r || a.i - b.i)
      .map(x => x.el);
  };
  const items = () => ordered().filter(el => el.getAttribute('aria-disabled') !== 'true');

  const lastQuery = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    const shown = ordered();
    shown.forEach((el, i) => { el.setAttribute('aria-posinset', String(i + 1)); el.setAttribute('aria-setsize', String(shown.length)); });
    const visible = shown.filter(el => el.getAttribute('aria-disabled') !== 'true');
    if (shown.length !== count) setCount(shown.length);
    if (shown.length - visible.length !== unavailable) setUnavailable(shown.length - visible.length);
    const queryChanged = lastQuery.current !== query;
    lastQuery.current = query;
    if (queryChanged || !visible.some(el => el.id === active)) {
      const first = visible[0]?.id ?? null;
      if (first !== active) setActive(first);
      rootRef.current?.querySelector('[data-slot="command-list"]')?.scrollTo({top: 0});
    }
  });

  const move = (to: (index: number, length: number) => number) => {
    const visible = items();
    if (!visible.length) return;
    const index = visible.findIndex(el => el.id === active);
    const next = visible[to(index, visible.length)];
    if (!next) return;
    setActive(next.id);
    next.scrollIntoView({block: 'nearest'});
  };

  const jumps = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const field = event.target instanceof HTMLInputElement ? event.target : null;
    return !field || !field.value || event.ctrlKey || event.metaKey;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const down = event.key === 'ArrowDown' || (event.ctrlKey && event.key === 'n');
    const up = event.key === 'ArrowUp' || (event.ctrlKey && event.key === 'p');
    if (down) { event.preventDefault(); move((i, n) => i < 0 ? 0 : i + 1 < n ? i + 1 : loop ? 0 : i); }
    else if (up) { event.preventDefault(); move((i, n) => i <= 0 ? (loop ? n - 1 : 0) : i - 1); }
    else if ((event.key === 'Home' || event.key === 'End') && jumps(event)) { event.preventDefault(); move((_, n) => event.key === 'Home' ? 0 : n - 1); }
    else if (event.key === 'Enter') {
      const el = active ? document.getElementById(active) : null;
      if (el && el.getAttribute('aria-disabled') !== 'true') { event.preventDefault(); el.click(); }
    }
  };

  const value = React.useMemo<CommandContextValue>(
    () => ({search, query, setSearch, active, setActive, matches, rank, count, listId, label, loading, setLoading}),
    [search, query, active, matches, rank, count, listId, label, loading],
  );
  const rootSetRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const results = count === 1 ? '1 result' : `${count} results`;
  const status = loading ? loadingText : !query ? '' : unavailable === 0 ? results : unavailable === count ? `${results}, unavailable` : `${results}, ${unavailable} unavailable`;

  return <CommandContext.Provider value={value}>
    <div
      ref={rootSetRef}
      data-slot="command"
      className={cn('relative flex size-full flex-col overflow-hidden rounded-frame bg-page text-text-1 not-in-data-[slot=dialog-content]:frame', className)}
      data-searching={query ? '' : undefined}
      {...props}
      onKeyDown={handleKeyDown}
    >
      {children}
      <p role="status" className="sr-only">{status}</p>
    </div>
  </CommandContext.Provider>;
}

type CommandDialogProps = Omit<React.ComponentProps<typeof Dialog>, 'children'> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function CommandDialog({title = 'Command palette', description = 'Search for a command to run', children, className, ...props}: CommandDialogProps) {
  return <Dialog {...props}>
    <DialogContent
      data-slot="command-dialog"
      size="lg"
      showCloseButton={false}
      className={cn('top-[20dvh] max-h-[min(calc(var(--spacing)*120),calc(80dvh-var(--space-8)))] translate-y-0 gap-0 overflow-hidden bg-page p-0', className)}
    >
      {title !== null && <DialogTitle className="sr-only">{title}</DialogTitle>}
      {description !== null && <DialogDescription className="sr-only">{description}</DialogDescription>}
      {children}
    </DialogContent>
  </Dialog>;
}

type CommandInputProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> & {
  value?: string;
  onValueChange?: (value: string) => void;
};

function CommandInput({className, value, onValueChange, placeholder = 'Search commands', ...props}: CommandInputProps) {
  const {search, setSearch, active, listId, label, loading} = useCommand();
  React.useEffect(() => { if (value !== undefined && value !== search) setSearch(value); }, [value, search, setSearch]);
  return <div data-slot="command-input-wrapper" className="search-row rule-row">
    {loading
      ? <Icon icon={CircleDash} size={16} className="animate-spin motion-reduce:animate-none"/>
      : <Icon icon={Search} size={16}/>}
    <input
      data-slot="command-input"
      data-control=""
      role="combobox"
      aria-expanded
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={active ?? undefined}
      aria-label={label}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder={placeholder}
      value={value ?? search}
      onChange={event => { setSearch(event.target.value); onValueChange?.(event.target.value); }}
      className={cn('search-field text-ellipsis', className)}
      {...props}
    />
  </div>;
}

function CommandList({className, ref, ...props}: Omit<React.ComponentProps<'div'>, 'id'>) {
  const {listId, label, count, loading} = useCommand();
  const fade = useScrollFade<HTMLDivElement>();
  const setRef = React.useMemo(() => mergeRefs(fade, ref), [fade, ref]);
  return <div
    ref={setRef}
    id={listId}
    data-slot="command-list"
    tabIndex={-1}
    role="listbox"
    aria-label={label}
    aria-busy={loading || undefined}
    data-empty={count === 0 || undefined}
    className={cn('flex max-h-(--popup-max) min-h-0 flex-1 flex-col scroll-py-1 overflow-x-hidden overflow-y-auto overscroll-contain p-1', fadeClass, className)}
    {...props}
  />;
}

function CommandEmpty({className, children = 'No results', ...props}: React.ComponentProps<'div'>) {
  const {count, loading, query} = useCommand();
  if (count > 0 || loading) return null;
  return <Empty data-slot="command-empty" role="presentation" variant="plain" size="sm" className={className} {...props}>
    <EmptyHeader>
      <EmptyTitle role="presentation">{children}</EmptyTitle>
      {query && <EmptyDescription role="presentation">Nothing matches "{query}".</EmptyDescription>}
    </EmptyHeader>
  </Empty>;
}

function CommandLoading({className, children = 'Loading', ...props}: React.ComponentProps<'div'>) {
  const {setLoading} = useCommand();
  const said = typeof children === 'string' ? children : 'Loading';
  React.useLayoutEffect(() => { setLoading(said); return () => setLoading(null); }, [said, setLoading]);
  return <div data-slot="command-loading" aria-hidden className={cn('flex items-center gap-2 px-2 py-3 type-body text-text-3', className)} {...props}>
    {children}
  </div>;
}

function CommandGroup({className, heading, children, ...props}: React.ComponentProps<'div'> & {heading?: React.ReactNode}) {
  const headingId = React.useId();
  return <div
    data-slot="command-group"
    role="presentation"
    className={cn('pt-1 [&:not(:has([data-slot=command-item]))]:hidden in-data-searching:[&:has([data-slot=command-item])]:contents', className)}
    {...props}
  >
    {heading && <div id={headingId} aria-hidden data-slot="command-group-heading" className="menu-label in-data-searching:hidden">{heading}</div>}
    <div role="group" aria-labelledby={heading ? headingId : undefined} className="flex flex-col in-data-searching:contents">{children}</div>
  </div>;
}

function CommandSeparator({className, alwaysRender, ...props}: React.ComponentProps<'div'> & {alwaysRender?: boolean}) {
  const {query} = useCommand();
  if (query && !alwaysRender) return null;
  return <div data-slot="command-separator" aria-hidden className={cn('menu-separator', className)} {...props}/>;
}

type CommandItemProps = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  value?: string;
  keywords?: string[];
  onSelect?: (value: string) => void;
  disabled?: boolean;
  forceMount?: boolean;
};

function CommandItem({className, value: valueProp, keywords, onSelect, disabled, forceMount, children, ...props}: CommandItemProps) {
  const {active, setActive, matches, rank} = useCommand();
  const id = React.useId();
  const value = valueProp ?? (typeof children === 'string' ? children : '');
  if (!forceMount && !matches(value, keywords)) return null;
  const selected = active === id;
  const score = rank(value, keywords);
  return <div
    id={id}
    data-slot="command-item"
    role="option"
    aria-selected={selected}
    aria-disabled={disabled || undefined}
    data-selected={selected || undefined}
    data-highlighted={selected || undefined}
    data-disabled={disabled || undefined}
    data-value={value}
    data-rank={score || undefined}
    style={score ? {order: -score} : undefined}
    onPointerMove={() => { if (!disabled && !selected) setActive(id); }}
    onClick={() => { if (!disabled) onSelect?.(value); }}
    className={cn(
      'group/command-item menu-item scroll-my-1',
      className,
    )}
    {...props}
  >{typeof children === 'string' ? <CommandLabel>{children}</CommandLabel> : children}</div>;
}

function CommandLabel({children, className}: {children: string; className?: string}) {
  const {query} = useCommand();
  const ranges = query ? matchRanges(children, query) : [];
  const parts: React.ReactNode[] = [];
  let at = 0;
  ranges.forEach(([from, to], i) => {
    if (from > at) parts.push(children.slice(at, from));
    parts.push(<mark key={i} className="bg-transparent text-text-1 underline decoration-1 underline-offset-2 forced-colors:text-[inherit]">{children.slice(from, to)}</mark>);
    at = to;
  });
  if (at < children.length) parts.push(children.slice(at));
  return <span data-slot="command-label" className={cn('min-w-0 truncate in-data-searching:text-text-2', className)}>{parts}</span>;
}

function CommandShortcut({className, keys, children, ...props}: React.ComponentProps<'kbd'> & {keys?: string[]}) {
  return <KbdGroup data-slot="command-shortcut" className={cn('ms-auto', className)} {...props}>
    {keys ? keys.map((key, i) => <Kbd key={i}>{key}</Kbd>) : children}
  </KbdGroup>;
}

function CommandFooter({className, children, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="command-footer" className={cn('frame-foot shrink-0 flex-wrap gap-x-4 gap-y-1 bg-page type-body-sm text-text-3 rule-top', className)} {...props}>
    {children}
  </div>;
}

function CommandHint({keys, children}: {keys: string[]; children: React.ReactNode}) {
  return <span data-slot="command-hint" className="inline-flex items-center gap-2">
    <KbdGroup>{keys.map((key, i) => <Kbd key={i}>{key}</Kbd>)}</KbdGroup>
    {children}
  </span>;
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandLoading,
  CommandGroup,
  CommandItem,
  CommandLabel,
  CommandShortcut,
  CommandSeparator,
  CommandFooter,
  CommandHint,
  useCommand,
};

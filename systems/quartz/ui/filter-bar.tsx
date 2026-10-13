'use client';

import * as React from 'react';
import {Menu as MenuPrimitive} from '@base-ui/react/menu';
import {Icon, Add, Checkmark} from '../icon';
import type {Kind} from '../lib/kind';
import {useQuartzPortal} from '../lib/portal';
import {overlayMotion, overlaySurface} from '../lib/overlay';
import {cn} from '../lib/utils';
import {Chip, ChipButton, ChipGroupContext, type ChipProps} from './chip';
import {Input, type SearchModeProps} from './input';

const stripClassName = 'flex min-w-0 flex-1 flex-wrap items-center gap-2';

const inStrip = (child: React.ReactNode) => React.isValidElement(child) && (child.type === FilterBarSearch || child.type === FilterBarSelect || child.type === FilterToggle);

function FilterBar({className, children, ...props}: React.ComponentProps<'div'>) {
  const strip: React.ReactNode[] = [];
  const rest: React.ReactNode[] = [];
  React.Children.forEach(children, child => { (inStrip(child) ? strip : rest).push(child); });
  return <div
    role="search"
    data-slot="filter-bar"
    className={cn(
      '@container flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 in-data-[slot=table-toolbar]:px-2 in-data-[slot=table-toolbar]:py-1.5',
      '[&>[data-slot=filter-bar-count]]:ms-auto @max-lg:[&>[data-slot=filter-bar-count]]:hidden',
      className,
    )}
    {...props}
  >
    {strip.length > 0 && <ChipGroupContext.Provider value="wrap">
      <div data-slot="filter-bar-strip" className={stripClassName}>{strip}</div>
    </ChipGroupContext.Provider>}
    {rest}
  </div>;
}

type FilterBarSearchProps = Omit<SearchModeProps, 'mode' | 'value' | 'defaultValue' | 'onValueChange' | 'shortcut' | 'shortcutOwner'> & {
  value: string;
  onValueChange: (value: string) => void;
  shortcut?: string | null;
};

function FilterBarSearch({shortcut = '/', placeholder = 'Search', size = 'sm', className, 'aria-label': ariaLabel, ...props}: FilterBarSearchProps) {
  return <Input
    mode="search"
    size={size}
    shortcut={shortcut ?? undefined}
    placeholder={placeholder}
    aria-label={ariaLabel ?? placeholder}
    aria-keyshortcuts={shortcut ?? undefined}
    className={cn('min-w-(--search-min) flex-1 max-w-(--search-max)', className)}
    {...props}
  />;
}

function FilterBarChips({row, className, ...props}: React.ComponentProps<'div'> & {row?: boolean}) {
  return <div data-slot="chip-group" className={cn('flex min-w-0 flex-wrap items-center gap-1', row && 'min-h-(--row) px-2 py-2', className)} {...props}/>;
}

type FilterChipProps = Omit<React.ComponentProps<'span'>, 'children' | 'onChange'> & {
  label: string;
  value: React.ReactNode;
  kind?: Kind;
  onRemove: () => void;
};

function FilterChip({label, value, kind, onRemove, ...props}: FilterChipProps) {
  const remove = () => {
    let select: HTMLElement | null = null;
    for (let scope = (document.activeElement as HTMLElement | null)?.parentElement; scope && !select; scope = scope.parentElement) {
      select = scope.querySelector<HTMLElement>(`[data-slot=filter-bar-select][data-filter="${CSS.escape(label)}"]`);
    }
    onRemove();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      if (select?.isConnected) select.focus();
    }));
  };
  return <Chip onRemove={remove} removeLabel={`Remove ${label} filter`} kind={kind} data-filter={label} {...(props as object)}>
    <span className="text-text-2">{label}</span> {value}
  </Chip>;
}

function FilterToggle(props: Extract<ChipProps, {onRemove?: undefined}>) {
  return <Chip data-filter-toggle="" {...props}/>;
}

function FilterBarClear({className, children = 'Clear all', onClick, ...props}: React.ComponentProps<'button'>) {
  return <button
    type="button"
    data-slot="filter-bar-clear"
    onClick={event => {
      const bar = event.currentTarget.closest('[data-slot=filter-bar]');
      onClick?.(event);
      requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        bar?.querySelector<HTMLElement>('[data-mode=search] [data-control], [data-slot=filter-bar-select]')?.focus();
      });
    }}
    className={cn('inline-flex h-(--control-sm) items-center rounded-soft px-2 type-label text-text-2 underline-offset-4 decoration-1 transition-colors duration-(--dur-fast) ease-(--ease-step) hover:text-text-1 hover:underline', className)}
    {...props}
  >{children}</button>;
}

function FilterBarCount({shown, total, noun, className, ...props}: React.ComponentProps<'div'> & {shown: number; total: number; noun?: string}) {
  const f = (n: number) => n.toLocaleString('en-US');
  const text = shown === total ? `${f(total)}${noun ? ` ${noun}` : ''}` : `${f(shown)} of ${f(total)}${noun ? ` ${noun}` : ''}`;
  const [said, setSaid] = React.useState(text);
  React.useEffect(() => {
    const id = window.setTimeout(() => setSaid(text), 500);
    return () => window.clearTimeout(id);
  }, [text]);
  return <div data-slot="filter-bar-count" className={cn('type-body-sm whitespace-nowrap text-text-3 data [unicode-bidi:plaintext]', className)} {...props}>
    <span aria-hidden>{shown === total ? <><span className="text-text-1">{f(total)}</span> {noun}</> : <><span className="text-text-1">{f(shown)}</span> of {f(total)}{noun ? ` ${noun}` : ''}</>}</span>
    <span role="status" className="sr-only">{said}</span>
  </div>;
}

type FilterOption = {
  value: string;
  label: React.ReactNode;
  textValue?: string;
  count?: number;
  kind?: Kind;
  status?: 'idle' | 'queued' | 'running' | 'ok' | 'warn' | 'fail' | 'waiting';
  disabled?: boolean;
};

type FilterBarSelectBase = {
  label: string;
  options: FilterOption[];
  showAllOption?: boolean;
  allLabel?: string;
  sinkEmpty?: boolean;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'default';
  disabled?: boolean;
  className?: string;
};
type FilterBarSelectSingle = FilterBarSelectBase & {multiple?: false; value?: string | null; defaultValue?: string | null; onValueChange?: (value: string | null) => void};
type FilterBarSelectMultiple = FilterBarSelectBase & {multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void};
type FilterBarSelectProps = FilterBarSelectSingle | FilterBarSelectMultiple;

const ALL = '__all__';
const optionText = (o: FilterOption) => o.textValue ?? (typeof o.label === 'string' ? o.label : o.value);

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = React.useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const set = (v: T) => { if (!controlled) setInner(v); onChange?.(v); };
  return [current, set] as const;
}

const popupClassName = cn('menu-popup max-h-[min(var(--available-height),var(--popup-max))]', overlaySurface, overlayMotion);
const itemClassName = 'menu-item pe-8 data-[empty]:text-text-3';
const indicatorClassName = 'pointer-events-none absolute end-2 flex size-4 items-center justify-center';
function OptionBody({option}: {option: FilterOption}) {
  return <>
    <span className="min-w-0 flex-1 truncate">{option.label}</span>
    {option.count !== undefined && <span data-slot="filter-option-count" className="type-label-sm data text-text-3">{option.count.toLocaleString('en-US')}</span>}
  </>;
}

function FilterBarSelect(props: FilterBarSelectProps) {
  const {label, options, showAllOption = false, allLabel = 'All', size = 'default', disabled, className, showValue = true} = props;
  const container = useQuartzPortal();
  const [single, setSingle] = useControllable<string | null>(props.multiple ? undefined : props.value, props.multiple ? null : props.defaultValue ?? null, props.multiple ? undefined : props.onValueChange);
  const [many, setMany] = useControllable<string[]>(props.multiple ? props.value : undefined, props.multiple ? props.defaultValue ?? [] : [], props.multiple ? props.onValueChange : undefined);

  const chosen = props.multiple ? many : single ? [single] : [];
  const active = chosen.length > 0;
  const first = options.find(o => o.value === chosen[0]);
  const summary = !active || !showValue ? null : chosen.length > 1 ? null : first ? optionText(first) : null;
  const accessibleName = `${label}: ${!active ? allLabel : options.filter(o => chosen.includes(o.value)).map(optionText).join(', ')}`;

  const sink = props.sinkEmpty ?? options.some(o => o.count !== undefined);
  const live = sink ? options.filter(o => o.count !== 0 || chosen.includes(o.value)) : options;
  const empty = sink ? options.filter(o => o.count === 0 && !chosen.includes(o.value)) : [];

  const renderItem = (o: FilterOption, isEmpty = false) => props.multiple
    ? <MenuPrimitive.CheckboxItem
        key={o.value}
        data-slot="filter-option"
        data-empty={isEmpty || undefined}
        disabled={o.disabled || isEmpty}
        className={itemClassName}
        checked={many.includes(o.value)}
        onCheckedChange={c => setMany(c ? [...many, o.value] : many.filter(v => v !== o.value))}
        closeOnClick={false}
      >
        <OptionBody option={o}/>
        <MenuPrimitive.CheckboxItemIndicator className={indicatorClassName}><Icon icon={Checkmark} size={16}/></MenuPrimitive.CheckboxItemIndicator>
      </MenuPrimitive.CheckboxItem>
    : <MenuPrimitive.RadioItem key={o.value} value={o.value} closeOnClick disabled={o.disabled || isEmpty} data-slot="filter-option" data-empty={isEmpty || undefined} className={itemClassName}>
        <OptionBody option={o}/>
        <MenuPrimitive.RadioItemIndicator className={indicatorClassName}><Icon icon={Checkmark} size={16}/></MenuPrimitive.RadioItemIndicator>
      </MenuPrimitive.RadioItem>;

  const sunkBody = <>
    <MenuPrimitive.GroupLabel className="menu-label">No rows with the other filters</MenuPrimitive.GroupLabel>
    {empty.map(o => renderItem(o, true))}
  </>;
  const sunk = empty.length > 0 && <>
    <MenuPrimitive.Separator className="menu-separator"/>
    {props.multiple ? <MenuPrimitive.Group>{sunkBody}</MenuPrimitive.Group> : sunkBody}
  </>;

  return <MenuPrimitive.Root>
    <MenuPrimitive.Trigger
      disabled={disabled}
      aria-label={accessibleName}
      render={<ChipButton chevron size={size} count={showValue && props.multiple && chosen.length > 1 ? chosen.length : undefined}/>}
      data-slot="filter-bar-select"
      data-filter={label}
      data-active={active || undefined}
      className={className}
    >
      {summary != null ? `${label}: ${summary}` : label}
    </MenuPrimitive.Trigger>
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Positioner sideOffset={4} align="start" collisionPadding={8} className="isolate z-(--z-overlay) outline-none">
        <MenuPrimitive.Popup data-slot="filter-bar-select-content" className={cn(popupClassName, 'min-w-[max(var(--anchor-width),var(--menu-min))] max-w-[min(var(--available-width),var(--popover))]')}>
          {props.multiple
            ? <>
                {showAllOption && <>
                  <MenuPrimitive.CheckboxItem className={itemClassName} checked={!active} onCheckedChange={() => setMany([])} closeOnClick={false}>
                    {allLabel}
                    <MenuPrimitive.CheckboxItemIndicator className={indicatorClassName}><Icon icon={Checkmark} size={16}/></MenuPrimitive.CheckboxItemIndicator>
                  </MenuPrimitive.CheckboxItem>
                  <MenuPrimitive.Separator className="menu-separator"/>
                </>}
                {live.map(o => renderItem(o))}
                {sunk}
              </>
            : <MenuPrimitive.RadioGroup value={single ?? ALL} onValueChange={v => setSingle(v === ALL ? null : v as string)}>
                {showAllOption && <>
                  <MenuPrimitive.RadioItem value={ALL} closeOnClick className={itemClassName}>
                    {allLabel}
                    <MenuPrimitive.RadioItemIndicator className={indicatorClassName}><Icon icon={Checkmark} size={16}/></MenuPrimitive.RadioItemIndicator>
                  </MenuPrimitive.RadioItem>
                  <MenuPrimitive.Separator className="menu-separator"/>
                </>}
                {live.map(o => renderItem(o))}
                {sunk}
              </MenuPrimitive.RadioGroup>}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  </MenuPrimitive.Root>;
}

type FilterBarAddProps = {
  label: string;
  options: FilterOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  size?: 'xs' | 'sm' | 'default';
  disabled?: boolean;
  className?: string;
};

function FilterBarAdd({label, options, size = 'default', disabled, className, ...props}: FilterBarAddProps) {
  const container = useQuartzPortal();
  const [value, setValue] = useControllable<string | null>(props.value, props.defaultValue ?? null, props.onValueChange);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const chosen = options.find(o => o.value === value);
  if (chosen) return <Chip
    size={size}
    data-slot="filter-bar-add-value"
    data-filter={label}
    onRemove={() => setValue(null)}
    removeLabel={`Remove ${label} filter`}
    focusAfterEmpty={trigger}
    className={className}
  ><span className="text-text-2">{label}:</span> {optionText(chosen)}</Chip>;
  return <MenuPrimitive.Root>
    <MenuPrimitive.Trigger
      ref={trigger}
      disabled={disabled}
      aria-label={`Add ${label} filter`}
      render={<ChipButton size={size}/>}
      data-slot="filter-bar-add"
      data-filter={label}
      className={cn('bg-transparent shadow-none text-text-2 hover:not-data-disabled:text-text-1 before:border-dashed [--frame-color:var(--line-control-hover)]', className)}
    >
      <Icon icon={Add} size={12} data-slot="chip-icon"/>
      {label}
    </MenuPrimitive.Trigger>
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Positioner sideOffset={4} align="start" collisionPadding={8} className="isolate z-(--z-overlay) outline-none">
        <MenuPrimitive.Popup data-slot="filter-bar-add-content" className={cn(popupClassName, 'min-w-[max(var(--anchor-width),var(--menu-min))] max-w-[min(var(--available-width),var(--popover))]')}>
          <MenuPrimitive.RadioGroup value={value ?? ''} onValueChange={v => setValue(v as string)}>
            {options.map(o => <MenuPrimitive.RadioItem key={o.value} value={o.value} closeOnClick disabled={o.disabled} data-slot="filter-option" className={itemClassName}>
              <OptionBody option={o}/>
              <MenuPrimitive.RadioItemIndicator className={indicatorClassName}><Icon icon={Checkmark} size={16}/></MenuPrimitive.RadioItemIndicator>
            </MenuPrimitive.RadioItem>)}
          </MenuPrimitive.RadioGroup>
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  </MenuPrimitive.Root>;
}

type FacetField<T> = {
  id: string;
  value: (row: T) => string | readonly string[];
};

function useFilteredRows<T>(rows: readonly T[], {search = '', match, fields, filters, where}: {
  search?: string;
  where?: readonly (((row: T) => boolean) | false | null | undefined)[];
  match?: (row: T, query: string) => boolean;
  fields: FacetField<T>[];
  filters: Record<string, readonly string[] | null | undefined>;
}) {
  return React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const values = (f: FacetField<T>, row: T) => { const v = f.value(row); return typeof v === 'string' ? [v] : v; };
    const passes = (f: FacetField<T>, row: T) => { const chosen = filters[f.id]; return !chosen?.length || values(f, row).some(v => chosen.includes(v)); };
    const counts: Record<string, Record<string, number>> = Object.fromEntries(fields.map(f => [f.id, {}]));
    const out: T[] = [];
    const tests = (where ?? []).filter((t): t is (row: T) => boolean => typeof t === 'function');
    for (const row of rows) {
      if (q && match && !match(row, q)) continue;
      if (!tests.every(t => t(row))) continue;
      const pass = fields.map(f => passes(f, row));
      if (pass.every(Boolean)) out.push(row);
      fields.forEach((f, i) => {
        if (!pass.every((p, j) => j === i || p)) return;
        for (const v of values(f, row)) counts[f.id][v] = (counts[f.id][v] ?? 0) + 1;
      });
    }
    return {rows: out, counts};
  }, [rows, search, match, fields, filters, where]);
}

export {
  FilterBar, FilterBarSearch, FilterBarChips, FilterChip, FilterToggle, FilterBarSelect, FilterBarAdd, FilterBarClear, FilterBarCount, useFilteredRows,
  type FilterBarSearchProps, type FilterBarAddProps, type FilterBarSelectProps, type FilterChipProps, type FilterOption, type FacetField,
};

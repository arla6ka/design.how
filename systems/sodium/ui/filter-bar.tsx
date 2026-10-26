'use client';

import * as React from 'react';
import {Menu as MenuPrimitive} from '@base-ui/react/menu';
import {Toggle as TogglePrimitive} from '@base-ui/react/toggle';
import {Icon, Checkmark, ChevronDown} from '../icon';
import {menuLabelClass, menuPopupClass, menuSeparatorClass, optionCheckClass, optionItemClass} from '../lib/overlay';
import {useSodiumPortal} from '../lib/portal';
import {cn, controlHeight} from '../lib/utils';
import {Button} from './button';
import {Input, type SearchModeProps} from './input';

function FilterBar({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    role="search"
    data-slot="filter-bar"
    className={cn(
      '@container flex w-full min-w-0 flex-wrap items-center gap-2',
      '[&>[data-slot=filter-bar-count]]:ms-auto [&>[data-slot=filter-bar-clear]]:ms-auto [&>[data-slot=filter-bar-count]~[data-slot=filter-bar-clear]]:ms-0',
      '@max-2xs:[&>[data-slot=filter-bar-count]]:sr-only @max-2xs:[&>[data-slot=filter-bar-count]~[data-slot=filter-bar-clear]]:ms-auto',
      className,
    )}
    {...props}
  />;
}

type FilterBarSearchProps = Omit<SearchModeProps, 'mode' | 'size' | 'value' | 'defaultValue' | 'onValueChange' | 'shortcut' | 'shortcutOwner'> & {
  value: string;
  onValueChange: (value: string) => void;
  shortcut?: string | null;
};

function FilterBarSearch({shortcut = '/', placeholder = 'Search', className, 'aria-label': ariaLabel, ...props}: FilterBarSearchProps) {
  return <Input
    mode="search"
    size="sm"
    shortcut={shortcut ?? undefined}
    placeholder={placeholder}
    aria-label={ariaLabel ?? placeholder}
    aria-keyshortcuts={shortcut ?? undefined}
    className={cn('w-auto min-w-32 flex-1 basis-40 @max-md:basis-full', className)}
    {...props}
  />;
}

const filterCellClass = cn(
  controlHeight.sm, 'inline-flex max-w-full shrink-0 cursor-default items-center gap-1.5 border border-(--field-edge) bg-(--field-bg) px-(--field-inset-sm) type-label-sm text-text-2 select-none',
  'transition-[background-color,color,border-color,box-shadow] duration-(--dur-light) ease-soft [-webkit-tap-highlight-color:transparent]',
  'hover:not-data-disabled:bg-(--field-hover) hover:not-data-disabled:border-(--field-edge-hover) hover:not-data-disabled:ring-1 hover:not-data-disabled:ring-(--field-ring-hover) hover:not-data-disabled:text-text-1',
  'data-active:bg-selected data-active:text-text-1 data-pressed:bg-selected data-pressed:text-text-1',
  'hover:not-data-disabled:data-active:bg-selected-strong hover:not-data-disabled:data-pressed:bg-selected-strong',
  'data-popup-open:bg-(--field-focus-bg) data-popup-open:border-focus data-popup-open:inset-ring data-popup-open:inset-ring-focus data-popup-open:ring-1 data-popup-open:ring-(--field-ring-focus)',
  'data-disabled:cursor-not-allowed data-disabled:bg-well data-disabled:text-text-disabled',
  '[&_svg]:size-(--icon-sm) [&_svg]:shrink-0 [&_svg]:text-text-3 [&_[data-slot=filter-caret]]:transition-[rotate] [&_[data-slot=filter-caret]]:duration-(--dur-state) data-popup-open:[&_[data-slot=filter-caret]]:rotate-180',
  'forced-colors:border-[ButtonText] forced-colors:data-active:outline-2 forced-colors:data-active:-outline-offset-2 forced-colors:data-pressed:outline-2 forced-colors:data-pressed:-outline-offset-2',
);

type FilterToggleProps = Omit<TogglePrimitive.Props, 'className'> & {className?: string};

function FilterToggle({className, ...props}: FilterToggleProps) {
  return <TogglePrimitive data-slot="filter-toggle" className={cn(filterCellClass, className)} {...props}/>;
}

function FilterBarClear({className, children = 'Clear', onClick, ...props}: Omit<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return <Button
    variant="ghost"
    size="sm"
    data-slot="filter-bar-clear"
    onClick={event => {
      const bar = (event.currentTarget as HTMLElement).closest('[data-slot=filter-bar]');
      onClick?.(event);
      requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        bar?.querySelector<HTMLElement>('[data-mode=search] [data-control], [data-slot=filter-bar-select]')?.focus();
      });
    }}
    className={className}
    {...props}
  >{children}</Button>;
}

function FilterBarCount({shown, total, noun, className, ...props}: React.ComponentProps<'div'> & {shown: number; total: number; noun?: string}) {
  const f = (n: number) => n.toLocaleString('en-US');
  const tail = noun ? ` ${noun}` : '';
  const text = shown === total ? `${f(total)}${tail}` : `${f(shown)} of ${f(total)}${tail}`;
  const [said, setSaid] = React.useState(text);
  React.useEffect(() => {
    const id = window.setTimeout(() => setSaid(text), 500);
    return () => window.clearTimeout(id);
  }, [text]);
  return <div data-slot="filter-bar-count" className={cn('shrink-0 type-label-sm whitespace-nowrap text-text-3 [unicode-bidi:plaintext]', className)} {...props}>
    <span aria-hidden><span className="text-text-1">{f(shown)}</span>{shown === total ? tail : ` of ${f(total)}${tail}`}</span>
    <span role="status" className="sr-only">{said}</span>
  </div>;
}

type FilterOption = {
  value: string;
  label: React.ReactNode;
  textValue?: string;
  count?: number;
  disabled?: boolean;
};

type FilterBarSelectBase = {
  label: string;
  options: FilterOption[];
  showAllOption?: boolean;
  allLabel?: string;
  sinkEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  defaultOpen?: boolean;
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

function OptionBody({option}: {option: FilterOption}) {
  return <>
    <span className="min-w-0 flex-1 truncate">{option.label}</span>
    {option.count !== undefined && <span data-slot="filter-option-count" className="ms-auto ps-3 type-code-sm text-text-3">{option.count.toLocaleString('en-US')}</span>}
  </>;
}

function FilterBarSelect(props: FilterBarSelectProps) {
  const {label, options, showAllOption = false, allLabel = 'All', disabled, className, defaultOpen} = props;
  const container = useSodiumPortal();
  const [single, setSingle] = useControllable<string | null>(props.multiple ? undefined : props.value, props.multiple ? null : props.defaultValue ?? null, props.multiple ? undefined : props.onValueChange);
  const [many, setMany] = useControllable<string[]>(props.multiple ? props.value : undefined, props.multiple ? props.defaultValue ?? [] : [], props.multiple ? props.onValueChange : undefined);

  const chosen = props.multiple ? many : single ? [single] : [];
  const active = chosen.length > 0;
  const first = options.find(o => o.value === chosen[0]);
  const accessibleName = `${label}: ${!active ? allLabel : options.filter(o => chosen.includes(o.value)).map(optionText).join(', ')}`;

  const sink = props.sinkEmpty ?? options.some(o => o.count !== undefined);
  const live = sink ? options.filter(o => o.count !== 0 || chosen.includes(o.value)) : options;
  const empty = sink ? options.filter(o => o.count === 0 && !chosen.includes(o.value)) : [];

  const check = (indicator: 'radio' | 'checkbox') => indicator === 'radio'
    ? <MenuPrimitive.RadioItemIndicator render={<span className={optionCheckClass}/>}><Icon icon={Checkmark}/></MenuPrimitive.RadioItemIndicator>
    : <MenuPrimitive.CheckboxItemIndicator render={<span className={optionCheckClass}/>}><Icon icon={Checkmark}/></MenuPrimitive.CheckboxItemIndicator>;

  const row = (o: FilterOption, isEmpty = false) => props.multiple
    ? <MenuPrimitive.CheckboxItem
        key={o.value}
        data-slot="filter-option"
        disabled={o.disabled || isEmpty}
        checked={many.includes(o.value)}
        onCheckedChange={c => setMany(c ? [...many, o.value] : many.filter(v => v !== o.value))}
        closeOnClick={false}
        className={optionItemClass}
      >{check('checkbox')}<OptionBody option={o}/></MenuPrimitive.CheckboxItem>
    : <MenuPrimitive.RadioItem key={o.value} value={o.value} closeOnClick disabled={o.disabled || isEmpty} data-slot="filter-option" className={optionItemClass}>{check('radio')}<OptionBody option={o}/></MenuPrimitive.RadioItem>;

  const sunk = empty.length > 0 && <>
    <MenuPrimitive.Separator className={menuSeparatorClass}/>
    <MenuPrimitive.Group>
      <MenuPrimitive.GroupLabel className={menuLabelClass}>None left with the other filters</MenuPrimitive.GroupLabel>
      {empty.map(o => row(o, true))}
    </MenuPrimitive.Group>
  </>;

  const all = props.multiple
    ? <MenuPrimitive.CheckboxItem checked={!active} onCheckedChange={() => setMany([])} closeOnClick={false} className={optionItemClass}>{check('checkbox')}{allLabel}</MenuPrimitive.CheckboxItem>
    : <MenuPrimitive.RadioItem value={ALL} closeOnClick className={optionItemClass}>{check('radio')}{allLabel}</MenuPrimitive.RadioItem>;

  return <MenuPrimitive.Root defaultOpen={defaultOpen} modal={defaultOpen ? false : undefined}>
    <MenuPrimitive.Trigger
      disabled={disabled}
      aria-label={accessibleName}
      data-slot="filter-bar-select"
      data-filter={label}
      data-active={active || undefined}
      className={cn(filterCellClass, 'pe-1.5', className)}
    >
      <span className="shrink-0">{label}</span>
      {active && (chosen.length > 1
        ? <span className="type-code-sm normal-case text-text-1">{chosen.length}</span>
        : first && <span className="min-w-0 truncate type-code-sm normal-case text-text-1">{optionText(first)}</span>)}
      <Icon icon={ChevronDown} data-slot="filter-caret"/>
    </MenuPrimitive.Trigger>
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Positioner side="bottom" align="start" sideOffset={4} collisionPadding={8} collisionAvoidance={defaultOpen ? {side: 'none', align: 'none', fallbackAxisSide: 'none'} : undefined} className="isolate z-(--z-overlay) outline-none">
        <MenuPrimitive.Popup data-slot="filter-bar-menu" data-size="sm" finalFocus={defaultOpen ? false : undefined} className={cn(menuPopupClass, 'max-w-[min(var(--available-width),var(--popover))]')}>
          {props.multiple
            ? <>
                {showAllOption && <>{all}<MenuPrimitive.Separator className={menuSeparatorClass}/></>}
                {live.map(o => row(o))}
                {sunk}
              </>
            : <MenuPrimitive.RadioGroup value={single ?? ALL} onValueChange={v => setSingle(v === ALL ? null : v as string)}>
                {showAllOption && <>{all}<MenuPrimitive.Separator className={menuSeparatorClass}/></>}
                {live.map(o => row(o))}
                {sunk}
              </MenuPrimitive.RadioGroup>}
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
  FilterBar, FilterBarSearch, FilterToggle, FilterBarSelect, FilterBarClear, FilterBarCount, useFilteredRows,
  type FilterBarSearchProps, type FilterBarSelectProps, type FilterToggleProps, type FilterOption, type FacetField,
};

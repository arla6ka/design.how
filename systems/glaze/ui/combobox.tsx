'use client';

import * as React from 'react';
import {Combobox as ComboboxPrimitive} from '@base-ui/react/combobox';
import {Icon, Add, Check, ChevronDown, Close, NoResults, Pending, Search} from '../icon';
import {menuItemClass, menuLabelClass, menuPopupClass, menuSeparatorClass} from '../lib/overlay';
import {useGlazePortal} from '../lib/portal';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {chipRemoveClasses, chipValueClasses, chipVariants} from './chip';
import {useFieldDisabled} from './field';
import {InputAction, InputLeading, InputRoot, InputTrailing, type InputSize} from './input';
import {Kbd} from './kbd';

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

function normalizeEmail(raw: string) {
  const angle = raw.match(/<([^>]+)>/);
  return (angle ? angle[1] : raw).trim().replace(/^mailto:/i, '').toLowerCase();
}

function splitEmails(text: string) {
  return text.replace(/(?:"[^"]*"|[^"<>,;\n])*<([^>]+)>/g, ' $1 ').split(/[\s,;]+/);
}

function validateEmail(email: string) {
  return EMAIL.test(email) ? null : 'Not an email address';
}

type CreatableOptions = {
  normalize?: (raw: string) => string;
  validate?: (value: string, all: string[]) => string | null | undefined;
  split?: (text: string) => string[];
  delimiters?: string[];
};

const presets: Record<'email', Required<CreatableOptions>> = {
  email: {normalize: normalizeEmail, validate: v => validateEmail(v), split: splitEmails, delimiters: [',', ';', ' ']},
};

type Ctx = {
  creatable: boolean;
  pending: boolean;
  preview: string;
  previewError: string | null;
  canCreate: boolean;
  duplicate: boolean;
  query: string;
  commit: (raw: string[]) => void;
  errorOf: (value: string) => string | null;
  invalidCount: number;
  onChipsKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onChipsPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  announce: string;
  repeated: string;
  inline: boolean;
};

const idle: Ctx = {
  creatable: false, pending: false, preview: '', previewError: null, canCreate: false, duplicate: false, query: '', commit: () => {},
  errorOf: () => null, invalidCount: 0, onChipsKeyDown: () => {}, onChipsPaste: () => {}, announce: '', repeated: '', inline: false,
};
const ComboboxContext = React.createContext<Ctx>(idle);

type ComboboxExtra = CreatableOptions & {
  creatable?: boolean;
  preset?: 'email';
  pending?: boolean;
};

type ComboboxProps<Value, Multiple extends boolean | undefined = false> = ComboboxPrimitive.Root.Props<Value, Multiple> & ComboboxExtra;

function Combobox<Value, Multiple extends boolean | undefined = false>(props: ComboboxProps<Value, Multiple>) {
  const {creatable = false, preset, normalize, validate, split, delimiters, pending = false, ...root} = props;
  const inline = !!root.inline;
  const off = useFieldDisabled();
  const opts: Required<CreatableOptions> = {
    normalize: normalize ?? (preset ? presets[preset].normalize : (raw: string) => raw.trim()),
    validate: validate ?? (preset ? presets[preset].validate : () => null),
    split: split ?? (preset ? presets[preset].split : (text: string) => text.split(/[,\n]+/)),
    delimiters: delimiters ?? (preset ? presets[preset].delimiters : [',']),
  };
  const r = root as unknown as ComboboxPrimitive.Root.Props<string, true>;
  const [innerValue, setInnerValue] = React.useState<string[]>((r.defaultValue as string[] | undefined) ?? []);
  const value = (r.value as string[] | undefined) ?? innerValue;
  const [innerQuery, setInnerQuery] = React.useState((r.defaultInputValue as string | undefined) ?? '');
  const query = typeof r.inputValue === 'string' ? r.inputValue : innerQuery;
  const highlighted = React.useRef<unknown>(undefined);
  const [announce, setAnnounce] = React.useState('');
  const [repeated, setRepeated] = React.useState('');
  const disabled = !!root.disabled || off;

  if (!creatable) {
    return <ComboboxContext.Provider value={{...idle, pending, inline}}>
      <ComboboxPrimitive.Root data-slot="combobox" {...(root as ComboboxPrimitive.Root.Props<Value, Multiple>)} disabled={disabled}/>
    </ComboboxContext.Provider>;
  }

  const setValue = (next: string[]) => {
    if (r.value === undefined) setInnerValue(next);
    (r.onValueChange as ((v: string[], d: unknown) => void) | undefined)?.(next, undefined);
  };
  const setQuery = (next: string) => {
    if (typeof r.inputValue !== 'string') setInnerQuery(next);
    (r.onInputValueChange as ((v: string, d: unknown) => void) | undefined)?.(next, undefined);
  };

  const items = (r.items as string[] | undefined) ?? [];
  const lower = (v: string) => v.toLowerCase();
  const preview = opts.normalize(query);
  const previewError = preview ? opts.validate(preview, value) ?? null : null;
  const known = items.some(i => lower(String(i)) === lower(preview));
  const duplicate = !!preview && value.some(v => lower(v) === lower(preview));
  const canCreate = !!preview && !known && !duplicate;

  const commit = (raws: string[]) => {
    const fresh: string[] = [];
    let skipped = '';
    for (const raw of raws) {
      const typed = opts.normalize(raw);
      if (!typed) continue;
      const v = items.find(i => lower(String(i)) === lower(typed)) ?? typed;
      if (value.some(x => lower(x) === lower(v)) || fresh.some(x => lower(x) === lower(v))) { skipped = v; continue; }
      fresh.push(v);
    }
    if (fresh.length) {
      setValue([...value, ...fresh]);
      setAnnounce(fresh.length === 1 ? `Added ${fresh[0]}` : `Added ${fresh.length}`);
    } else if (skipped) {
      setAnnounce(`${skipped} is already added`);
      setRepeated(skipped);
      window.setTimeout(() => setRepeated(''), 700);
    }
    if (fresh.length || skipped) setQuery('');
  };

  const onChipsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    const open = /<[^>]*$/.test(query) || query.split('"').length % 2 === 0;
    const delimiter = opts.delimiters.includes(e.key) && !open && !(e.key === ' ' && preset === 'email' && !query.includes('@'));
    if ((e.key === 'Enter' && !highlighted.current) || (delimiter && query.trim())) {
      if (!query.trim()) return;
      e.preventDefault();
      (e as unknown as {preventBaseUIHandler?: () => void}).preventBaseUIHandler?.();
      commit([query]);
    }
  };

  const onChipsPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const parts = opts.split(query + e.clipboardData.getData('text')).filter(p => opts.normalize(p));
    if (parts.length < 2) return;
    e.preventDefault();
    commit(parts);
  };

  const errorOf = (v: string) => opts.validate(v, value) ?? null;
  const invalidCount = value.filter(v => errorOf(v)).length;

  return <ComboboxContext.Provider value={{creatable, pending, preview, previewError, canCreate, duplicate, query, commit, errorOf, invalidCount, onChipsKeyDown, onChipsPaste, announce, repeated, inline}}>
    <ComboboxPrimitive.Root
      data-slot="combobox"
      {...r}
      disabled={disabled}
      multiple
      items={items}
      value={value}
      onValueChange={(next: string[]) => {
        const removed = value.filter(v => !next.includes(v));
        if (removed.length === 1) setAnnounce(`Removed ${removed[0]}`);
        setValue(next);
        setQuery('');
      }}
      inputValue={query}
      onInputValueChange={(next: string) => setQuery(next)}
      onItemHighlighted={(item: string | undefined, details: ComboboxPrimitive.Root.HighlightEventDetails) => { highlighted.current = item; r.onItemHighlighted?.(item, details); }}
    />
  </ComboboxContext.Provider>;
}

function splitForced<T extends object>(props: T) {
  const forced: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) (k.startsWith('data-force-') ? forced : rest)[k] = v;
  return {forced, rest: rest as T};
}

const textSize: Record<InputSize, string> = {sm: 'type-caption', default: 'type-body-sm', lg: 'type-body'};

function ComboboxValue(props: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props}/>;
}

function ComboboxTrigger({className, children, ...props}: ComboboxPrimitive.Trigger.Props) {
  return <ComboboxPrimitive.Trigger
    data-slot="combobox-trigger"
    aria-label={children ? undefined : 'Show options'}
    render={<InputAction/>}
    className={mergeClass('[&_svg]:transition-transform [&_svg]:duration-(--dur-state) data-popup-open:[&_svg]:rotate-180 motion-reduce:[&_svg]:transition-none', className)}
    {...props}
  >{children ?? <Icon icon={ChevronDown}/>}</ComboboxPrimitive.Trigger>;
}

function ComboboxClear({className, ...props}: ComboboxPrimitive.Clear.Props) {
  return <ComboboxPrimitive.Clear data-slot="combobox-clear" aria-label="Clear" render={<InputAction/>} className={className} {...props}>
    <Icon icon={Close}/>
  </ComboboxPrimitive.Clear>;
}

type ComboboxInputProps = Omit<ComboboxPrimitive.Input.Props, 'size'> & {
  size?: InputSize;
  showSearchIcon?: boolean;
  showTrigger?: boolean;
  showClear?: boolean;
  'aria-invalid'?: boolean;
};

function ComboboxInput({className, size = 'default', showSearchIcon = false, showTrigger = true, showClear = false, disabled: disabledProp, 'aria-invalid': invalid, children, ...all}: ComboboxInputProps) {
  const disabled = useFieldDisabled() || !!disabledProp;
  const {forced, rest: props} = splitForced(all);
  const {pending} = React.useContext(ComboboxContext);
  return <ComboboxPrimitive.InputGroup
    data-slot="combobox-input-group"
    render={<InputRoot size={size} disabled={disabled}/>}
    data-invalid={invalid || undefined}
    className={typeof className === 'string' ? className : undefined}
    {...forced}
  >
    {(showSearchIcon || pending) && <InputLeading>{pending ? <Icon icon={Pending} className="animate-spin motion-reduce:animate-none"/> : <Icon icon={Search}/>}</InputLeading>}
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      data-control=""
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn('h-full w-full min-w-0 flex-1 truncate bg-transparent text-inherit disabled:cursor-not-allowed', textSize[size])}
      {...props}
    />
    {(showClear || showTrigger || children) && <InputTrailing>
      {showClear && <ComboboxClear disabled={disabled}/>}
      {showTrigger && <ComboboxTrigger disabled={disabled}/>}
      {children}
    </InputTrailing>}
  </ComboboxPrimitive.InputGroup>;
}

type ComboboxContentProps = ComboboxPrimitive.Popup.Props & Pick<ComboboxPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor' | 'collisionAvoidance'> & {
  size?: 'default' | 'sm';
};

const pendingRow = <p data-slot="combobox-pending" role="status" className="flex min-h-(--menu-item-h) items-center gap-2 px-2 type-body-sm text-text-2 [&_svg]:text-text-3">
  <Icon icon={Pending} className="animate-spin motion-reduce:animate-none"/>Searching
</p>;

function ComboboxContent({className, side = 'bottom', sideOffset = 6, align = 'start', alignOffset = 0, anchor, collisionAvoidance, size = 'default', children, ...props}: ComboboxContentProps) {
  const container = useGlazePortal();
  const {creatable, pending, inline} = React.useContext(ComboboxContext);
  const body = <>
    {pending && pendingRow}
    {children as React.ReactNode}
    {creatable && <ComboboxCreate/>}
  </>;
  const surface = cn(menuPopupClass, 'group/combobox-content gap-0 overflow-hidden p-0');
  if (inline) return <div data-slot="combobox-content" data-size={size} data-pending={pending || undefined} className={cn(surface, 'w-full max-h-none', typeof className === 'string' && className)}>{body}</div>;
  return <ComboboxPrimitive.Portal container={container}>
    <ComboboxPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} anchor={anchor} collisionPadding={8} collisionAvoidance={collisionAvoidance} className="isolate z-(--z-overlay) outline-none">
      <ComboboxPrimitive.Popup
        data-slot="combobox-content"
        data-size={size}
        data-pending={pending || undefined}
        className={mergeClass([surface, 'w-(--anchor-width) min-w-(--menu-min)'], className)}
        {...props}
      >{body}</ComboboxPrimitive.Popup>
    </ComboboxPrimitive.Positioner>
  </ComboboxPrimitive.Portal>;
}

function ComboboxList({className, ...props}: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" className={mergeClass('max-h-[min(var(--popup-max),var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 empty:p-0 data-empty:p-0', className)} {...props}/>;
}

function scrollListOnly(item: HTMLElement | null) {
  if (!item) return;
  item.scrollIntoView = () => {
    const list = item.closest<HTMLElement>('[data-slot="combobox-list"]');
    if (!list) return;
    const a = item.getBoundingClientRect(), b = list.getBoundingClientRect();
    if (a.top < b.top) list.scrollTop -= b.top - a.top;
    else if (a.bottom > b.bottom) list.scrollTop += a.bottom - b.bottom;
  };
}

function ComboboxItem({className, children, ref, ...props}: ComboboxPrimitive.Item.Props) {
  const {inline} = React.useContext(ComboboxContext);
  const setRef = React.useMemo(() => mergeRefs<HTMLDivElement>(inline ? scrollListOnly : undefined, ref), [inline, ref]);
  return <ComboboxPrimitive.Item ref={setRef} data-slot="combobox-item" className={mergeClass([menuItemClass, 'ps-7'], className)} {...props}>
    <ComboboxPrimitive.ItemIndicator render={<span className="pointer-events-none absolute start-2 flex size-(--icon) items-center justify-center [&_svg]:text-text-1!"/>}>
      <Icon icon={Check}/>
    </ComboboxPrimitive.ItemIndicator>
    <span className="min-w-0 flex-1 truncate">{children}</span>
  </ComboboxPrimitive.Item>;
}

function ComboboxGroup(props: ComboboxPrimitive.Group.Props) {
  return <ComboboxPrimitive.Group data-slot="combobox-group" {...props}/>;
}

function ComboboxLabel({className, ...props}: ComboboxPrimitive.GroupLabel.Props) {
  return <ComboboxPrimitive.GroupLabel data-slot="combobox-label" className={mergeClass([menuLabelClass, 'ps-7'], className)} {...props}/>;
}

function ComboboxCollection(props: ComboboxPrimitive.Collection.Props) {
  return <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props}/>;
}

function ComboboxSeparator({className, ...props}: ComboboxPrimitive.Separator.Props) {
  return <ComboboxPrimitive.Separator data-slot="combobox-separator" className={mergeClass([menuSeparatorClass, 'mx-0'], className)} {...props}/>;
}

function ComboboxEmpty({className, children, ...props}: ComboboxPrimitive.Empty.Props) {
  const {pending, canCreate, duplicate, inline} = React.useContext(ComboboxContext);
  if (pending || canCreate || duplicate) return null;
  return <ComboboxPrimitive.Empty
    data-slot="combobox-empty"
    className={mergeClass(['type-label text-text-1 text-center text-pretty empty:hidden', inline ? 'flex' : 'hidden group-data-empty/combobox-content:flex', 'flex-col items-center justify-center gap-2 px-3 py-4'], className)}
    {...props}
  >
    {children != null && <><Icon icon={NoResults} size={32} weight="light" className="text-text-3"/><span className="min-w-0">{children}</span></>}
  </ComboboxPrimitive.Empty>;
}

function ComboboxCreate() {
  const {canCreate, duplicate, preview, previewError, commit, query} = React.useContext(ComboboxContext);
  if (duplicate) return <p data-slot="combobox-duplicate" className="flex min-h-(--menu-row) items-center px-3 type-body-sm text-text-2"><span className="me-1 min-w-0 truncate text-text-1">{preview}</span><span className="shrink-0">is already added.</span></p>;
  if (!canCreate) return null;
  return <div className="p-1 group-data-empty/combobox-content:pt-1">
    <button
      type="button"
      data-slot="combobox-create"
      data-invalid={previewError ? '' : undefined}
      onMouseDown={e => e.preventDefault()}
      onClick={() => commit([query])}
      className={cn(menuItemClass, 'py-1.5 text-start hover:bg-hover')}
    >
      <Icon icon={Add}/>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate"><span className="text-text-2">Add </span>{preview}</span>
        {previewError && <span className="type-caption text-fail-text">{previewError}. It will be marked.</span>}
      </span>
      <Kbd>Enter</Kbd>
    </button>
  </div>;
}

type ComboboxChipsProps = ComboboxPrimitive.Chips.Props & {
  size?: Exclude<InputSize, 'sm'>;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

function ComboboxChips({className, size = 'default', disabled: disabledProp, 'aria-invalid': invalid, ...props}: ComboboxChipsProps) {
  const {invalidCount} = React.useContext(ComboboxContext);
  const disabled = useFieldDisabled() || !!disabledProp;
  const isInvalid = invalid || invalidCount > 0;
  return <ComboboxPrimitive.Chips
    data-slot="combobox-chips"
    render={<InputRoot size={size} disabled={disabled}/>}
    data-invalid={isInvalid || undefined}
    aria-invalid={isInvalid || undefined}
    className={mergeClass([
      'h-auto! min-h-(--field-h) flex-wrap content-start gap-1 overflow-y-auto py-0.5 ps-0.5 pe-0.5 max-h-32',
      'rounded-[calc(var(--input-h)/2)]',
    ], className)}
    {...props}
  />;
}

function ComboboxChip({className, children, showRemove = true, value, ...props}: ComboboxPrimitive.Chip.Props & {showRemove?: boolean; value?: string}) {
  const {errorOf, repeated} = React.useContext(ComboboxContext);
  const off = useFieldDisabled();
  const error = value !== undefined ? errorOf(value) : null;
  return <ComboboxPrimitive.Chip
    data-slot="combobox-chip"
    data-invalid={error ? '' : undefined}
    data-repeated={value !== undefined && repeated !== '' && value.toLowerCase() === repeated.toLowerCase() ? '' : undefined}
    title={error ?? undefined}
    className={mergeClass([
      chipVariants(), chipValueClasses, 'outline-none',
      'border-transparent bg-field data-disabled:border-transparent data-invalid:border-transparent data-invalid:bg-fail-tint data-invalid:text-fail-text',
      !showRemove && 'pe-2.5',
      'data-highlighted:border-line-focus data-highlighted:bg-pressed data-repeated:border-line-focus data-repeated:bg-pressed focus-visible:focus-ring',
    ], className)}
    {...props}
  >
    <span className="min-w-0 truncate">{children}</span>
    {error && <span className="sr-only">, invalid: {error}</span>}
    {showRemove && <ComboboxPrimitive.ChipRemove
      data-slot="combobox-chip-remove"
      disabled={off}
      aria-label={typeof children === 'string' ? `Remove ${children}` : 'Remove'}
      className={chipRemoveClasses}
    ><Icon icon={Close} size={12}/></ComboboxPrimitive.ChipRemove>}
  </ComboboxPrimitive.Chip>;
}

function ComboboxChipsInput({className, onKeyDown, onPaste, ...props}: ComboboxPrimitive.Input.Props) {
  const {creatable, onChipsKeyDown, onChipsPaste, invalidCount, announce, pending} = React.useContext(ComboboxContext);
  return <>
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      data-control=""
      aria-invalid={invalidCount > 0 || undefined}
      onKeyDown={e => { onKeyDown?.(e); if (creatable) onChipsKeyDown(e); }}
      onPaste={e => { onPaste?.(e); if (creatable) onChipsPaste(e); }}
      className={mergeClass('h-(--control-sm) min-w-12 flex-1 bg-transparent ps-1 type-body-sm text-text-1 first:ps-2.5 disabled:cursor-not-allowed', className)}
      {...props}
    />
    {pending && <Icon icon={Pending} className="me-2 self-center text-text-3 animate-spin motion-reduce:animate-none"/>}
    {creatable && <span role="status" className="sr-only">{announce}{invalidCount > 0 ? `. ${invalidCount} invalid` : ''}</span>}
  </>;
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

type ComboboxFieldProps = ComboboxExtra & {
  items?: string[];
  inline?: boolean;
  multiple?: boolean;
  value?: string | string[] | null;
  defaultValue?: string | string[] | null;
  onValueChange?: (value: string | string[] | null) => void;
  placeholder?: string;
  emptyText?: string;
  size?: InputSize;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  showClear?: boolean;
  showSearchIcon?: boolean;
  defaultInputValue?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  [forced: `data-force-${string}`]: unknown;
};

function ComboboxField({items = [], multiple, value, defaultValue, onValueChange, placeholder, emptyText = 'No matches', size = 'default', disabled, name, id, className, showClear, showSearchIcon, inline, defaultInputValue, creatable, preset, normalize, validate, split, delimiters, pending, 'aria-label': ariaLabel, 'aria-describedby': describedBy, 'aria-invalid': invalid, ...all}: ComboboxFieldProps) {
  const {forced} = splitForced(all);
  const anchor = useComboboxAnchor();
  const listSize = size === 'sm' ? 'sm' : 'default';
  const list = <ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>;
  const open = inline ? {inline: true, open: true, defaultInputValue} : defaultInputValue !== undefined ? {defaultInputValue} : {};
  if (!multiple) {
    return <Combobox items={items} value={value as string | null | undefined} defaultValue={defaultValue as string | null | undefined} onValueChange={v => onValueChange?.(v as string | null)} disabled={disabled} name={name} pending={pending} {...open}>
      <ComboboxInput id={id} size={size} placeholder={placeholder} showClear={showClear} showSearchIcon={showSearchIcon} aria-label={ariaLabel} aria-describedby={describedBy} aria-invalid={invalid} disabled={disabled} className={className} {...forced}/>
      <ComboboxContent size={listSize}>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        {list}
      </ComboboxContent>
    </Combobox>;
  }
  return <Combobox
    items={items}
    multiple
    value={value as string[] | undefined}
    defaultValue={(defaultValue as string[] | undefined) ?? []}
    onValueChange={v => onValueChange?.(v as string[])}
    disabled={disabled}
    name={name}
    creatable={creatable}
    preset={preset}
    normalize={normalize}
    validate={validate}
    split={split}
    delimiters={delimiters}
    pending={pending}
    {...open}
  >
    <ComboboxChips ref={anchor} size={size === 'sm' ? 'default' : size} disabled={disabled} aria-invalid={invalid} className={className} {...forced}>
      <ComboboxValue>
        {(selected: string[]) => <>
          {selected.map(v => <ComboboxChip key={v} value={v}>{v}</ComboboxChip>)}
          <ComboboxChipsInput id={id} placeholder={selected.length ? '' : placeholder} aria-label={ariaLabel} aria-describedby={describedBy} disabled={disabled}/>
        </>}
      </ComboboxValue>
    </ComboboxChips>
    <ComboboxContent anchor={anchor}>
      {items.length > 0 && <ComboboxEmpty>{emptyText}</ComboboxEmpty>}
      {list}
    </ComboboxContent>
  </Combobox>;
}

export {
  Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxClear, ComboboxCollection, ComboboxContent, ComboboxCreate, ComboboxEmpty,
  ComboboxField, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList, ComboboxSeparator, ComboboxTrigger, ComboboxValue,
  normalizeEmail, splitEmails, validateEmail, useComboboxAnchor,
  type ComboboxFieldProps, type ComboboxProps,
};

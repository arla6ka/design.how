'use client';

import * as React from 'react';
import {Input as InputPrimitive} from '@base-ui/react/input';
import {Select as SelectPrimitive} from '@base-ui/react/select';
import {Icon, ChevronDown, ChevronUp, ChevronSort, Checkmark} from '../icon';
import type {Kind} from '../lib/kind';
import {useQuartzPortal} from '../lib/portal';
import {overlayMotion, overlaySurface} from '../lib/overlay';
import {cn, controlHeight, mergeClass} from '../lib/utils';
import {Badge} from './badge';
import {fieldControlVariants, type ControlSize} from './field';

const popupClassName = cn('relative isolate z-(--z-overlay) max-h-(--available-height) min-w-(--anchor-width) overflow-hidden p-1 [&_[role=listbox]]:scroll-fade-y', overlaySurface, overlayMotion);

const itemClassName = cn(
  'menu-item w-full pe-8',
  'data-selected:bg-accent-wash data-selected:data-highlighted:bg-accent-wash focus-visible:focus-ring-inset forced-colors:data-selected:data-highlighted:bg-[Highlight]!',
);

const groupLabelClassName = 'menu-label';
const separatorClassName = 'menu-separator';

const triggerClassName = cn(
  'group/select-trigger flex w-fit min-w-40 items-center justify-between gap-2 rounded-soft bg-page control-edge px-3 text-start type-label whitespace-nowrap select-none',
  'text-text-1 transition-[background-color,box-shadow,outline-color] duration-(--dur-fast) ease-(--ease-step)',
  'hover:not-data-disabled:not-aria-invalid:[--frame-color:var(--line-control-hover)] data-popup-open:not-aria-invalid:[--frame-color:var(--line-control-hover)]',
  'aria-invalid:[--frame-color:var(--fail-line)]',
  'focus-visible:outline-none focus-visible:[--frame-color:var(--border-focus)]! focus-visible:[--control-lift:var(--focus-halo)]! data-popup-open:[--frame-color:var(--border-focus)]! data-popup-open:[--control-lift:var(--focus-halo)]!',
  'data-disabled:cursor-not-allowed data-disabled:text-text-disabled data-disabled:[--frame-color:var(--line-row)] data-disabled:[--control-lift:var(--elev-none)]',
  'forced-colors:border forced-colors:border-solid forced-colors:border-[ButtonText] [-webkit-tap-highlight-color:transparent]',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
);

const triggerSize = {
  sm: `${controlHeight.sm} px-2`,
  default: controlHeight.default,
  lg: `${controlHeight.lg} px-4`,
} as const;

type SelectItemDef = {value: string; label: React.ReactNode; kind?: Kind; disabled?: boolean};
type SelectItems = readonly SelectItemDef[] | Record<string, React.ReactNode>;

const KindContext = React.createContext<Record<string, Kind>>({});

type SelectProps = Omit<SelectPrimitive.Root.Props<string>, 'items' | 'onValueChange'> & {
  items?: SelectItems;
  onValueChange?: (value: string | null, details?: SelectPrimitive.Root.ChangeEventDetails) => void;
  native?: boolean;
  size?: ControlSize;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
};

const listOf = (items?: SelectItems): SelectItemDef[] => !items ? [] : Array.isArray(items) ? [...items] : Object.entries(items).map(([value, label]) => ({value, label}));

function Select({items, native, size = 'default', placeholder, className, children, onValueChange, ...props}: SelectProps) {
  const list = React.useMemo(() => listOf(items), [items]);
  const kinds = React.useMemo(() => Object.fromEntries(list.filter(i => i.kind).map(i => [i.value, i.kind!])), [list]);
  if (native) {
    const {value, defaultValue, disabled, name, required, id, inputRef: _ref, ...rest} = props as Record<string, unknown> & {value?: string | null; defaultValue?: string | null};
    const aria = Object.fromEntries(Object.entries(rest).filter(([k]) => k.startsWith('aria-') || k.startsWith('data-')));
    return <NativeSelect
      size={size}
      className={className}
      value={value === undefined ? undefined : value ?? ''}
      defaultValue={defaultValue === undefined ? undefined : defaultValue ?? ''}
      disabled={disabled as boolean | undefined}
      name={name as string | undefined}
      required={required as boolean | undefined}
      id={id as string | undefined}
      onChange={e => onValueChange?.(e.currentTarget.value || null)}
      {...aria}
    >
      {placeholder !== undefined && <NativeSelectOption value="" disabled>{placeholder}</NativeSelectOption>}
      {list.map(i => <NativeSelectOption key={i.value} value={i.value} disabled={i.disabled}>{typeof i.label === 'string' ? i.label : i.value}</NativeSelectOption>)}
    </NativeSelect>;
  }
  const baseItems = items === undefined ? undefined : list.map(i => ({value: i.value, label: i.kind ? <>{i.label}<Badge kind={i.kind} size="sm" className={kindLabelClassName}/></> : i.label}));
  return <KindContext.Provider value={kinds}>
    <SelectPrimitive.Root items={baseItems} onValueChange={onValueChange as SelectPrimitive.Root.Props<string>['onValueChange']} {...props}>{children}</SelectPrimitive.Root>
  </KindContext.Provider>;
}

function SelectGroup({className, ...props}: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={mergeClass('scroll-my-1', className)} {...props}/>;
}

const textClassName = 'block min-w-0 flex-1 truncate';
const kindLabelClassName = 'ms-2 align-[0.0625em]';

function SelectValue({className, ...props}: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" className={mergeClass([textClassName, 'data-placeholder:text-text-3'], className)} {...props}/>;
}

type SelectTriggerProps = SelectPrimitive.Trigger.Props & {
  size?: ControlSize;
  'aria-invalid'?: boolean | 'true' | 'false';
};

function SelectTrigger({className, size = 'default', children, 'aria-invalid': invalid, ...props}: SelectTriggerProps) {
  const isInvalid = invalid === true || invalid === 'true';
  return <SelectPrimitive.Trigger
    data-slot="select-trigger"
    data-size={size}
    data-status={isInvalid ? 'fail' : undefined}
    aria-invalid={isInvalid || undefined}
    className={mergeClass([triggerClassName, triggerSize[size]], className)}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon className="flex text-text-2"><Icon icon={ChevronSort} size={16}/></SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>;
}

type SelectContentProps = SelectPrimitive.Popup.Props & Pick<SelectPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'alignItemWithTrigger'>;

function SelectContent({className, children, side = 'bottom', sideOffset = 4, align = 'start', alignOffset = 0, alignItemWithTrigger = false, ...props}: SelectContentProps) {
  const container = useQuartzPortal();
  return <SelectPrimitive.Portal container={container}>
    <SelectPrimitive.Positioner side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger} className="isolate z-(--z-overlay) outline-none">
      <SelectPrimitive.Popup data-slot="select-content" className={mergeClass([popupClassName, 'flex max-w-[min(var(--popover),var(--available-width))] flex-col'], className)} {...props}>
        <SelectScrollUpButton/>
        <SelectPrimitive.List className="max-h-(--popup-max) scroll-py-1 overflow-y-auto">{children}</SelectPrimitive.List>
        <SelectScrollDownButton/>
      </SelectPrimitive.Popup>
    </SelectPrimitive.Positioner>
  </SelectPrimitive.Portal>;
}

function SelectLabel({className, ...props}: SelectPrimitive.GroupLabel.Props) {
  return <SelectPrimitive.GroupLabel data-slot="select-label" className={mergeClass(groupLabelClassName, className)} {...props}/>;
}

function SelectItem({className, children, kind, ...props}: SelectPrimitive.Item.Props & {
  kind?: Kind;
}) {
  const kinds = React.useContext(KindContext);
  const k = kind ?? (typeof props.value === 'string' ? kinds[props.value] : undefined);
  return <SelectPrimitive.Item data-slot="select-item" data-kind={k} className={mergeClass(itemClassName, className)} {...props}>
    <SelectPrimitive.ItemText className={textClassName}>{children}{k && <Badge kind={k} size="sm" className={kindLabelClassName}/>}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator render={<span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center"/>}>
      <Icon icon={Checkmark} size={16}/>
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>;
}

function SelectSeparator({className, ...props}: SelectPrimitive.Separator.Props) {
  return <SelectPrimitive.Separator data-slot="select-separator" className={mergeClass(separatorClassName, className)} {...props}/>;
}

function SelectScrollUpButton({className, ...props}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return <SelectPrimitive.ScrollUpArrow data-slot="select-scroll-up-button" className={mergeClass('top-0 z-(--z-raised) flex h-(--control-xs) w-full cursor-default items-center justify-center bg-raised text-text-2', className)} {...props}>
    <Icon icon={ChevronUp} size={16}/>
  </SelectPrimitive.ScrollUpArrow>;
}

function SelectScrollDownButton({className, ...props}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return <SelectPrimitive.ScrollDownArrow data-slot="select-scroll-down-button" className={mergeClass('bottom-0 z-(--z-raised) flex h-(--control-xs) w-full cursor-default items-center justify-center bg-raised text-text-2', className)} {...props}>
    <Icon icon={ChevronDown} size={16}/>
  </SelectPrimitive.ScrollDownArrow>;
}

type NativeSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: ControlSize;
};

function NativeSelect({className, size = 'default', ...props}: NativeSelectProps) {
  const primitiveProps = props as unknown as Omit<InputPrimitive.Props, 'className' | 'size'>;
  return <div
    data-slot="native-select-wrapper"
    data-size={size}
    className={cn('group/native-select relative w-full min-w-0 sm:w-fit', className)}
  >
    <InputPrimitive
      data-slot="native-select"
      data-size={size}
      data-status={props['aria-invalid'] ? 'fail' : undefined}
      render={<select/>}
      className={cn(fieldControlVariants({size}), 'cursor-pointer appearance-none pe-9 sm:min-w-40 [-webkit-tap-highlight-color:transparent]', size === 'sm' && 'pe-8', size === 'lg' && 'pe-10')}
      {...primitiveProps}
    />
    <Icon
      icon={ChevronSort}
      size={16}
      data-slot="native-select-icon"
      className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-2 group-has-disabled/native-select:text-text-disabled group-data-[size=sm]/native-select:end-2 group-data-[size=lg]/native-select:end-4"
    />
  </div>;
}

function NativeSelectOption({className, ...props}: React.ComponentProps<'option'>) {
  return <option data-slot="native-select-option" className={cn('bg-raised text-text-1', className)} {...props}/>;
}

function NativeSelectOptGroup({className, ...props}: React.ComponentProps<'optgroup'>) {
  return <optgroup data-slot="native-select-optgroup" className={cn('bg-raised text-text-1', className)} {...props}/>;
}

export {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  type NativeSelectProps,
  type SelectProps,
  type SelectItemDef,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  popupClassName as listPopupClassName,
  itemClassName as listItemClassName,
  groupLabelClassName as listGroupLabelClassName,
  separatorClassName as listSeparatorClassName,
  triggerClassName as fieldTriggerClassName,
};

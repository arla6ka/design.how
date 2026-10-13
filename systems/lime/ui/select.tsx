'use client';

import {Select as SelectPrimitive} from '@base-ui/react/select';
import {cva, type VariantProps} from 'class-variance-authority';
import {Checkmark, ChevronDown, Icon} from '../icon';
import {useLimePortal} from '../lib/portal';
import {groupLabelClass, itemClass, popupClass} from '../lib/popup';
import {mergeClass} from '../lib/utils';

const triggerVariants = cva(
  [
    'group/select-trigger flex w-fit min-w-40 items-center justify-between gap-2 rounded-field border border-line-strong bg-field ps-3 pe-2.5 text-start whitespace-nowrap text-fg select-none',
    'transition-[border-color] duration-(--dur-instant) ease-out hover:not-data-disabled:not-aria-invalid:border-control data-popup-open:not-aria-invalid:border-accent-line',
    'focus-visible:border-accent-line focus-visible:outline-offset-0',
    'aria-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:bg-surface-2 data-disabled:text-fg-disabled',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {sm: 'h-(--control-sm) text-sm', md: 'h-(--control-md) text-sm', lg: 'h-(--control-lg) text-base'},
    },
    defaultVariants: {size: 'md'},
  },
);

function Select<Value = string>(props: SelectPrimitive.Root.Props<Value>) {
  return <SelectPrimitive.Root data-slot="select" {...props}/>;
}

function SelectGroup({className, ...props}: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" className={className} {...props}/>;
}

function SelectLabel({className, ...props}: SelectPrimitive.GroupLabel.Props) {
  return <SelectPrimitive.GroupLabel data-slot="select-label" className={mergeClass(groupLabelClass, className)} {...props}/>;
}

type SelectTriggerProps = SelectPrimitive.Trigger.Props & VariantProps<typeof triggerVariants> & {
  placeholder?: string;
};

function SelectTrigger({className, size, placeholder, children, ...props}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger data-slot="select-trigger" className={mergeClass(triggerVariants({size}), className)} {...props}>
      {children ?? <SelectPrimitive.Value placeholder={placeholder} className="min-w-0 truncate data-placeholder:text-fg-3"/>}
      <SelectPrimitive.Icon className="shrink-0 text-fg-3 transition-transform duration-(--dur-fast) group-data-popup-open/select-trigger:rotate-180"><Icon icon={ChevronDown} size={16}/></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({className, children, ...props}: SelectPrimitive.Popup.Props) {
  const container = useLimePortal();
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Positioner sideOffset={6} alignItemWithTrigger={false} collisionPadding={8} className="isolate z-(--z-popover) outline-none">
        <SelectPrimitive.Popup data-slot="select-content" className={mergeClass(popupClass, className)} {...props}>
          <SelectPrimitive.List className="max-h-(--popup-max,20rem) overflow-y-auto overscroll-contain">{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({className, children, ...props}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item data-slot="select-item" className={mergeClass(itemClass, className)} {...props}>
      <SelectPrimitive.ItemText className="min-w-0 truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute end-2 flex size-4 items-center justify-center"><Icon icon={Checkmark} size={16}/></SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export {Select, SelectGroup, SelectLabel, SelectTrigger, SelectContent, SelectItem, triggerVariants};

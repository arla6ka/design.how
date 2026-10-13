'use client';

import {Combobox as ComboboxPrimitive} from '@base-ui/react/combobox';
import {Checkmark, ChevronDown, Close, Icon} from '../icon';
import {useLimePortal} from '../lib/portal';
import {itemClass, popupClass} from '../lib/popup';
import {mergeClass} from '../lib/utils';
import {fieldControl} from './input';

function Combobox<Value, Multiple extends boolean | undefined = false>(props: ComboboxPrimitive.Root.Props<Value, Multiple>) {
  return <ComboboxPrimitive.Root data-slot="combobox" {...props}/>;
}

type ComboboxInputProps = ComboboxPrimitive.Input.Props & {
  hideTrigger?: boolean;
  showClear?: boolean;
};

function ComboboxInput({className, hideTrigger, showClear, ...props}: ComboboxInputProps) {
  return (
    <ComboboxPrimitive.InputGroup data-slot="combobox-input-group" className="relative flex w-full items-center">
      <ComboboxPrimitive.Input
        data-slot="combobox-input"
        className={mergeClass([fieldControl(), 'text-ellipsis', hideTrigger ? '' : 'pe-16'], className)}
        {...props}
      />
      <span className="absolute inset-y-0 end-1.5 flex items-center gap-0.5">
        {showClear && (
          <ComboboxPrimitive.Clear aria-label="Clear" className="inline-flex size-7 items-center justify-center rounded-full text-fg-3 hover:bg-surface-2 hover:text-fg">
            <Icon icon={Close} size={16}/>
          </ComboboxPrimitive.Clear>
        )}
        {!hideTrigger && (
          <ComboboxPrimitive.Trigger aria-label="Show options" className="inline-flex size-7 items-center justify-center rounded-full text-fg-3 hover:bg-surface-2 hover:text-fg">
            <Icon icon={ChevronDown} size={16}/>
          </ComboboxPrimitive.Trigger>
        )}
      </span>
    </ComboboxPrimitive.InputGroup>
  );
}

function ComboboxContent({className, children, ...props}: ComboboxPrimitive.Popup.Props) {
  const container = useLimePortal();
  return (
    <ComboboxPrimitive.Portal container={container}>
      <ComboboxPrimitive.Positioner sideOffset={6} collisionPadding={8} className="isolate z-(--z-popover) outline-none">
        <ComboboxPrimitive.Popup data-slot="combobox-content" className={mergeClass([popupClass, 'w-(--anchor-width)'], className)} {...props}>
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({className, ...props}: ComboboxPrimitive.List.Props) {
  return <ComboboxPrimitive.List data-slot="combobox-list" className={mergeClass('max-h-72 overflow-y-auto overscroll-contain data-empty:hidden', className)} {...props}/>;
}

function ComboboxItem({className, children, ...props}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item data-slot="combobox-item" className={mergeClass(itemClass, className)} {...props}>
      <span className="min-w-0 truncate">{children}</span>
      <ComboboxPrimitive.ItemIndicator className="absolute end-2 flex size-4 items-center justify-center"><Icon icon={Checkmark} size={16}/></ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxEmpty({className, ...props}: ComboboxPrimitive.Empty.Props) {
  return <ComboboxPrimitive.Empty data-slot="combobox-empty" className={mergeClass('px-3 py-3 text-sm text-fg-3 empty:hidden', className)} {...props}/>;
}

export {Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty};

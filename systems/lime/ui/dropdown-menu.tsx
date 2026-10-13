'use client';

import {Menu as MenuPrimitive} from '@base-ui/react/menu';
import {Checkmark, ChevronRight, Icon} from '../icon';
import {useLimePortal} from '../lib/portal';
import {groupLabelClass, itemClass, popupClass, separatorClass} from '../lib/popup';
import {mergeClass} from '../lib/utils';

function DropdownMenu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props}/>;
}

function DropdownMenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props}/>;
}

type DropdownMenuContentProps = MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset'>;

function DropdownMenuContent({className, side = 'bottom', align = 'start', sideOffset = 6, alignOffset = 0, ...props}: DropdownMenuContentProps) {
  const container = useLimePortal();
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} collisionPadding={8} className="isolate z-(--z-popover) outline-none">
        <MenuPrimitive.Popup data-slot="dropdown-menu-content" className={mergeClass([popupClass, 'min-w-44'], className)} {...props}/>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props}/>;
}

function DropdownMenuLabel({className, ...props}: MenuPrimitive.GroupLabel.Props) {
  return <MenuPrimitive.GroupLabel data-slot="dropdown-menu-label" className={mergeClass(groupLabelClass, className)} {...props}/>;
}

type DropdownMenuItemProps = MenuPrimitive.Item.Props & {
  destructive?: boolean;
};

function DropdownMenuItem({className, destructive, ...props}: DropdownMenuItemProps) {
  return <MenuPrimitive.Item data-slot="dropdown-menu-item" className={mergeClass([itemClass, 'pe-3', destructive && 'text-danger-text data-highlighted:bg-danger-tint'], className)} {...props}/>;
}

function DropdownMenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props}/>;
}

function DropdownMenuSubTrigger({className, children, ...props}: MenuPrimitive.SubmenuTrigger.Props) {
  return (
    <MenuPrimitive.SubmenuTrigger data-slot="dropdown-menu-sub-trigger" className={mergeClass([itemClass, 'pe-2 data-popup-open:bg-surface-2'], className)} {...props}>
      {children}
      <Icon icon={ChevronRight} size={16} className="ms-auto text-fg-3 rtl:rotate-180"/>
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({className, ...props}: DropdownMenuContentProps) {
  return <DropdownMenuContent side="right" align="start" sideOffset={4} alignOffset={-4} className={className} {...props}/>;
}

function DropdownMenuCheckboxItem({className, children, ...props}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem data-slot="dropdown-menu-checkbox-item" className={mergeClass(itemClass, className)} {...props}>
      {children}
      <MenuPrimitive.CheckboxItemIndicator className="absolute end-2 flex size-4 items-center justify-center"><Icon icon={Checkmark} size={16}/></MenuPrimitive.CheckboxItemIndicator>
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props}/>;
}

function DropdownMenuRadioItem({className, children, ...props}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item" className={mergeClass(itemClass, className)} {...props}>
      {children}
      <MenuPrimitive.RadioItemIndicator className="absolute end-2 flex size-4 items-center justify-center"><Icon icon={Checkmark} size={16}/></MenuPrimitive.RadioItemIndicator>
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({className, ...props}: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator data-slot="dropdown-menu-separator" className={mergeClass(separatorClass, className)} {...props}/>;
}

export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuCheckboxItem, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator,
};

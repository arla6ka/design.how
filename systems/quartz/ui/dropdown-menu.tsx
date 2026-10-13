'use client';

import * as React from 'react';
import {Menu as MenuPrimitive} from '@base-ui/react/menu';
import {ContextMenu as ContextMenuPrimitive} from '@base-ui/react/context-menu';
import {overlayMotion, overlaySurface} from '../lib/overlay';
import {Icon, ChevronRight, Checkmark} from '../icon';
import {cn, mergeClass} from '../lib/utils';
import {useQuartzPortal} from '../lib/portal';
import {Kbd, KbdGroup} from './kbd';

type Mode = 'click' | 'contextmenu';
type MenuState = {
  mode: Mode;
  mark: (row: HTMLElement | null) => void;
  pressed: React.RefObject<HTMLElement | null>;
};
const MenuContext = React.createContext<MenuState>({mode: 'click', mark: () => {}, pressed: {current: null}});

const menuPopupClass = cn('menu-popup', overlaySurface, overlayMotion);

const menuItemClass = 'group/menu-item menu-item data-inset:ps-8';

const menuCheckItemClass = cn(menuItemClass, 'ps-8');

const menuLabelClass = 'menu-label data-inset:ps-8';
const menuSeparatorClass = 'menu-separator';
const menuShortcutClass = 'ms-auto ps-4';

type DropdownMenuProps = MenuPrimitive.Root.Props & {
  trigger?: Mode;
  onTargetChange?: (row: HTMLElement | null) => void;
};

const TARGET = '[data-menu-target], tr, [role="row"], li';

function rowOf(from: EventTarget | null | undefined, area?: Element | null) {
  if (!(from instanceof Element)) return null;
  const row = from.closest<HTMLElement>(TARGET);
  const within = area ?? row?.closest('[data-menu-area]');
  return row && within && within.contains(row) && row !== within ? row : null;
}

function DropdownMenu({trigger = 'click', onOpenChange, onTargetChange, ...props}: DropdownMenuProps) {
  const target = React.useRef<HTMLElement | null>(null);
  const pressed = React.useRef<HTMLElement | null>(null);
  const onTarget = React.useRef(onTargetChange);
  React.useLayoutEffect(() => { onTarget.current = onTargetChange; });
  const mark = React.useCallback((row: HTMLElement | null) => {
    if (row === target.current) return;
    target.current?.removeAttribute('data-menu-target-open');
    target.current = row;
    row?.setAttribute('data-menu-target-open', '');
    onTarget.current?.(row);
  }, []);
  const state = React.useMemo(() => ({mode: trigger, mark, pressed}), [trigger, mark]);
  const change: MenuPrimitive.Root.Props['onOpenChange'] = (open, details) => {
    if (open && !target.current) {
      mark(trigger === 'contextmenu' ? pressed.current : rowOf(details.event?.target));
    }
    if (!open) { mark(null); pressed.current = null; }
    onOpenChange?.(open, details);
  };
  return <MenuContext.Provider value={state}>
    {trigger === 'contextmenu'
      ? <ContextMenuPrimitive.Root data-slot="dropdown-menu" onOpenChange={change as ContextMenuPrimitive.Root.Props['onOpenChange']} {...(props as ContextMenuPrimitive.Root.Props)}/>
      : <MenuPrimitive.Root data-slot="dropdown-menu" onOpenChange={change} {...props}/>}
  </MenuContext.Provider>;
}

function DropdownMenuPortal(props: MenuPrimitive.Portal.Props) {
  const container = useQuartzPortal();
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" container={container} {...props}/>;
}

type DropdownMenuTriggerProps = MenuPrimitive.Trigger.Props & {
  selectable?: boolean;
};

function DropdownMenuTrigger({selectable = false, className, ...props}: DropdownMenuTriggerProps) {
  const {mode, mark, pressed} = React.useContext(MenuContext);
  if (mode === 'contextmenu') {
    const base = cn(
      !selectable && 'select-none',
      '[&_[data-menu-target-open]]:bg-hover [&_[data-menu-target-open]]:shadow-[inset_0_1px_0_var(--line-frame),inset_0_-1px_0_var(--line-frame)]',
      'forced-colors:[&_[data-menu-target-open]]:outline-solid forced-colors:[&_[data-menu-target-open]]:outline-2 forced-colors:[&_[data-menu-target-open]]:-outline-offset-2',
    );
    return <ContextMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      data-menu-area=""
      data-selectable={selectable || undefined}
      onPointerDown={event => { if (event.pointerType !== 'mouse') pressed.current = rowOf(event.target, event.currentTarget); }}
      onContextMenu={event => { mark(rowOf(event.target, event.currentTarget)); }}
      onKeyDown={event => {
        if (!(event.shiftKey && event.key === 'F10')) return;
        const from = document.activeElement as HTMLElement | null;
        if (!from || !event.currentTarget.contains(from)) return;
        event.preventDefault();
        const box = from.getBoundingClientRect();
        const inset = Math.min(box.width / 2, 160);
        const x = getComputedStyle(from).direction === 'rtl' ? box.right - inset : box.left + inset;
        from.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: x, clientY: box.top + box.height / 2, button: 2}));
      }}
      className={mergeClass(base, className as ContextMenuPrimitive.Trigger.Props['className'])}
      {...(props as ContextMenuPrimitive.Trigger.Props)}
    />;
  }
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" className={className} {...props}/>;
}

type DropdownMenuContentProps = MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'>;

function DropdownMenuContent({align, alignOffset, side, sideOffset, collisionPadding = 8, className, ...props}: DropdownMenuContentProps) {
  const {mode} = React.useContext(MenuContext);
  const popup = <MenuPrimitive.Popup data-slot="dropdown-menu-content" aria-label={mode === 'contextmenu' ? 'Actions' : undefined} className={mergeClass(menuPopupClass, className)} {...props}/>;
  return <DropdownMenuPortal>
    {mode === 'contextmenu'
      ? <ContextMenuPrimitive.Positioner className="isolate z-(--z-overlay) outline-none" align={align ?? 'start'} alignOffset={alignOffset ?? 4} side={side ?? 'inline-end'} sideOffset={sideOffset ?? 0} collisionPadding={collisionPadding}>{popup}</ContextMenuPrimitive.Positioner>
      : <MenuPrimitive.Positioner className="isolate z-(--z-overlay) outline-none" align={align ?? 'start'} alignOffset={alignOffset ?? 0} side={side ?? 'bottom'} sideOffset={sideOffset ?? 6} collisionPadding={collisionPadding}>{popup}</MenuPrimitive.Positioner>}
  </DropdownMenuPortal>;
}

function DropdownMenuGroup(props: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props}/>;
}

function DropdownMenuLabel({className, inset, ...props}: MenuPrimitive.GroupLabel.Props & {inset?: boolean}) {
  return <MenuPrimitive.GroupLabel data-slot="dropdown-menu-label" data-inset={inset || undefined} className={mergeClass(menuLabelClass, className)} {...props}/>;
}

type ItemVariant = 'default' | 'destructive';

function DropdownMenuItem({className, inset, variant = 'default', ...props}: MenuPrimitive.Item.Props & {inset?: boolean; variant?: ItemVariant}) {
  return <MenuPrimitive.Item
    data-slot="dropdown-menu-item"
    data-inset={inset || undefined}
    data-variant={variant}
    data-status={variant === 'destructive' ? 'fail' : undefined}
    className={mergeClass(menuItemClass, className)}
    {...props}
  />;
}

function DropdownMenuLinkItem({className, inset, ...props}: MenuPrimitive.LinkItem.Props & {inset?: boolean}) {
  return <MenuPrimitive.LinkItem
    data-slot="dropdown-menu-link-item"
    data-inset={inset || undefined}
    className={mergeClass([menuItemClass, 'cursor-pointer'], className)}
    {...props}
  />;
}

function DropdownMenuSub(props: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props}/>;
}

function DropdownMenuSubTrigger({className, inset, children, ...props}: MenuPrimitive.SubmenuTrigger.Props & {inset?: boolean}) {
  return <MenuPrimitive.SubmenuTrigger
    data-slot="dropdown-menu-sub-trigger"
    data-inset={inset || undefined}
    className={mergeClass([menuItemClass, 'data-popup-open:bg-hover forced-colors:data-popup-open:outline-solid forced-colors:data-popup-open:outline-1 forced-colors:data-popup-open:-outline-offset-1'], className)}
    {...props}
  >
    {children}
    <Icon icon={ChevronRight} size={16} className="ms-auto text-text-3 rtl:-scale-x-100"/>
  </MenuPrimitive.SubmenuTrigger>;
}

function DropdownMenuSubContent({align = 'start', alignOffset = -4, side = 'inline-end', sideOffset = 2, className, collisionPadding = 8, ...props}: DropdownMenuContentProps) {
  return <DropdownMenuPortal>
    <MenuPrimitive.Positioner className="isolate z-(--z-overlay) outline-none" align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} collisionPadding={collisionPadding}>
      <MenuPrimitive.Popup data-slot="dropdown-menu-sub-content" className={mergeClass(menuPopupClass, className)} {...props}/>
    </MenuPrimitive.Positioner>
  </DropdownMenuPortal>;
}

function DropdownMenuCheckboxItem({className, children, inset, ...props}: MenuPrimitive.CheckboxItem.Props & {inset?: boolean}) {
  return <MenuPrimitive.CheckboxItem
    data-slot="dropdown-menu-checkbox-item"
    data-inset={inset || undefined}
    className={mergeClass(menuCheckItemClass, className)}
    {...props}
  >
    <span data-slot="dropdown-menu-checkbox-item-indicator" className="pointer-events-none absolute start-2 flex size-4 items-center justify-center">
      <MenuPrimitive.CheckboxItemIndicator><Icon icon={Checkmark} size={16}/></MenuPrimitive.CheckboxItemIndicator>
    </span>
    {children}
  </MenuPrimitive.CheckboxItem>;
}

function DropdownMenuRadioGroup(props: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props}/>;
}

function DropdownMenuRadioItem({className, children, inset, ...props}: MenuPrimitive.RadioItem.Props & {inset?: boolean}) {
  return <MenuPrimitive.RadioItem
    data-slot="dropdown-menu-radio-item"
    data-inset={inset || undefined}
    className={mergeClass(menuCheckItemClass, className)}
    {...props}
  >
    <span data-slot="dropdown-menu-radio-item-indicator" className="pointer-events-none absolute start-2 flex size-4 items-center justify-center">
      <MenuPrimitive.RadioItemIndicator className="size-(--mark-size) bg-ink forced-colors:bg-[CanvasText]"/>
    </span>
    {children}
  </MenuPrimitive.RadioItem>;
}

function DropdownMenuSeparator({className, ...props}: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator data-slot="dropdown-menu-separator" className={mergeClass(menuSeparatorClass, className)} {...props}/>;
}

function DropdownMenuShortcut({className, keys, children, ...props}: React.ComponentProps<'kbd'> & {keys?: string[]}) {
  return <KbdGroup data-slot="dropdown-menu-shortcut" className={cn(menuShortcutClass, className)} {...props}>
    {keys ? keys.map((key, i) => <Kbd key={i}>{key}</Kbd>) : typeof children === 'string' ? <Kbd>{children}</Kbd> : children}
  </KbdGroup>;
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  menuPopupClass,
  menuItemClass,
  menuCheckItemClass,
  menuLabelClass,
  menuSeparatorClass,
  menuShortcutClass,
  type DropdownMenuProps,
};

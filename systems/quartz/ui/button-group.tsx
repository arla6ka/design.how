'use client';

import {Menu as MenuPrimitive} from '@base-ui/react/menu';
import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {createContext, useContext, useMemo, useRef, type ComponentProps, type ReactNode, type RefObject} from 'react';
import {Icon, ChevronDown} from '../icon';
import {useQuartzPortal} from '../lib/portal';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {Button, type ButtonProps} from './button';
import {overlayMotion, overlaySurface} from '../lib/overlay';

const buttonGroupVariants = cva(
  [
    'flex w-fit items-stretch gap-0',
    '[&>:not([data-variant=primary])]:shadow-none! *:active:scale-none!',
    '*:focus-visible:focus-ring-inset *:data-[variant=primary]:focus-visible:focus-ring-ink *:data-pressed:focus-visible:focus-ring-ink',
    'has-[>[data-variant=primary]]:gap-px *:data-[variant=primary]:rounded-none!',
    'has-[>[data-slot=button-group]]:gap-2',
  ],
  {
    variants: {
      orientation: {
        horizontal: '[&>:not([data-variant=primary],[data-slot=button-group-separator])]:frame-shared *:data-[variant=primary]:first:rounded-s-soft! *:data-[variant=primary]:last:rounded-e-soft!',
        vertical: 'flex-col [&>:not([data-variant=primary],[data-slot=button-group-separator])]:frame-shared-y *:data-[variant=primary]:first:rounded-t-soft! *:data-[variant=primary]:last:rounded-b-soft!',
      },
    },
    defaultVariants: {orientation: 'horizontal'},
  },
);

const GroupAnchor = createContext<RefObject<HTMLDivElement | null> | null>(null);

type ButtonGroupProps = ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>;

function ButtonGroup({className, orientation = 'horizontal', ref, ...props}: ButtonGroupProps) {
  const anchor = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs(anchor, ref), [ref]);
  return <GroupAnchor.Provider value={anchor}>
    <div
      ref={setRef}
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({orientation}), className)}
      {...props}
    />
  </GroupAnchor.Provider>;
}

function ButtonGroupText({className, render, ...props}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        ...({'data-slot': 'button-group-text'} as ComponentProps<'div'>),
        className: cn('flex items-center gap-2 bg-page px-3 type-label text-text-2 forced-colors:border forced-colors:border-solid [&_svg]:pointer-events-none', className),
      },
      props,
    ),
  });
}

function ButtonGroupSeparator({className, orientation = 'vertical', ...props}: ComponentProps<'div'> & {orientation?: 'horizontal' | 'vertical'}) {
  return <div
    role="separator"
    aria-orientation={orientation}
    data-slot="button-group-separator"
    data-orientation={orientation}
    className={cn('relative shrink-0 self-stretch rounded-none! bg-line-row! forced-colors:bg-[CanvasText]', orientation === 'vertical' ? 'my-2 w-px' : 'mx-2 h-px', className)}
    {...props}
  />;
}

type ButtonGroupMenuProps = {
  label: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  pending?: boolean;
  disabled?: boolean;
  align?: 'start' | 'end';
};

function ButtonGroupMenu({label, children, variant = 'primary', size = 'default', pending, disabled, align = 'end'}: ButtonGroupMenuProps) {
  const container = useQuartzPortal();
  const anchor = useContext(GroupAnchor);
  const iconSize: ButtonProps['size'] = size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon';
  return <MenuPrimitive.Root>
    <MenuPrimitive.Trigger
      render={<Button variant={variant} size={iconSize}/>}
      disabled={disabled || pending}
      aria-label={label}
      data-slot="button-group-menu-trigger"
    >
      <Icon icon={ChevronDown} size={16} className="transition-none in-data-popup-open:rotate-180"/>
    </MenuPrimitive.Trigger>
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Positioner anchor={anchor ?? undefined} sideOffset={4} align={align} collisionPadding={8} className="isolate z-(--z-overlay) outline-none">
        <MenuPrimitive.Popup data-slot="button-group-menu" className={cn('menu-popup w-max max-w-[min(var(--popover),var(--available-width))]', overlaySurface, overlayMotion)}>
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  </MenuPrimitive.Root>;
}

type ButtonGroupMenuItemProps = MenuPrimitive.Item.Props & {
  description?: ReactNode;
  variant?: 'default' | 'destructive';
};

function ButtonGroupMenuItem({className, description, variant = 'default', children, ...props}: ButtonGroupMenuItemProps) {
  return <MenuPrimitive.Item
    data-slot="button-group-menu-item"
    data-variant={variant}
    data-status={variant === 'destructive' ? 'fail' : undefined}
    className={mergeClass(['menu-item', description && 'items-start'], className)}
    {...props}
  >
    {description
      ? <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">{children}</span>
          <span className="type-body-sm text-text-3">{description}</span>
        </span>
      : children}
  </MenuPrimitive.Item>;
}

function ButtonGroupMenuGroup({children, label}: {children: ReactNode; label?: string}) {
  return <MenuPrimitive.Group data-slot="button-group-menu-group">
    {label && <MenuPrimitive.GroupLabel className="menu-label">{label}</MenuPrimitive.GroupLabel>}
    {children}
  </MenuPrimitive.Group>;
}

function ButtonGroupMenuSeparator({className, ...props}: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator data-slot="button-group-menu-separator" className={mergeClass('menu-separator', className)} {...props}/>;
}

export {
  ButtonGroup, ButtonGroupMenu, ButtonGroupMenuGroup, ButtonGroupMenuItem, ButtonGroupMenuSeparator, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants,
  type ButtonGroupProps, type ButtonGroupMenuProps, type ButtonGroupMenuItemProps,
};

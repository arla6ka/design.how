'use client';

import {createContext, useContext} from 'react';
import {Toggle as TogglePrimitive} from '@base-ui/react/toggle';
import {Toolbar as ToolbarPrimitive} from '@base-ui/react/toolbar';
import {cn, mergeClass} from '../lib/utils';
import {Button, buttonVariants, type ButtonProps} from './button';

type ToolbarSize = 'sm' | 'default';
const SizeContext = createContext<ToolbarSize>('default');

type ToolbarProps = ToolbarPrimitive.Root.Props & {
  size?: ToolbarSize;
};

function Toolbar({className, size = 'default', ...props}: ToolbarProps) {
  return <SizeContext.Provider value={size}>
    <ToolbarPrimitive.Root
      data-slot="toolbar"
      data-size={size}
      className={mergeClass('-m-1 flex w-max max-w-[calc(100%+var(--space-2))] min-w-0 items-center gap-0.5 overflow-x-auto p-1 [scrollbar-width:none]', className)}
      {...props}
    />
  </SizeContext.Provider>;
}

function ToolbarGroup({className, ...props}: ToolbarPrimitive.Group.Props) {
  return <ToolbarPrimitive.Group data-slot="toolbar-group" className={mergeClass('flex shrink-0 items-center gap-0.5', className)} {...props}/>;
}

function itemSize(size: ToolbarSize, iconOnly?: boolean): NonNullable<ButtonProps['size']> {
  if (iconOnly) return size === 'sm' ? 'icon-sm' : 'icon';
  return size === 'sm' ? 'sm' : 'default';
}

type ToolbarButtonProps = Omit<ToolbarPrimitive.Button.Props, 'render'> & {
  variant?: ButtonProps['variant'];
  iconOnly?: boolean;
  pending?: boolean;
};

function ToolbarButton({variant = 'ghost', iconOnly, pending, className, children, ...props}: ToolbarButtonProps) {
  const size = useContext(SizeContext);
  return <ToolbarPrimitive.Button
    data-slot="toolbar-button"
    render={<Button variant={variant} size={itemSize(size, iconOnly)} pending={pending}/>}
    className={mergeClass(['max-w-none', !iconOnly && (size === 'sm' ? 'px-2' : 'px-2.5')], className)}
    {...props}
  >{children}</ToolbarPrimitive.Button>;
}

type ToolbarToggleProps = Omit<TogglePrimitive.Props, 'render'> & {
  iconOnly?: boolean;
};

function ToolbarToggle({iconOnly, className, ...props}: ToolbarToggleProps) {
  const size = useContext(SizeContext);
  return <ToolbarPrimitive.Button
    data-slot="toolbar-toggle"
    render={<TogglePrimitive
      className={mergeClass([
        buttonVariants({variant: 'ghost', size: itemSize(size, iconOnly)}),
        'max-w-none',
        !iconOnly && (size === 'sm' ? 'px-2' : 'px-2.5'),
        'text-text-2 hover:not-data-disabled:text-text-1',
        'data-pressed:bg-pressed data-pressed:text-text-1 data-pressed:hover:not-data-disabled:bg-pressed',
        'forced-colors:data-pressed:border-2',
      ], className)}
      {...props}
    />}
  />;
}

function ToolbarSeparator({className, ...props}: ToolbarPrimitive.Separator.Props) {
  return <ToolbarPrimitive.Separator
    data-slot="toolbar-separator"
    className={cn('mx-1 h-4 w-px shrink-0 bg-line forced-colors:bg-[CanvasText]', className)}
    {...props}
  />;
}

export {Toolbar, ToolbarGroup, ToolbarButton, ToolbarToggle, ToolbarSeparator, type ToolbarProps, type ToolbarButtonProps, type ToolbarToggleProps};

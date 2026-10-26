'use client';

import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {createContext, useContext, useMemo, useRef, type ComponentProps, type ReactNode, type RefObject} from 'react';
import {Icon, ChevronDown} from '../icon';
import {cn, mergeRefs} from '../lib/utils';
import {Button, type ButtonProps} from './button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuTrigger} from './dropdown-menu';

const buttonGroupVariants = cva(
  [
    'flex w-fit items-stretch',
    '[&>*]:hover:z-(--z-raised) [&>*]:active:z-(--z-raised) [&>*]:focus-visible:z-(--z-raised)',
    '[&>*]:focus-visible:focus-ring-inset',
    'has-[>[data-slot=button-group]]:gap-2',
  ],
  {
    variants: {
      orientation: {
        horizontal: '[&>:not([data-slot=button-group],[data-slot=button-group-separator])+:not([data-slot=button-group],[data-slot=button-group-separator])]:-ms-px',
        vertical: 'flex-col [&>:not([data-slot=button-group],[data-slot=button-group-separator])+:not([data-slot=button-group],[data-slot=button-group-separator])]:-mt-px',
      },
    },
    defaultVariants: {orientation: 'horizontal'},
  },
);

type ButtonGroupProps = ComponentProps<'div'> & VariantProps<typeof buttonGroupVariants>;

const GroupAnchor = createContext<RefObject<HTMLDivElement | null> | null>(null);

function ButtonGroup({className, orientation = 'horizontal', ref, ...props}: ButtonGroupProps) {
  const own = useRef<HTMLDivElement | null>(null);
  const setRef = useMemo(() => mergeRefs<HTMLDivElement>(own, ref), [ref]);
  return <GroupAnchor.Provider value={own}>
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

type ButtonGroupMenuProps = {
  label: string;
  children: ReactNode;
  variant?: 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  pending?: boolean;
  disabled?: boolean;
  align?: 'start' | 'end';
};

const caretSize: Record<NonNullable<ButtonGroupMenuProps['size']>, ButtonProps['size']> = {sm: 'icon-sm', default: 'icon', lg: 'icon-lg'};

function ButtonGroupMenu({label, children, variant = 'secondary', size = 'default', pending, disabled, align = 'end'}: ButtonGroupMenuProps) {
  const anchor = useContext(GroupAnchor);
  return <DropdownMenu>
    <DropdownMenuTrigger
      render={<Button variant={variant} size={caretSize[size]}/>}
      disabled={disabled || pending}
      aria-label={label}
      data-slot="button-group-menu-trigger"
    >
      <Icon icon={ChevronDown} className="in-data-popup-open:rotate-180"/>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      data-slot="button-group-menu"
      anchor={anchor ?? undefined}
      align={align}
      size={size === 'sm' ? 'sm' : 'default'}
      className="min-w-(--anchor-width) max-w-[min(var(--popover),var(--available-width))]"
    >{children}</DropdownMenuContent>
  </DropdownMenu>;
}

function ButtonGroupText({className, render, ...props}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        ...({'data-slot': 'button-group-text'} as ComponentProps<'div'>),
        className: cn('relative flex items-center gap-1.5 border border-line bg-secondary-bg px-3 type-label whitespace-nowrap text-text-2 [&_svg]:pointer-events-none [&_svg]:size-(--icon)', className),
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
    className={cn('relative shrink-0 self-stretch bg-line forced-colors:bg-[CanvasText]', orientation === 'vertical' ? 'mx-1 my-1.5 w-px' : 'mx-1.5 my-1 h-px', className)}
    {...props}
  />;
}

export {ButtonGroup, ButtonGroupMenu, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants, type ButtonGroupMenuProps, type ButtonGroupProps};

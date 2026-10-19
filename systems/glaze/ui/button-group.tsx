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
    '[&>*]:[--scale-press:1] [&>*]:hover:z-(--z-raised) [&>*]:focus-visible:z-(--z-raised)',
    '[&>*]:focus-visible:focus-ring-inset',
    'has-[>[data-slot=button-group]]:gap-2',
  ],
  {
    variants: {
      orientation: {
        horizontal: [
          '[&>:not([data-slot=button-group],[data-slot=button-group-separator]):not(:nth-child(1_of_:not([data-base-ui-focus-guard],[aria-owns])))]:-ms-px',
          '[&>:not([data-slot=button-group],[data-slot=button-group-separator]):not(:nth-child(1_of_:not([data-base-ui-focus-guard],[aria-owns])))]:rounded-s-none [&>:not([data-slot=button-group],[data-slot=button-group-separator]):not(:nth-last-child(1_of_:not([data-base-ui-focus-guard],[aria-owns])))]:rounded-e-none',
        ],
        vertical: [
          'flex-col',
          '[&>:not([data-slot=button-group],[data-slot=button-group-separator]):not(:nth-child(1_of_:not([data-base-ui-focus-guard],[aria-owns])))]:-mt-px',
          '[&>:not([data-slot=button-group],[data-slot=button-group-separator]):not(:nth-child(1_of_:not([data-base-ui-focus-guard],[aria-owns])))]:rounded-t-none [&>:not([data-slot=button-group],[data-slot=button-group-separator]):not(:nth-last-child(1_of_:not([data-base-ui-focus-guard],[aria-owns])))]:rounded-b-none',
          '[&>:nth-child(1_of_:not([data-base-ui-focus-guard],[aria-owns]))]:rounded-t-overlay [&>:nth-last-child(1_of_:not([data-base-ui-focus-guard],[aria-owns]))]:rounded-b-overlay',
        ],
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
  defaultOpen?: boolean;
  collisionAvoidance?: ComponentProps<typeof DropdownMenuContent>['collisionAvoidance'];
};

const caretSize: Record<NonNullable<ButtonGroupMenuProps['size']>, ButtonProps['size']> = {sm: 'icon-sm', default: 'icon', lg: 'icon-lg'};

function ButtonGroupMenu({label, children, variant = 'secondary', size = 'default', pending, disabled, align = 'end', defaultOpen, collisionAvoidance}: ButtonGroupMenuProps) {
  const anchor = useContext(GroupAnchor);
  return <DropdownMenu defaultOpen={defaultOpen} modal={defaultOpen ? false : undefined}>
    <DropdownMenuTrigger
      render={<Button variant={variant} size={caretSize[size]}/>}
      disabled={disabled || pending}
      aria-label={label}
      data-slot="button-group-menu-trigger"
    >
      <Icon icon={ChevronDown} className="transition-transform duration-(--dur-state) in-data-popup-open:rotate-180 motion-reduce:transition-none"/>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      data-slot="button-group-menu"
      anchor={anchor ?? undefined}
      align={align}
      size={size === 'sm' ? 'sm' : 'default'}
      collisionAvoidance={collisionAvoidance}
      finalFocus={defaultOpen ? false : undefined}
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
        className: cn('relative flex items-center gap-1.5 rounded-pill border border-(--flat-ring) bg-(--flat-bg) px-3 type-label text-text-2 data tabular-nums [&_svg]:pointer-events-none [&_svg]:size-(--icon)', className),
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
    className={cn('relative shrink-0 self-stretch rounded-none! bg-line forced-colors:bg-[CanvasText]', orientation === 'vertical' ? 'mx-1 my-2 w-px' : 'mx-2 my-1 h-px', className)}
    {...props}
  />;
}

export {ButtonGroup, ButtonGroupMenu, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants, type ButtonGroupMenuProps, type ButtonGroupProps};

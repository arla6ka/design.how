'use client';

import {createContext, useContext} from 'react';
import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const ItemGroupContext = createContext(false);

const itemGroupVariants = cva('group/item-group flex w-full min-w-0 flex-col overflow-hidden', {
  variants: {
    variant: {
      panel: 'panel forced-colors:border-[CanvasText]',
      plain: '',
    },
  },
  defaultVariants: {variant: 'panel'},
});

type ItemGroupProps = React.ComponentProps<'div'> & VariantProps<typeof itemGroupVariants>;

function ItemGroup({className, variant = 'panel', role = 'list', ...props}: ItemGroupProps) {
  return <ItemGroupContext.Provider value={true}>
    <div data-slot="item-group" data-variant={variant} role={role} className={cn(itemGroupVariants({variant}), className)} {...props}/>
  </ItemGroupContext.Provider>;
}

const itemVariants = cva(
  [
    'group/item @container/item relative flex w-full min-w-0 items-center gap-3 px-3 text-start text-text-1',
    'transition-[background-color] duration-(--dur-state) ease-out',
    'in-data-[slot=item-group]:rule-row',
    'has-[[data-slot=item-link]:hover]:not-data-selected:bg-hover-row has-[[data-slot=item-link]:active]:bg-pressed',
    'has-[[data-slot=item-link]:focus-visible]:focus-ring-row',
    'data-selected:bg-pressed forced-colors:data-selected:outline forced-colors:data-selected:outline-2 forced-colors:data-selected:-outline-offset-2',
    'data-disabled:text-text-disabled',
  ],
  {
    variants: {
      size: {
        default: 'min-h-(--row) py-1.5 has-data-[slot=item-description]:py-2',
        sm: 'min-h-(--control) gap-2 py-1',
      },
    },
    defaultVariants: {size: 'default'},
  },
);

type ItemProps = useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants> & {
  selected?: boolean;
  disabled?: boolean;
};

function Item({className, size = 'default', selected, disabled, render, ...props}: ItemProps) {
  const inGroup = useContext(ItemGroupContext);
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {className: cn(itemVariants({size}), className)},
      {
        'data-slot': 'item',
        'data-size': size,
        'data-selected': selected ? '' : undefined,
        'data-disabled': disabled ? '' : undefined,
        role: inGroup ? 'listitem' : undefined,
      } as React.ComponentProps<'div'>,
      props,
    ),
    render,
    state: {slot: 'item', size},
  });
}

const itemMediaVariants = cva('flex shrink-0 items-center justify-center group-has-data-[slot=item-description]/item:self-start group-has-data-[slot=item-description]/item:mt-0.5 [&_svg]:pointer-events-none', {
  variants: {
    variant: {
      default: '',
      icon: 'size-6 text-text-2',
      image: 'size-8 overflow-hidden rounded-tag bg-field [&_img]:size-full [&_img]:object-cover',
    },
  },
  defaultVariants: {variant: 'default'},
});

function ItemMedia({className, variant = 'default', ...props}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return <div data-slot="item-media" data-variant={variant} className={cn(itemMediaVariants({variant}), className)} {...props}/>;
}

function ItemContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-content" className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props}/>;
}

function ItemTitle({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-title" className={cn('flex min-w-0 items-baseline gap-2 type-label [&>*:first-child]:min-w-0 [&>*:first-child]:truncate', className)} {...props}/>;
}

function ItemDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="item-description" className={cn('line-clamp-2 type-body-sm text-text-2 group-data-disabled/item:text-text-disabled', className)} {...props}/>;
}

function ItemMeta({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-meta" className={cn('shrink-0 type-caption text-text-2 @max-md/item:hidden', className)} {...props}/>;
}

function ItemLink({className, ...props}: React.ComponentProps<'a'>) {
  return <a data-slot="item-link" data-control="" className={cn('min-w-0 truncate after:absolute after:inset-0 after:content-[""]', className)} {...props}/>;
}

function ItemActions({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-actions" className={cn('relative z-(--z-raised) -me-2 flex shrink-0 items-center gap-1', className)} {...props}/>;
}

export {Item, ItemGroup, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemMeta, ItemLink, ItemActions, itemVariants, itemGroupVariants, type ItemProps, type ItemGroupProps};

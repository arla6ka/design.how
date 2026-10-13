import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import type {Kind} from '../lib/kind';
import {Status, statusLabels, type StatusValue} from './status';
import {cn} from '../lib/utils';

function ItemGroup({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="item-group"
    className={cn('group/item-group relative flex w-full flex-col overflow-hidden bg-page frame', className)}
    {...props}
  />;
}

function ItemSeparator({className, ...props}: React.ComponentProps<'div'>) {
  return <div role="separator" aria-orientation="horizontal" data-slot="item-separator" className={cn('h-px shrink-0 bg-line-row', className)} {...props}/>;
}

const itemVariants = cva(
  [
    'group/item @container/item relative flex w-full min-w-0 flex-wrap items-center text-start text-text-1 transition-[background-color,box-shadow] duration-(--dur-fast) ease-(--ease-step)',
    'in-data-[slot=item-group]:rounded-none in-data-[slot=item-group]:rule-row',
    'in-data-[slot=panel-body]:rounded-none in-data-[slot=panel-body]:rule-row in-data-[slot=panel-body]:px-3',
    'in-data-[slot=card]:rounded-none in-data-[slot=card]:rule-row',
    '[a]:not-data-selected:not-aria-selected:hover:bg-hover [button]:not-data-selected:not-aria-selected:hover:bg-hover [a]:active:bg-pressed [button]:active:bg-pressed',
    'not-data-selected:not-aria-selected:has-[[data-slot=item-link]:hover]:bg-hover has-[[data-slot=item-link]:active]:bg-pressed',
    'aria-selected:bg-accent-wash data-selected:bg-accent-wash',
    'not-in-data-[slot=item-group]:aria-selected:shadow-[inset_0_1px_0_var(--line-frame),inset_0_-1px_0_var(--line-frame)] not-in-data-[slot=item-group]:data-selected:shadow-[inset_0_1px_0_var(--line-frame),inset_0_-1px_0_var(--line-frame)]',
    'data-[status=fail]:wash-row',
    'forced-colors:data-selected:outline forced-colors:data-selected:outline-2 forced-colors:data-selected:-outline-offset-2',
  ],
  {
    variants: {
      variant: {
        default: 'rounded-soft bg-transparent',
        muted: 'rounded-soft bg-transparent',
        framed: 'frame',
        /** @deprecated Use framed. */
        outline: 'frame',
      },
      size: {
        default: 'min-h-(--row) gap-x-3 gap-y-1 px-4 py-2 has-data-[slot=item-description]:min-h-(--row-lg)',
        sm: 'min-h-(--row-sm) gap-x-3 gap-y-1 px-4 py-1.5',
        dense: 'min-h-(--control-sm) gap-x-2 px-4 py-1',
        /** @deprecated Use dense: 28px is the sm control height, and xs means 24px elsewhere. */
        xs: 'min-h-(--control-sm) gap-x-2 px-4 py-1',
      },
    },
    defaultVariants: {variant: 'default', size: 'default'},
  },
);

type ItemProps = useRender.ComponentProps<'div'> & VariantProps<typeof itemVariants> & {
  selected?: boolean;
  kind?: Kind;
};

function Item({className, variant = 'default', size: sizeProp = 'default', selected, kind, render, ...props}: ItemProps) {
  const size = sizeProp === 'xs' ? 'dense' : sizeProp;
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {className: cn(itemVariants({variant, size}), className)},
      {
        'data-slot': 'item',
        'data-size': size,
        'data-kind': kind,
        'data-selected': selected ? '' : undefined,
        'aria-current': selected && render ? 'true' : undefined,
      } as React.ComponentProps<'div'>,
      props,
    ),
    render,
    state: {slot: 'item', variant, size},
  });
}

const itemMediaVariants = cva(
  'flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'rounded-soft bg-transparent',
        icon: 'size-8 text-text-2 group-data-[size=dense]/item:size-6',
        image: 'size-10 overflow-hidden rounded-soft group-data-[size=sm]/item:size-8 group-data-[size=dense]/item:size-6 [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: {variant: 'default'},
  },
);

function ItemMedia({className, variant = 'default', ...props}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return <div data-slot="item-media" data-variant={variant} className={cn(itemMediaVariants({variant, className}))} {...props}/>;
}

function ItemContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="item-content"
    className={cn('flex min-w-0 flex-1 flex-col gap-0.5 [&+[data-slot=item-content]]:flex-none', className)}
    {...props}
  />;
}

function ItemTitle({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-title" className={cn('flex w-fit max-w-full min-w-0 items-baseline gap-2 overflow-hidden type-label [&>*:first-child]:min-w-0 [&>*:first-child]:truncate @max-sm/item:[&>*:not(:first-child):not([data-slot=badge])]:hidden', className)} {...props}/>;
}

function ItemDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p
    data-slot="item-description"
    className={cn('line-clamp-2 type-body-sm text-text-2 group-data-[size=dense]/item:line-clamp-1 [&>a]:underline [&>a]:underline-offset-4', className)}
    {...props}
  />;
}

function ItemMeta({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-meta" className={cn('shrink-0 type-body-sm text-text-3 @max-xl/item:hidden', className)} {...props}/>;
}

function ItemStatus({status, className, children, ...props}: Omit<React.ComponentProps<'div'>, 'children'> & {status: StatusValue; children?: React.ReactNode}) {
  return <div data-slot="item-status" className={cn('inline-flex shrink-0 items-center type-label-sm text-text-2', className)} {...props}>
    <Status status={status} className="type-label-sm">{children ?? statusLabels[status]}</Status>
  </div>;
}

function ItemLink({className, ...props}: React.ComponentProps<'a'>) {
  return <a
    data-slot="item-link"
    className={cn(
      'min-w-0 truncate after:absolute after:inset-0 after:rounded-soft after:content-[""]',
      'focus-visible:outline-none focus-visible:after:focus-ring-inset',
      className,
    )}
    {...props}
  />;
}

function ItemActions({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-actions" className={cn('relative z-(--z-raised) flex shrink-0 items-center gap-1', className)} {...props}/>;
}

function ItemHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-header" className={cn('flex basis-full items-center justify-between gap-2', className)} {...props}/>;
}

function ItemFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="item-footer" className={cn('flex basis-full items-center justify-between gap-2', className)} {...props}/>;
}

export {Item, ItemMedia, ItemContent, ItemActions, ItemLink, ItemGroup, ItemSeparator, ItemTitle, ItemDescription, ItemMeta, ItemStatus, ItemHeader, ItemFooter, itemVariants, type ItemProps};

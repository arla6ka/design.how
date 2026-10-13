import * as React from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';
import {EMPTY_VALUE} from '../lib/format';

const dataListVariants = cva('group/data-list min-w-0', {
  variants: {
    variant: {
      plain: '',
      framed: 'frame bg-page px-4',
      /** @deprecated Use framed. */
      card: 'frame bg-page px-4',
      /** @deprecated Use framed. */
      frame: 'frame bg-page px-4',
    },
    orientation: {
      horizontal: '',
      vertical: '',
    },
    size: {
      sm: '',
      default: '',
    },
  },
  defaultVariants: {variant: 'plain', orientation: 'horizontal', size: 'default'},
});

type DataListProps = React.ComponentProps<'dl'> & VariantProps<typeof dataListVariants>;

function DataList({className, variant = 'plain', orientation = 'horizontal', size = 'default', ...props}: DataListProps) {
  return <div
    data-slot="data-list-frame"
    data-variant={variant === 'card' || variant === 'frame' ? 'framed' : variant}
    data-orientation={orientation}
    data-size={size}
    className={cn('@container/data-list', dataListVariants({variant, orientation, size}), className)}
  >
    <dl
      data-slot="data-list"
      className={cn(
        'grid min-w-0 grid-cols-1',
        orientation === 'horizontal' && '@md/data-list:grid-cols-[fit-content(var(--label-column))_minmax(0,1fr)] @md/data-list:gap-x-4',
      )}
      {...props}
    />
  </div>;
}

function DataListItem({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="data-list-item"
    className={cn(
      'col-span-full flex min-h-(--row) min-w-0 flex-col justify-center gap-1 py-2',
      'group-data-[orientation=horizontal]/data-list:@md/data-list:grid group-data-[orientation=horizontal]/data-list:@md/data-list:grid-cols-subgrid group-data-[orientation=horizontal]/data-list:@md/data-list:items-baseline group-data-[orientation=horizontal]/data-list:@md/data-list:gap-x-4',
      'group-data-[size=sm]/data-list:min-h-(--row-sm) group-data-[size=sm]/data-list:py-1.5',
      'group-data-[variant=framed]/data-list:[&+&]:rule-top',
      className,
    )}
    {...props}
  />;
}

function DataListLabel({className, ...props}: React.ComponentProps<'dt'>) {
  return <dt
    data-slot="data-list-label"
    className={cn('min-w-0 type-label text-start text-text-3 [overflow-wrap:anywhere] group-data-[size=sm]/data-list:type-label-sm', className)}
    {...props}
  />;
}

const isEmpty = (node: React.ReactNode) => node === null || node === undefined || node === false || (typeof node === 'string' && node.trim() === '');

function DataListValue({className, mono = false, numeric = false, children, ...props}: React.ComponentProps<'dd'> & {
  mono?: boolean;
  numeric?: boolean;
}) {
  return <dd
    data-slot="data-list-value"
    data-empty={isEmpty(children) || undefined}
    className={cn(
      'flex min-w-0 flex-wrap items-center gap-2 type-body text-start text-text-1 [overflow-wrap:anywhere]',
      'group-data-[size=sm]/data-list:type-body-sm',
      mono && 'type-tag',
      numeric && 'data',
      className,
    )}
    {...props}
  >{isEmpty(children) ? <DataListEmpty/> : children}</dd>;
}

function DataListEmpty({className, children = EMPTY_VALUE, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="data-list-empty" className={cn('font-sans text-text-3', className)} {...props}>{children}</span>;
}

export {DataList, DataListItem, DataListLabel, DataListValue, DataListEmpty, dataListVariants};

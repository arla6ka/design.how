import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const dataListVariants = cva('group/data-list @container/data-list min-w-0', {
  variants: {
    variant: {
      plain: '',
      framed: 'frame px-inset forced-colors:border-[CanvasText]',
    },
  },
  defaultVariants: {variant: 'plain'},
});

type DataListProps = React.ComponentProps<'dl'> & VariantProps<typeof dataListVariants> & {
  orientation?: 'horizontal' | 'vertical';
};

function DataList({className, variant = 'plain', orientation = 'horizontal', ...props}: DataListProps) {
  return <div data-slot="data-list-frame" data-variant={variant} data-orientation={orientation} className={cn(dataListVariants({variant}), className)}>
    <dl
      data-slot="data-list"
      className={cn('grid min-w-0 grid-cols-1', orientation === 'horizontal' && '@sm/data-list:grid-cols-[fit-content(var(--label-col))_minmax(0,1fr)] @sm/data-list:gap-x-6')}
      {...props}
    />
  </div>;
}

function DataListItem({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="data-list-item"
    className={cn(
      'col-span-full flex min-h-(--row) min-w-0 flex-col justify-center gap-x-6 gap-y-1 py-2.5',
      'group-data-[orientation=horizontal]/data-list:@sm/data-list:grid group-data-[orientation=horizontal]/data-list:@sm/data-list:grid-cols-subgrid group-data-[orientation=horizontal]/data-list:@sm/data-list:items-baseline',
      'group-data-[variant=framed]/data-list:rule-row',
      className,
    )}
    {...props}
  />;
}

function DataListLabel({className, ...props}: React.ComponentProps<'dt'>) {
  return <dt data-slot="data-list-label" className={cn('min-w-0 type-label-sm text-text-2 [overflow-wrap:anywhere]', className)} {...props}/>;
}

const isEmpty = (node: React.ReactNode) => node === null || node === undefined || node === false || (typeof node === 'string' && node.trim() === '');

type DataListValueProps = React.ComponentProps<'dd'> & {
  prose?: boolean;
};

function DataListValue({className, prose = false, children, ...props}: DataListValueProps) {
  const empty = isEmpty(children);
  return <dd
    data-slot="data-list-value"
    data-empty={empty || undefined}
    className={cn('flex min-w-0 flex-wrap items-center gap-2 text-text-1 [overflow-wrap:anywhere]', prose ? 'type-body-sm' : 'type-code', className)}
    {...props}
  >{empty ? <DataListEmpty/> : children}</dd>;
}

function DataListEmpty({className, children = 'None', ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="data-list-empty" className={cn('type-body-sm text-text-3', className)} {...props}>{children}</span>;
}

export {DataList, DataListItem, DataListLabel, DataListValue, DataListEmpty, dataListVariants, type DataListProps, type DataListValueProps};

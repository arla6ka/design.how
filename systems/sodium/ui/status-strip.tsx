'use client';

import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const stripVariants = cva('@container/strip min-w-0 overflow-hidden', {
  variants: {
    variant: {
      framed: 'border border-line bg-page forced-colors:border-[CanvasText]',
      plain: '',
    },
  },
  defaultVariants: {variant: 'framed'},
});

type StatusStripProps = React.ComponentProps<'div'> & VariantProps<typeof stripVariants> & {
  label?: string;
};

function StatusStrip({className, variant = 'framed', label, children, ...props}: StatusStripProps) {
  return <div data-slot="status-strip" data-variant={variant} role="group" aria-label={label} className={cn(stripVariants({variant}), className)} {...props}>
    <div data-slot="status-strip-cells" className="-me-px -mb-px grid grid-cols-[repeat(auto-fit,minmax(min(100%,var(--label-col)),1fr))]">
      {children}
    </div>
  </div>;
}

type StatusStripCellProps = useRender.ComponentProps<'div'> & {
  selected?: boolean;
};

function StatusStripCell({className, selected, render, ...props}: StatusStripCellProps) {
  const interactive = !!render || !!props.onClick;
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'relative flex min-w-0 flex-col justify-center gap-0.5 border-e border-b border-line px-inset py-inset text-start text-text-1',
          'transition-[background-color] duration-(--dur-state) ease-out',
          interactive && 'cursor-pointer select-none hover:bg-hover active:bg-pressed focus-visible:focus-ring-inset',
          selected && 'selected hover:bg-selected-strong active:bg-selected-strong',
          'forced-colors:data-selected:outline forced-colors:data-selected:outline-2 forced-colors:data-selected:-outline-offset-2',
          className,
        ),
      },
      {'data-slot': 'status-strip-cell', 'data-selected': selected ? '' : undefined, 'aria-current': selected ? 'true' : undefined} as React.ComponentProps<'div'>,
      props,
    ),
    render,
    state: {slot: 'status-strip-cell', selected},
  });
}

function StatusStripLabel({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="status-strip-label" className={cn('flex min-w-0 items-center gap-1.5 truncate type-label-sm text-text-2 [&_svg]:size-(--icon) [&_svg]:shrink-0', className)} {...props}/>;
}

function StatusStripValue({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="status-strip-value" className={cn(
    'flex min-w-0 items-baseline gap-1.5 truncate type-code text-text-1',
    '[&>[data-slot=status-mark]]:h-auto [&>[data-slot=status-mark]]:self-baseline [&>[data-slot=status-mark]]:[--marker:var(--cap)]',
    className,
  )} {...props}/>;
}

function StatusStripUnit({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="status-strip-unit" className={cn('text-text-2', className)} {...props}/>;
}

export {StatusStrip, StatusStripCell, StatusStripLabel, StatusStripValue, StatusStripUnit, stripVariants, type StatusStripProps, type StatusStripCellProps};

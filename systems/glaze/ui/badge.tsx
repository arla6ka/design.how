import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const badgeVariants = cva(
  [
    'inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1 overflow-hidden rounded-tag whitespace-nowrap data',
    '[&>svg]:pointer-events-none [&>svg]:size-(--icon-sm) [&>svg]:shrink-0',
    'forced-colors:border forced-colors:border-[CanvasText]',
  ],
  {
    variants: {
      variant: {
        neutral: 'bg-field text-text-1',
        outline: 'border border-line-control text-text-1',
        ok: 'bg-ok-tint text-ok-text',
        warn: 'bg-warn-tint text-warn-text',
        fail: 'bg-fail-tint text-fail-text',
      },
      size: {
        default: 'min-h-5 px-1.5 type-label-sm',
        sm: 'min-h-4 px-1 type-label-sm',
      },
    },
    defaultVariants: {variant: 'neutral', size: 'default'},
  },
);

type BadgeProps = useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & {
  count?: number;
  max?: number;
};

function Badge({className, variant = 'neutral', size = 'default', count, max = 99, render, children, ...props}: BadgeProps) {
  const capped = count !== undefined && count > max;
  const exact = count?.toLocaleString('en-US');
  const shown = count === undefined ? children : capped ? <><span aria-hidden>{max}+</span><span className="sr-only">{exact}</span></> : exact;
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {className: cn(badgeVariants({variant, size}), className), children: shown},
      {'data-slot': 'badge', 'data-variant': variant, 'data-size': size, title: capped ? exact : undefined} as React.ComponentProps<'span'>,
      props,
    ),
    render,
    state: {slot: 'badge', variant},
  });
}

export {Badge, badgeVariants, type BadgeProps};

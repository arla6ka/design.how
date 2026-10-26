import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const tagVariants = cva(
  [
    'inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1 overflow-hidden border whitespace-nowrap',
    '[&>svg]:pointer-events-none [&>svg]:size-(--icon) [&>svg]:shrink-0',
    'forced-colors:border-[CanvasText]',
  ],
  {
    variants: {
      variant: {
        neutral: 'border-line bg-well text-text-1',
        outline: 'border-line bg-page text-text-2',
        ok: 'border-ok bg-ok-tint text-ok-text',
        warn: 'border-warn bg-warn-tint text-warn-text',
        fail: 'border-fail bg-fail-tint text-fail-text',
      },
      size: {
        default: 'min-h-6 px-2 type-label-sm',
        sm: 'min-h-5 px-1.5 type-micro',
      },
    },
    defaultVariants: {variant: 'neutral', size: 'default'},
  },
);

type TagProps = useRender.ComponentProps<'span'> & VariantProps<typeof tagVariants> & {
  count?: number;
  max?: number;
};

function Tag({className, variant = 'neutral', size = 'default', count, max = 99, render, children, ...props}: TagProps) {
  const capped = count !== undefined && count > max;
  const exact = count?.toLocaleString('en-US');
  const shown = count === undefined ? children : capped ? <><span aria-hidden>{max}+</span><span className="sr-only">{exact}</span></> : exact;
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {className: cn(tagVariants({variant, size}), className), children: shown},
      {'data-slot': 'tag', 'data-variant': variant, 'data-size': size, title: capped ? exact : undefined} as React.ComponentProps<'span'>,
      props,
    ),
    render,
    state: {slot: 'tag', variant},
  });
}

export {Tag, tagVariants, type TagProps};

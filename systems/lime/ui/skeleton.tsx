import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const skeletonVariants = cva('block shrink-0 bg-surface-2', {
  variants: {
    shape: {
      text: 'h-3 w-full rounded-sm',
      circle: 'size-10 rounded-full',
      block: 'h-24 w-full rounded-panel',
    },
  },
  defaultVariants: {shape: 'text'},
});

type SkeletonProps = Omit<React.ComponentProps<'span'>, 'children'> & VariantProps<typeof skeletonVariants>;

function Skeleton({className, shape, ...props}: SkeletonProps) {
  return <span data-slot="skeleton" data-shape={shape ?? 'text'} aria-hidden="true" className={cn(skeletonVariants({shape}), className)} {...props}/>;
}

export {Skeleton, skeletonVariants, type SkeletonProps};

import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const badgeVariants = cva(
  'inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-control px-2.5 text-xs font-medium whitespace-nowrap [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-2 text-fg-2',
        accent: 'bg-accent-wash text-fg',
        outline: 'border border-line-strong text-fg-2',
        success: 'bg-success-tint text-success-text',
        warn: 'bg-warn-tint text-warn-text',
        danger: 'bg-danger-tint text-danger-text',
      },
    },
    defaultVariants: {variant: 'neutral'},
  },
);

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

function Badge({className, variant, ...props}: BadgeProps) {
  return <span data-slot="badge" className={cn(badgeVariants({variant}), className)} {...props}/>;
}

export {Badge, badgeVariants, type BadgeProps};

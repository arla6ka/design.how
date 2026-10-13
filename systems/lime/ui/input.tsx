'use client';

import {Input as InputPrimitive} from '@base-ui/react/input';
import {cva, type VariantProps} from 'class-variance-authority';
import {mergeClass} from '../lib/utils';

const fieldControl = cva(
  [
    'w-full min-w-0 rounded-field border border-line-strong bg-field px-3 text-fg',
    'placeholder:text-fg-3 hover:not-disabled:not-aria-invalid:border-control',
    'focus-visible:border-accent-line focus-visible:outline-offset-0',
    'aria-invalid:border-danger',
    'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled disabled:placeholder:text-fg-disabled',
  ],
  {
    variants: {
      size: {
        sm: 'h-(--control-sm) text-sm',
        md: 'h-(--control-md) text-sm',
        lg: 'h-(--control-lg) text-base',
      },
    },
    defaultVariants: {size: 'md'},
  },
);

type InputProps = Omit<InputPrimitive.Props, 'size'> & VariantProps<typeof fieldControl>;

function Input({className, size, type = 'text', ...props}: InputProps) {
  return <InputPrimitive data-slot="input" type={type} className={mergeClass(fieldControl({size}), className)} {...props}/>;
}

export {Input, fieldControl, type InputProps};

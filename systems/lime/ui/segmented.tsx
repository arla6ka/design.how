'use client';

import {Radio as RadioPrimitive} from '@base-ui/react/radio';
import {RadioGroup as RadioGroupPrimitive} from '@base-ui/react/radio-group';
import {cva, type VariantProps} from 'class-variance-authority';
import {createContext, useContext} from 'react';
import {mergeClass} from '../lib/utils';

const trackVariants = cva('inline-flex w-fit max-w-full items-stretch gap-0.5 rounded-control bg-surface-2 p-0.5', {
  variants: {
    size: {sm: 'h-(--control-sm)', md: 'h-(--control-md)'},
    fill: {true: 'flex w-full *:flex-1', false: ''},
  },
  defaultVariants: {size: 'md', fill: false},
});

const SizeContext = createContext<'sm' | 'md'>('md');

type SegmentedProps = Omit<RadioGroupPrimitive.Props, 'onValueChange'> & VariantProps<typeof trackVariants> & {
  onValueChange?: (value: string) => void;
};

function Segmented({className, size = 'md', fill, onValueChange, children, ...props}: SegmentedProps) {
  return (
    <SizeContext.Provider value={size ?? 'md'}>
      <RadioGroupPrimitive
        data-slot="segmented"
        onValueChange={value => onValueChange?.(value as string)}
        className={mergeClass(trackVariants({size, fill}), className)}
        {...props}
      >
        {children}
      </RadioGroupPrimitive>
    </SizeContext.Provider>
  );
}

function SegmentedItem({className, children, ...props}: RadioPrimitive.Root.Props) {
  const size = useContext(SizeContext);
  return (
    <RadioPrimitive.Root
      data-slot="segmented-item"
      className={mergeClass([
        'inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-control px-3 font-medium whitespace-nowrap text-fg-2 select-none',
        'transition-[background-color,color,box-shadow] duration-(--dur-fast) ease-out',
        'hover:not-data-disabled:not-data-checked:text-fg data-checked:bg-raised data-checked:text-fg data-checked:shadow-card',
        'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled',
        size === 'sm' ? 'text-xs' : 'text-sm',
      ], className)}
      {...props}
    >
      {typeof children === 'string' ? <span className="truncate">{children}</span> : children}
    </RadioPrimitive.Root>
  );
}

export {Segmented, SegmentedItem, trackVariants};

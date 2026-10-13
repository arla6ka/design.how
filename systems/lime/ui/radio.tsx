'use client';

import {Radio as RadioPrimitive} from '@base-ui/react/radio';
import {RadioGroup as RadioGroupPrimitive} from '@base-ui/react/radio-group';
import {mergeClass} from '../lib/utils';

function RadioGroup({className, ...props}: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={mergeClass('flex flex-col gap-3', className)} {...props}/>;
}

function Radio({className, ...props}: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      className={mergeClass([
        'inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-control bg-page',
        'transition-[background-color,border-color] duration-(--dur-fast) ease-out',
        'hover:not-data-disabled:border-fg-2',
        'data-checked:border-accent-line data-checked:bg-accent',
        'data-disabled:cursor-not-allowed data-disabled:border-line-strong data-disabled:bg-surface-2',
      ], className)}
      {...props}
    >
      <RadioPrimitive.Indicator data-slot="radio-indicator" className="size-2 rounded-full bg-on-accent data-disabled:bg-fg-disabled"/>
    </RadioPrimitive.Root>
  );
}

export {RadioGroup, Radio};

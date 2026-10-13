'use client';

import {Checkbox as CheckboxPrimitive} from '@base-ui/react/checkbox';
import {Checkmark, Subtract} from '../icon';
import {mergeClass} from '../lib/utils';

function Checkbox({className, ...props}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={mergeClass([
        'inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-control bg-page text-on-accent',
        'transition-[background-color,border-color] duration-(--dur-fast) ease-out',
        'hover:not-data-disabled:border-fg-2',
        'data-checked:not-data-disabled:border-accent-line data-checked:not-data-disabled:bg-accent data-indeterminate:not-data-disabled:border-accent-line data-indeterminate:not-data-disabled:bg-accent',
        'data-disabled:cursor-not-allowed data-disabled:border-line-strong data-disabled:bg-surface-2 data-disabled:text-fg-disabled',
        'data-checked:hover:not-data-disabled:bg-accent-hover data-indeterminate:hover:not-data-disabled:bg-accent-hover',
        'aria-invalid:not-data-disabled:border-danger!',
      ], className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center" keepMounted={false}>
        <CheckboxIcon/>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

function CheckboxIcon() {
  return (
    <>
      <Checkmark size={16} className="in-data-indeterminate:hidden"/>
      <Subtract size={16} className="hidden in-data-indeterminate:block"/>
    </>
  );
}

export {Checkbox};

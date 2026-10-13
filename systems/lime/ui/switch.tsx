'use client';

import {Switch as SwitchPrimitive} from '@base-ui/react/switch';
import {mergeClass} from '../lib/utils';

function Switch({className, ...props}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={mergeClass([
        'group/switch inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent bg-surface-3 p-0.5',
        'transition-[background-color] duration-(--dur-fast) ease-out',
        'hover:not-data-disabled:not-data-checked:bg-line-strong',
        'data-checked:bg-(--switch-on)',
        'data-disabled:cursor-not-allowed data-disabled:bg-surface-2',
      ], className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="block size-4 rounded-full bg-(--thumb) shadow-(--shadow-thumb) transition-[translate,background-color] duration-(--dur-fast) ease-out data-checked:translate-x-4 rtl:data-checked:-translate-x-4 data-checked:bg-(--switch-on-thumb) group-data-disabled/switch:shadow-none group-data-disabled/switch:bg-surface"
      />
    </SwitchPrimitive.Root>
  );
}

export {Switch};

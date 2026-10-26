'use client';

import {Switch as SwitchPrimitive} from '@base-ui/react/switch';
import {cn, mergeClass} from '../lib/utils';

type SwitchProps = SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
  pending?: boolean;
  'aria-invalid'?: boolean | 'true' | 'false';
};

function Switch({className, size = 'default', pending, readOnly, 'aria-invalid': invalid, ...props}: SwitchProps) {
  const isInvalid = invalid === true || invalid === 'true';
  return <SwitchPrimitive.Root
    data-slot="switch"
    data-size={size}
    data-pending={pending || undefined}
    aria-invalid={isInvalid || undefined}
    aria-busy={pending || undefined}
    readOnly={readOnly || pending}
    className={mergeClass([
      'group/switch peer relative inline-flex shrink-0 cursor-pointer items-center border border-line-control bg-check-off p-0.5 [-webkit-tap-highlight-color:transparent]',
      'light-motion',
      'after:absolute after:-inset-1',
      'data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7',
      'data-checked:checked',
      'hover:not-data-disabled:not-data-readonly:not-data-checked:bg-check-off-hover active:not-data-disabled:not-data-readonly:not-data-checked:bg-check-off',
      'aria-invalid:border-fail',
      'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-well',
      'data-readonly:cursor-default data-pending:cursor-progress',
      'forced-colors:border-[CanvasText] forced-colors:data-checked:bg-[Highlight]',
    ], className)}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        'pointer-events-none block bg-line-control',
        'data-checked:bg-(--check-mark)',
        'transition-[translate,background-color] duration-(--dur-light) ease-soft',
        'group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5',
        'group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3',
        'rtl:group-data-[size=default]/switch:data-checked:-translate-x-4 rtl:group-data-[size=sm]/switch:data-checked:-translate-x-3',
        'data-disabled:bg-text-disabled',
        'group-data-pending/switch:invisible',
        'forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] forced-colors:data-checked:bg-[HighlightText] forced-colors:data-disabled:bg-[GrayText]',
      )}
    />
    {pending && <span data-slot="switch-pending" aria-hidden className="pending absolute inset-0 m-auto text-text-2 group-data-checked/switch:text-(--check-mark)"/>}
  </SwitchPrimitive.Root>;
}

export {Switch, type SwitchProps};

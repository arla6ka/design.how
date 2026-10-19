'use client';

import {Switch as SwitchPrimitive} from '@base-ui/react/switch';
import {Icon, Pending} from '../icon';
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
      'group/switch peer relative inline-flex shrink-0 cursor-pointer items-center rounded-pill border border-transparent bg-(--switch-off) p-px focus-sm [-webkit-tap-highlight-color:transparent]',
      'transition-[background-color,border-color] duration-(--dur-state) ease-out',
      'after:absolute after:-inset-x-1 after:-inset-y-1',
      'data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7',
      'data-checked:glaze-sm',
      'hover:not-data-disabled:not-data-checked:bg-line-control',
      'aria-invalid:border-fail data-checked:aria-invalid:border-fail',
      'data-disabled:cursor-not-allowed data-disabled:border-transparent data-disabled:bg-field',
      'data-readonly:cursor-default data-pending:cursor-progress',
      'forced-colors:border-[CanvasText] forced-colors:data-checked:bg-[Highlight] forced-colors:data-disabled:border-[GrayText]',
    ], className)}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        'pointer-events-none grid place-content-center rounded-pill border border-line-control bg-(--switch-knob) text-(--switch-mark)',
        'data-checked:border-transparent data-checked:bg-(--glaze-sm-text) data-checked:text-text-2',
        'transition-[translate,scale,background-color] duration-(--dur-state) ease-out',
        'group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3',
        'group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3',
        'rtl:group-data-[size=default]/switch:data-checked:-translate-x-4 rtl:group-data-[size=sm]/switch:data-checked:-translate-x-3',
        'group-active/switch:not-data-disabled:not-data-readonly:scale-(--scale-press)',
        'data-disabled:border-line-faint data-disabled:bg-paper',
        'forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] forced-colors:data-checked:bg-[HighlightText] forced-colors:data-disabled:bg-[GrayText]',
      )}
    >
      {pending && <Icon icon={Pending} size={12} className={cn('animate-spin motion-reduce:animate-none', size === 'sm' && 'size-2.5')}/>}
    </SwitchPrimitive.Thumb>
  </SwitchPrimitive.Root>;
}

export {Switch, type SwitchProps};

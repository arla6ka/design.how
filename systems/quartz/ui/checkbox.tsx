'use client';

import {Checkbox as CheckboxPrimitive} from '@base-ui/react/checkbox';
import {CheckboxGroup as CheckboxGroupPrimitive} from '@base-ui/react/checkbox-group';
import {Icon, Checkmark, Subtract} from '../icon';
import {cn, mergeClass} from '../lib/utils';

type CheckboxProps = CheckboxPrimitive.Root.Props & {'aria-invalid'?: boolean | 'true' | 'false'};

function Checkbox({className, 'aria-invalid': invalid, onClick, ...props}: CheckboxProps) {
  const isInvalid = invalid === true || invalid === 'true';
  return <CheckboxPrimitive.Root
    data-slot="checkbox"
    data-status={isInvalid ? 'fail' : undefined}
    aria-invalid={isInvalid || undefined}
    onClick={event => { onClick?.(event); event.stopPropagation(); }}
    className={mergeClass([
      'peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-soft [-webkit-tap-highlight-color:transparent]',
      'bg-page text-text-inverse control-edge [--frame-color:var(--border-control)] transition-[background-color,box-shadow,outline-color] duration-(--dur-fast) ease-(--ease-step)',
      'not-pointer-coarse:after:absolute not-pointer-coarse:after:-inset-1.5 touch-target',
      'hover:not-data-disabled:not-data-readonly:not-data-checked:not-data-indeterminate:not-aria-invalid:[--frame-color:var(--ink)]',
      'data-checked:bg-ink data-indeterminate:bg-ink',
      'active:not-data-disabled:not-data-readonly:not-data-checked:not-data-indeterminate:bg-pressed active:not-data-disabled:not-data-readonly:data-checked:bg-button-primary-hover active:not-data-disabled:not-data-readonly:data-indeterminate:bg-button-primary-hover active:not-data-disabled:not-data-readonly:duration-(--dur-press)',
      'aria-invalid:[--frame-color:var(--fail-line)] aria-invalid:data-checked:bg-ink aria-invalid:data-indeterminate:bg-ink',
      'data-disabled:cursor-not-allowed data-disabled:bg-page data-disabled:[--frame-color:var(--text-disabled)] data-disabled:[--control-lift:var(--elev-none)] data-disabled:text-text-inverse',
      'data-disabled:data-checked:bg-text-disabled data-disabled:data-indeterminate:bg-text-disabled',
      'data-readonly:cursor-default',
      'forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]',
      'forced-colors:data-checked:[forced-color-adjust:none] forced-colors:data-checked:bg-[Highlight]! forced-colors:data-checked:text-[HighlightText]!',
      'forced-colors:data-indeterminate:[forced-color-adjust:none] forced-colors:data-indeterminate:bg-[Highlight]! forced-colors:data-indeterminate:text-[HighlightText]!',
      'forced-colors:data-disabled:border-[GrayText] forced-colors:data-disabled:data-checked:bg-[GrayText]!',
    ], className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-slot="checkbox-indicator"
      className="grid place-content-center text-current"
      render={(indicatorProps, state) => <span {...indicatorProps}>
        <Icon icon={state.indeterminate ? Subtract : Checkmark} size={12}/>
      </span>}
    />
  </CheckboxPrimitive.Root>;
}

function CheckboxGroup({className, ...props}: CheckboxGroupPrimitive.Props) {
  return <CheckboxGroupPrimitive data-slot="checkbox-group" className={mergeClass('flex flex-col gap-2', className)} {...props}/>;
}

export {Checkbox, CheckboxGroup, type CheckboxProps};

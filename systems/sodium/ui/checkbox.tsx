'use client';

import {Checkbox as CheckboxPrimitive} from '@base-ui/react/checkbox';
import {CheckboxGroup as CheckboxGroupPrimitive} from '@base-ui/react/checkbox-group';
import {cn} from '../lib/utils';

type CheckboxProps = CheckboxPrimitive.Root.Props & {'aria-invalid'?: boolean | 'true' | 'false'};

const base = [
  'peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center [-webkit-tap-highlight-color:transparent]',
  'after:absolute after:-inset-1.5',
  'data-disabled:cursor-not-allowed data-readonly:cursor-default',
  'light-motion',
].join(' ');

const ticked = 'checked data-disabled:border-line data-disabled:bg-well data-disabled:text-text-disabled forced-colors:[forced-color-adjust:none] forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]';
const clear = [
  'border border-line-control bg-check-off',
  'hover:not-data-disabled:not-data-readonly:bg-check-off-hover active:not-data-disabled:not-data-readonly:bg-check-off',
  'aria-invalid:border-fail',
  'data-disabled:border-line data-disabled:bg-well',
  'forced-colors:border-[CanvasText]',
].join(' ');

function Tick() {
  return <svg data-slot="checkbox-tick" viewBox="0 0 10 10" className="size-2.5" aria-hidden fill="none">
    <path d="M1.5 5.25 4 7.75 8.75 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
  </svg>;
}

function Checkbox({className, 'aria-invalid': invalid, onClick, ...props}: CheckboxProps) {
  const isInvalid = invalid === true || invalid === 'true';
  return <CheckboxPrimitive.Root
    data-slot="checkbox"
    aria-invalid={isInvalid || undefined}
    onClick={event => { onClick?.(event); event.stopPropagation(); }}
    className={state => cn(base, state.checked || state.indeterminate ? ticked : clear, typeof className === 'function' ? className(state) : className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      data-slot="checkbox-indicator"
      className="grid place-content-center text-current"
      render={(indicatorProps, state) => <span {...indicatorProps}>
        {state.indeterminate
          ? <span data-slot="checkbox-dash" className="block h-0.5 w-2 bg-current"/>
          : <Tick/>}
      </span>}
    />
  </CheckboxPrimitive.Root>;
}

function CheckboxGroup({className, ...props}: CheckboxGroupPrimitive.Props) {
  return <CheckboxGroupPrimitive
    data-slot="checkbox-group"
    className={state => cn('flex flex-col gap-2', typeof className === 'function' ? className(state) : className)}
    {...props}
  />;
}

export {Checkbox, CheckboxGroup, type CheckboxProps};

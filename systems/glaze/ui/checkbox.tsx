'use client';

import {Checkbox as CheckboxPrimitive} from '@base-ui/react/checkbox';
import {CheckboxGroup as CheckboxGroupPrimitive} from '@base-ui/react/checkbox-group';
import {Icon, Check} from '../icon';
import {cn} from '../lib/utils';

type CheckboxProps = CheckboxPrimitive.Root.Props & {'aria-invalid'?: boolean | 'true' | 'false'};

const base = [
  'peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-tag focus-sm [-webkit-tap-highlight-color:transparent]',
  'after:absolute after:-inset-1.5',
  'data-disabled:cursor-not-allowed data-readonly:cursor-default',
  'forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]',
].join(' ');

const ticked = 'glaze-sm forced-colors:[forced-color-adjust:none] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]';
const clear = [
  'border border-line-strong bg-paper transition-[border-color,background-color] duration-(--dur-state) ease-out',
  'hover:not-data-disabled:not-data-readonly:not-aria-invalid:border-text-2 active:not-data-disabled:not-data-readonly:bg-pressed',
  'aria-invalid:border-fail',
  'data-disabled:border-line-control data-disabled:bg-field',
].join(' ');

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
      className="tick-draw grid place-content-center text-current"
      render={(indicatorProps, state) => <span {...indicatorProps}>
        {state.indeterminate
          ? <span data-slot="checkbox-dash" className="block h-0.5 w-2 rounded-pill bg-current"/>
          : <Icon icon={Check} size={12} weight="bold"/>}
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

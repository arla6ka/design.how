'use client';

import {Radio as RadioPrimitive} from '@base-ui/react/radio';
import {RadioGroup as RadioGroupPrimitive} from '@base-ui/react/radio-group';
import {useId, type ReactNode} from 'react';
import {cn} from '../lib/utils';

type RadioGroupProps = RadioGroupPrimitive.Props & {'aria-invalid'?: boolean | 'true' | 'false'};

function RadioGroup({className, 'aria-invalid': invalid, ...props}: RadioGroupProps) {
  const isInvalid = invalid === true || invalid === 'true';
  return <RadioGroupPrimitive
    data-slot="radio-group"
    data-invalid={isInvalid || undefined}
    aria-invalid={isInvalid || undefined}
    className={state => cn('group/radio-group grid w-full gap-3', typeof className === 'function' ? className(state) : className)}
    {...props}
  />;
}

const base = [
  'peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center [-webkit-tap-highlight-color:transparent]',
  'after:absolute after:-inset-1.5',
  'data-disabled:cursor-not-allowed data-readonly:cursor-default',
  'light-motion',
].join(' ');
const chosen = 'checked data-disabled:border-line data-disabled:bg-well data-disabled:text-text-disabled forced-colors:[forced-color-adjust:none] forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]';
const open = [
  'border border-line-control bg-check-off',
  'hover:not-data-disabled:not-data-readonly:bg-check-off-hover active:not-data-disabled:not-data-readonly:bg-check-off',
  'group-data-invalid/radio-group:border-fail',
  'data-disabled:border-line data-disabled:bg-well',
  'forced-colors:border-[CanvasText]',
].join(' ');

function RadioGroupItem({className, ...props}: RadioPrimitive.Root.Props) {
  return <RadioPrimitive.Root
    data-slot="radio-group-item"
    className={state => cn(base, state.checked ? chosen : open, typeof className === 'function' ? className(state) : className)}
    {...props}
  >
    <RadioPrimitive.Indicator data-slot="radio-group-indicator" className="size-1.5 bg-current forced-colors:bg-[HighlightText]"/>
  </RadioPrimitive.Root>;
}

type RadioGroupOptionProps = Omit<RadioPrimitive.Root.Props, 'children' | 'className'> & {
  className?: string;
  label: ReactNode;
  description?: ReactNode;
};

function RadioGroupOption({label, description, className, ...props}: RadioGroupOptionProps) {
  const id = useId();
  return <label data-slot="radio-group-option" className={cn('flex cursor-pointer items-start gap-3 has-data-disabled:cursor-not-allowed', className)}>
    <RadioGroupItem aria-labelledby={`${id}-l`} aria-describedby={description ? `${id}-d` : undefined} {...props}/>
    <span className="flex min-w-0 flex-col gap-1 peer-data-disabled:*:text-text-disabled">
      <span id={`${id}-l`} className="type-label text-text-1">{label}</span>
      {description && <span id={`${id}-d`} className="type-caption text-text-2">{description}</span>}
    </span>
  </label>;
}

export {RadioGroup, RadioGroupItem, RadioGroupOption, type RadioGroupProps, type RadioGroupOptionProps};

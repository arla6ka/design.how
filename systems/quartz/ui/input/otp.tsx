'use client';

import {useId, useState} from 'react';
import {OTPField as OTPFieldPrimitive} from '@base-ui/react/otp-field';
import {cn} from '../../lib/utils';
import {splitBox, useControllable, useOff, type BoxProps} from './parts';

type OtpModeProps = Pick<BoxProps, 'size' | 'className'> & {
  mode: 'otp';
  length: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  groups?: number[];
  validationType?: OTPFieldPrimitive.Root.Props['validationType'];
  normalizeValue?: (value: string) => string;
  inputMode?: OTPFieldPrimitive.Root.Props['inputMode'];
  name?: string;
  id?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

function OtpMode({
  mode: _mode, size = 'default', className, length, value, defaultValue = '', onValueChange, onComplete, groups, validationType = 'numeric',
  normalizeValue, inputMode, name, id, disabled: disabledProp, autoFocus, 'aria-label': ariaLabel, 'aria-describedby': describedBy, 'aria-invalid': ariaInvalid, ...all
}: OtpModeProps) {
  const disabled = useOff(disabledProp);
  const labelId = useId();
  const {box} = splitBox(all as Record<string, unknown>);
  const [current, set] = useControllable(value, defaultValue, onValueChange);
  const [rejected, setRejected] = useState('');
  const split = groups ?? (length >= 6 && length % 2 === 0 ? [length / 2, length / 2] : [length]);
  const starts = split.map((_, i) => split.slice(0, i).reduce((a, b) => a + b, 0));
  const slot = cn(
    'min-w-0 rounded-soft bg-page control-edge text-center data text-text-1 caret-ink outline-none forced-colors:border',
    'transition-[background-color,box-shadow,outline-color] duration-(--dur-fast) ease-(--ease-step)',
    'focus-visible:[--frame-color:var(--border-focus)]! focus-visible:[--control-lift:var(--focus-halo)]! data-filled:not-data-invalid:[--frame-color:var(--line-control-hover)]',
    'hover:not-data-disabled:not-data-invalid:[--frame-color:var(--line-control-hover)]',
    'in-data-[status=fail]:[--frame-color:var(--fail-line)]! data-invalid:[--frame-color:var(--fail-line)]',
    'data-disabled:cursor-not-allowed data-disabled:text-text-disabled data-disabled:[--frame-color:var(--line-row)] data-disabled:[--control-lift:var(--elev-none)]',
    size === 'sm' ? 'h-(--control-sm) w-7 type-label pointer-coarse:text-base' : size === 'lg' ? 'h-(--control-lg) w-10 type-heading-sm' : 'h-(--control) w-8 type-label pointer-coarse:text-base',
  );
  return <OTPFieldPrimitive.Root
    data-slot="input"
    data-mode="otp"
    data-size={size}
    data-status={ariaInvalid ? 'fail' : undefined}
    length={length}
    value={current}
    onValueChange={v => { set(v); setRejected(''); }}
    onValueComplete={v => onComplete?.(v)}
    onValueInvalid={() => setRejected(validationType === 'numeric' ? 'Digits only' : validationType === 'alpha' ? 'Letters only' : 'Letters and digits only')}
    validationType={validationType}
    normalizeValue={normalizeValue}
    inputMode={inputMode}
    name={name}
    id={id}
    disabled={disabled}
    className={cn('flex w-fit items-center gap-2 data-disabled:cursor-not-allowed', className)}
    dir="ltr"
    {...box}
  >
    {split.map((count, g) => <span key={g} className="contents">
      {g > 0 && <OTPFieldPrimitive.Separator data-slot="input-otp-separator" className="h-0.5 w-2 shrink-0 bg-text-3"/>}
      <span data-slot="input-otp-group" className="flex items-center gap-1">
        {Array.from({length: count}, (_, i) => {
          const index = starts[g] + i;
          return <OTPFieldPrimitive.Input
            key={index}
            data-slot="input-otp-slot"
            data-control=""
            autoFocus={autoFocus && index === 0}
            aria-label={index === 0 ? undefined : `Character ${index + 1} of ${length}`}
            aria-labelledby={index === 0 && ariaLabel ? labelId : undefined}
            aria-describedby={index === 0 ? describedBy : undefined}
            aria-invalid={ariaInvalid || undefined}
            className={slot}
          />;
        })}
      </span>
    </span>)}
    {ariaLabel && <span id={labelId} className="sr-only">{ariaLabel}</span>}
    <span role="status" className="sr-only">{rejected}</span>
  </OTPFieldPrimitive.Root>;
}

export {OtpMode, type OtpModeProps};

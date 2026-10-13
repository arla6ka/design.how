'use client';

import {useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FocusEvent} from 'react';
import {Icon, View, ViewOff} from '../../icon';
import {cn, mergeRefs} from '../../lib/utils';
import {EMPTY_VALUE} from '../../lib/format';
import {CopyButton} from '../copy-button';
import {InputAction, InputControl, InputPrefix, InputRoot, InputSuffix, actionClass, splitBox, useControllable, useOff, type BoxProps, type NativeProps, type StringValue} from './parts';

type SecretModeProps = BoxProps & NativeProps & StringValue & {
  mode: 'secret';
  noun?: string;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  hideOnBlur?: boolean;
  hideAfter?: number;
  redacted?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  tail?: number;
};

function keyPrefixLength(value: string) {
  const head = value.slice(0, 12);
  return Math.max(head.lastIndexOf('_'), head.lastIndexOf('-')) + 1;
}

function maskSecret(value: string, tail = 4, capacity = Infinity) {
  const prefix = keyPrefixLength(value);
  if (value.length <= prefix + tail) return '•'.repeat(value.length);
  const hidden = value.length - prefix - tail;
  const floor = Math.min(4, hidden);
  let head = prefix;
  let dots = hidden;
  if (head + dots + tail > capacity) dots = Math.max(floor, capacity - head - tail);
  if (head + dots + tail > capacity) { head = 0; dots = Math.max(floor, Math.min(hidden + prefix, capacity - tail)); }
  return value.slice(0, head) + '•'.repeat(dots) + value.slice(-tail);
}

function useCapacity(ref: {current: HTMLInputElement | null}) {
  const [capacity, setCapacity] = useState(Infinity);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const char = ctx.measureText('0').width;
      const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (char > 0 && room > 0) setCapacity(Math.floor(room / char));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return capacity;
}

function SecretMode({
  mode: _mode, size = 'default', prefix, suffix: _suffix, className, controlClassName, value, defaultValue = '', onValueChange, onChange,
  noun = 'value', revealed: revealedProp, defaultRevealed = false, onRevealedChange, hideOnBlur = false, hideAfter, redacted = false,
  copyable, onCopy, tail = 4, disabled: disabledProp, readOnly: readOnlyProp, onBlur, ref, ...all
}: SecretModeProps) {
  const disabled = useOff(disabledProp);
  const {box, rest} = splitBox(all);
  const readOnly = readOnlyProp || redacted;
  const [current, set] = useControllable(value, defaultValue, onValueChange);
  const [revealed, setRevealed] = useControllable(revealedProp, defaultRevealed, onRevealedChange);
  const shown = revealed && !redacted;
  const after = hideAfter ?? (readOnly ? 30_000 : 0);
  const describe = useId();

  useEffect(() => {
    if (!shown || !after) return;
    const t = setTimeout(() => setRevealed(false), after);
    return () => clearTimeout(t);
  }, [shown, after]); // eslint-disable-line react-hooks/exhaustive-deps

  const control = useRef<HTMLInputElement | null>(null);
  const capacity = useCapacity(control);
  const setControl = useMemo(() => mergeRefs<HTMLInputElement>(control, ref), [ref]);
  const display = readOnly && !shown ? maskSecret(current, tail, capacity) : current;
  const shrunk = display.length < current.length;
  const canCopy = (copyable ?? readOnly) && !redacted;
  return <InputRoot
    size={size}
    disabled={disabled}
    readOnly={readOnly}
    invalid={rest['aria-invalid'] === true || rest['aria-invalid'] === 'true'}
    className={cn('data-revealed:not-data-readonly:[--frame-color:var(--accent-line)]', className)}
    data-mode="secret"
    data-kind={shown ? 'key' : undefined}
    data-revealed={shown || undefined}
    data-redacted={redacted || undefined}
    onBlur={(e: FocusEvent<HTMLDivElement>) => { if (hideOnBlur && shown && !e.currentTarget.contains(e.relatedTarget)) setRevealed(false); }}
    {...box}
  >
    {prefix !== undefined && <InputPrefix>{prefix}</InputPrefix>}
    <InputControl
      {...rest}
      ref={setControl}
      type={readOnly || shown ? 'text' : 'password'}
      value={display}
      onChange={(e: ChangeEvent<HTMLInputElement>) => { set(e.target.value); onChange?.(e as never); }}
      onBlur={onBlur}
      disabled={disabled}
      readOnly={readOnly}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      data-1p-ignore=""
      data-lpignore="true"
      data-bwignore=""
      aria-describedby={cn(rest['aria-describedby'] as string | undefined, readOnly && !shown && current && describe) || undefined}
      placeholder={readOnly ? EMPTY_VALUE : rest.placeholder as string | undefined}
      className={cn('type-code pointer-coarse:type-code-touch', redacted && 'text-text-2', controlClassName)}
    />
    {readOnly && !shown && current && <span id={describe} className="sr-only">{`Hidden, ending in ${current.slice(-tail)}${shrunk ? `, ${current.length} characters` : ''}`}</span>}
    {(!redacted || canCopy) && !(readOnly && !current) && <InputSuffix>
      {!redacted && <InputAction
        disabled={disabled}
        aria-pressed={shown}
        aria-label={`${shown ? 'Hide' : 'Show'} ${noun}`}
        onClick={() => setRevealed(!shown)}
      ><Icon icon={shown ? ViewOff : View} size={16}/></InputAction>}
      {canCopy && <CopyButton value={current} label={noun} disabled={disabled} onCopy={onCopy} className={actionClass(size)}/>}
    </InputSuffix>}
  </InputRoot>;
}

export {SecretMode, maskSecret, type SecretModeProps};

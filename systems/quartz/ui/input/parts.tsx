'use client';

import {createContext, useContext, useState, type ComponentProps, type PointerEvent, type ReactNode, type Ref} from 'react';
import {Input as InputPrimitive} from '@base-ui/react/input';
import {Button, type ButtonProps} from '../button';
import {fieldBoxVariants, useFieldDisabled, type ControlSize} from '../field';
import {cn, mergeClass} from '../../lib/utils';

const SizeContext = createContext<ControlSize>('default');

function useOff(disabled?: boolean) {
  const inField = useFieldDisabled();
  return !!disabled || inField;
}

type InputRootProps = ComponentProps<'div'> & {
  size?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
};

function InputRoot({size = 'default', disabled: disabledProp, readOnly, invalid, className, onPointerDown, children, ...props}: InputRootProps) {
  const disabled = useOff(disabledProp);
  const down = (e: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, [role=button]')) return;
    const control = e.currentTarget.querySelector<HTMLElement>('[data-control]');
    if (!control || disabled) return;
    e.preventDefault();
    control.focus();
  };
  return <SizeContext.Provider value={size}>
    <div
      data-slot="input"
      data-size={size}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-status={invalid ? 'fail' : undefined}
      onPointerDown={down}
      className={cn(fieldBoxVariants({size}), 'cursor-text data-readonly:cursor-default', className)}
      {...props}
    >{children}</div>
  </SizeContext.Provider>;
}

function InputPrefix({className, ...props}: ComponentProps<'span'>) {
  return <span
    data-slot="input-prefix"
    className={cn(
      'flex shrink-0 items-center gap-2 ps-3 type-label pointer-coarse:text-base text-text-3 select-none group-data-[size=sm]/field-box:ps-2 group-data-[size=lg]/field-box:ps-4 has-[button]:ps-1 group-data-[size=sm]/field-box:has-[button]:ps-1 group-data-[size=lg]/field-box:has-[button]:ps-1',
      '[&_svg]:text-text-2 group-data-disabled/field-box:text-text-disabled group-has-[[data-control]:disabled]/field-box:text-text-disabled',
      '[unicode-bidi:plaintext]',
      className,
    )}
    {...props}
  />;
}

function InputSuffix({className, ...props}: ComponentProps<'span'>) {
  return <span
    data-slot="input-suffix"
    className={cn(
      'flex shrink-0 items-center gap-0.5 pe-3 type-label pointer-coarse:text-base text-text-3 select-none group-data-[size=sm]/field-box:pe-2 group-data-[size=lg]/field-box:pe-4 has-[button]:pe-1 group-data-[size=sm]/field-box:has-[button]:pe-1 group-data-[size=lg]/field-box:has-[button]:pe-1',
      '[&_svg]:text-text-2 group-data-disabled/field-box:text-text-disabled group-has-[[data-control]:disabled]/field-box:text-text-disabled',
      '[unicode-bidi:plaintext]',
      className,
    )}
    {...props}
  />;
}

function InputControl({className, ...props}: InputPrimitive.Props) {
  return <InputPrimitive
    data-slot="input-control"
    data-control=""
    className={mergeClass([
      'h-full w-full min-w-0 flex-1 bg-transparent px-3 text-inherit placeholder:text-text-3',
      'group-data-[size=sm]/field-box:px-2 group-data-[size=lg]/field-box:px-4',
      'group-has-[[data-slot=input-prefix]]/field-box:ps-2 group-has-[[data-slot=input-suffix]]/field-box:pe-2',
      'disabled:cursor-not-allowed disabled:placeholder:text-text-disabled read-only:cursor-default',
      'file:me-3 file:h-6 file:cursor-pointer file:rounded-inner file:border-0 file:bg-pressed file:px-2 file:type-label-sm file:text-text-1',
    ], className)}
    {...props}
  />;
}

function actionClass(box: ControlSize, icon = true) {
  if (icon) return cn('rounded-inner', box === 'sm' ? 'size-5' : box === 'lg' ? 'size-9' : 'size-6');
  return cn('rounded-inner', box === 'sm' ? 'h-5 px-2 type-label-sm' : box === 'lg' ? 'h-9' : 'h-6 px-2');
}

function fieldActionClass(box?: ControlSize) {
  return cn(
    'relative flex shrink-0 items-center justify-center rounded-inner text-text-2 touch-target',
    box === undefined ? 'size-6 group-data-[size=sm]/field-box:size-5 group-data-[size=lg]/field-box:size-9' : box === 'sm' ? 'size-5' : box === 'lg' ? 'size-9' : 'size-6',
    'transition-colors duration-(--dur-fast) ease-(--ease-step) motion-reduce:transition-none',
    'hover:not-data-disabled:bg-hover hover:not-data-disabled:text-text-1 data-disabled:text-text-disabled',
  );
}

function InputAction({className, size, variant = 'ghost', ...props}: Omit<ButtonProps, 'size'> & {size?: 'icon' | 'text'}) {
  const box = useContext(SizeContext);
  const icon = (size ?? 'icon') === 'icon';
  return <Button
    data-slot="input-action"
    variant={variant}
    size={icon ? 'icon-sm' : 'sm'}
    className={mergeClass([
      variant === 'ghost' && 'bg-transparent hover:not-data-disabled:bg-hover',
      actionClass(box, icon),
    ], className)}
    {...props}
  />;
}

function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const set = (next: T) => { if (value === undefined) setInner(next); onChange?.(next); };
  return [current, set] as const;
}

type BoxProps = {
  size?: ControlSize;
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
  controlClassName?: string;
  ref?: Ref<HTMLInputElement>;
};

type NativeProps = Omit<InputPrimitive.Props, 'size' | 'prefix' | 'className' | 'type' | 'value' | 'defaultValue' | 'onValueChange' | 'ref'>;
type StringValue = {value?: string; defaultValue?: string; onValueChange?: (value: string) => void};

function splitBox<T extends Record<string, unknown>>(props: T) {
  const box: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) (k.startsWith('data-force-') || k === 'data-kind' || k === 'style' ? box : rest)[k] = v;
  return {box, rest: rest as T};
}

export {
  InputAction, InputControl, InputPrefix, InputRoot, InputSuffix, SizeContext, actionClass, fieldActionClass, splitBox, useControllable, useOff,
  type BoxProps, type InputRootProps, type NativeProps, type StringValue,
};

'use client';

import {useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps} from 'react';
import {Input as InputPrimitive} from '@base-ui/react/input';
import {cn, mergeRefs} from '../lib/utils';

type TextareaProps = ComponentProps<'textarea'> & {
  autoGrow?: boolean;
  minRows?: number;
  maxRows?: number;
  resizable?: boolean;
  limit?: number;
  onValueChange?: (value: string) => void;
};

const supportsFieldSizing = () => typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');
const fmt = new Intl.NumberFormat('en-US');

function Textarea({className, autoGrow = false, rows, minRows = rows ?? 3, maxRows = 10, resizable = false, limit, style, value, defaultValue, onChange, onValueChange, ref: callerRef, ...props}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const setRef = useMemo(() => mergeRefs(ref, callerRef), [callerRef]);
  const counterId = useId();
  const [length, setLength] = useState(() => String(value ?? defaultValue ?? '').length);
  const [fallback, setFallback] = useState(false);

  useEffect(() => { setFallback(autoGrow && !supportsFieldSizing()); }, [autoGrow]);
  useEffect(() => { if (value !== undefined) setLength(String(value).length); }, [value]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!fallback || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  });

  const over = limit !== undefined && length > limit;
  const near = limit !== undefined && length >= Math.floor(limit * 0.8);
  const left = limit !== undefined ? limit - length : 0;
  const invalid = over || props['aria-invalid'] === true || props['aria-invalid'] === 'true';
  const primitiveProps = props as unknown as Omit<InputPrimitive.Props, 'className' | 'style'>;

  const textarea = <InputPrimitive
    {...primitiveProps}
    data-slot="textarea"
    data-control=""
    data-auto-grow={autoGrow || undefined}
    render={<textarea ref={setRef} rows={minRows}/>}
    value={value as string | undefined}
    defaultValue={defaultValue as string | undefined}
    onChange={(e: ChangeEvent<HTMLInputElement>) => {
      const el = e.target as unknown as HTMLTextAreaElement;
      setLength(el.value.length);
      onChange?.(e as unknown as ChangeEvent<HTMLTextAreaElement>);
      onValueChange?.(el.value);
    }}
    aria-invalid={invalid || undefined}
    aria-describedby={cn(props['aria-describedby'], limit !== undefined && counterId) || undefined}
    style={autoGrow
      ? {minHeight: `calc(${minRows}lh + 2 * var(--space-2) + 2 * var(--line-width))`, maxHeight: `calc(${maxRows}lh + 2 * var(--space-2) + 2 * var(--line-width))`, ...style}
      : {height: `calc(${minRows}lh + 2 * var(--space-2) + 2 * var(--line-width))`, ...style}}
    className={cn(
      'block w-full min-w-0 rounded-overlay border border-line-control bg-paper px-3 py-2 type-body-sm text-text-1 placeholder:text-text-3',
      'transition-[border-color,background-color,color] duration-(--dur-state) ease-out',
      'focus:not-aria-invalid:border-line-focus focus-visible:not-aria-invalid:border-line-focus aria-invalid:border-fail',
      'disabled:cursor-not-allowed disabled:border-line-faint disabled:bg-field disabled:text-text-disabled disabled:placeholder:text-text-disabled',
      'read-only:cursor-default read-only:not-focus:border-line-faint',
      autoGrow && 'field-sizing-content [contain:inline-size]',
      resizable && !autoGrow ? 'resize-y' : 'resize-none',
      limit === undefined && className,
    )}
  />;

  if (limit === undefined) return textarea;
  return <div data-slot="textarea-limit" className={cn('flex w-full min-w-0 flex-col gap-1', className)}>
    {textarea}
    <p
      id={counterId}
      data-slot="textarea-counter"
      data-status={over ? 'fail' : undefined}
      className={cn('self-end type-caption text-text-2 data-[status=fail]:text-fail-text', !near && 'sr-only')}
    >
      {over ? `${fmt.format(-left)} over the ${fmt.format(limit)} limit` : `${fmt.format(left)} left`}
    </p>
    <span role="status" className="sr-only">{over ? `Over the ${fmt.format(limit)} character limit` : near ? 'Near the character limit' : ''}</span>
  </div>;
}

export {Textarea, type TextareaProps};

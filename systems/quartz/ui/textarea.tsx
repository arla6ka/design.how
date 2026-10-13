'use client';

import {useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps} from 'react';
import {Input as InputPrimitive} from '@base-ui/react/input';
import {fieldControlVariants} from './field';
import {cn, mergeRefs} from '../lib/utils';

type TextareaProps = ComponentProps<'textarea'> & {
  maxRows?: number;
  minRows?: number;
  resizable?: boolean;
  limit?: number;
  onValueChange?: (value: string) => void;
};

const supportsFieldSizing = () => typeof CSS !== 'undefined' && CSS.supports('field-sizing', 'content');

function Textarea({className, maxRows = 12, rows, minRows = rows ?? 3, resizable = false, limit, style, value, defaultValue, onChange, onValueChange, ref: callerRef, ...props}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const setRef = useMemo(() => mergeRefs(ref, callerRef), [callerRef]);
  const counterId = useId();
  const [length, setLength] = useState(() => String(value ?? defaultValue ?? '').length);
  const [fallback, setFallback] = useState(false);

  useEffect(() => { setFallback(!supportsFieldSizing()); }, []);
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
  const primitiveProps = props as unknown as Omit<InputPrimitive.Props, 'className' | 'style'>;
  const invalid = over || props['aria-invalid'] === true || props['aria-invalid'] === 'true';

  const textarea = <InputPrimitive
    {...primitiveProps}
    data-slot="textarea"
    data-status={invalid ? 'fail' : undefined}
    render={<textarea ref={setRef}/>}
    value={value as string | undefined}
    defaultValue={defaultValue as string | undefined}
    onChange={(e: ChangeEvent<HTMLInputElement>) => { const el = e.target as unknown as HTMLTextAreaElement; setLength(el.value.length); onChange?.(e as unknown as ChangeEvent<HTMLTextAreaElement>); onValueChange?.(el.value); }}
    aria-invalid={invalid || undefined}
    aria-describedby={cn(props['aria-describedby'], limit !== undefined && counterId) || undefined}
    style={{
      minHeight: `calc(${minRows}lh + 2 * var(--space-2))`,
      maxHeight: `calc(${maxRows}lh + 2 * var(--space-2))`,
      ...style,
    }}
    className={cn(
      fieldControlVariants({size: 'default'}),
      'h-auto w-full min-w-48 [contain:inline-size] field-sizing-content px-3 py-2 leading-5! pointer-coarse:text-base',
      'scroll-fade-y focus-visible:mask-none',
      resizable ? 'resize-y' : 'resize-none',
      'read-only:cursor-default',
      limit === undefined && className,
    )}
  />;

  if (limit === undefined) return textarea;
  return <div data-slot="textarea-limit" className={cn('relative flex w-full min-w-0 flex-col gap-1', className)}>
    {textarea}
    <p
      id={counterId}
      data-slot="textarea-counter"
      data-status={over ? 'fail' : undefined}
      data-near={near || undefined}
      className={cn(
        'flex items-center justify-end gap-2 self-end type-label-sm text-text-3',
        !near && 'sr-only',
        over && 'text-text-1',
        'data-[status=fail]:text-fail-text',
      )}
    >
      {over ? `${(-left).toLocaleString('en-US')} over the ${limit.toLocaleString('en-US')} limit` : `${left.toLocaleString('en-US')} left`}
    </p>
    <span role="status" className="sr-only">{over ? `Over the ${limit} character limit` : near ? 'Near the character limit' : ''}</span>
  </div>;
}

export {Textarea, type TextareaProps};

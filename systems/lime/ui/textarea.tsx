'use client';

import {Input as InputPrimitive} from '@base-ui/react/input';
import {mergeProps} from '@base-ui/react/merge-props';
import type {VariantProps} from 'class-variance-authority';
import {useCallback, useLayoutEffect, useRef} from 'react';
import {mergeClass} from '../lib/utils';
import {fieldControl} from './input';

type TextareaProps = Omit<React.ComponentProps<'textarea'>, 'className'> & VariantProps<typeof fieldControl> & {
  className?: InputPrimitive.Props['className'];
  autoGrow?: boolean;
};

function Textarea({className, size, autoGrow, onInput, value, defaultValue, ref, ...props}: TextareaProps) {
  const own = useRef<HTMLTextAreaElement | null>(null);
  const grow = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  const setRef = useCallback((el: HTMLElement | null) => {
    const area = el as HTMLTextAreaElement | null;
    own.current = area;
    if (typeof ref === 'function') ref(area);
    else if (ref) ref.current = area;
  }, [ref]);
  useLayoutEffect(() => { if (autoGrow) grow(own.current); }, [autoGrow, value, grow]);
  return (
    <InputPrimitive
      ref={setRef}
      data-slot="textarea"
      value={value}
      defaultValue={defaultValue}
      className={mergeClass([fieldControl({size}), 'block h-auto min-h-20 resize-y py-2', autoGrow && 'max-h-60 resize-none'], className)}
      render={inputProps => <textarea {...mergeProps<'textarea'>(inputProps, props, {
        onInput: e => { if (autoGrow) grow(e.currentTarget); onInput?.(e); },
      })}/>}
    />
  );
}

export {Textarea, type TextareaProps};

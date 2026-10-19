import type * as React from 'react';
import {clsx, type ClassValue} from 'clsx';
import {extendTailwindMerge} from 'tailwind-merge';

const twMerge = extendTailwindMerge<'type-role' | 'glass-key'>({
  extend: {
    classGroups: {
      'type-role': [{type: ['title', 'heading', 'heading-sm', 'body', 'body-sm', 'label', 'label-sm', 'label-lg', 'caption', 'code', 'code-sm', 'code-xs']}],
      'glass-key': [{glass: ['ink', 'paper', 'coral']}],
    },
  },
});

export const controlHeight = {
  sm: 'h-[max(var(--control-sm),calc(1lh+var(--space-2)))]',
  default: 'h-[max(var(--control),calc(1lh+var(--space-2)))]',
  lg: 'h-[max(var(--control-lg),calc(1lh+var(--space-2)))]',
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mergeClass<State>(base: ClassValue, className: string | ((state: State) => string | undefined) | undefined): string | ((state: State) => string) {
  return typeof className === 'function' ? (state: State) => cn(base, className(state)) : cn(base, className);
}

export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return node => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

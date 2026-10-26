import type * as React from 'react';
import {clsx, type ClassValue} from 'clsx';
import {extendTailwindMerge} from 'tailwind-merge';

const twMerge = extendTailwindMerge<'type-role' | 'surface'>({
  extend: {
    theme: {spacing: ['inset']},
    classGroups: {
      'type-role': [{type: ['display', 'title', 'heading', 'heading-sm', 'figure', 'body', 'body-sm', 'caption', 'label-lg', 'label', 'label-sm', 'micro', 'code', 'code-sm']}],
      'surface': ['slab', 'slab-fail', 'edged', 'quiet'],
    },
  },
});

export const controlHeight = {
  sm: 'h-[max(var(--control-sm),calc(1lh+var(--space-2)))]',
  default: 'h-[max(var(--control),calc(1lh+var(--space-2)))]',
  lg: 'h-[max(var(--control-lg),calc(1lh+var(--space-2)))]',
} as const;

export function reducedMotion(el?: Element | null): boolean {
  return typeof window !== 'undefined' && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !!el?.closest('[data-force-reduced-motion]'));
}

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

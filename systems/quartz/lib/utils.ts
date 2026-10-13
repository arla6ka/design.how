import type * as React from 'react';
import {clsx, type ClassValue} from 'clsx';
import {extendTailwindMerge} from 'tailwind-merge';

const twMerge = extendTailwindMerge<'type-role'>({
  extend: {
    classGroups: {
      'type-role': [{type: ['display-xl', 'display-lg', 'display', 'heading-lg', 'heading', 'heading-sm', 'heading-xs', 'body-lg', 'body', 'body-sm', 'button', 'label', 'label-sm', 'code', 'code-sm', 'code-display', 'code-touch', 'stat-xl', 'stat-lg', 'stat', 'state-word']}],
    },
  },
});

export const controlHeight = {
  xs: 'h-[max(var(--control-xs),1lh)]',
  sm: 'h-[max(var(--control-sm),calc(1lh+var(--space-2)))]',
  default: 'h-[max(var(--control),calc(1lh+var(--space-3)))]',
  lg: 'h-[max(var(--control-lg),calc(1lh+var(--space-6)))]',
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

export function withDefaults<T extends object, G extends object = Partial<T>>(defaults: T, given?: G): T & Omit<G, keyof T> {
  const out = {...defaults} as Record<string, unknown>;
  if (given) for (const [key, value] of Object.entries(given)) if (value !== undefined) out[key] = value;
  return out as T & Omit<G, keyof T>;
}

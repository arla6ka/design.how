'use client';

import {Button as ButtonPrimitive} from '@base-ui/react/button';
import {cva, type VariantProps} from 'class-variance-authority';
import {useEffect, useMemo, useRef, type ReactNode, type Ref} from 'react';
import {Icon, Pending} from '../icon';
import {cn, controlHeight, mergeClass, mergeRefs} from '../lib/utils';

const buttonVariants = cva(
  [
    'group/button relative inline-flex max-w-full shrink-0 items-center justify-center gap-1.5 rounded-pill whitespace-nowrap select-none',
    'disabled:cursor-not-allowed data-disabled:cursor-not-allowed aria-busy:cursor-progress',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'glass glass-ink',
        destructive: 'glass glass-coral',
        confirm: 'glass glass-green',
        secondary: 'flat',
        ghost: [
          'bg-transparent text-text-1 transition-[background-color,color,scale] duration-(--dur-press) ease-out',
          'hover:not-data-disabled:bg-hover active:not-data-disabled:bg-pressed active:not-data-disabled:scale-(--scale-press)',
          'data-disabled:not-aria-busy:text-text-disabled',
          'forced-colors:border forced-colors:border-solid forced-colors:border-[ButtonText]',
        ],
      },
      size: {
        sm: `${controlHeight.sm} px-2.5 type-label-sm [&_svg]:size-(--icon-sm)`,
        default: `${controlHeight.default} px-3 type-label [&_svg]:size-(--icon)`,
        lg: `${controlHeight.lg} px-3.5 type-label-lg [&_svg]:size-(--icon-lg)`,
        'icon-sm': 'size-(--control-sm) px-0 [&_svg]:size-(--icon-sm)',
        icon: 'size-(--control) px-0 [&_svg]:size-(--icon)',
        'icon-lg': 'size-(--control-lg) px-0 [&_svg]:size-(--icon-lg)',
      },
    },
    defaultVariants: {variant: 'primary', size: 'default'},
  },
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & {
  pending?: boolean;
  pendingLabel?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

function Arc() {
  return <Icon icon={Pending} data-slot="button-arc" className="animate-spin motion-reduce:animate-none"/>;
}

function visibleName(el: HTMLElement): string {
  const label = el.getAttribute('aria-label') ?? '';
  if (label.trim() || el.getAttribute('aria-labelledby')) return label || 'labelledby';
  let text = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { text += node.textContent ?? ''; return; }
    if (node instanceof Element && node.getAttribute('aria-hidden') === 'true') return;
    if (node instanceof Element && node.getAttribute('role') === 'img') { text += node.getAttribute('aria-label') ?? ''; return; }
    node.childNodes.forEach(walk);
  };
  walk(el);
  return text.trim();
}

function useNameCheck() {
  const node = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !node.current) return;
    if (!visibleName(node.current)) {
      node.current.setAttribute('data-unnamed', '');
      console.error('Glaze Button has no accessible name. Give it text children, or aria-label on an icon size.', node.current);
    } else node.current.removeAttribute('data-unnamed');
  });
  return node;
}

function Button({className, variant, size, pending, pendingLabel, disabled, focusableWhenDisabled, children, ref, ...props}: ButtonProps) {
  const v = variant ?? 'primary';
  const s = size ?? 'default';
  const iconOnly = s.startsWith('icon');
  const canPend = pending !== undefined;
  const named = useNameCheck();
  const mergedRef = useMemo(() => mergeRefs(ref as Ref<HTMLElement> | undefined, named), [ref, named]);

  const label = typeof children === 'string' ? <span data-slot="button-text" className="min-w-0 truncate">{children}</span> : children;
  const content = canPend
    ? <span data-slot="button-stack" className="grid min-w-0 place-items-center [grid-template-areas:'stack']">
        <span data-slot="button-idle" className={cn('inline-flex max-w-full min-w-0 items-center gap-1.5 [grid-area:stack]', pending && 'opacity-0')}>{label}</span>
        <span data-slot="button-pending" aria-hidden className={cn('inline-flex max-w-full min-w-0 items-center gap-1.5 [grid-area:stack]', !pending && 'invisible')}>
          <Arc/>{iconOnly ? null : typeof pendingLabel === 'string' ? <span className="min-w-0 truncate">{pendingLabel}</span> : pendingLabel ?? label}
        </span>
      </span>
    : label;

  return <ButtonPrimitive
    data-slot="button"
    data-variant={v}
    data-size={s}
    ref={mergedRef}
    disabled={disabled || pending}
    focusableWhenDisabled={pending || focusableWhenDisabled}
    aria-busy={pending || undefined}
    className={mergeClass(buttonVariants({variant: v, size: s}), className)}
    {...props}
  >{content}</ButtonPrimitive>;
}

export {Button, buttonVariants, type ButtonProps};

'use client';

import {Toggle as TogglePrimitive} from '@base-ui/react/toggle';
import {cva} from 'class-variance-authority';
import type {ComponentProps, KeyboardEvent, MouseEvent, ReactNode, RefObject} from 'react';
import {Icon, Close} from '../icon';
import {cn} from '../lib/utils';

const chipVariants = cva([
  'group/chip relative inline-flex h-(--control-sm) focus-sm max-w-full min-w-0 shrink-0 items-center gap-1 rounded-pill border whitespace-nowrap select-none',
  'type-label-sm transition-[background-color,border-color,color,scale] duration-(--dur-state) ease-out',
  '[&_svg]:pointer-events-none [&_svg]:size-(--icon-sm) [&_svg]:shrink-0 [&_svg]:text-text-3',
  'forced-colors:border-[ButtonText]',
]);

const toggleClasses = [
  'cursor-pointer px-2.5 [-webkit-tap-highlight-color:transparent]',
  'border-line-control bg-paper text-text-1',
  'hover:not-data-disabled:border-line-focus active:not-data-disabled:scale-(--scale-press) active:duration-(--dur-press)',
  'data-pressed:border-line-focus data-pressed:bg-pressed data-pressed:[&_svg]:text-text-1',
  'data-disabled:cursor-not-allowed data-disabled:border-line-faint data-disabled:text-text-disabled',
  'forced-colors:data-pressed:border-2',
].join(' ');

const valueClasses = [
  'ps-2.5 pe-(--shell-inset) border-line-control bg-paper text-text-1',
  'data-invalid:border-fail',
  'data-disabled:border-line-faint data-disabled:text-text-disabled',
].join(' ');

const chipRemoveClasses = cn(
  'relative inline-flex size-[calc(var(--control-sm)-2*var(--shell-inset)-2*var(--line-width))] shrink-0 items-center justify-center rounded-pill text-text-2',
  'transition-[background-color,color] duration-(--dur-state) ease-out hover:not-disabled:bg-hover hover:not-disabled:text-text-1 active:not-disabled:bg-pressed',
  'focus-sm focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:text-text-disabled',
  'after:absolute after:-inset-1',
  '[&_svg]:text-current',
);

const fmt = new Intl.NumberFormat('en-US');

function ChipCount({children, className}: {children: ReactNode; className?: string}) {
  return <span data-slot="chip-count" className={cn('data text-text-2', className)}>{typeof children === 'number' ? fmt.format(children) : children}</span>;
}

type ToggleChipProps = TogglePrimitive.Props & {
  count?: number;
  onRemove?: undefined;
};

type ValueChipProps = Omit<ComponentProps<'span'>, 'onChange'> & {
  count?: number;
  onRemove: () => void;
  removeLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  focusAfterEmpty?: RefObject<HTMLElement | null>;
};

type ChipProps = ToggleChipProps | ValueChipProps;

function Chip(props: ChipProps) {
  if (props.onRemove) return <ValueChip {...props}/>;
  const {className, count, children, ...rest} = props as ToggleChipProps;
  return <TogglePrimitive
    data-slot="chip"
    className={state => cn(chipVariants(), toggleClasses, typeof className === 'function' ? className(state) : className)}
    {...rest}
  >
    {typeof children === 'string' ? <span className="min-w-0 truncate">{children}</span> : children}
    {count !== undefined && <ChipCount>{count}</ChipCount>}
  </TogglePrimitive>;
}

function focusAfterRemove(button: HTMLElement, fallback?: RefObject<HTMLElement | null>) {
  const scope = button.closest('[data-slot=chip-group]') ?? button.closest('[data-slot=chip-value]')?.parentElement;
  if (!scope) return () => {};
  const all = [...scope.querySelectorAll<HTMLElement>('[data-slot=chip-remove]:not(:disabled)')];
  const i = all.indexOf(button);
  const target = all[i + 1] ?? all[i - 1];
  return () => {
    if (target?.isConnected) target.focus();
    else if (!target) fallback?.current?.focus();
  };
}

function ValueChip({className, count, children, onRemove, removeLabel, invalid, disabled, focusAfterEmpty, ...props}: ValueChipProps) {
  const text = typeof children === 'string' ? children : undefined;
  const remove = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
    const refocus = focusAfterRemove(event.currentTarget, focusAfterEmpty);
    onRemove();
    requestAnimationFrame(refocus);
  };
  return <span
    data-slot="chip-value"
    data-invalid={invalid || undefined}
    data-disabled={disabled || undefined}
    className={cn(chipVariants(), valueClasses, className)}
    {...props}
  >
    <span className="min-w-0 truncate">{children}</span>
    {count !== undefined && <ChipCount>{count}</ChipCount>}
    {invalid && <span className="sr-only">(not accepted)</span>}
    <button
      type="button"
      data-slot="chip-remove"
      onClick={remove}
      onKeyDown={event => { if (event.key === 'Backspace' || event.key === 'Delete') { event.preventDefault(); remove(event); } }}
      disabled={disabled}
      aria-label={removeLabel ?? (text ? `Remove ${text}` : 'Remove')}
      className={chipRemoveClasses}
    >
      <Icon icon={Close} size={12}/>
    </button>
  </span>;
}

function ChipGroup({className, ...props}: ComponentProps<'div'>) {
  return <div data-slot="chip-group" className={cn('flex flex-wrap items-center gap-1', className)} {...props}/>;
}

export {Chip, ChipCount, ChipGroup, chipVariants, toggleClasses as chipToggleClasses, valueClasses as chipValueClasses, chipRemoveClasses, type ChipProps};

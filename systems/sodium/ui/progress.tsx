'use client';

import {createContext, useContext, type ReactNode} from 'react';
import {Progress as ProgressPrimitive} from '@base-ui/react/progress';
import {cn, mergeClass} from '../lib/utils';

type ProgressStatus = 'warn' | 'fail';

const statusWords: Record<ProgressStatus, string> = {warn: 'Slow', fail: 'Failed'};

const ProgressContext = createContext<{status?: ProgressStatus; indeterminate: boolean; statusLabel?: ReactNode}>({indeterminate: false});

type ProgressProps = Omit<ProgressPrimitive.Root.Props, 'value'> & {
  value?: number | null;
  size?: 'default' | 'sm';
  status?: ProgressStatus;
  statusLabel?: ReactNode;
};

const cells = cn(
  '[mask-image:repeating-linear-gradient(to_right,currentColor_0_var(--space-1),transparent_var(--space-1)_calc(var(--space-1)+var(--space-0-5)))]',
  'rtl:[mask-image:repeating-linear-gradient(to_left,currentColor_0_var(--space-1),transparent_var(--space-1)_calc(var(--space-1)+var(--space-0-5)))]',
);

function Progress({className, children, value = null, min = 0, max = 100, size = 'default', status, statusLabel, ...props}: ProgressProps) {
  const indeterminate = value === null;
  return <ProgressContext.Provider value={{status, indeterminate, statusLabel}}>
    <ProgressPrimitive.Root
      data-slot="progress"
      data-size={size}
      data-status={status}
      data-indeterminate={indeterminate || undefined}
      value={value}
      min={min}
      max={max}
      locale="en-US"
      getAriaValueText={(formatted: string | null) => [formatted ?? (indeterminate ? 'In progress' : ''), status ? (typeof statusLabel === 'string' ? statusLabel : statusWords[status]) : ''].filter(Boolean).join(', ')}
      className={mergeClass('group/progress flex w-full min-w-0 flex-wrap items-baseline gap-x-3 gap-y-2', className)}
      {...props}
    >
      {children}
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className={cn('relative block w-full basis-full overflow-hidden bg-line forced-colors:bg-[GrayText]', cells, size === 'sm' ? 'h-1' : 'h-(--meter)')}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            'block h-full bg-text-1 transition-[width] duration-(--dur-wipe) ease-linear forced-colors:bg-[CanvasText]',
            'group-data-[status=warn]/progress:bg-warn group-data-[status=fail]/progress:bg-fail group-data-indeterminate/progress:hidden',
          )}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  </ProgressContext.Provider>;
}

function ProgressLabel({className, ...props}: ProgressPrimitive.Label.Props) {
  return <ProgressPrimitive.Label data-slot="progress-label" className={mergeClass('min-w-0 flex-1 truncate type-label-sm text-text-2', className)} {...props}/>;
}

type ProgressValueProps = Omit<ProgressPrimitive.Value.Props, 'children'> & {
  children?: ((formattedValue: string, value: number) => ReactNode) | null;
};

function ProgressValue({className, children, ...props}: ProgressValueProps) {
  const {status, indeterminate, statusLabel} = useContext(ProgressContext);
  const cls = cn('ms-auto inline-flex shrink-0 items-baseline gap-2 type-code text-text-1', className as string);
  if (indeterminate) return <span data-slot="progress-value" className={cn(cls, 'items-center self-center text-text-2')}><span className="pending"/></span>;
  return <span className={cls}>
    {status && <span data-slot="progress-status" className={cn('type-label-sm', status === 'fail' ? 'text-fail-text' : 'text-warn-text')}>{statusLabel ?? statusWords[status]}</span>}
    <ProgressPrimitive.Value data-slot="progress-value" {...props}>
      {children ? (formatted: string | null, value: number | null) => children(formatted ?? '', value ?? 0) : undefined}
    </ProgressPrimitive.Value>
  </span>;
}

export {Progress, ProgressLabel, ProgressValue, type ProgressProps, type ProgressValueProps, type ProgressStatus};

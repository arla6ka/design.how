'use client';

import {createContext, useContext, useRef, useState} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, DataTable, ErrorOutline, Locked, Search, type SodiumIcon} from '../icon';
import {Button} from './button';
import {cn} from '../lib/utils';

type EmptyReason = 'empty' | 'no-results' | 'no-access' | 'error';

const reasonGlyph: Record<EmptyReason, SodiumIcon> = {empty: DataTable, 'no-results': Search, 'no-access': Locked, error: ErrorOutline};

const emptyVariants = cva('group/empty flex w-full min-w-0 flex-col items-start gap-4 text-start text-text-1', {
  variants: {
    variant: {
      framed: 'frame forced-colors:border-[CanvasText]',
      plain: '',
    },
    size: {
      default: 'px-6 py-8',
      sm: 'gap-3 px-3 py-5',
    },
  },
  defaultVariants: {variant: 'framed', size: 'default'},
});

type EmptyProps = React.ComponentProps<'div'> & VariantProps<typeof emptyVariants> & {
  reason?: EmptyReason;
};

const EmptyContext = createContext<{reason: EmptyReason; size: 'default' | 'sm'}>({reason: 'empty', size: 'default'});

function Empty({className, reason = 'empty', variant = 'framed', size = 'default', role, ...props}: EmptyProps) {
  return <EmptyContext.Provider value={{reason, size: size ?? 'default'}}><div
    data-slot="empty"
    data-reason={reason}
    data-size={size}
    role={role ?? (reason === 'error' ? 'alert' : undefined)}
    className={cn(emptyVariants({variant, size}), className)}
    {...props}
  /></EmptyContext.Provider>;
}

type EmptyIconProps = React.ComponentProps<'span'> & {
  icon?: SodiumIcon;
};

function EmptyIcon({className, icon, ...props}: EmptyIconProps) {
  const {reason, size} = useContext(EmptyContext);
  return <span
    data-slot="empty-icon"
    aria-hidden
    className={cn(
      'flex size-10 shrink-0 items-center justify-center border border-line bg-page text-text-3',
      'group-data-[size=sm]/empty:size-8 group-data-[reason=error]/empty:border-fail group-data-[reason=error]/empty:text-fail-text',
      className,
    )}
    {...props}
  >
    <Icon icon={icon ?? reasonGlyph[reason]} size={size === 'sm' ? 16 : 20}/>
  </span>;
}

function EmptyHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="empty-header" className={cn('flex max-w-(--measure-hint) min-w-0 flex-col gap-1', className)} {...props}/>;
}

function EmptyTitle({className, ...props}: React.ComponentProps<'h3'>) {
  return <h3 data-slot="empty-title" className={cn('min-w-0 type-heading-sm text-pretty text-text-1 group-data-[reason=error]/empty:text-fail-text group-data-[size=sm]/empty:type-body', className)} {...props}/>;
}

function EmptyDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p
    data-slot="empty-description"
    className={cn('type-body-sm text-pretty text-text-2 [&_a]:text-text-1 [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-2', className)}
    {...props}
  />;
}

function EmptyContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="empty-content" className={cn('flex min-w-0 flex-wrap items-center gap-2', className)} {...props}/>;
}

function EmptyCode({className, ...props}: React.ComponentProps<'code'>) {
  return <code data-slot="empty-code" className={cn('mono break-all text-text-1 select-all', className)} {...props}/>;
}

const clock = (d: Date) => d.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});

type EmptyRetryProps = Omit<React.ComponentProps<typeof Button>, 'onClick' | 'pending' | 'children'> & {
  onRetry: () => Promise<unknown>;
  children?: React.ReactNode;
};

function EmptyRetry({onRetry, children = 'Retry', variant = 'secondary', size = 'default', className, ...props}: EmptyRetryProps) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState<{attempt: number; at: string} | null>(null);
  const attempts = useRef(0);
  const run = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onRetry();
      setFailed(null);
    } catch {
      attempts.current += 1;
      setFailed({attempt: attempts.current, at: clock(new Date())});
    } finally {
      setPending(false);
    }
  };
  return <span data-slot="empty-retry" className="inline-flex flex-wrap items-center gap-3">
    <Button variant={variant} size={size} pending={pending} pendingLabel="Retrying" onClick={run} className={className} {...props}>
      {children}
    </Button>
    <span role="status" data-slot="empty-retry-status" className="type-caption text-text-2 data empty:hidden">
      {failed && `Retry ${failed.attempt} failed at ${failed.at}`}
    </span>
  </span>;
}

export {Empty, EmptyIcon, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyCode, EmptyRetry, emptyVariants, type EmptyProps, type EmptyReason, type EmptyRetryProps};

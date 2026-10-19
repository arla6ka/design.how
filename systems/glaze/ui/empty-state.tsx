'use client';

import {useRef, useState} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, Retry, Empty as EmptyGlyph, Failed, NoAccess, NoResults, type GlazeIcon} from '../icon';
import {Button} from './button';
import {cn} from '../lib/utils';

type EmptyReason = 'empty' | 'no-results' | 'no-access' | 'error';

const reasonGlyph: Record<EmptyReason, GlazeIcon> = {empty: EmptyGlyph, 'no-results': NoResults, 'no-access': NoAccess, error: Failed};

const emptyVariants = cva('group/empty flex w-full min-w-0 flex-col items-center gap-3 text-center text-text-1', {
  variants: {
    variant: {
      panel: 'panel forced-colors:border-[CanvasText]',
      plain: '',
    },
    size: {
      default: 'px-4 py-6',
      sm: 'gap-2 px-3 py-4',
    },
  },
  defaultVariants: {variant: 'panel', size: 'default'},
});

type EmptyProps = React.ComponentProps<'div'> & VariantProps<typeof emptyVariants> & {
  reason?: EmptyReason;
};

function Empty({className, reason = 'empty', variant = 'panel', size = 'default', role, ...props}: EmptyProps) {
  return <div
    data-slot="empty"
    data-reason={reason}
    data-size={size}
    role={role ?? (reason === 'error' ? 'alert' : undefined)}
    className={cn(emptyVariants({variant, size}), className)}
    {...props}
  />;
}

function EmptyHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="empty-header" className={cn('flex max-w-(--measure-hint) min-w-0 flex-col items-center gap-1', className)} {...props}/>;
}

type EmptyTitleProps = React.ComponentProps<'h3'> & {
  icon?: GlazeIcon | false;
};

function EmptyTitle({className, icon, children, ...props}: EmptyTitleProps) {
  return <h3 data-slot="empty-title" className={cn('flex min-w-0 flex-col items-center gap-3 type-label text-text-1 group-data-[reason=error]/empty:text-fail-text group-data-[size=sm]/empty:gap-2', className)} {...props}>
    {icon !== false && <EmptyIcon icon={icon}/>}
    <span className="min-w-0 text-pretty">{children}</span>
  </h3>;
}

function EmptyIcon({icon}: {icon?: GlazeIcon}) {
  return <span data-slot="empty-icon" className="flex shrink-0 text-text-3 group-data-[reason=error]/empty:text-fail-text">
    <EmptyReasonGlyph icon={icon}/>
  </span>;
}

function EmptyReasonGlyph({icon}: {icon?: GlazeIcon}) {
  const sized = 'group-data-[size=sm]/empty:size-8';
  if (icon) return <Icon icon={icon} size={40} weight="light" className={sized}/>;
  return <>
    {(Object.keys(reasonGlyph) as EmptyReason[]).map(reason => <Icon key={reason} icon={reasonGlyph[reason]} size={40} weight="light" data-reason={reason} className={cn('hidden', sized, {
      empty: 'group-data-[reason=empty]/empty:block',
      'no-results': 'group-data-[reason=no-results]/empty:block',
      'no-access': 'group-data-[reason=no-access]/empty:block',
      error: 'group-data-[reason=error]/empty:block',
    }[reason])}/>)}
  </>;
}

function EmptyDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p
    data-slot="empty-description"
    className={cn(
      'type-body-sm text-pretty text-text-2 [&_a]:text-text-1 [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-2',
      className,
    )}
    {...props}
  />;
}

function EmptyContent({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="empty-content" className={cn('flex min-w-0 flex-wrap items-center justify-center gap-2', className)} {...props}/>;
}

function EmptyCode({className, ...props}: React.ComponentProps<'code'>) {
  return <code data-slot="empty-code" className={cn('break-all text-text-1 select-all', className)} {...props}/>;
}

const clock = (d: Date) => d.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});

type EmptyRetryProps = Omit<React.ComponentProps<typeof Button>, 'onClick' | 'pending' | 'children'> & {
  onRetry: () => Promise<unknown>;
  children?: React.ReactNode;
};

function EmptyRetry({onRetry, children = 'Retry', variant = 'secondary', size = 'sm', className, ...props}: EmptyRetryProps) {
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
  return <span data-slot="empty-retry" className="inline-flex flex-col items-center gap-1">
    <Button variant={variant} size={size} pending={pending} pendingLabel="Retrying" onClick={run} className={className} {...props}>
      <Icon icon={Retry} size={12}/>{children}
    </Button>
    <span role="status" data-slot="empty-retry-status" className="type-caption text-text-2 data empty:hidden">
      {failed && `Retry ${failed.attempt} failed at ${failed.at}`}
    </span>
  </span>;
}

export {Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyCode, EmptyRetry, emptyVariants, type EmptyProps, type EmptyReason, type EmptyRetryProps};

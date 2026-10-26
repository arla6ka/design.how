'use client';

import {createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {cva} from 'class-variance-authority';
import {Icon, Close} from '../icon';
import {Button} from './button';
import {StatusMark, statusLabels} from './status';
import {cn, mergeRefs} from '../lib/utils';

type AlertStatus = 'neutral' | 'ok' | 'warn' | 'fail';

const alertVariants = cva('group/alert @container/alert relative w-full min-w-0 border border-line bg-page px-inset py-3.5 text-start text-text-1 forced-colors:border-[CanvasText]');

type AlertContextValue = {status: AlertStatus; dismiss: () => void; dismissible: boolean};
const AlertContext = createContext<AlertContextValue | null>(null);

const storageKey = (key: string) => `sodium:alert-dismissed:${key}`;
function readDismissed(key: string) {
  try { return localStorage.getItem(storageKey(key)) === '1'; } catch { return false; }
}

function nextFocusable(from: HTMLElement) {
  const all = [...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')];
  return all.find(el => !from.contains(el) && (from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? null;
}

type AlertProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  status?: AlertStatus;
  announce?: boolean;
  dismissKey?: string;
  onDismiss?: () => void;
};

function Alert({className, status = 'neutral', announce = true, dismissKey, onDismiss, role, children, ref, ...props}: AlertProps) {
  const root = useRef<HTMLDivElement>(null);
  const rootRefs = useMemo(() => mergeRefs(root, ref), [ref]);
  const [dismissed, setDismissed] = useState<boolean | undefined>(dismissKey ? undefined : false);
  useLayoutEffect(() => { if (dismissKey) setDismissed(readDismissed(dismissKey)); }, [dismissKey]);

  const dismissible = status === 'neutral' || status === 'ok';
  const dismiss = useCallback(() => {
    if (!dismissible) return;
    const next = root.current ? nextFocusable(root.current) : null;
    if (dismissKey) { try { localStorage.setItem(storageKey(dismissKey), '1'); } catch {} }
    setDismissed(true);
    onDismiss?.();
    requestAnimationFrame(() => next?.focus());
  }, [dismissible, dismissKey, onDismiss]);

  if (dismissed !== false) return null;
  if (children === undefined || children === null || children === false) return null;

  const loud = status === 'warn' || status === 'fail';

  return <AlertContext.Provider value={{status, dismiss, dismissible}}>
    <div
      ref={rootRefs}
      data-slot="alert"
      data-status={status}
      role={role ?? (announce ? (loud ? 'alert' : 'status') : undefined)}
      className={cn(alertVariants(), className)}
      {...props}
    >
      <div data-slot="alert-grid" className={cn(
        'grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center',
        '[grid-template-areas:"lead_title_action_close""desc_desc_action_close"]',
        '@max-sm/alert:[grid-template-areas:"lead_title_title_close""desc_desc_desc_close""action_action_action_action"]',
      )}>
        {status !== 'neutral' && <span data-slot="alert-status" className="me-2 flex items-center [grid-area:lead] [&>[data-slot=status-mark]]:h-auto">
          <StatusMark status={status} label={statusLabels[status]}/>
        </span>}
        {children}
      </div>
    </div>
  </AlertContext.Provider>;
}

function useAlert() {
  const context = useContext(AlertContext);
  if (!context) throw new Error('Alert parts must be inside <Alert>.');
  return context;
}

function AlertTitle({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="alert-title" className={cn('min-w-0 type-label text-text-1 [overflow-wrap:anywhere] [text-box:trim-both_cap_alphabetic] [grid-area:title]', className)} {...props}/>;
}

function AlertDescription({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="alert-description"
    className={cn(
      'mt-2 min-w-0 type-body-sm text-text-2 [overflow-wrap:anywhere] [text-box:trim-both_cap_alphabetic] [grid-area:desc] group-not-has-data-[slot=alert-title]/alert:mt-0 group-not-has-data-[slot=alert-title]/alert:[grid-area:title]',
      '[&_a]:text-text-1 [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-2',
      className,
    )}
    {...props}
  />;
}

function AlertAction({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="alert-action"
    className={cn(
      'ms-4 flex max-w-full min-w-0 flex-wrap items-center gap-2 self-center [grid-area:action]',
      '@max-sm/alert:ms-0 @max-sm/alert:mt-3 @max-sm/alert:justify-self-start',
      className,
    )}
    {...props}
  />;
}

function AlertClose({className, label = 'Dismiss', onClick, ...props}: Omit<React.ComponentProps<typeof Button>, 'children' | 'size' | 'variant'> & {label?: string}) {
  const {dismiss, dismissible} = useAlert();
  if (!dismissible) {
    if (process.env.NODE_ENV !== 'production') console.warn('AlertClose: warn and fail alerts stay until the problem is fixed, so the close button is not rendered.');
    return null;
  }
  return <Button
    variant="ghost"
    size="icon-sm"
    data-slot="alert-close"
    aria-label={label}
    onClick={event => { onClick?.(event); if (!event.defaultPrevented) dismiss(); }}
    className={cn('ms-2 [grid-area:close]', className)}
    {...props}
  >
    <Icon icon={Close}/>
  </Button>;
}

export {Alert, AlertTitle, AlertDescription, AlertAction, AlertClose, alertVariants, type AlertProps, type AlertStatus};

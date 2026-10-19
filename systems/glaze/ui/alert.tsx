'use client';

import {createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {cva} from 'class-variance-authority';
import {Icon, Close, Failed, Information, Success, Warning, type GlazeIcon} from '../icon';
import {Button} from './button';
import {cn, mergeRefs} from '../lib/utils';

type AlertStatus = 'neutral' | 'ok' | 'warn' | 'fail';

const statusIcon: Record<AlertStatus, GlazeIcon> = {neutral: Information, ok: Success, warn: Warning, fail: Failed};

const alertVariants = cva('group/alert @container/alert relative w-full min-w-0 rounded-overlay p-3 text-start text-text-1 forced-colors:border forced-colors:border-[CanvasText]', {
  variants: {
    status: {
      neutral: 'border border-line bg-paper',
      ok: 'bg-ok-tint',
      warn: 'bg-warn-tint',
      fail: 'bg-fail-tint',
    },
  },
  defaultVariants: {status: 'neutral'},
});

type AlertContextValue = {status: AlertStatus; dismiss: () => void; dismissible: boolean};
const AlertContext = createContext<AlertContextValue | null>(null);

const storageKey = (key: string) => `glaze:alert-dismissed:${key}`;
function readDismissed(key: string) {
  try { return localStorage.getItem(storageKey(key)) === '1'; } catch { return false; }
}

function nextFocusable(from: HTMLElement) {
  const all = [...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')];
  return all.find(el => !from.contains(el) && (from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? null;
}

type AlertProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  status?: AlertStatus;
  icon?: boolean | ReactNode;
  announce?: boolean;
  dismissKey?: string;
  onDismiss?: () => void;
};

function Alert({className, status = 'neutral', icon = true, announce = true, dismissKey, onDismiss, role, children, ref, ...props}: AlertProps) {
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

  const glyph: ReactNode = icon === false || icon === null ? null : icon === true ? <Icon icon={statusIcon[status]} size={14}/> : icon;
  const loud = status === 'warn' || status === 'fail';

  return <AlertContext.Provider value={{status, dismiss, dismissible}}>
    <div
      ref={rootRefs}
      data-slot="alert"
      data-status={status}
      role={role ?? (announce ? (loud ? 'alert' : 'status') : undefined)}
      className={cn(alertVariants({status}), className)}
      {...props}
    >
      <div
        data-slot="alert-grid"
        className={cn(
          'grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-start [grid-template-areas:"icon_title_action_close""icon_desc_action_close""icon_more_more_more"]',
        )}
      >
        {glyph && <span data-slot="alert-icon" className={cn(
          'me-2 flex h-lh items-center type-label [grid-area:icon] group-not-has-data-[slot=alert-title]/alert:type-body-sm',
          status === 'neutral' ? 'text-text-2' : status === 'ok' ? 'text-ok-text' : status === 'warn' ? 'text-warn-text' : 'text-fail-text',
        )}>{glyph}</span>}
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
  return <p data-slot="alert-title" className={cn('min-w-0 type-label text-text-1 [overflow-wrap:anywhere] [grid-area:title]', className)} {...props}/>;
}

function AlertDescription({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="alert-description"
    className={cn(
      'min-w-0 type-body-sm text-text-1 [overflow-wrap:anywhere] [grid-area:desc] group-data-[status=neutral]/alert:text-text-2',
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
      'ms-3 -my-0.5 flex max-w-full min-w-0 flex-wrap items-center gap-2 self-center [grid-area:action]',
      '@max-sm/alert:ms-0 @max-sm/alert:mt-2 @max-sm/alert:my-0 @max-sm/alert:justify-self-start @max-sm/alert:[grid-area:more]',
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
    className={cn('ms-2 -me-1.5 -mt-1 self-start [grid-area:close]', className)}
    {...props}
  >
    <Icon icon={Close} size={12}/>
  </Button>;
}

export {Alert, AlertTitle, AlertDescription, AlertAction, AlertClose, alertVariants, type AlertProps, type AlertStatus};

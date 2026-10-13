'use client';

import {createContext, useCallback, useContext, useLayoutEffect, useRef, useState, useMemo, type ReactNode} from 'react';
import {cva} from 'class-variance-authority';
import {cn, mergeRefs} from '../lib/utils';
import {Button, ButtonSize} from './button';
import {Icon, Information, WarningAlt, Close, CloseOutline, type QuartzIcon} from '../icon';

type AlertStatus = 'neutral' | 'warn' | 'fail';
/** @deprecated Use AlertStatus. 'inverse' renders as neutral. */
type AlertTone = AlertStatus | 'inverse';
type AlertPlacement = 'inline' | 'page';

const statusIcon: Record<AlertStatus, QuartzIcon> = {neutral: Information, warn: WarningAlt, fail: CloseOutline};

const alertVariants = cva('group/alert @container/alert relative w-full min-w-0 bg-page text-start text-text-1', {
  variants: {
    placement: {
      inline: 'frame px-4 py-3',
      page: 'flex flex-col justify-center px-4 py-2 min-h-(--control-lg) sm:px-6 shadow-[inset_0_-1px_0_var(--line-frame)]',
    },
    size: {
      default: '',
      sm: '',
    },
    inset: {true: 'frame shadow-none', false: ''},
  },
  compoundVariants: [
    {placement: 'inline', size: 'sm', className: 'px-4 py-2'},
    {placement: 'page', size: 'sm', className: 'min-h-(--control) py-1.5'},
  ],
  defaultVariants: {placement: 'inline', size: 'default', inset: false},
});

let warnedInverse = false;

type AlertContextValue = {status: AlertStatus; dismiss: () => void; dismissible: boolean};
const AlertContext = createContext<AlertContextValue | null>(null);

const storageKey = (key: string) => `quartz:alert-dismissed:${key}`;

function readDismissed(key: string) {
  try { return localStorage.getItem(storageKey(key)) === '1'; } catch { return false; }
}

function nextFocusable(from: HTMLElement) {
  const all = [...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')];
  return all.find(el => !from.contains(el) && (from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) ?? null;
}

type AlertProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  status?: AlertStatus;
  /** @deprecated Use status. 'inverse' is gone and renders as neutral. */
  tone?: AlertTone;
  placement?: AlertPlacement;
  size?: 'default' | 'sm';
  inset?: boolean;
  icon?: boolean | ReactNode;
  announce?: boolean;
  dismissKey?: string;
  onDismiss?: () => void;
  /** @deprecated Use status. The v1 name for it; 'default' maps to neutral. */
  variant?: 'default' | 'warn' | 'fail';
};

function Alert({className, status: statusProp, tone: toneProp, placement = 'inline', size = 'default', inset = false, icon, announce = true, dismissKey, onDismiss, variant, role, children, ref, ...props}: AlertProps) {
  const asked: AlertTone = statusProp ?? toneProp ?? (variant === 'warn' || variant === 'fail' ? variant : 'neutral');
  if (asked === 'inverse' && !warnedInverse && process.env.NODE_ENV !== 'production') {
    warnedInverse = true;
    console.warn('Alert tone="inverse" is deprecated: an ink band is a header in ink. It renders as neutral.');
  }
  const level: AlertStatus = asked === 'inverse' ? 'neutral' : asked;
  const root = useRef<HTMLDivElement>(null);
  const rootRefs = useMemo(() => mergeRefs(root, ref), [ref]);
  const [dismissed, setDismissed] = useState<boolean | undefined>(dismissKey ? undefined : false);

  useLayoutEffect(() => {
    if (dismissKey) setDismissed(readDismissed(dismissKey));
  }, [dismissKey]);

  const dismissible = level === 'neutral';
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

  const status = level === 'warn' || level === 'fail' ? level : undefined;
  const statusGlyph = statusIcon[level];
  const glyph: ReactNode = icon === false || icon === null ? null
    : icon !== true && icon !== undefined ? icon
    : (icon ?? (placement === 'inline' || !!status)) && statusGlyph ? <Icon icon={statusGlyph} size={16}/> : null;

  return <AlertContext.Provider value={{status: level, dismiss, dismissible}}>
    <div
      ref={rootRefs}
      data-slot="alert"
      data-placement={placement}
      data-size={size}
      data-status={status}
      role={role ?? (announce ? (status ? 'alert' : 'status') : undefined)}
      className={cn(alertVariants({placement, size, inset: placement === 'page' && inset}), className)}
      {...props}
    >
      <div
        data-slot="alert-grid"
        className={cn(
          'grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] [grid-template-areas:"icon_title_action_close""icon_desc_action_close""icon_more_more_more"]',
          '@max-[12rem]/alert:[grid-template-areas:"icon_icon_icon_close""title_title_title_title""desc_desc_desc_desc""more_more_more_more"]',
          placement === 'page' ? 'items-center' : 'items-start',
        )}
      >
        {glyph && <span data-slot="alert-icon" className={cn('flex items-center [grid-area:icon] self-start text-text-2 group-data-[status=warn]/alert:text-warn-text group-data-[status=fail]/alert:text-fail-text', size === 'sm' ? 'me-2 h-lh type-body-sm' : 'me-3 h-lh type-label group-not-has-data-[slot=alert-title]/alert:type-body-sm')}>
          {glyph}
        </span>}
        {children}
      </div>
    </div>
  </AlertContext.Provider>;
}

function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('Alert parts must be inside <Alert>.');
  return ctx;
}

function AlertTitle({className, ...props}: React.ComponentProps<'p'>) {
  return <p
    data-slot="alert-title"
    className={cn('min-w-0 pb-0.5 type-label leading-5! text-current [overflow-wrap:anywhere] [grid-area:title] group-data-[size=sm]/alert:type-body-sm', className)}
    {...props}
  />;
}

function AlertDescription({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="alert-description"
    className={cn(
      'min-w-0 type-body-sm text-text-2 [overflow-wrap:anywhere] [grid-area:desc]',
      '[&_a]:text-current [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-text-1',
      className,
    )}
    {...props}
  />;
}

function AlertAction({className, children, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="alert-action"
    className={cn(
      'ms-3 -my-1 flex max-w-full min-w-0 flex-wrap items-center gap-2 self-center [grid-area:action]',
      '@max-sm/alert:ms-0 @max-sm/alert:mt-2 @max-sm/alert:mb-0 @max-sm/alert:justify-self-start @max-sm/alert:[grid-area:more]',
      className,
    )}
    {...props}
  ><ButtonSize size="sm">{children}</ButtonSize></div>;
}

function AlertClose({className, label = 'Dismiss', onClick, ...props}: Omit<React.ComponentProps<'button'>, 'children'> & {label?: string}) {
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
    className={cn(
      '-my-[calc((var(--control-sm)-1lh)/2)] group-not-has-data-[slot=alert-title]/alert:type-body-sm ms-2 -me-1 self-start bg-transparent text-current [grid-area:close]',
      'group-data-[placement=page]/alert:my-0 group-data-[placement=page]/alert:self-center',
      'not-pointer-coarse:after:absolute not-pointer-coarse:after:-inset-1 not-pointer-coarse:after:content-[""]',
      '@max-[12rem]/alert:mb-1',
      className,
    )}
    {...props}
  >
    <Icon icon={Close} size={16}/>
  </Button>;
}

export {Alert, AlertTitle, AlertDescription, AlertAction, AlertClose, alertVariants, type AlertProps, type AlertStatus, type AlertTone, type AlertPlacement};

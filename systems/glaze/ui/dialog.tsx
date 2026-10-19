'use client';

import * as React from 'react';
import {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {AlertDialog as AlertDialogPrimitive} from '@base-ui/react/alert-dialog';
import {cva, type VariantProps} from 'class-variance-authority';
import {Button, type ButtonProps} from './button';
import {Icon, Failed, Close as CloseIcon} from '../icon';
import {cn, mergeClass} from '../lib/utils';
import {useGlazeModal, useGlazePortal} from '../lib/portal';
import {createPortal} from 'react-dom';
import {closesAfter, overlayMotion, overlayPanel, overlayShell, scrimClass, useDefaultAction, useOverlayOpen, useScrollBody, type DefaultAction} from '../lib/overlay';

type DialogRole = 'dialog' | 'alertdialog';

type DialogState = {
  role: DialogRole;
  confirmText?: string;
  typed: string;
  setTyped: (value: string) => void;
  matched: boolean;
  pending: boolean;
  error: string | null;
  run: (action: () => void | Promise<unknown>, closeAfter: boolean) => void;
  close: () => void;
  locks: boolean;
};

const DialogContext = React.createContext<DialogState | null>(null);

function useDialog() {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error('Dialog parts must be inside <Dialog>.');
  return context;
}

type DialogProps = Omit<DialogPrimitive.Root.Props, 'role'> & {
  role?: DialogRole;
  confirmText?: string;
  contained?: boolean;
};

function Dialog({role = 'dialog', confirmText, contained = false, open: openProp, defaultOpen = false, onOpenChange, modal = true, children, ...props}: DialogProps) {
  const {open, setOpen, pending, error, session, run} = useOverlayOpen<DialogPrimitive.Root.ChangeEventDetails>({
    open: openProp, defaultOpen, onOpenChange,
  });
  const [entry, setEntry] = React.useState({session, value: ''});
  const typed = entry.session === session ? entry.value : '';
  const setTyped = React.useCallback((value: string) => setEntry({session, value}), [session]);

  const matched = confirmText === undefined || typed.trim() === confirmText;
  const locks = open && !contained && (role === 'alertdialog' || modal === true);

  const state = React.useMemo<DialogState>(() => ({
    role, confirmText, typed, setTyped, matched, pending, error, run, close: () => setOpen(false), locks,
  }), [role, confirmText, typed, setTyped, matched, pending, error, run, setOpen, locks]);

  return <DialogContext.Provider value={state}>
    {role === 'alertdialog' && !contained
      ? <AlertDialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={setOpen} {...(props as AlertDialogPrimitive.Root.Props)}>{children}</AlertDialogPrimitive.Root>
      : <DialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={setOpen} modal={contained ? false : modal} {...props}>{children}</DialogPrimitive.Root>}
  </DialogContext.Provider>;
}

const dialogVariants = cva(
  [
    'group/dialog fixed top-1/2 left-1/2 z-(--z-overlay) -translate-x-1/2 -translate-y-1/2',
    'max-h-[calc(100dvh-var(--space-8)*2)] w-[calc(100%-var(--space-4)*2)]',
    overlayShell,
    overlayMotion,
    'after:pointer-events-none after:absolute after:inset-0 after:z-(--z-raised) after:rounded-[inherit] after:bg-scrim after:opacity-0 after:transition-opacity after:duration-(--dur-state) data-nested-dialog-open:after:opacity-100',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-(--overlay-sm)',
        default: 'max-w-(--overlay)',
        lg: 'max-w-(--overlay-lg)',
      },
    },
    defaultVariants: {size: 'default'},
  },
);

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props}/>;
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  const container = useGlazePortal();
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={container} {...props}/>;
}

function DialogOverlay({className, ...props}: DialogPrimitive.Backdrop.Props) {
  return <DialogPrimitive.Backdrop data-slot="dialog-overlay" className={mergeClass(scrimClass, className)} {...props}/>;
}

type DialogContentProps = DialogPrimitive.Popup.Props & VariantProps<typeof dialogVariants> & {
  showCloseButton?: boolean;
};

const FootSlotContext = React.createContext<HTMLElement | null | undefined>(undefined);

function useDialogFootSlot() {
  return React.useContext(FootSlotContext);
}

function DialogContent({className, size, showCloseButton, children, ref, onKeyDown, initialFocus, ...props}: DialogContentProps) {
  const {role, pending, locks} = useDialog();
  const [foot, setFoot] = React.useState<HTMLDivElement | null>(null);
  const withClose = showCloseButton ?? role === 'dialog';
  const action = useDefaultAction<HTMLDivElement>({ref, onKeyDown, initialFocus});
  useGlazeModal(locks);
  return <DialogPortal>
    <DialogOverlay/>
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      data-size={size ?? 'default'}
      data-role={role}
      data-close={withClose || undefined}
      aria-busy={pending || undefined}
      className={mergeClass(dialogVariants({size}), className)}
      {...action}
      {...props}
    >
      <FootSlotContext.Provider value={foot}>
      <div data-slot="dialog-panel" className={cn(overlayPanel, 'relative')}>
        {children}
        {withClose && <DialogPrimitive.Close
          data-slot="dialog-close-button"
          aria-label="Close"
          disabled={pending}
          render={<Button variant="ghost" size="icon-sm" className="absolute end-3 top-3.5"/>}
        >
          <Icon icon={CloseIcon}/>
        </DialogPrimitive.Close>}
      </div>
      </FootSlotContext.Provider>
      <div ref={setFoot} data-slot="dialog-foot" className="contents"/>
    </DialogPrimitive.Popup>
  </DialogPortal>;
}

function DialogHeader({className, ...props}: React.ComponentProps<'div'>) {
  const {pending, error} = useDialog();
  return <div
    data-slot="dialog-header"
    data-pending={pending || undefined}
    data-status={error ? 'fail' : undefined}
    className={cn(
      'flex shrink-0 flex-col gap-1 p-4 group-data-close/dialog:pe-12 group-has-data-[slot=dialog-body]/dialog:pb-3',
      className,
    )}
    {...props}
  />;
}

function DialogBody({className, ref, ...props}: React.ComponentProps<'div'>) {
  const setRef = useScrollBody<HTMLDivElement>(ref);
  return <div
    ref={setRef}
    data-slot="dialog-body"
    className={cn(
      'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain border-t border-transparent px-4 pt-3 pb-4 type-body-sm text-text-1',
      'not-group-has-data-[slot=dialog-header]/dialog:pt-4 data-scrolled:border-line-faint focus-visible:focus-ring-inset',
      className,
    )}
    {...props}
  />;
}

type DialogFooterProps = React.ComponentProps<'div'> & {
  defaultAction?: DefaultAction;
  meta?: React.ReactNode;
};

function DialogFooter({className, defaultAction, meta, children, ...props}: DialogFooterProps) {
  const {error} = useDialog();
  const slot = useDialogFootSlot();
  const row = <>
    {error && <div data-slot="dialog-error" role="alert" data-status="fail" className="mt-(--shell-inset) flex items-start gap-2 rounded-panel bg-fail-tint px-3 py-2 type-body-sm text-fail-text">
      <Icon icon={Failed} className="mt-0.5"/>
      <span className="min-w-0 break-words">{error}</span>
    </div>}
    <div
      data-slot="dialog-footer"
      data-default-action={defaultAction ?? 'auto'}
      className={cn('shell-foot justify-end', className)}
      {...props}
    >
      {meta && <span data-slot="dialog-footer-meta" className="me-auto">{meta}</span>}
      {children}
    </div>
  </>;
  if (slot === undefined) return row;
  return slot ? createPortal(row, slot) : null;
}

function DialogTitle({className, ...props}: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={mergeClass('type-heading-sm text-text-1 break-words', className)} {...props}/>;
}

function DialogDescription({className, ...props}: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={mergeClass('max-w-(--measure-hint) type-body-sm text-text-2 break-words [&_a]:text-text-1 [&_a]:underline [&_a]:underline-offset-4', className)} {...props}/>;
}

function DialogClose({disabled, render, ...props}: DialogPrimitive.Close.Props) {
  const {pending} = useDialog();
  return <DialogPrimitive.Close
    data-slot="dialog-close"
    data-dialog-action="dismiss"
    disabled={disabled || pending}
    render={render ?? <Button variant="secondary" size="sm"/>}
    {...props}
  />;
}

type DialogActionProps = ButtonProps & {
  close?: boolean;
  onAction?: () => void | Promise<unknown>;
};

function DialogAction({close, onAction, onClick, disabled, size = 'sm', pending: pendingProp, ...props}: DialogActionProps) {
  const {matched, pending, run} = useDialog();
  const closeAfter = closesAfter({close, onAction, onClick, type: props.type});
  return <Button
    data-slot="dialog-action"
    data-dialog-action="primary"
    size={size}
    disabled={disabled || !matched}
    pending={pendingProp ?? (onAction !== undefined || props.pendingLabel !== undefined || pending ? pending : undefined)}
    onClick={event => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (onAction || closeAfter) run(onAction ?? (() => {}), closeAfter);
    }}
    {...props}
  />;
}

type DialogConfirmFieldProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'children'> & {
  label?: (name: React.ReactNode) => React.ReactNode;
};

function DialogConfirmField({label = name => <>Type {name} to confirm</>, className, id, ...props}: DialogConfirmFieldProps) {
  const {confirmText, typed, setTyped, pending} = useDialog();
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const hintId = `${fieldId}-hint`;
  if (confirmText === undefined) return null;
  const value = typed.trim();
  let differs = -1;
  for (let i = 0; i < value.length; i++) if (value[i] !== confirmText[i]) { differs = i; break; }
  if (differs < 0 && value.length > confirmText.length) differs = confirmText.length;
  const good = differs < 0 ? value.length : differs;
  const matchedNow = differs < 0 && value.length === confirmText.length;
  const name = <span data-slot="dialog-confirm-name" className="mono rounded-tag bg-field px-1 break-all select-all">
    {Array.from(confirmText).map((ch, i) => <span
      key={i}
      data-char={i < good ? 'match' : i === differs ? 'differs' : 'rest'}
      className="text-text-2 data-[char=match]:text-text-1 data-[char=differs]:bg-fail-tint data-[char=differs]:text-fail-text data-[char=differs]:underline data-[char=differs]:underline-offset-2"
    >{ch}</span>)}
  </span>;
  const hint = differs >= 0
    ? `Differs at character ${differs + 1}. The name is case-sensitive.`
    : matchedNow ? 'Matches. Press the button to confirm; Enter does not.' : 'The name is case-sensitive. Enter does not confirm.';
  return <div data-slot="dialog-confirm-field" className="flex flex-col gap-2">
    <label htmlFor={fieldId} className="type-body-sm text-text-2 break-words">{label(name)}</label>
    <input
      id={fieldId}
      data-autofocus
      value={typed}
      onChange={event => setTyped(event.target.value)}
      readOnly={pending}
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      aria-describedby={hintId}
      aria-invalid={differs >= 0 || undefined}
      className={cn('field w-full type-code-sm read-only:text-text-2', className)}
      {...props}
    />
    <p id={hintId} className={cn('type-caption', differs >= 0 ? 'text-fail-text' : matchedNow ? 'text-ok-text' : 'text-text-2')}>{hint}</p>
    <p aria-live="polite" className="sr-only">{matchedNow ? 'Matches.' : ''}</p>
  </div>;
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogAction,
  DialogConfirmField,
  dialogVariants,
  useDialogFootSlot,
  useDialog,
  type DialogProps,
  type DialogRole,
  type DialogContentProps,
  type DialogActionProps,
};

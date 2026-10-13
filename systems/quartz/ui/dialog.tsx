'use client';

import * as React from 'react';
import {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {AlertDialog as AlertDialogPrimitive} from '@base-ui/react/alert-dialog';
import {cva, type VariantProps} from 'class-variance-authority';
import {Button, ButtonSize, type ButtonProps} from './button';
import {fieldControlVariants} from './field';
import {CodeTag} from './badge';
import {Icon, Warning, Close as CloseIcon} from '../icon';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {useQuartzModal, useQuartzPortal} from '../lib/portal';
import {backdropClass, closesAfter, overlayShellSurface, useDefaultAction, useOverlayOpen, type DefaultAction} from '../lib/overlay';

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
};

function Dialog({role = 'dialog', confirmText, open: openProp, defaultOpen = false, onOpenChange, modal = true, children, ...props}: DialogProps) {
  const {open, setOpen, pending, error, session, run} = useOverlayOpen<DialogPrimitive.Root.ChangeEventDetails>({
    open: openProp, defaultOpen, onOpenChange,
  });
  const [entry, setEntry] = React.useState({session, value: ''});
  const typed = entry.session === session ? entry.value : '';
  const setTyped = React.useCallback((value: string) => setEntry({session, value}), [session]);

  const matched = confirmText === undefined || typed.trim() === confirmText;
  const locks = open && (role === 'alertdialog' || modal === true);

  const state = React.useMemo<DialogState>(() => ({
    role, confirmText, typed, setTyped, matched, pending, error, run, close: () => setOpen(false), locks,
  }), [role, confirmText, typed, setTyped, matched, pending, error, run, setOpen, locks]);

  return <DialogContext.Provider value={state}>
    {role === 'alertdialog'
      ? <AlertDialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={setOpen} {...(props as AlertDialogPrimitive.Root.Props)}>{children}</AlertDialogPrimitive.Root>
      : <DialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={setOpen} modal={modal} {...props}>{children}</DialogPrimitive.Root>}
  </DialogContext.Provider>;
}

const dialogSurface = overlayShellSurface;

const dialogVariants = cva(
  [
    'group/dialog fixed top-1/2 left-1/2 z-(--z-overlay) flex max-h-[calc(100dvh-var(--space-8)*2)] w-[calc(100%-var(--gutter-sm)*2)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto overscroll-contain outline-none',
    dialogSurface,
    'transition-opacity duration-(--dur-slow) ease-(--ease-step) data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-base)',
    'after:pointer-events-none after:absolute after:inset-0 after:z-(--z-cover) after:rounded-[inherit] after:bg-overlay after:opacity-0 after:transition-opacity after:duration-(--dur-base) data-nested-dialog-open:after:opacity-100',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-overlay-sm',
        default: 'max-w-overlay',
        lg: 'max-w-overlay-lg',
      },
    },
    defaultVariants: {size: 'default'},
  },
);

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props}/>;
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  const container = useQuartzPortal();
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={container} {...props}/>;
}

function DialogOverlay({className, ...props}: DialogPrimitive.Backdrop.Props) {
  return <DialogPrimitive.Backdrop data-slot="dialog-overlay" className={mergeClass(backdropClass, className)} {...props}/>;
}

type DialogContentProps = DialogPrimitive.Popup.Props & VariantProps<typeof dialogVariants> & {
  showCloseButton?: boolean;
};

function DialogContent({className, size, showCloseButton, children, ref, onKeyDown, initialFocus, ...props}: DialogContentProps) {
  const {role, pending, locks} = useDialog();
  const withClose = showCloseButton ?? role === 'dialog';
  const action = useDefaultAction<HTMLDivElement>({ref, onKeyDown, initialFocus});
  useQuartzModal(locks);
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
      {children}
      {withClose && <div data-slot="dialog-close-anchor" className="pointer-events-none sticky top-0 z-(--z-above) order-first h-0">
        <DialogPrimitive.Close
          data-slot="dialog-close-button"
          aria-label="Close"
          disabled={pending}
          render={<Button variant="ghost" size="icon-sm" className="pointer-events-auto absolute end-4 top-5"/>}
        >
          <Icon icon={CloseIcon} size={16}/>
        </DialogPrimitive.Close>
      </div>}
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
      'grid grid-cols-1 gap-1.5 pt-5 pb-5 group-data-close/dialog:pe-14 group-has-data-[slot=dialog-body]/dialog:pb-0',
      'frame sticky top-1 z-(--z-raised) mx-1 mt-1 bg-page px-5 [--frame-radius:calc(var(--radius-frame)-4px)]',
      'group-has-data-[slot=dialog-body]/dialog:before:border-b-0 group-has-data-[slot=dialog-body]/dialog:[--frame-radius:calc(var(--radius-frame)-4px)_calc(var(--radius-frame)-4px)_0_0]',
      'group-has-[[data-dialog-action=primary][data-variant=destructive]]/dialog:[--accent-mark:var(--fail-mark)]',
      className,
    )}
    {...props}
  />;
}

function DialogBody({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="dialog-body"
    className={cn(
      'frame mx-1 mb-1 flex min-w-0 flex-col gap-4 bg-page p-5 pt-6 before:border-t-0 [--frame-radius:0_0_calc(var(--radius-frame)-4px)_calc(var(--radius-frame)-4px)] group-has-data-[slot=dialog-footer]/dialog:mb-0',
      className,
    )}
    {...props}
  />;
}

type DialogFooterProps = React.ComponentProps<'div'> & {
  defaultAction?: DefaultAction;
};

function DialogFooter({className, defaultAction, ref, children, ...props}: DialogFooterProps) {
  const {error} = useDialog();
  const footer = React.useRef<HTMLDivElement>(null);
  const setRef = React.useMemo(() => mergeRefs(footer, ref), [ref]);
  return <>
    {error && <div data-slot="dialog-error" role="alert" data-status="fail" className="flex items-start gap-2 bg-accent-wash px-5 py-2 type-body-sm text-text-1">
      <Icon icon={Warning} size={16} className="mt-0.5"/>
      <span className="min-w-0 break-words">{error}</span>
    </div>}
    <div
      ref={setRef}
      data-slot="dialog-footer"
      data-default-action={defaultAction ?? 'auto'}
      className={cn(
        'frame-foot flex-wrap justify-end',
        'sticky bottom-0 z-(--z-raised) bg-(--surface-frame)',
        className,
      )}
      {...props}
    ><ButtonSize size="sm">{children}</ButtonSize></div>
  </>;
}

function DialogTitle({className, ...props}: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={mergeClass('type-heading-xs text-text-1 break-words', className)} {...props}/>;
}

function DialogDescription({className, ...props}: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={mergeClass('type-body text-text-2 break-words [&_a]:underline [&_a]:underline-offset-4', className)} {...props}/>;
}

function DialogClose({disabled, ...props}: DialogPrimitive.Close.Props) {
  const {pending} = useDialog();
  return <DialogPrimitive.Close data-slot="dialog-close" data-dialog-action="dismiss" disabled={disabled || pending} {...props}/>;
}

type DialogActionProps = ButtonProps & {
  close?: boolean;
  onAction?: () => void | Promise<unknown>;
};

function DialogAction({close, onAction, onClick, disabled, pending: pendingProp, ...props}: DialogActionProps) {
  const {matched, pending, run} = useDialog();
  const closeAfter = closesAfter({close, onAction, onClick, type: props.type});
  return <Button
    data-slot="dialog-action"
    data-dialog-action="primary"
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
  const name = <CodeTag fill="outline" data-slot="dialog-confirm-name" className="h-auto min-h-5 whitespace-normal break-all select-all">
    {Array.from(confirmText).map((ch, i) => <span
      key={i}
      data-char={i < good ? 'match' : i === differs ? 'differs' : 'rest'}
      data-status={i === differs ? 'fail' : undefined}
      className="text-text-3 data-[char=match]:text-text-1 data-[char=differs]:bg-accent-wash data-[char=differs]:text-text-1 data-[char=differs]:underline data-[char=differs]:decoration-accent-line data-[char=differs]:decoration-2 data-[char=differs]:underline-offset-2"
    >{ch}</span>)}
  </CodeTag>;
  const matchedNow = differs < 0 && value.length === confirmText.length;
  const hint = differs >= 0
    ? `Differs at character ${differs + 1}. The name is case-sensitive.`
    : value.length === confirmText.length ? 'Matches. Press the button to confirm; Enter does not.' : 'The name is case-sensitive. Enter does not confirm.';
  return <div data-slot="dialog-confirm-field" className="flex flex-col gap-2">
    <label htmlFor={fieldId} className="type-body text-text-2 break-words">{label(name)}</label>
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
      className={cn(
        fieldControlVariants(),
        'type-code pointer-coarse:type-code-touch read-only:text-text-2',
        matchedNow && '[--frame-color:var(--line-control-hover)]',
        className,
      )}
      {...props}
    />
    <p id={hintId} className="type-body-sm text-text-3">{hint}</p>
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
  dialogSurface,
  useDialog,
  type DialogProps,
  type DialogRole,
};

'use client';

import * as React from 'react';
import {Drawer as DrawerPrimitive} from '@base-ui/react/drawer';
import {Button as ButtonPrimitive} from '@base-ui/react/button';
import {useDomDirection} from '../lib/direction';
import {Button, type ButtonProps} from './button';
import {Icon, Close as CloseIcon, ErrorOutline} from '../icon';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {useSodiumModal, useSodiumPortal} from '../lib/portal';
import {
  closesAfter, overlayBodyClass, overlayDescriptionClass, overlayErrorClass, overlayFooterClass, overlayHeadMetaClass, overlayHeaderClass,
  overlayMetaClass, overlayModal, overlayTitleClass, scrimClass, useDefaultAction, useOverlayOpen, useScrollBody, type DefaultAction,
} from '../lib/overlay';

type Side = 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end';
type ScreenSide = Exclude<Side, 'start' | 'end'>;

function screenSide(side: Side, dir: 'ltr' | 'rtl'): ScreenSide {
  if (side === 'start') return dir === 'rtl' ? 'right' : 'left';
  if (side === 'end') return dir === 'rtl' ? 'left' : 'right';
  return side;
}

const swipeOf: Record<ScreenSide, 'up' | 'right' | 'down' | 'left'> = {top: 'up', right: 'right', bottom: 'down', left: 'left'};

type SheetState = {
  docked: boolean;
  side: ScreenSide;
  setSide: (side: ScreenSide) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  trigger: React.RefObject<HTMLElement | null>;
  pending: boolean;
  error: string | null;
  run: (action: () => void | Promise<unknown>, closeAfter: boolean) => void;
};

const SheetContext = React.createContext<SheetState | null>(null);

function useSheet() {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error('Sheet parts must be inside <Sheet>.');
  return context;
}

type SheetProps = Omit<DrawerPrimitive.Root.Props, 'modal' | 'swipeDirection' | 'onOpenChange'> & {
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Sheet({modal = true, open: openProp, defaultOpen = false, onOpenChange, children, ...props}: SheetProps) {
  const [side, setSide] = React.useState<ScreenSide>('right');
  const titleId = React.useId();
  const trigger = React.useRef<HTMLElement | null>(null);
  const {open, setOpen, pending, error, run} = useOverlayOpen<DrawerPrimitive.Root.ChangeEventDetails>({open: openProp, defaultOpen, onOpenChange});
  const state = React.useMemo(() => ({docked: !modal, side, setSide, open, setOpen, titleId, trigger, pending, error, run}), [modal, side, open, setOpen, titleId, pending, error, run]);
  return <SheetContext.Provider value={state}>
    {modal
      ? <DrawerPrimitive.Root data-slot="sheet" open={open} onOpenChange={setOpen} swipeDirection={swipeOf[side]} {...props}>{children}</DrawerPrimitive.Root>
      : children as React.ReactNode}
  </SheetContext.Provider>;
}

function SheetTrigger({ref, onClick, ...props}: DrawerPrimitive.Trigger.Props) {
  const {docked, open, setOpen, trigger} = useSheet();
  const refs = React.useMemo(() => mergeRefs(trigger as React.Ref<HTMLButtonElement>, ref), [trigger, ref]);
  if (docked) return <ButtonPrimitive
    data-slot="sheet-trigger"
    ref={refs}
    aria-expanded={open}
    data-popup-open={open || undefined}
    onClick={event => { onClick?.(event as never); setOpen(!open); }}
    {...(props as ButtonPrimitive.Props)}
  />;
  return <DrawerPrimitive.Trigger data-slot="sheet-trigger" ref={refs} onClick={onClick} {...props}/>;
}

function SheetClose({onClick, disabled, render, ...props}: DrawerPrimitive.Close.Props) {
  const {docked, setOpen, trigger, pending} = useSheet();
  const look = render ?? <Button variant="secondary" size="sm"/>;
  if (docked) return <ButtonPrimitive
    data-slot="sheet-close"
    data-dialog-action="dismiss"
    disabled={disabled || pending}
    render={look as ButtonPrimitive.Props['render']}
    onClick={event => { onClick?.(event as never); setOpen(false); trigger.current?.focus(); }}
    {...(props as ButtonPrimitive.Props)}
  />;
  return <DrawerPrimitive.Close data-slot="sheet-close" data-dialog-action="dismiss" disabled={disabled || pending} render={look} onClick={onClick} {...props}/>;
}

function SheetPortal(props: DrawerPrimitive.Portal.Props) {
  const container = useSodiumPortal();
  return <DrawerPrimitive.Portal data-slot="sheet-portal" container={container} {...props}/>;
}

function SheetOverlay({className, ...props}: DrawerPrimitive.Backdrop.Props) {
  return <DrawerPrimitive.Backdrop
    data-slot="sheet-overlay"
    className={mergeClass([scrimClass, 'opacity-[calc(1-var(--drawer-swipe-progress,0))] data-swiping:duration-0'], className)}
    {...props}
  />;
}

const modalPanel = cn(
  'group/sheet relative',
  overlayModal,
  'transition-[translate,opacity] duration-(--dur-overlay) ease-out data-swiping:duration-0 data-swiping:select-none',
  'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-state) data-ending-style:ease-in',
  'data-[side=right]:border-y-0 data-[side=right]:border-e-0 data-[side=left]:border-y-0 data-[side=left]:border-s-0',
  'data-[side=top]:border-x-0 data-[side=top]:border-t-0 data-[side=bottom]:border-x-0 data-[side=bottom]:border-b-0',
  'data-[side=right]:h-full data-[side=right]:w-[min(var(--overlay),100%-var(--space-10))] data-[side=left]:h-full data-[side=left]:w-[min(var(--overlay),100%-var(--space-10))]',
  'data-[side=top]:max-h-[calc(100dvh-var(--space-10))] data-[side=top]:w-full',
  'data-[side=bottom]:max-h-[calc(100dvh-var(--space-10))] data-[side=bottom]:w-full data-[side=bottom]:pb-[env(safe-area-inset-bottom)]',
  'data-[side=right]:translate-x-[var(--drawer-swipe-movement-x,0px)] motion-safe:data-[side=right]:data-starting-style:translate-x-(--space-4) motion-safe:data-[side=right]:data-ending-style:translate-x-(--space-4)',
  'data-[side=left]:translate-x-[var(--drawer-swipe-movement-x,0px)] motion-safe:data-[side=left]:data-starting-style:-translate-x-(--space-4) motion-safe:data-[side=left]:data-ending-style:-translate-x-(--space-4)',
  'data-[side=top]:translate-y-[var(--drawer-swipe-movement-y,0px)] motion-safe:data-[side=top]:data-starting-style:-translate-y-(--space-4) motion-safe:data-[side=top]:data-ending-style:-translate-y-(--space-4)',
  'data-[side=bottom]:translate-y-[var(--drawer-swipe-movement-y,0px)] motion-safe:data-[side=bottom]:data-starting-style:translate-y-(--space-4) motion-safe:data-[side=bottom]:data-ending-style:translate-y-(--space-4)',
);

const viewportAlign: Record<ScreenSide, string> = {
  right: 'items-stretch justify-end rtl:justify-start',
  left: 'items-stretch justify-start rtl:justify-end',
  top: 'flex-col items-center justify-start',
  bottom: 'flex-col items-center justify-end',
};

type SheetContentProps = Omit<DrawerPrimitive.Popup.Props, 'className'> & {
  className?: string;
  side?: Side;
  showCloseButton?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
};

function SheetContent({side = 'end', ...props}: SheetContentProps) {
  const {docked, setSide} = useSheet();
  const screen = screenSide(side, useDomDirection(useSodiumPortal()));
  React.useLayoutEffect(() => { setSide(screen); }, [screen, setSide]);
  if (docked) return <DockedContent side={side === 'start' || side === 'left' ? 'start' : 'end'} {...props}/>;
  return <ModalContent side={screen} {...props}/>;
}

const SheetCloseContext = React.createContext(false);

function CloseButton({docked}: {docked: boolean}) {
  const {pending} = useSheet();
  const button = <Button variant="ghost" size="icon-sm"/>;
  return docked
    ? <SheetClose data-slot="sheet-close-button" aria-label="Close" data-dialog-action={undefined} render={button}><Icon icon={CloseIcon}/></SheetClose>
    : <DrawerPrimitive.Close data-slot="sheet-close-button" aria-label="Close" disabled={pending} render={button}><Icon icon={CloseIcon}/></DrawerPrimitive.Close>;
}

function ModalContent({className, children, side, showCloseButton, ref, onKeyDown, initialFocus, defaultWidth: _w, minWidth: _min, maxWidth: _max, onWidthChange: _c, ...props}: Omit<SheetContentProps, 'side'> & {side: ScreenSide}) {
  const {open, pending} = useSheet();
  const action = useDefaultAction<HTMLDivElement>({ref, onKeyDown, initialFocus});
  useSodiumModal(open);
  const withClose = showCloseButton ?? side !== 'bottom';
  return <SheetPortal>
    <SheetOverlay/>
    <DrawerPrimitive.Viewport data-slot="sheet-viewport" className={cn('fixed inset-0 z-(--z-overlay) flex', viewportAlign[side])}>
      <DrawerPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        data-show-close={withClose || undefined}
        aria-busy={pending || undefined}
        className={cn(modalPanel, className)}
        {...action}
        {...props}
      >
        {side === 'bottom' && <div data-slot="sheet-handle" aria-hidden className="flex h-4 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
          <span className="h-1 w-8 bg-line-control forced-colors:bg-[CanvasText]"/>
        </div>}
        <DrawerPrimitive.Content data-slot="sheet-inner" className="flex min-h-0 flex-1 flex-col">
          <SheetCloseContext.Provider value={withClose}>{children}</SheetCloseContext.Provider>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Popup>
    </DrawerPrimitive.Viewport>
  </SheetPortal>;
}

function DockedContent({className, children, side, showCloseButton = true, defaultWidth = 360, minWidth = 280, maxWidth = 640, onWidthChange, style, onKeyDown, ref, initialFocus: _f, finalFocus: _ff, render: _r, ...rest}: Omit<SheetContentProps, 'side'> & {side: 'start' | 'end'}) {
  const {open, setOpen, titleId, trigger, pending} = useSheet();
  const [width, setWidth] = React.useState(defaultWidth);
  const [dragging, setDragging] = React.useState(false);
  const start = React.useRef<{x: number; w: number} | null>(null);
  if (!open) return null;
  const set = (w: number) => {
    const next = Math.round(Math.min(Math.max(w, minWidth), maxWidth));
    setWidth(next);
    onWidthChange?.(next);
  };
  const sign = (el: Element) => {
    const rtl = getComputedStyle(el).direction === 'rtl';
    return (side === 'end') !== rtl ? -1 : 1;
  };
  return <aside
    aria-labelledby={titleId}
    {...(rest as React.HTMLAttributes<HTMLElement>)}
    ref={ref as React.Ref<HTMLElement>}
    data-slot="sheet-content"
    data-docked=""
    data-side={side}
    data-show-close={showCloseButton || undefined}
    onKeyDown={event => {
      onKeyDown?.(event as never);
      if (event.defaultPrevented || event.key !== 'Escape') return;
      if ((event.target as HTMLElement).closest('[role=menu],[role=listbox],[role=dialog]')) return;
      if (pending) { event.preventDefault(); return; }
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }}
    className={cn('group/sheet relative flex min-h-0 shrink-0 flex-col bg-page text-text-1 max-md:w-full!', side === 'end' ? 'border-s border-line' : 'border-e border-line', typeof className === 'string' ? className : undefined)}
    style={{width, ...(typeof style === 'object' ? style : undefined)}}
  >
    <div
      role="separator"
      tabIndex={0}
      aria-label="Resize panel"
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      aria-valuetext={`${width} pixels`}
      data-slot="sheet-handle"
      data-dragging={dragging || undefined}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus();
        start.current = {x: event.clientX, w: width};
        setDragging(true);
      }}
      onPointerMove={event => { if (start.current) set(start.current.w + sign(event.currentTarget) * (event.clientX - start.current.x)); }}
      onPointerUp={() => { start.current = null; setDragging(false); }}
      onPointerCancel={() => { start.current = null; setDragging(false); }}
      onDoubleClick={() => set(defaultWidth)}
      onKeyDown={event => {
        const step = event.shiftKey ? 8 : 32;
        const s = sign(event.currentTarget);
        if (event.key === 'ArrowLeft') set(width - s * step);
        else if (event.key === 'ArrowRight') set(width + s * step);
        else if (event.key === 'Home') set(minWidth);
        else if (event.key === 'End') set(maxWidth);
        else if (event.key === 'Enter') set(defaultWidth);
        else return;
        event.preventDefault();
      }}
      className={cn(
        'group/handle absolute inset-y-0 z-(--z-raised) flex w-2 cursor-col-resize touch-none justify-center max-md:hidden',
        side === 'end' ? '-start-1' : '-end-1',
      )}
    >
      <span className="w-px bg-transparent transition-colors duration-(--dur-state) ease-out group-hover/handle:bg-line-control group-focus-visible/handle:bg-focus group-data-dragging/handle:bg-focus forced-colors:bg-[CanvasText]"/>
    </div>
    <SheetCloseContext.Provider value={showCloseButton}>{children}</SheetCloseContext.Provider>
  </aside>;
}

type SheetHeaderProps = React.ComponentProps<'div'> & {
  meta?: React.ReactNode;
};

function SheetHeader({className, meta, children, ...props}: SheetHeaderProps) {
  const {docked, pending, error} = useSheet();
  const withClose = React.useContext(SheetCloseContext);
  return <div
    data-slot="sheet-header"
    data-pending={pending || undefined}
    data-status={error ? 'fail' : undefined}
    className={cn(overlayHeaderClass, className)}
    {...props}
  >
    {children}
    {meta && <span data-slot="sheet-header-meta" className={overlayHeadMetaClass}>{meta}</span>}
    {withClose && <div className="panel-head-actions"><CloseButton docked={docked}/></div>}
  </div>;
}

function SheetBody({className, ref, ...props}: React.ComponentProps<'div'>) {
  const setRef = useScrollBody<HTMLDivElement>(ref);
  return <div ref={setRef} data-slot="sheet-body" className={cn(overlayBodyClass, className)} {...props}/>;
}

function SheetFooter({className, defaultAction, meta, children, ...props}: React.ComponentProps<'div'> & {
  defaultAction?: DefaultAction;
  meta?: React.ReactNode;
}) {
  const {error} = useSheet();
  return <>
    {error && <div data-slot="sheet-error" role="alert" data-status="fail" className={overlayErrorClass}>
      <Icon icon={ErrorOutline}/>
      <span className="min-w-0 break-words">{error}</span>
    </div>}
    <div
      data-slot="sheet-footer"
      data-default-action={defaultAction ?? 'auto'}
      className={cn(overlayFooterClass, 'mt-auto', error && 'border-fail', className)}
      {...props}
    >
      {meta && <span data-slot="sheet-footer-meta" className={overlayMetaClass}>{meta}</span>}
      {children}
    </div>
  </>;
}

function SheetTitle({className, children, ...props}: DrawerPrimitive.Title.Props) {
  const {docked, titleId} = useSheet();
  const base = overlayTitleClass;
  if (docked) return <h2 id={titleId} data-slot="sheet-title" className={cn(base, typeof className === 'string' && className)}>{children as React.ReactNode}</h2>;
  return <DrawerPrimitive.Title data-slot="sheet-title" className={mergeClass(base, className)} {...props}>{children}</DrawerPrimitive.Title>;
}

function SheetDescription({className, ...props}: DrawerPrimitive.Description.Props) {
  const {docked} = useSheet();
  const base = overlayDescriptionClass;
  if (docked) return <p data-slot="sheet-description" className={cn(base, typeof className === 'string' && className)}>{props.children as React.ReactNode}</p>;
  return <DrawerPrimitive.Description data-slot="sheet-description" className={mergeClass(base, className)} {...props}/>;
}

type SheetActionProps = ButtonProps & {
  close?: boolean;
  onAction?: () => void | Promise<unknown>;
};

function SheetAction({close, onAction, onClick, pending: pendingProp, ...props}: SheetActionProps) {
  const {pending, run} = useSheet();
  const closeAfter = closesAfter({close, onAction, onClick, type: props.type});
  return <Button
    data-slot="sheet-action"
    data-dialog-action="primary"
    size="sm"
    pending={pendingProp ?? (onAction !== undefined || props.pendingLabel !== undefined || pending ? pending : undefined)}
    onClick={event => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (onAction || closeAfter) run(onAction ?? (() => {}), closeAfter);
    }}
    {...props}
  />;
}

function SheetSection({className, title, children, ...props}: Omit<React.ComponentProps<'section'>, 'title'> & {title?: React.ReactNode}) {
  return <section data-slot="sheet-section" className={cn('flex flex-col [[data-slot=sheet-section]+&]:pt-1', className)} {...props}>
    {title && <h3 className="pb-1 type-micro text-text-3">{title}</h3>}
    <dl className="flex flex-col">{children}</dl>
  </section>;
}

function SheetField({label, children, code, className}: {label: React.ReactNode; children: React.ReactNode; code?: boolean; className?: string}) {
  return <div data-slot="sheet-field" className={cn('rule-row grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-baseline gap-3 py-2.5 last:pb-0', className)}>
    <dt className="truncate type-label-sm text-text-2">{label}</dt>
    <dd className={cn('min-w-0 text-text-1', code ? 'type-code break-all' : 'type-body-sm break-words')}>{children}</dd>
  </div>;
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetAction,
  SheetSection,
  SheetField,
  useSheet,
  type SheetProps,
  type SheetContentProps,
  type SheetHeaderProps,
};

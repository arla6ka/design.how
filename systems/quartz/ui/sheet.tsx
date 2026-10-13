'use client';

import * as React from 'react';
import {Drawer as DrawerPrimitive} from '@base-ui/react/drawer';
import {Button as ButtonPrimitive} from '@base-ui/react/button';
import {useDomDirection} from '../lib/direction';
import {Button, ButtonSize, type ButtonProps} from './button';
import {Icon, Warning, Close as CloseIcon} from '../icon';
import type {Kind} from '../lib/kind';
import {cn, mergeClass, mergeRefs} from '../lib/utils';
import {useQuartzModal, useQuartzPortal} from '../lib/portal';
import {backdropClass, closesAfter, fadeClass, useDefaultAction, useOverlayOpen, useScrollFade, type DefaultAction} from '../lib/overlay';

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
  contained?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Sheet({modal = true, contained, open: openProp, defaultOpen = false, onOpenChange, children, ...props}: SheetProps) {
  const [side, setSide] = React.useState<ScreenSide>('right');
  const titleId = React.useId();
  const trigger = React.useRef<HTMLElement | null>(null);
  const {open, setOpen, pending, error, run} = useOverlayOpen<DrawerPrimitive.Root.ChangeEventDetails>({open: openProp, defaultOpen, onOpenChange});
  const state = React.useMemo(() => ({docked: !modal, side, setSide, open, setOpen, titleId, trigger, pending, error, run}), [modal, side, open, setOpen, titleId, pending, error, run]);
  return <SheetContext.Provider value={state}>
    {modal
      ? <DrawerPrimitive.Root data-slot="sheet" open={open} onOpenChange={setOpen} swipeDirection={swipeOf[side]} modal={contained ? false : undefined} {...props}>{children}</DrawerPrimitive.Root>
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

function SheetClose({onClick, disabled, ...props}: DrawerPrimitive.Close.Props) {
  const {docked, setOpen, trigger, pending} = useSheet();
  if (docked) return <ButtonPrimitive
    data-slot="sheet-close"
    data-dialog-action="dismiss"
    disabled={disabled || pending}
    onClick={event => { onClick?.(event as never); setOpen(false); trigger.current?.focus(); }}
    {...(props as ButtonPrimitive.Props)}
  />;
  return <DrawerPrimitive.Close data-slot="sheet-close" data-dialog-action="dismiss" disabled={disabled || pending} onClick={onClick} {...props}/>;
}

function SheetPortal(props: DrawerPrimitive.Portal.Props) {
  const container = useQuartzPortal();
  return <DrawerPrimitive.Portal data-slot="sheet-portal" container={container} {...props}/>;
}

function SheetOverlay({className, ...props}: DrawerPrimitive.Backdrop.Props) {
  return <DrawerPrimitive.Backdrop
    data-slot="sheet-overlay"
    className={mergeClass([backdropClass, 'min-h-dvh opacity-[calc(1-var(--drawer-swipe-progress,0))] data-swiping:duration-0'], className)}
    {...props}
  />;
}

const modalPanel = cn(
  'group/sheet relative flex min-h-0 flex-col bg-(--surface-frame) text-text-1 shadow-overlay outline-none',
  'transition-[translate,opacity] duration-(--dur-slow) ease-(--ease-step) data-swiping:duration-0 data-swiping:select-none',
  'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-base)',
  'forced-colors:outline-solid forced-colors:outline-1 forced-colors:outline-[CanvasText]',
  'data-[side=right]:h-full data-[side=right]:w-[calc(100%-var(--space-10))] data-[side=right]:sm:w-overlay',
  'data-[side=left]:h-full data-[side=left]:w-[calc(100%-var(--space-10))] data-[side=left]:sm:w-overlay',
  'data-[side=top]:max-h-[calc(100dvh-var(--space-10))] data-[side=top]:w-full data-[side=top]:rounded-b-frame',
  'data-[side=bottom]:max-h-[calc(100dvh-var(--space-10))] data-[side=bottom]:w-full data-[side=bottom]:rounded-t-frame data-[side=bottom]:pb-[env(safe-area-inset-bottom)]',
  'data-[side=right]:translate-x-[var(--drawer-swipe-movement-x,0px)] motion-safe:data-[side=right]:data-starting-style:translate-x-(--sheet-shift) motion-safe:data-[side=right]:data-ending-style:translate-x-(--sheet-shift)',
  'data-[side=left]:translate-x-[var(--drawer-swipe-movement-x,0px)] motion-safe:data-[side=left]:data-starting-style:-translate-x-(--sheet-shift) motion-safe:data-[side=left]:data-ending-style:-translate-x-(--sheet-shift)',
  'data-[side=top]:translate-y-[var(--drawer-swipe-movement-y,0px)] motion-safe:data-[side=top]:data-starting-style:-translate-y-(--sheet-shift) motion-safe:data-[side=top]:data-ending-style:-translate-y-(--sheet-shift)',
  'data-[side=bottom]:translate-y-[var(--drawer-swipe-movement-y,0px)] motion-safe:data-[side=bottom]:data-starting-style:translate-y-(--sheet-shift) motion-safe:data-[side=bottom]:data-ending-style:translate-y-(--sheet-shift)',
  'motion-reduce:transition-opacity',
);

const viewportAlign: Record<ScreenSide, string> = {
  right: 'items-stretch justify-end rtl:justify-start',
  left: 'items-stretch justify-start rtl:justify-end',
  top: 'flex-col items-stretch justify-start',
  bottom: 'flex-col items-stretch justify-end',
};

type SheetStack = 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
const stackClass: Record<SheetStack, string> = {
  md: '@max-md:w-full! @max-md:[&>[data-slot=sheet-handle]]:hidden',
  lg: '@max-lg:w-full! @max-lg:[&>[data-slot=sheet-handle]]:hidden',
  xl: '@max-xl:w-full! @max-xl:[&>[data-slot=sheet-handle]]:hidden',
  '2xl': '@max-2xl:w-full! @max-2xl:[&>[data-slot=sheet-handle]]:hidden',
  '3xl': '@max-3xl:w-full! @max-3xl:[&>[data-slot=sheet-handle]]:hidden',
  '4xl': '@max-4xl:w-full! @max-4xl:[&>[data-slot=sheet-handle]]:hidden',
  '5xl': '@max-5xl:w-full! @max-5xl:[&>[data-slot=sheet-handle]]:hidden',
};

type SheetContentProps = Omit<DrawerPrimitive.Popup.Props, 'className'> & {
  className?: string;
  side?: Side;
  showCloseButton?: boolean;
  kind?: Kind;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  stackBelow?: SheetStack;
};

function SheetContent({side = 'end', ...props}: SheetContentProps) {
  const {docked, setSide} = useSheet();
  const screen = screenSide(side, useDomDirection(useQuartzPortal()));
  React.useLayoutEffect(() => { setSide(screen); }, [screen, setSide]);
  if (docked) return <DockedContent side={side === 'start' || side === 'left' ? 'start' : 'end'} {...props}/>;
  return <ModalContent side={screen} {...props}/>;
}

function CloseButton({docked}: {docked: boolean}) {
  const {pending} = useSheet();
  const button = <Button variant="ghost" size="icon-sm" className="absolute end-4 top-5 z-(--z-raised)"/>;
  return docked
    ? <SheetClose data-slot="sheet-close-button" aria-label="Close" data-dialog-action={undefined} render={button}><Icon icon={CloseIcon} size={16}/></SheetClose>
    : <DrawerPrimitive.Close data-slot="sheet-close-button" aria-label="Close" disabled={pending} render={button}><Icon icon={CloseIcon} size={16}/></DrawerPrimitive.Close>;
}

function ModalContent({className, children, side, showCloseButton, kind, ref, onKeyDown, initialFocus, defaultWidth: _w, minWidth: _min, maxWidth: _max, onWidthChange: _c, stackBelow: _s, ...props}: Omit<SheetContentProps, 'side'> & {side: ScreenSide}) {
  const {open, pending} = useSheet();
  const action = useDefaultAction<HTMLDivElement>({ref, onKeyDown, initialFocus});
  useQuartzModal(open);
  const withClose = showCloseButton ?? side !== 'bottom';
  return <SheetPortal>
    <SheetOverlay/>
    <DrawerPrimitive.Viewport data-slot="sheet-viewport" className={cn('fixed inset-0 z-(--z-overlay) flex', viewportAlign[side])}>
      <DrawerPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        data-kind={kind}
        data-show-close={withClose || undefined}
        aria-busy={pending || undefined}
        className={cn(modalPanel, className)}
        {...action}
        {...props}
      >
        {side === 'bottom' && <div data-slot="sheet-handle" aria-hidden className="flex h-6 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
          <span className="h-1 w-(--grab-size) rounded-soft bg-control forced-colors:bg-[CanvasText]"/>
        </div>}
        <DrawerPrimitive.Content data-slot="sheet-inner" className="flex min-h-0 w-full flex-1 flex-col group-data-[side=bottom]/sheet:mx-auto group-data-[side=bottom]/sheet:max-w-overlay group-data-[side=top]/sheet:mx-auto group-data-[side=top]/sheet:max-w-overlay">
          {children}
        </DrawerPrimitive.Content>
        {withClose && <CloseButton docked={false}/>}
      </DrawerPrimitive.Popup>
    </DrawerPrimitive.Viewport>
  </SheetPortal>;
}

function DockedContent({className, children, side, showCloseButton = true, kind, defaultWidth = 360, minWidth = 280, maxWidth = 640, onWidthChange, stackBelow, style, onKeyDown, ref, initialFocus: _f, finalFocus: _ff, render: _r, ...rest}: Omit<SheetContentProps, 'side'> & {side: 'start' | 'end'}) {
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
    data-kind={kind}
    data-show-close={showCloseButton || undefined}
    data-stack-below={stackBelow}
    onKeyDown={event => {
      onKeyDown?.(event as never);
      if (event.defaultPrevented || event.key !== 'Escape') return;
      if ((event.target as HTMLElement).closest('[role=menu],[role=listbox],[role=dialog]')) return;
      if (pending) { event.preventDefault(); return; }
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }}
    className={cn(
      'group/sheet relative flex min-h-0 shrink-0 flex-col bg-(--surface-frame) text-text-1 frame overflow-visible! max-md:w-full!',
      'forced-colors:outline-solid forced-colors:outline-1 forced-colors:outline-[CanvasText]',
      stackBelow && stackClass[stackBelow],
      typeof className === 'string' ? className : undefined,
    )}
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
        'group/handle absolute inset-y-3 z-(--z-raised) flex w-2 cursor-col-resize touch-none justify-center max-md:hidden',
        side === 'end' ? '-start-1' : '-end-1',
        'focus-visible:outline-offset-0',
      )}
    >
      <span className="w-px bg-transparent transition-colors duration-(--dur-fast) ease-(--ease-step) group-hover/handle:bg-frame group-data-dragging/handle:w-0.5 group-data-dragging/handle:bg-ink group-focus-visible/handle:w-0.5 group-focus-visible/handle:bg-ink forced-colors:bg-[CanvasText]"/>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full mb-1 hidden h-5 items-center rounded-inner bg-inverse px-1 type-state-word text-text-inverse tabular-nums group-data-dragging/handle:flex group-focus-visible/handle:flex"
      >{width}</span>
    </div>
    {children}
    {showCloseButton && <CloseButton docked/>}
  </aside>;
}

function SheetHeader({className, ...props}: React.ComponentProps<'div'>) {
  const {pending, error} = useSheet();
  return <div
    data-slot="sheet-header"
    data-pending={pending || undefined}
    data-status={error ? 'fail' : undefined}
    className={cn(
      'frame relative mx-1 mt-1 flex shrink-0 flex-col gap-1.5 bg-page px-5 pt-5 pb-5 group-data-show-close/sheet:pe-14 [--frame-radius:calc(var(--radius-frame)-4px)]',
      'group-has-data-[slot=sheet-inset]/sheet:pb-0 group-has-data-[slot=sheet-inset]/sheet:before:border-b-0 group-has-data-[slot=sheet-inset]/sheet:[--frame-radius:calc(var(--radius-frame)-4px)_calc(var(--radius-frame)-4px)_0_0]',
      className,
    )}
    {...props}
  />;
}

function SheetBody({className, ref, ...props}: React.ComponentProps<'div'>) {
  const fade = useScrollFade<HTMLDivElement>({focusable: true});
  const setRef = React.useMemo(() => mergeRefs(fade, ref), [fade, ref]);
  return <div data-slot="sheet-inset" className="frame mx-1 mb-1 flex min-h-0 flex-1 flex-col bg-page [--frame-radius:calc(var(--radius-frame)-4px)] group-has-data-[slot=sheet-footer]/sheet:mb-0 group-has-data-[slot=sheet-header]/sheet:before:border-t-0 group-has-data-[slot=sheet-header]/sheet:[--frame-radius:0_0_calc(var(--radius-frame)-4px)_calc(var(--radius-frame)-4px)]">
    <div
      ref={setRef}
      data-slot="sheet-body"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-5 group-has-data-[slot=sheet-header]/sheet:pt-6 focus-visible:focus-ring-inset',
        fadeClass,
        className,
      )}
      {...props}
    />
  </div>;
}

function SheetFooter({className, defaultAction, ref, children, ...props}: React.ComponentProps<'div'> & {
  defaultAction?: DefaultAction;
}) {
  const {error} = useSheet();
  const footer = React.useRef<HTMLDivElement>(null);
  const setRef = React.useMemo(() => mergeRefs(footer, ref), [ref]);
  return <>
  {error && <div data-slot="sheet-error" role="alert" data-status="fail" className="mt-auto flex shrink-0 items-start gap-2 bg-accent-wash px-5 py-2 type-body-sm text-text-1">
    <Icon icon={Warning} size={16} className="mt-0.5"/>
    <span className="min-w-0 break-words">{error}</span>
  </div>}
  <div
    ref={setRef}
    data-slot="sheet-footer"
    data-default-action={defaultAction ?? 'auto'}
    className={cn(
      'frame-foot mt-auto shrink-0 flex-wrap justify-end bg-(--surface-frame)',
      '[[data-slot=sheet-error]+&]:mt-0',
      className,
    )}
    {...props}
  ><ButtonSize size="sm">{children}</ButtonSize></div>
  </>;
}

function SheetTitle({className, children, ...props}: DrawerPrimitive.Title.Props) {
  const {docked, titleId} = useSheet();
  const base = 'flex min-w-0 items-center gap-2 type-heading-xs text-text-1';
  const inner = <><span className="min-w-0 break-words group-data-docked/sheet:truncate">{children as React.ReactNode}</span></>;
  if (docked) return <h2 id={titleId} data-slot="sheet-title" className={cn(base, typeof className === 'string' && className)}>{inner}</h2>;
  return <DrawerPrimitive.Title data-slot="sheet-title" className={mergeClass(base, className)} {...props}>{inner}</DrawerPrimitive.Title>;
}

function SheetDescription({className, ...props}: DrawerPrimitive.Description.Props) {
  const {docked} = useSheet();
  const base = 'type-body text-text-2';
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
  return <section data-slot="sheet-section" className={cn('flex flex-col gap-1.5', className)} {...props}>
    {title && <h3 className="type-label-sm text-text-3">{title}</h3>}
    <dl className="flex flex-col">{children}</dl>
  </section>;
}

function SheetField({label, children, mono, className}: {label: React.ReactNode; children: React.ReactNode; mono?: boolean; className?: string}) {
  return <div data-slot="sheet-field" className={cn('grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-baseline gap-3 min-h-(--row-sm) py-1.5 rule-row', className)}>
    <dt className="truncate type-body-sm text-text-3">{label}</dt>
    <dd className={cn('min-w-0 text-text-1', mono ? 'type-code-sm break-all' : 'type-body-sm break-words')}>{children}</dd>
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
  useScrollFade,
  fadeClass,
  type SheetProps,
  type SheetContentProps,
  type SheetStack,
};

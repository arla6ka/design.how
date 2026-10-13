'use client';

import * as React from 'react';
import {Popover as PopoverPrimitive} from '@base-ui/react/popover';
import {Button} from './button';
import {Icon, Information, Close as CloseIcon} from '../icon';
import {cn, mergeClass} from '../lib/utils';
import {useQuartzPortal} from '../lib/portal';
import {overlayMotion, overlaySurface} from '../lib/overlay';

type PopoverState = {pinned: boolean; peeking: boolean; modal: boolean; pin: () => void; pointer: React.RefObject<string | null>};
const PopoverContext = React.createContext<PopoverState>({pinned: false, peeking: false, modal: false, pin: () => {}, pointer: {current: null}});

type Reason = PopoverPrimitive.Root.ChangeEventDetails['reason'];

type PopoverProps = PopoverPrimitive.Root.Props & {
  defaultPreview?: 'peeking' | 'pinned';
};

function Popover({open: openProp, defaultOpen = false, onOpenChange, modal = false, defaultPreview, ...props}: PopoverProps) {
  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp ?? openState;
  const [openedBy, setOpenedBy] = React.useState<'hover' | 'pin' | 'click' | null>(defaultOpen ? (defaultPreview === 'pinned' ? 'pin' : defaultPreview === 'peeking' ? 'hover' : 'click') : null);
  const pointer = React.useRef<string | null>(null);

  const change = (next: boolean, details: PopoverPrimitive.Root.ChangeEventDetails) => {
    const reason: Reason = details.reason;
    const fromPreview = !!(details.event?.target as Element | null)?.closest?.('[data-hover-preview]');
    if (next && reason === 'trigger-press' && fromPreview && pointer.current === 'touch') {
      details.cancel();
      return;
    }
    if (next) {
      setOpenedBy(reason === 'trigger-hover' ? 'hover' : fromPreview ? 'pin' : 'click');
    } else if (openedBy === 'hover' && reason === 'trigger-press') {
      details.cancel();
      setOpenedBy('pin');
      return;
    } else if (openedBy === 'pin' && reason === 'trigger-hover') {
      details.cancel();
      return;
    }
    if (openProp === undefined) setOpenState(next);
    if (!next) setOpenedBy(null);
    onOpenChange?.(next, details);
  };

  const state = React.useMemo(() => ({pinned: open && openedBy === 'pin', peeking: open && openedBy === 'hover', modal: modal === true, pin: () => setOpenedBy('pin'), pointer}), [open, openedBy, modal]);
  return <PopoverContext.Provider value={state}>
    <PopoverPrimitive.Root data-slot="popover" open={open} onOpenChange={change} modal={modal} {...props}/>
  </PopoverContext.Provider>;
}

function PopoverTrigger({openOnHover, delay = 600, closeDelay = 300, render, onPointerDown, ...props}: PopoverPrimitive.Trigger.Props) {
  const {pointer} = React.useContext(PopoverContext);
  const link = React.isValidElement<{href?: string}>(render) && render.type === 'a' && render.props.href !== undefined;
  return <PopoverPrimitive.Trigger
    data-slot="popover-trigger"
    data-hover-preview={openOnHover || undefined}
    openOnHover={openOnHover}
    delay={openOnHover ? delay : undefined}
    closeDelay={openOnHover ? closeDelay : undefined}
    render={render}
    onPointerDown={event => { pointer.current = event.pointerType; onPointerDown?.(event); }}
    {...props}
    {...(link ? {role: 'link'} : undefined)}
  />;
}

function PopoverClose(props: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props}/>;
}

type PopoverContentProps = PopoverPrimitive.Popup.Props & Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'>;

function PopoverContent({className, align = 'center', alignOffset = 0, side = 'bottom', sideOffset = 6, collisionPadding = 16, children, initialFocus, onPointerDown, ...props}: PopoverContentProps) {
  const container = useQuartzPortal();
  const {pinned, peeking, modal, pin} = React.useContext(PopoverContext);
  return <PopoverPrimitive.Portal container={container}>
    <PopoverPrimitive.Positioner
      data-slot="popover-positioner"
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className="isolate z-(--z-overlay)"
    >
      <PopoverPrimitive.Popup
        data-slot="popover-content"
        data-peeking={peeking || undefined}
        data-pinned={pinned || undefined}
        data-modal={modal || undefined}
        initialFocus={initialFocus ?? (peeking ? false : undefined)}
        onPointerDown={event => { if (peeking) pin(); onPointerDown?.(event); }}
        className={mergeClass([
          'relative flex max-h-(--available-height) w-popover max-w-(--available-width) flex-col gap-3 overflow-y-auto overscroll-contain p-4 type-body',
          overlaySurface,
          overlayMotion,
        ], className)}
        {...props}
      >
        {children}
        {(pinned || modal) && <PopoverPrimitive.Close
          data-slot="popover-pin-close"
          aria-label={pinned ? 'Close preview' : 'Close'}
          render={<Button variant="ghost" size="icon-xs" className="absolute end-3 top-3.5"/>}
        ><Icon icon={CloseIcon} size={16}/></PopoverPrimitive.Close>}
      </PopoverPrimitive.Popup>
    </PopoverPrimitive.Positioner>
  </PopoverPrimitive.Portal>;
}

function PopoverHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('flex flex-col gap-0.5 in-data-pinned:pe-6 in-data-modal:pe-6', className)} {...props}/>;
}

function PopoverTitle({className, ...props}: PopoverPrimitive.Title.Props) {
  return <PopoverPrimitive.Title data-slot="popover-title" className={mergeClass('type-label text-text-1 break-words', className)} {...props}/>;
}

function PopoverDescription({className, ...props}: PopoverPrimitive.Description.Props) {
  return <PopoverPrimitive.Description data-slot="popover-description" className={mergeClass('type-body-sm text-text-2 break-words', className)} {...props}/>;
}

type PopoverInfoProps = {
  children: React.ReactNode;
  label?: string;
  title?: React.ReactNode;
  side?: PopoverPrimitive.Positioner.Props['side'];
  align?: PopoverPrimitive.Positioner.Props['align'];
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & Omit<React.ComponentProps<'button'>, 'children' | 'title'>;

function hasInteractive(node: React.ReactNode): boolean {
  let found = false;
  React.Children.forEach(node, child => {
    if (found || !React.isValidElement<{children?: React.ReactNode; href?: string; onClick?: unknown}>(child)) return;
    if ((typeof child.type === 'string' && ['a', 'button', 'input', 'select', 'textarea'].includes(child.type)) || child.props.href !== undefined || child.props.onClick) found = true;
    else found = hasInteractive(child.props.children);
  });
  return found;
}

function PopoverInfo({children, label, title, side = 'top', align = 'center', className, defaultOpen, open, onOpenChange, ...props}: PopoverInfoProps) {
  const container = useQuartzPortal();
  if (process.env.NODE_ENV !== 'production' && hasInteractive(children)) console.error('PopoverInfo holds plain text only: focus never enters it, so a link or button inside cannot be reached by keyboard. Use a Popover.');
  const descriptionId = React.useId();
  const name = label ?? (typeof title === 'string' ? `About ${title}` : 'More information');
  return <PopoverPrimitive.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange ? next => onOpenChange(next) : undefined}>
    <PopoverPrimitive.Trigger
      {...(props as PopoverPrimitive.Trigger.Props)}
      data-slot="popover-info"
      aria-label={name}
      aria-describedby={descriptionId}
      className={cn(
        'relative -my-1 inline-flex size-6 shrink-0 items-center justify-center rounded-soft align-middle text-text-3',
        'touch-target',
        'transition-colors duration-(--dur-fast) hover:text-text-1 data-popup-open:text-text-1',
        'forced-colors:text-[ButtonText]',
        className,
      )}
    >
      <Icon icon={Information} size={16}/>
    </PopoverPrimitive.Trigger>
    <span id={descriptionId} hidden>{children}</span>
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Positioner side={side} align={align} sideOffset={6} collisionPadding={16} className="isolate z-(--z-overlay)">
        <PopoverPrimitive.Popup
          data-slot="popover-info-content"
          initialFocus={false}
          className={cn('flex w-(--popover-sm) max-w-(--available-width) flex-col gap-1 px-4 py-3 type-body-sm text-text-2 break-words', overlaySurface, overlayMotion)}
        >
          {title && <PopoverPrimitive.Title className="type-label text-text-1">{title}</PopoverPrimitive.Title>}
          <div>{children}</div>
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>;
}

export {Popover, PopoverTrigger, PopoverClose, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription, PopoverInfo, type PopoverInfoProps, type PopoverProps};

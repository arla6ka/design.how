'use client';

import {createContext, useContext, useSyncExternalStore} from 'react';
import {Drawer as DrawerPrimitive} from '@base-ui/react/drawer';
import {Close, Icon} from '../icon';
import {useLimePortal} from '../lib/portal';
import {cn, mergeClass} from '../lib/utils';
import {Button} from './button';

type SheetSide = 'auto' | 'bottom' | 'right' | 'left';
type ResolvedSide = Exclude<SheetSide, 'auto'>;

const SWIPE = {bottom: 'down', right: 'right', left: 'left'} as const;

const SheetContext = createContext<ResolvedSide>('bottom');

const wide = '(min-width: 640px)';
const subscribe = (change: () => void) => {
  const query = window.matchMedia(wide);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};

function useSheetSide(side: SheetSide): ResolvedSide {
  const isWide = useSyncExternalStore(subscribe, () => window.matchMedia(wide).matches, () => false);
  return side === 'auto' ? (isWide ? 'right' : 'bottom') : side;
}

type SheetProps = Omit<DrawerPrimitive.Root.Props, 'swipeDirection'> & {
  side?: SheetSide;
};

function Sheet({side = 'auto', ...props}: SheetProps) {
  const resolved = useSheetSide(side);
  return (
    <SheetContext value={resolved}>
      <DrawerPrimitive.Root data-slot="sheet" swipeDirection={SWIPE[resolved]} {...props}/>
    </SheetContext>
  );
}

function SheetTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="sheet-trigger" {...props}/>;
}

const motion = 'transition-transform duration-(--dur-slow) ease-(--ease-out) data-swiping:transition-none data-ending-style:duration-[calc(var(--dur-slow)*var(--drawer-swipe-strength,1))]';

const popupBySide: Record<ResolvedSide, string> = {
  bottom: cn(
    'max-h-[90dvh] w-full max-w-lg rounded-t-sheet',
    'translate-y-[var(--drawer-swipe-movement-y,0px)] data-starting-style:translate-y-full data-ending-style:translate-y-full',
  ),
  right: cn(
    'h-full w-full max-w-sheet rounded-sheet',
    'translate-x-[var(--drawer-swipe-movement-x,0px)] data-starting-style:translate-x-[calc(100%+(--spacing(4)))] data-ending-style:translate-x-[calc(100%+(--spacing(4)))]',
  ),
  left: cn(
    'h-full w-full max-w-sheet rounded-sheet',
    'translate-x-[var(--drawer-swipe-movement-x,0px)] data-starting-style:-translate-x-[calc(100%+(--spacing(4)))] data-ending-style:-translate-x-[calc(100%+(--spacing(4)))]',
  ),
};

const viewportBySide: Record<ResolvedSide, string> = {
  bottom: 'items-end justify-center',
  right: 'justify-end p-2',
  left: 'justify-start p-2',
};

type SheetContentProps = DrawerPrimitive.Popup.Props;

function SheetContent({className, children, ...props}: SheetContentProps) {
  const container = useLimePortal();
  const side = useContext(SheetContext);
  return (
    <DrawerPrimitive.Portal container={container}>
      <DrawerPrimitive.Backdrop
        data-slot="sheet-backdrop"
        className={cn(
          'fixed inset-0 z-(--z-dialog) bg-scrim opacity-[calc(1-var(--drawer-swipe-progress,0))] transition-opacity duration-(--dur-slow) ease-(--ease-out)',
          'data-swiping:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0',
        )}
      />
      <DrawerPrimitive.Viewport data-slot="sheet-viewport" className={cn('fixed inset-0 z-(--z-dialog) flex', viewportBySide[side])}>
        <DrawerPrimitive.Popup
          data-slot="sheet-content"
          data-side={side}
          className={mergeClass([
            'flex flex-col overflow-hidden bg-raised text-fg shadow-overlay outline-none data-swiping:select-none',
            popupBySide[side], motion,
          ], className)}
          {...props}
        >
          {side === 'bottom' && <div data-slot="sheet-handle" aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-line-strong"/>}
          {children}
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

type SheetHeaderProps = React.ComponentProps<'div'> & {
  showClose?: boolean;
};

function SheetHeader({className, showClose = true, children, ...props}: SheetHeaderProps) {
  return (
    <div data-slot="sheet-header" className={cn('flex shrink-0 items-start gap-3 px-5 pt-4 pb-3', className)} {...props}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
      {showClose && (
        <DrawerPrimitive.Close data-slot="sheet-close" render={<Button variant="secondary" size="icon-sm" aria-label="Close" className="-me-1"/>}>
          <Icon icon={Close} size={16}/>
        </DrawerPrimitive.Close>
      )}
    </div>
  );
}

function SheetTitle({className, ...props}: DrawerPrimitive.Title.Props) {
  return <DrawerPrimitive.Title data-slot="sheet-title" className={mergeClass('title-overlay', className)} {...props}/>;
}

function SheetDescription({className, ...props}: DrawerPrimitive.Description.Props) {
  return <DrawerPrimitive.Description data-slot="sheet-description" className={mergeClass('text-sm text-fg-2', className)} {...props}/>;
}

function SheetBody({className, ...props}: DrawerPrimitive.Content.Props) {
  return <DrawerPrimitive.Content data-slot="sheet-body" className={mergeClass('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2', className)} {...props}/>;
}

function SheetFooter({className, ...props}: React.ComponentProps<'div'>) {
  const side = useContext(SheetContext);
  return <div data-slot="sheet-footer" className={cn(
    'flex shrink-0 gap-2 px-5 pt-3 pb-[max(--spacing(5),env(safe-area-inset-bottom))]',
    side === 'bottom' ? 'flex-col-reverse *:w-full' : 'mt-auto justify-end',
    className,
  )} {...props}/>;
}

function SheetClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="sheet-close" {...props}/>;
}

export {Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter, SheetClose, useSheetSide, type SheetProps, type SheetSide};

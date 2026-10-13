'use client';

import {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {cva, type VariantProps} from 'class-variance-authority';
import {Close, Icon} from '../icon';
import {useLimePortal} from '../lib/portal';
import {cn, mergeClass} from '../lib/utils';
import {Button} from './button';

const backdropClass = cn(
  'fixed inset-0 z-(--z-dialog) bg-scrim transition-opacity duration-(--dur-base) ease-(--ease-out)',
  'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-fast)',
);

const dialogVariants = cva(
  [
    'fixed start-1/2 top-1/2 z-(--z-dialog) flex max-h-[calc(100dvh-(--spacing(8)))] w-[calc(100vw-(--spacing(8)))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-sheet bg-raised p-6 text-fg shadow-overlay outline-none',
    'rtl:translate-x-1/2',
    'transition-[opacity,scale] duration-(--dur-slow) ease-(--ease-out)',
    'data-starting-style:scale-(--scale-enter) data-starting-style:opacity-0 data-ending-style:scale-(--scale-enter) data-ending-style:opacity-0 data-ending-style:duration-(--dur-fast) data-ending-style:ease-(--ease-in)',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-overlay-sm',
        md: 'max-w-overlay',
        lg: 'max-w-overlay-lg',
      },
    },
    defaultVariants: {size: 'md'},
  },
);

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props}/>;
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props}/>;
}

type DialogContentProps = DialogPrimitive.Popup.Props & VariantProps<typeof dialogVariants> & {
  showClose?: boolean;
};

function DialogContent({className, size, showClose = true, children, ...props}: DialogContentProps) {
  const container = useLimePortal();
  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Backdrop data-slot="dialog-backdrop" className={backdropClass}/>
      <DialogPrimitive.Popup data-slot="dialog-content" className={mergeClass(dialogVariants({size}), className)} {...props}>
        {children}
        {showClose && (
          <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" className="absolute end-3 top-3"/>}>
            <Icon icon={Close} size={20}/>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-1.5 pe-8', className)} {...props}/>;
}

function DialogFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props}/>;
}

function DialogTitle({className, ...props}: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={mergeClass('title-overlay', className)} {...props}/>;
}

function DialogDescription({className, ...props}: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={mergeClass('text-sm text-fg-2', className)} {...props}/>;
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props}/>;
}

export {Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose, backdropClass, dialogVariants};

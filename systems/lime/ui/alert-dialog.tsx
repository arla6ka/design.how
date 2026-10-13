'use client';

import {AlertDialog as AlertDialogPrimitive} from '@base-ui/react/alert-dialog';
import {useLimePortal} from '../lib/portal';
import {cn, mergeClass} from '../lib/utils';
import {backdropClass, dialogVariants} from './dialog';

function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props}/>;
}

function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props}/>;
}

function AlertDialogContent({className, ...props}: AlertDialogPrimitive.Popup.Props) {
  const container = useLimePortal();
  return (
    <AlertDialogPrimitive.Portal container={container}>
      <AlertDialogPrimitive.Backdrop data-slot="alert-dialog-backdrop" className={backdropClass}/>
      <AlertDialogPrimitive.Popup data-slot="alert-dialog-content" className={mergeClass(dialogVariants({size: 'sm'}), className)} {...props}/>
    </AlertDialogPrimitive.Portal>
  );
}

function AlertDialogHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-header" className={cn('flex flex-col gap-1.5', className)} {...props}/>;
}

function AlertDialogFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="alert-dialog-footer" className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props}/>;
}

function AlertDialogTitle({className, ...props}: AlertDialogPrimitive.Title.Props) {
  return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={mergeClass('title-overlay', className)} {...props}/>;
}

function AlertDialogDescription({className, ...props}: AlertDialogPrimitive.Description.Props) {
  return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={mergeClass('text-sm text-fg-2', className)} {...props}/>;
}

function AlertDialogClose(props: AlertDialogPrimitive.Close.Props) {
  return <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props}/>;
}

export {AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogClose};

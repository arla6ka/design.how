'use client';

import {Toast as ToastPrimitive} from '@base-ui/react/toast';
import {useMemo, type ReactNode} from 'react';
import {Close, Icon} from '../icon';
import {useLimePortal} from '../lib/portal';
import {cn} from '../lib/utils';

const DEFAULT_TIMEOUT = 5000;
const ACTION_TIMEOUT = 8000;

type ToastOptions = {
  title: string;
  description?: string;
  action?: {label: string; onClick: () => void};
  timeout?: number;
  id?: string;
};

type ToastProviderProps = {
  children?: ReactNode;
  timeout?: number;
  contained?: boolean;
  toastManager?: ToastPrimitive.Provider.Props['toastManager'];
};

function ToastProvider({children, timeout = DEFAULT_TIMEOUT, contained, toastManager}: ToastProviderProps) {
  return (
    <ToastPrimitive.Provider limit={1} timeout={timeout} toastManager={toastManager}>
      {children}
      {contained ? <ToastViewport contained/> : <PortalledViewport/>}
    </ToastPrimitive.Provider>
  );
}

function PortalledViewport() {
  const container = useLimePortal();
  return <ToastPrimitive.Portal container={container}><ToastViewport/></ToastPrimitive.Portal>;
}

function ToastViewport({contained}: {contained?: boolean}) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn('inset-x-4 bottom-4 z-(--z-toast) mx-auto max-w-sm outline-none', contained ? 'absolute' : 'fixed sm:bottom-6')}
    >
      <ToastList/>
    </ToastPrimitive.Viewport>
  );
}

const inkButton = 'inline-flex h-(--control-sm) shrink-0 items-center justify-center rounded-control text-fg-inverse transition-colors duration-(--dur-instant) hover:bg-ink-hover active:bg-ink-active outline-fg-inverse focus-visible:-outline-offset-2';

function ToastList() {
  const {toasts} = ToastPrimitive.useToastManager();
  return toasts.map(toast => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      swipeDirection="down"
      data-slot="toast"
      className={cn(
        'absolute inset-x-0 bottom-0 flex min-h-(--control-lg) items-center rounded-panel bg-ink py-2 ps-4 pe-2 text-fg-inverse shadow-overlay select-none',
        'translate-y-(--toast-swipe-movement-y) transition-[opacity,translate] duration-(--dur-base) ease-(--ease-out)',
        'data-starting-style:translate-y-2 data-starting-style:opacity-0',
        'data-ending-style:opacity-0 data-ending-style:duration-(--dur-fast) data-ending-style:ease-(--ease-in) data-limited:invisible',
      )}
    >
      <ToastPrimitive.Content className="flex min-w-0 flex-1 items-center gap-1">
        <div className="flex min-w-0 flex-1 flex-col py-1 pe-2">
          <ToastPrimitive.Title data-slot="toast-title" className="label"/>
          <ToastPrimitive.Description data-slot="toast-description" className="body opacity-80"/>
        </div>
        <ToastPrimitive.Action data-slot="toast-action" className={cn(inkButton, 'label px-3 font-semibold')}/>
        <ToastPrimitive.Close data-slot="toast-close" aria-label="Dismiss" className={cn(inkButton, 'w-(--control-sm)')}>
          <Icon icon={Close} size={16}/>
        </ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ));
}

function useToast() {
  const manager = ToastPrimitive.useToastManager();
  return useMemo(() => ({
    show({title, description, action, timeout, id}: ToastOptions) {
      const toastId: string = manager.add({
        id,
        title,
        description,
        timeout: timeout ?? (action ? ACTION_TIMEOUT : undefined),
        actionProps: action ? {children: action.label, onClick: () => { action.onClick(); manager.close(toastId); }} : undefined,
      });
      return toastId;
    },
    close: (id?: string) => manager.close(id),
  }), [manager]);
}

const createToastManager = ToastPrimitive.createToastManager;

export {ToastProvider, useToast, createToastManager, type ToastOptions, type ToastProviderProps};

'use client';

import {isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {Toast as ToastPrimitive} from '@base-ui/react/toast';
import {useDomDirection} from '../lib/direction';
import {cn} from '../lib/utils';
import {cssNumber} from '../lib/css-var';
import {useQuartzPortal} from '../lib/portal';
import {Icon, Close as CloseIcon} from '../icon';
import {buttonVariants} from './button';
import {StatusArc} from './status';

const toastManager = ToastPrimitive.createToastManager();

type ToastKind = 'default' | 'success' | 'warn' | 'fail' | 'loading';

type ToastOptions = {
  description?: ReactNode;
  action?: {label: ReactNode; onClick: () => void};
  timeout?: number;
  id?: string;
  onClose?: () => void;
};

function textLength(node: ReactNode): number {
  if (node === null || node === undefined || typeof node === 'boolean') return 0;
  if (typeof node === 'string' || typeof node === 'number') return String(node).length;
  if (Array.isArray(node)) return node.reduce<number>((sum, n) => sum + textLength(n), 0);
  if (isValidElement<{children?: ReactNode}>(node)) return textLength(node.props.children);
  return 40;
}

function readingTimeout(title: ReactNode, description?: ReactNode, hasAction = false) {
  const root = typeof document === 'undefined' ? null : document.querySelector('.quartz');
  const read = (name: string, fallback: number) => cssNumber(root, `--toast-read-${name}`, fallback);
  const ms = read('base', 3000) + read('char', 60) * (textLength(title) + textLength(description)) + (hasAction ? read('action', 3000) : 0);
  return Math.min(read('max', 12000), Math.max(read('min', 4000), Math.round(ms / 100) * 100));
}

function timeoutFor(kind: ToastKind, title: ReactNode, options: ToastOptions) {
  if (options.timeout !== undefined) return options.timeout;
  if (kind === 'fail' || kind === 'loading') return 0;
  return readingTimeout(title, options.description, !!options.action);
}

function toastFields(kind: ToastKind, title: ReactNode, options: Omit<ToastOptions, 'id'>) {
  const {description, action, onClose} = options;
  const timeout = timeoutFor(kind, title, options);
  return {
    title,
    description,
    type: kind,
    timeout,
    priority: kind === 'fail' ? 'high' as const : 'low' as const,
    onClose,
    data: {timeout},
    actionProps: action ? {children: action.label, onClick: action.onClick} : undefined,
  };
}

function add(kind: ToastKind, title: ReactNode, options: ToastOptions = {}) {
  if (textLength(title) === 0 && !isValidElement(title)) return '';
  return toastManager.add({id: options.id, ...toastFields(kind, title, options)});
}

const toast = Object.assign((title: ReactNode, options?: ToastOptions) => add('default', title, options), {
  success: (title: ReactNode, options?: ToastOptions) => add('success', title, options),
  warn: (title: ReactNode, options?: ToastOptions) => add('warn', title, options),
  fail: (title: ReactNode, options?: ToastOptions) => add('fail', title, options),
  loading: (title: ReactNode, options?: ToastOptions) => add('loading', title, options),
  promise: <T,>(promise: Promise<T>, labels: {loading: ReactNode; success: ReactNode | ((value: T) => ReactNode); fail: ReactNode | ((error: unknown) => ReactNode)}) =>
    toastManager.promise(promise, {
      loading: {title: labels.loading, type: 'loading', timeout: 0, data: {timeout: 0}},
      success: value => {
        const title = typeof labels.success === 'function' ? (labels.success as (v: T) => ReactNode)(value) : labels.success;
        const timeout = readingTimeout(title);
        return {title, type: 'success', timeout, data: {timeout}};
      },
      error: error => ({title: typeof labels.fail === 'function' ? (labels.fail as (e: unknown) => ReactNode)(error) : labels.fail, type: 'fail', priority: 'high', timeout: 0, data: {timeout: 0}}),
    }),
  update: (id: string, kind: ToastKind, title: ReactNode, options: Omit<ToastOptions, 'id'> = {}) =>
    toastManager.update(id, toastFields(kind, title, options)),
  dismiss: (id?: string) => toastManager.close(id),
});

type ToasterProps = {
  inline?: boolean;
  limit?: number;
  manager?: typeof toastManager;
  className?: string;
};

function Toaster({inline, limit = 3, manager = toastManager, className}: ToasterProps) {
  const container = useQuartzPortal();
  const [away, setAway] = useState(false);
  useEffect(() => {
    const sync = () => setAway(!document.hasFocus());
    sync();
    window.addEventListener('blur', sync);
    window.addEventListener('focus', sync);
    return () => { window.removeEventListener('blur', sync); window.removeEventListener('focus', sync); };
  }, []);
  const viewport = <ToastPrimitive.Viewport
    data-slot="toast-viewport"
    data-away={away || undefined}
    {...(inline ? {role: 'group', 'aria-live': 'off' as const, 'aria-label': 'Example toasts'} : {})}
    className={cn(
      'group/toasts @container/toast flex w-full flex-col-reverse gap-2 outline-none',
      inline ? 'relative' : 'fixed z-(--z-overlay) end-0 bottom-0 p-(--gutter-sm) pb-[max(var(--gutter-sm),env(safe-area-inset-bottom))] sm:end-(--gutter) sm:bottom-(--gutter) sm:w-toast sm:p-0',
      className,
    )}
  >
    <ToastList limit={limit} manager={manager}/>
  </ToastPrimitive.Viewport>;
  return <ToastPrimitive.Provider toastManager={manager} limit={Number.MAX_SAFE_INTEGER}>
    {inline ? viewport : <ToastPrimitive.Portal container={container}>{viewport}</ToastPrimitive.Portal>}
  </ToastPrimitive.Provider>;
}

type ToastObject = ReturnType<typeof ToastPrimitive.useToastManager>['toasts'][number];

function waitingIds(toasts: ToastObject[], limit: number) {
  const live = toasts.filter(t => t.transitionStatus !== 'ending');
  const fails = live.filter(t => t.type === 'fail').length;
  const routine = live.filter(t => t.type !== 'fail').reverse();
  return new Set(routine.slice(Math.max(0, limit - fails)).map(t => t.id));
}

function ToastList({limit, manager}: {limit: number; manager: typeof toastManager}) {
  const {toasts} = ToastPrimitive.useToastManager();
  const waiting = waitingIds(toasts, limit);
  const key = [...waiting].join(' ');
  const parked = useRef(new Set<string>());
  useEffect(() => {
    for (const t of toasts) {
      const ms = (t.data as {timeout?: number} | undefined)?.timeout ?? 0;
      if (!ms || t.transitionStatus === 'ending') continue;
      if (waiting.has(t.id) && !parked.current.has(t.id)) { parked.current.add(t.id); manager.update(t.id, {timeout: 0}); }
      else if (!waiting.has(t.id) && parked.current.has(t.id)) { parked.current.delete(t.id); manager.update(t.id, {timeout: ms}); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, manager]);
  const nodes = useRef(new Map<string, HTMLElement>());
  const tops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const next = new Map<string, number>();
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nodes.current.forEach((el, id) => {
      if (!el.offsetParent || !el.parentElement) return;
      const top = el.parentElement.getBoundingClientRect().top + el.offsetTop;
      next.set(id, top);
      const before = tops.current.get(id);
      if (before === undefined || Math.abs(before - top) < 1 || still) return;
      el.getAnimations().forEach(a => { if (a.id === 'toast-flip') a.cancel(); });
      const root = el.closest('.quartz');
      el.animate([{transform: `translateY(${before - top}px)`}, {transform: 'none'}], {
        id: 'toast-flip',
        duration: cssNumber(root, '--dur-base', 200),
        easing: root ? getComputedStyle(root).getPropertyValue('--ease-step').trim() || 'ease-out' : 'ease-out',
      });
    });
    tops.current = next;
  });
  const register = (id: string) => (el: HTMLElement | null) => { if (el) nodes.current.set(id, el); else nodes.current.delete(id); };
  return toasts.map(t => <ToastItem key={t.id} toast={t} waiting={waiting.has(t.id)} nodeRef={register(t.id)}/>);
}

function ToastTimer({ms}: {ms: number}) {
  if (!ms) return null;
  return <span
    aria-hidden
    data-slot="toast-timer"
    className={cn(
      'pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-text-3 rtl:origin-right',
      'animate-[quartz-toast-drain_linear_forwards] motion-reduce:hidden',
      'group-data-expanded/toasts:[animation-play-state:paused] group-data-away/toasts:[animation-play-state:paused]',
    )}
    style={{animationDuration: `${ms}ms`}}
  />;
}

function ToastItem({toast: t, waiting, nodeRef}: {toast: ToastObject; waiting: boolean; nodeRef: (el: HTMLElement | null) => void}) {
  const kind = (t.type ?? 'default') as ToastKind;
  const ms = (t.data as {timeout?: number} | undefined)?.timeout ?? t.timeout ?? 0;
  const end = useDomDirection(useQuartzPortal()) === 'rtl' ? 'left' : 'right';
  const status = kind === 'warn' || kind === 'fail' ? kind : undefined;
  return <ToastPrimitive.Root
    ref={nodeRef}
    toast={t}
    data-slot="toast"
    data-kind-of-toast={kind}
    data-timeout={ms || undefined}
    data-waiting={waiting || undefined}
    data-status={status}
    swipeDirection={['down', end]}
    className={cn(
      'relative grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-x-3 [grid-template-areas:"content_action_close"] overflow-hidden rounded-frame bg-page py-3 ps-4 pe-2 text-text-1 shadow-overlay select-none',
      '@max-[22rem]/toast:gap-y-1 @max-[22rem]/toast:[grid-template-areas:"content_content_close"_"action_action_action"]',
      'translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y)',
      'transition-[translate,opacity] duration-(--dur-base) ease-(--ease-step) data-swiping:transition-none',
      'data-starting-style:translate-y-2 data-starting-style:opacity-0',
      'data-ending-style:hidden data-waiting:hidden motion-reduce:transition-none forced-colors:outline forced-colors:outline-1',
    )}
  >
    <ToastPrimitive.Content data-slot="toast-content" className="flex min-w-0 flex-1 items-start gap-2 [grid-area:content]">
      {kind === 'loading' && <span aria-hidden className="flex h-4 shrink-0 items-center"><StatusArc/></span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <ToastPrimitive.Title data-slot="toast-title" className={cn('type-label break-words', kind === 'fail' && 'text-fail-text', kind === 'warn' && 'text-warn-text')}/>
        <ToastPrimitive.Description data-slot="toast-description" className="type-body-sm break-words text-text-2 empty:hidden"/>
      </div>
    </ToastPrimitive.Content>
    {t.actionProps && <ToastPrimitive.Action data-slot="toast-action" className={buttonVariants({variant: 'secondary', size: 'xs', className: '-my-1 self-start [grid-area:action] @max-[22rem]/toast:my-0 @max-[22rem]/toast:ms-7 @max-[22rem]/toast:justify-self-start'})}/>}
    <ToastPrimitive.Close data-slot="toast-close" aria-label="Dismiss" className={buttonVariants({variant: 'ghost', size: 'icon-xs', className: '-my-1 self-start bg-transparent text-text-2 [grid-area:close] hover:text-text-1 active:bg-pressed'})}>
      <Icon icon={CloseIcon} size={16}/>
    </ToastPrimitive.Close>
    {!waiting && <ToastTimer key={`${t.id}-${ms}-${String(t.title)}`} ms={ms}/>}
  </ToastPrimitive.Root>;
}

export {Toaster, toast, toastManager, readingTimeout, type ToastKind, type ToastOptions, type ToasterProps};

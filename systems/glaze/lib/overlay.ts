'use client';

import * as React from 'react';
import type {Dialog as DialogPrimitive} from '@base-ui/react/dialog';
import {coarsePointer, cycleTab} from './portal';
import {cn, mergeRefs} from './utils';

type ChangeDetails = {cancel: () => void};

type OverlayModel = {open: boolean; session: number; pending: boolean; error: string | null};

const overlayModel = (open: boolean): OverlayModel => ({open, session: 0, pending: false, error: null});

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return value !== null && (typeof value === 'object' || typeof value === 'function') && typeof (value as {then?: unknown}).then === 'function';
}

function overlayOpenChanged(model: OverlayModel, open: boolean): OverlayModel {
  if (model.open === open) return model;
  return {open, session: model.session + 1, pending: false, error: open ? null : model.error};
}

function overlayMayClose(model: OverlayModel) {
  return !model.pending;
}

function overlayRunStarted(model: OverlayModel): OverlayModel | null {
  if (model.pending) return null;
  return {...model, pending: true, error: null};
}

type RunOutcome = {ok: true} | {ok: false; error: string};

function overlayRunSettled(model: OverlayModel, session: number, outcome: RunOutcome, closeAfter: boolean): {model: OverlayModel; close: boolean} {
  if (session !== model.session || !model.pending) return {model, close: false};
  if (outcome.ok) return {model: {...model, pending: false}, close: closeAfter && model.open};
  return {model: {...model, pending: false, error: outcome.error}, close: false};
}

const FAILED = 'That did not work. Nothing changed.';
const messageOf = (e: unknown) => e instanceof Error ? e.message : typeof e === 'string' && e ? e : FAILED;

function ownDetails<D extends ChangeDetails>(): D {
  const details = {
    reason: 'imperative-action',
    event: new Event('glaze-overlay'),
    trigger: undefined,
    isCanceled: false,
    isPropagationAllowed: false,
    cancel() { details.isCanceled = true; },
    allowPropagation() { details.isPropagationAllowed = true; },
    preventUnmountOnClose() {},
  };
  return details as unknown as D;
}

function useOverlayOpen<D extends ChangeDetails>({open: openProp, defaultOpen = false, onOpenChange}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, details: D) => void;
}) {
  const [openState, setOpenState] = React.useState(defaultOpen);
  const open = openProp ?? openState;
  const [model, setModel] = React.useState(() => overlayModel(open));
  const modelRef = React.useRef(model);
  const commit = React.useCallback((next: OverlayModel) => {
    if (next === modelRef.current) return;
    modelRef.current = next;
    setModel(next);
  }, []);
  const latest = React.useRef({controlled: openProp !== undefined, onOpenChange});
  React.useLayoutEffect(() => { latest.current = {controlled: openProp !== undefined, onOpenChange}; });
  React.useLayoutEffect(() => { commit(overlayOpenChanged(modelRef.current, open)); }, [open, commit]);

  const setOpen = React.useCallback((next: boolean, details?: D) => {
    const full = details ?? ownDetails<D>();
    if (!next && !overlayMayClose(modelRef.current)) { full.cancel(); return; }
    if (!latest.current.controlled) setOpenState(next);
    latest.current.onOpenChange?.(next, full);
  }, []);

  const run = React.useCallback((action: () => unknown, closeAfter: boolean) => {
    const started = overlayRunStarted(modelRef.current);
    if (!started) return;
    let result: unknown;
    try { result = action(); }
    catch (e) { commit({...modelRef.current, error: messageOf(e)}); return; }
    if (!isThenable(result)) { commit({...modelRef.current, error: null}); if (closeAfter) setOpen(false); return; }
    commit(started);
    const settle = (outcome: RunOutcome) => {
      const {model: next, close} = overlayRunSettled(modelRef.current, started.session, outcome, closeAfter);
      commit(next);
      if (close) setOpen(false);
    };
    result.then(() => settle({ok: true}), (e: unknown) => settle({ok: false, error: messageOf(e)}));
  }, [commit, setOpen]);

  return {open, setOpen, pending: model.pending, error: model.error, session: model.session, run};
}

function closesAfter({close, onAction, onClick, type}: {close?: boolean; onAction?: unknown; onClick?: unknown; type?: string}) {
  return close ?? (onAction !== undefined || (onClick === undefined && type !== 'submit'));
}

type DefaultAction = 'primary' | 'dismiss' | 'none';

const CONTROL = 'button, a[href], textarea, select, summary, [role="button"], [role="link"], [role="menuitem"], [role="option"], [role="combobox"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [contenteditable="true"]';
const FIELD = 'input:not([type="checkbox"],[type="radio"],[type="button"],[type="submit"],[type="reset"],[type="hidden"],[type="range"]):not(:disabled,[readonly]), textarea:not(:disabled,[readonly])';

function footerOf(popup: HTMLElement) {
  return popup.querySelector<HTMLElement>('[data-default-action]');
}

function modeOf(footer: HTMLElement): DefaultAction {
  const declared = footer.dataset.defaultAction;
  if (declared === 'primary' || declared === 'dismiss' || declared === 'none') return declared;
  return footer.querySelector('[data-dialog-action="primary"][data-variant="destructive"]') ? 'dismiss' : 'primary';
}

function actionOf(footer: HTMLElement, action: 'primary' | 'dismiss') {
  const el = footer.querySelector<HTMLElement>(`[data-dialog-action="${action}"]`);
  if (!el || el.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return null;
  return el;
}

type InitialFocus = DialogPrimitive.Popup.Props['initialFocus'];

function useDefaultAction<E extends HTMLElement>({ref, onKeyDown, initialFocus}: {
  ref?: React.Ref<E>;
  onKeyDown?: React.KeyboardEventHandler<E>;
  initialFocus?: InitialFocus;
}) {
  const popupRef = React.useRef<E | null>(null);
  const setRef = React.useMemo(() => mergeRefs(popupRef, ref), [ref]);

  const handleKeyDown = (event: React.KeyboardEvent<E>) => {
    onKeyDown?.(event);
    cycleTab(event);
    if (event.defaultPrevented || event.key !== 'Enter' || event.nativeEvent.isComposing || event.repeat) return;
    if (event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) return;
    const popup = event.currentTarget;
    const target = event.target as HTMLElement;
    if (!popup.contains(target)) return;
    if (target !== popup && target.closest(CONTROL)) return;
    if (target instanceof HTMLInputElement && target.form) return;
    const footer = footerOf(popup);
    if (!footer) return;
    const mode = modeOf(footer);
    if (mode === 'none' || (mode === 'dismiss' && target.matches(FIELD))) return;
    const button = actionOf(footer, mode);
    if (!button) return;
    event.preventDefault();
    button.click();
  };

  const focusOnOpen: InitialFocus = initialFocus ?? (() => {
    const popup = popupRef.current;
    if (!popup) return true;
    if (coarsePointer()) return popup;
    const auto = popup.querySelector<HTMLElement>('[data-autofocus]');
    if (auto) return auto;
    const footer = footerOf(popup);
    if (!footer) return true;
    const mode = modeOf(footer);
    if (mode === 'dismiss') return actionOf(footer, 'dismiss') ?? true;
    if (mode === 'primary') return popup.querySelector<HTMLElement>(FIELD) ?? actionOf(footer, 'primary') ?? true;
    return popup.querySelector<HTMLElement>(FIELD) ?? popup;
  });

  return {ref: setRef, onKeyDown: handleKeyDown, initialFocus: focusOnOpen};
}

function useScrollBody<E extends HTMLElement>(ref?: React.Ref<E>) {
  const scroller = React.useRef<E | null>(null);
  const setRef = React.useMemo(() => mergeRefs(scroller, ref), [ref]);
  React.useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      if (el.scrollTop > 0) el.dataset.scrolled = ''; else delete el.dataset.scrolled;
      if (el.scrollHeight > el.clientHeight + 1) el.tabIndex = 0; else el.removeAttribute('tabindex');
    };
    update();
    el.addEventListener('scroll', update, {passive: true});
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);
  return setRef;
}

const forcedOutline = 'forced-colors:outline-solid forced-colors:outline-1 forced-colors:outline-[CanvasText]';

const overlaySurface = cn('overlay outline-none', forcedOutline);

const overlayShell = cn('shell grid-rows-[minmax(0,1fr)] border-line text-text-1 outline-none', forcedOutline);

const overlayPanel = 'panel flex min-h-0 min-w-0 flex-col overflow-hidden';

const overlayMotion = 'overlay-motion';

const scrimClass = 'fixed inset-0 z-(--z-overlay) bg-scrim transition-opacity duration-(--dur-overlay) ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-state)';

const menuPopupClass = cn(
  overlaySurface, overlayMotion,
  'flex max-h-[min(var(--popup-max),var(--available-height))] min-w-(--menu-min) max-w-(--available-width) flex-col overflow-y-auto overscroll-contain p-1 [--menu-item-h:var(--menu-row)]',
  'data-[size=sm]:[--menu-item-h:var(--menu-row-sm)]',
);

const menuItemClass = cn(
  'relative flex min-h-(--menu-item-h) w-full cursor-default items-center gap-2 rounded-tag px-2 type-label text-text-1 outline-none select-none data-inset:ps-7',
  'in-data-[size=sm]:type-label-sm',
  '[&_svg]:size-(--icon) [&_svg]:shrink-0 [&_svg]:text-text-3',
  'data-highlighted:bg-hover data-disabled:cursor-not-allowed data-disabled:text-text-disabled data-disabled:[&_svg]:text-text-disabled',
  'data-[variant=destructive]:text-fail-text data-[variant=destructive]:[&_svg]:text-fail-text data-[variant=destructive]:data-highlighted:bg-fail-tint',
  'forced-colors:data-highlighted:outline-solid forced-colors:data-highlighted:outline-2 forced-colors:data-highlighted:-outline-offset-2',
);

const menuCheckItemClass = cn(menuItemClass, 'ps-7');

const menuLabelClass = 'flex min-h-(--menu-item-h) items-center px-2 type-caption text-text-2 select-none data-inset:ps-7';

const menuSeparatorClass = '-mx-1 my-1 h-px shrink-0 bg-line-faint';

export {
  useOverlayOpen,
  overlayModel,
  overlayOpenChanged,
  overlayMayClose,
  overlayRunStarted,
  overlayRunSettled,
  isThenable,
  closesAfter,
  useDefaultAction,
  useScrollBody,
  overlaySurface,
  overlayShell,
  overlayPanel,
  overlayMotion,
  scrimClass,
  menuPopupClass,
  menuItemClass,
  menuCheckItemClass,
  menuLabelClass,
  menuSeparatorClass,
  type DefaultAction,
};

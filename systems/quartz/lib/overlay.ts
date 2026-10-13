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
    event: new Event('quartz-overlay'),
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

function actionOf(footer: HTMLElement, action: 'primary' | 'dismiss', busy = false) {
  const el = footer.querySelector<HTMLElement>(`[data-dialog-action="${action}"]`);
  if (!el) return null;
  if (busy && el.matches('[aria-busy="true"]')) return el;
  if (el.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return null;
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

const overlaySurface = 'rounded-frame bg-page text-text-1 shadow-overlay outline-none forced-colors:outline-solid forced-colors:outline-1 forced-colors:outline-[CanvasText]';

const overlayShellSurface = overlaySurface.replace('bg-page', 'bg-(--surface-frame)');

const overlayMotion = 'transition-opacity duration-(--dur-base) ease-(--ease-step) data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-fast) motion-reduce:transition-none';

const backdropClass = cn(
  'fixed inset-0 z-(--z-overlay) bg-overlay',
  'transition-opacity duration-(--dur-slow) ease-(--ease-step) data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-base)',
);

function useScrollFade<E extends HTMLElement>({focusable = false}: {focusable?: boolean} = {}) {
  const ref = React.useRef<E | null>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const start = el.scrollTop > 1;
      const end = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      const fade = start && end ? 'both' : start ? 'start' : end ? 'end' : '';
      if (fade) el.dataset.fade = fade; else delete el.dataset.fade;
      if (focusable) { if (el.scrollHeight > el.clientHeight + 1) el.tabIndex = 0; else el.removeAttribute('tabindex'); }
    };
    update();
    el.addEventListener('scroll', update, {passive: true});
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    const mo = new MutationObserver(update);
    mo.observe(el, {childList: true, subtree: true});
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); mo.disconnect(); };
  }, [focusable]);
  return ref;
}

const fadeClass = 'fade-y';

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
  overlaySurface,
  overlayShellSurface,
  overlayMotion,
  backdropClass,
  useScrollFade,
  fadeClass,
  type DefaultAction,
};

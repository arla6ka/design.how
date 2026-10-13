'use client';

import {createContext, createElement, Fragment, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';

type Direction = 'ltr' | 'rtl';

type PortalScope = {
  container: HTMLElement | null;
  lock: () => () => void;
};

const QuartzPortalContext = createContext<PortalScope | undefined>(undefined);

const noLock = () => () => {};

function inertOutside(keep: HTMLElement) {
  const set: HTMLElement[] = [];
  let node: HTMLElement | null = keep;
  while (node && node !== node.ownerDocument.body) {
    const parent: HTMLElement | null = node.parentElement;
    if (!parent) break;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert || sibling.tagName === 'SCRIPT') continue;
      sibling.inert = true;
      set.push(sibling);
    }
    node = parent;
  }
  return () => { for (const el of set) el.inert = false; };
}

export function QuartzPortalProvider({children, dir}: {children: ReactNode; dir?: Direction}) {
  const parent = useContext(QuartzPortalContext);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const count = useRef(0);
  const undo = useRef<(() => void) | null>(null);
  const role = !parent ? 'root' : dir ? 'dir' : 'stage';

  const scope = useMemo<PortalScope>(() => {
    if (role === 'dir') return {container, lock: parent!.lock};
    if (role === 'stage') return {container, lock: noLock};
    return {
      container,
      lock: () => {
        count.current += 1;
        if (count.current === 1 && container) undo.current = inertOutside(container);
        let released = false;
        return () => {
          if (released) return;
          released = true;
          count.current -= 1;
          if (count.current === 0) { undo.current?.(); undo.current = null; }
        };
      },
    };
  }, [role, container, parent]);

  if (!parent && dir) return createElement(Fragment, null, children);

  const element = createElement('div', {ref: setContainer, 'data-quartz-portal': role, dir: role === 'dir' ? dir : undefined});
  return createElement(QuartzPortalContext.Provider, {value: scope},
    children,
    role === 'dir' ? (parent!.container ? createPortal(element, parent!.container) : null) : element,
  );
}

export function useQuartzPortal() {
  return useContext(QuartzPortalContext)?.container;
}

export function useQuartzModal(active: boolean) {
  const scope = useContext(QuartzPortalContext);
  const lock = scope?.lock;
  const ready = !!scope?.container;
  useLayoutEffect(() => {
    if (!active || !lock || !ready) return;
    return lock();
  }, [active, lock, ready]);
}

const TABBABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable="true"]';

function tabbablesIn(popup: HTMLElement) {
  return Array.from(popup.querySelectorAll<HTMLElement>(TABBABLE)).filter(el => {
    if (el.matches(':disabled, [data-base-ui-focus-guard], [aria-hidden="true"]') || el.tabIndex < 0) return false;
    if (el.closest('[inert]') || el.closest('[hidden]')) return false;
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  });
}

export function cycleTab(event: {key: string; shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean; defaultPrevented: boolean; currentTarget: HTMLElement; target: EventTarget; preventDefault: () => void}) {
  if (event.key !== 'Tab' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
  const popup = event.currentTarget;
  const target = event.target as HTMLElement;
  if (!popup.contains(target)) return;
  const stops = tabbablesIn(popup);
  if (!stops.length) { event.preventDefault(); popup.focus(); return; }
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (event.shiftKey && (target === first || target === popup)) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && target === last) { event.preventDefault(); first.focus(); }
}

export function coarsePointer() {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

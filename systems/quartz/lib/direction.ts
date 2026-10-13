'use client';

import {createElement, useLayoutEffect, useState, type ReactNode, type RefObject} from 'react';
import {DirectionProvider} from '@base-ui/react/direction-provider';
import {QuartzPortalProvider} from './portal';

export type Direction = 'ltr' | 'rtl';

export function QuartzDirection({dir, children}: {dir: Direction; children: ReactNode}) {
  return createElement(DirectionProvider, {direction: dir}, createElement(QuartzPortalProvider, {dir, children}));
}

type DirectionTarget = RefObject<Element | null> | Element | null | undefined;

const resolve = (target: DirectionTarget) => (target && 'current' in target ? target.current : target) ?? null;

export function useDomDirection(target: DirectionTarget): Direction {
  const [dir, setDir] = useState<Direction>('ltr');
  useLayoutEffect(() => {
    const doc = resolve(target)?.ownerDocument ?? (typeof document === 'undefined' ? null : document);
    if (!doc) return;
    const read = () => {
      const el = resolve(target) ?? doc.documentElement;
      setDir(getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr');
    };
    read();
    const watch = new MutationObserver(read);
    watch.observe(doc.documentElement, {attributes: true, attributeFilter: ['dir'], subtree: true});
    return () => watch.disconnect();
  }, [target]);
  return dir;
}

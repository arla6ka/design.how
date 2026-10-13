'use client';

import {useEffect, useRef} from 'react';

function useFocusWhenReplaced<Target extends HTMLElement = HTMLElement, Region extends HTMLElement = HTMLElement>(replaced: boolean) {
  const region = useRef<Region>(null);
  const target = useRef<Target>(null);
  const was = useRef(replaced);
  useEffect(() => {
    const before = was.current;
    was.current = replaced;
    if (before || !replaced) return;
    const active = document.activeElement;
    if (!active || active === document.body || !active.isConnected || region.current?.contains(active)) target.current?.focus();
  }, [replaced]);
  return {region, target};
}

export {useFocusWhenReplaced};

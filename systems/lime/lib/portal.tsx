'use client';

import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';

const LimePortalContext = createContext<HTMLElement | null | undefined>(undefined);

export function LimePortalProvider({children}: {children: ReactNode}) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return (
    <LimePortalContext.Provider value={container}>
      {children}
      <div ref={setContainer} data-lime-portal=""/>
    </LimePortalContext.Provider>
  );
}

let fallback: HTMLElement | null = null;

function fallbackContainer() {
  if (fallback && fallback.isConnected) return fallback;
  fallback = document.createElement('div');
  fallback.className = 'lime';
  fallback.setAttribute('data-system', 'lime');
  fallback.setAttribute('data-lime-portal', 'fallback');
  document.body.appendChild(fallback);
  return fallback;
}

export function useLimePortal() {
  const scoped = useContext(LimePortalContext);
  const [own, setOwn] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (scoped === undefined) setOwn(fallbackContainer());
  }, [scoped]);
  return scoped === undefined ? own : scoped;
}

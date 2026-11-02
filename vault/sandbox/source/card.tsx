'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {SandboxCycle} from './engine';

export default function SandboxCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<SandboxCycle | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const raf = requestAnimationFrame(() => {
      const next = new SandboxCycle(host);
      engine.current = next;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });
    return () => {
      cancelAnimationFrame(raf);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="Short clips rebuilt as a halftone of small tinted symbols, one symbol per brightness band, switching to a new clip and palette every two seconds."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: '#ffffff'}}
  />;
}

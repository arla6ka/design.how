// Crystal cluster (https://design.how/vault/crystal-cluster), card.tsx.
// FIXED. Change the VARIABLE values in params instead (CRYSTAL_COLOR, OUTLINE_COLOR, OUTLINE_PX, BEAM_CORE, BEAM_GOLD, PULL, BACKDROP).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {CrystalCluster} from './engine';

export const BACKDROP = 'radial-gradient(120% 90% at 50% 28%, #6b4a2c 0%, #3a2a1c 45%, #1c140d 100%)';

export default function CrystalClusterCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<CrystalCluster | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const raf = requestAnimationFrame(() => {
      const next = new CrystalCluster(host);
      engine.current = next;
      if (!next.ok) return;
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
    aria-label="A small cluster of teal crystals with a thin gold outline, floating in a rising gold beam of light in a dark room."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', backgroundColor: '#3a2a1c', backgroundImage: BACKDROP}}
  />;
}

'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {FadeMotion, PALETTES, pixelFontSpec} from './engine';

export default function FadeMotionCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<FadeMotion | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const reduced = prefersReducedMotion();
    const raf = requestAnimationFrame(() => {
      const next = new FadeMotion(host);
      engine.current = next;
      if (!next.ok) return;
      if (!reduced) next.enableHero(2);
      next.onBg = css => { host.style.backgroundColor = css; };
      const refresh = () => { if (!cancelled) engine.current?.refreshFonts(); };
      document.fonts?.load?.(pixelFontSpec()).catch(() => {}).then(refresh);
      document.fonts?.ready.then(refresh).catch(() => {});
      if (reduced) next.renderStill();
      else if (running.current) next.start();
    });

    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMove = (event: PointerEvent) => {
      if (reduced) return;
      const r = host.getBoundingClientRect();
      engine.current?.setPointer({x: (event.clientX - r.left) / r.width, y: (event.clientY - r.top) / r.height});
    };
    const onLeave = () => engine.current?.setPointer(null);
    if (fine) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointercancel', onLeave);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointercancel', onLeave);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="The word motion trailing downward into light, its fade built from hundreds of overlapping copies, turning gently as its colours change."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: PALETTES[0].bg}}
  />;
}

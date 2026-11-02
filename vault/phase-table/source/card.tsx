'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PhaseTable} from './engine';
import {METALS} from './params';

export default function PhaseTableCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<PhaseTable | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new PhaseTable(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    const onMove = (event: PointerEvent) => {
      const r = element.getBoundingClientRect();
      engine.current?.setPointer(r.width ? (event.clientX - r.left) / r.width : null);
    };
    const onLeave = () => engine.current?.setPointer(null);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerdown', onMove);
    element.addEventListener('pointerleave', onLeave);
    element.addEventListener('pointercancel', onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerdown', onMove);
      element.removeEventListener('pointerleave', onLeave);
      element.removeEventListener('pointercancel', onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A grid of glowing metal wires on a near-black field, four rows by six columns, each cell one continuous looping curve. Circles run down the diagonal; away from it the curves gain lobes, becoming arches, figure-eights, waves and dense woven lattices. Each wire catches a bright reflection on one side and falls to shadow on the other, and all twenty-four breathe together on one shared sweep. Moving the pointer sweeps the reflection over every curve."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: METALS[0].bg, userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', touchAction: 'pan-y'}}/>
  </div>;
}

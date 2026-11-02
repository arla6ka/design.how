// Ink flood (https://design.how/vault/ink-flood), card.tsx.
// FIXED. Change the VARIABLE values in params instead (scene, palette.fields, palette.dot, generateSpine options, HALFTONE_DEFAULTS).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {InkFlood} from './engine';
import {DEFAULT_SCENE} from './presets';
import type {Scene} from './scene';

export type InkFloodProps = {scene?: Scene; className?: string};

export default function InkFloodCard({scene = DEFAULT_SCENE, className}: InkFloodProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<InkFlood | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new InkFlood(element, scene);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [scene, running]);

  return <div
    ref={box}
    role="img"
    aria-label="A grey dot writes a thick black scribble across a pale field, the scribble swells until its ink floods the whole card, and the drawing starts again mirrored in the opposite colours, each pass painting the ground the next one is drawn on."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: scene.palette.fields[0]}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

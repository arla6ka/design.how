'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PixelFire} from './engine';
import {GROUND} from './params';

export default function PixelFireCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<PixelFire | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    const element = canvas.current;
    if (!host || !element) return;
    const raf = requestAnimationFrame(() => {
      const next = new PixelFire(host, element);
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
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A small pixel-art fire burning on a dark red block, drawn in crisp square texels. Moving the pointer through it pushes the flames aside and up, and a tap blows it out until it regrows."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND, userSelect: 'none', touchAction: 'pan-y'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none'}}/>
  </div>;
}

// Sunset slam (https://design.how/vault/sunset-slam), card.tsx.
// FIXED. Change the VARIABLE values in params instead (RAMP, BG_TOP, BG_BOTTOM, RECTS, BLOOM_LAYERS, BLOOM_ALPHA, HOVER_WARM, HOVER_BLOOM, OUTRO).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {SunsetSlam} from './engine';
import {BG} from './params';

export default function SunsetSlamCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<SunsetSlam | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new SunsetSlam(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });

    const onEnter = (event: PointerEvent) => { if (event.pointerType === 'mouse') engine.current?.setHover(true); };
    const onLeave = () => engine.current?.setHover(false);
    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      element.removeEventListener('pointerenter', onEnter);
      element.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="The word sunset, in white slab letters on a pre-dawn sky, squashes down and then slams forward into a chunky retro logo trailing a fan of dawn colour, from deep navy through violet and rose to a gold edge. It cools to a resting sticker, holds, then the fan retracts and the word returns to where it started."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: BG}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

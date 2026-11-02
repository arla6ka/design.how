'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {SlideStack} from './engine';
import {FONT_VAR, GROUND} from './params';

function cardFraction(element: HTMLElement, cx: number, cy: number) {
  const r = element.getBoundingClientRect();
  const s = Math.min(r.width, r.height);
  if (s <= 0 || r.width <= 0) return null;
  return {x: (cx - r.left) / r.width, y: (cy - r.top - (r.height - s) / 2) / s};
}

export default function SlideStackCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<SlideStack | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily || 'sans-serif';
    probe.remove();

    const raf = requestAnimationFrame(() => {
      const next = new SlideStack(element);
      engine.current = next;
      if (!next.ok) return;
      next.setFont(family);
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      document.fonts?.load(`600 1em "${first}"`).then(() => { if (!cancelled) engine.current?.setFont(family); }, () => {});
    });

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') engine.current?.setPointer(cardFraction(element, event.clientX, event.clientY));
    };
    const onLeave = () => engine.current?.setPointer(null);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
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
    aria-label="Five dark blocks on a light grey ground, sliding between a left and a right stop, with an orange field behind them. Each row moves a beat out of step with its neighbour, so the movement runs through the stack as a wave and the orange edge traces a shifting diagonal."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

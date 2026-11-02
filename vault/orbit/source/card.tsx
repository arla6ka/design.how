'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {Orbit} from './engine';
import {BG, CAST, FONT_VAR} from './params';

function roleFamily(variable: string): string {
  const probe = document.createElement('span');
  probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${variable})`;
  probe.textContent = 'Ag';
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || 'sans-serif';
  probe.remove();
  return family;
}

export default function OrbitCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Orbit | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const family = roleFamily(FONT_VAR);
    const raf = requestAnimationFrame(() => {
      const next = new Orbit(element);
      engine.current = next;
      if (!next.ok) return;
      next.setFont(family);
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      document.fonts?.load(`600 1em "${first}"`).then(() => { if (!cancelled) engine.current?.setFont(family); }, () => {});
    });

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);

    let lastX = 0;
    let lastY = 0;
    let havePointer = false;
    const push = () => {
      if (!havePointer) return;
      const r = element.getBoundingClientRect();
      if (r.width && r.height) engine.current?.setPointer({x: (lastX - r.left) / r.width, y: (lastY - r.top) / r.height});
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      lastX = event.clientX;
      lastY = event.clientY;
      havePointer = true;
      push();
    };
    const onLeave = () => { engine.current?.setPointer(null); engine.current?.dragEnd(); };
    window.addEventListener('pointermove', onMove, {passive: true});
    window.addEventListener('scroll', push, {passive: true});
    window.addEventListener('blur', onLeave);

    let dragT = 0;
    let claimed = false;
    let startX = 0;
    let startY = 0;
    const fraction = (event: PointerEvent) => {
      const r = element.getBoundingClientRect();
      return r.width && r.height ? {x: (event.clientX - r.left) / r.width, y: (event.clientY - r.top) / r.height} : null;
    };
    const onDown = (event: PointerEvent) => {
      const p = fraction(event);
      if (!p) return;
      startX = p.x;
      startY = p.y;
      claimed = event.pointerType === 'mouse';
      dragT = performance.now();
      if (claimed) { element.setPointerCapture(event.pointerId); engine.current?.dragStart(p); }
    };
    const onDrag = (event: PointerEvent) => {
      const p = fraction(event);
      if (!p) return;
      if (!claimed) {
        const dx = Math.abs(p.x - startX);
        const dy = Math.abs(p.y - startY);
        if ((dx < 0.02 && dy < 0.02) || dx <= dy) return;
        claimed = true;
        element.setPointerCapture(event.pointerId);
        engine.current?.dragStart({x: startX, y: startY});
      }
      const now = performance.now();
      const dt = Math.min(Math.max((now - dragT) / 1000, 1 / 240), 0.1);
      dragT = now;
      engine.current?.dragMove(p, dt);
      event.preventDefault();
    };
    const onUp = (event: PointerEvent) => {
      if (claimed && element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      claimed = false;
      engine.current?.dragEnd();
    };
    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointermove', onDrag);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', push);
      window.removeEventListener('blur', onLeave);
      element.removeEventListener('pointerdown', onDown);
      element.removeEventListener('pointermove', onDrag);
      element.removeEventListener('pointerup', onUp);
      element.removeEventListener('pointercancel', onUp);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`${CAST.length} named multiplayer cursors circling on an invisible sphere, growing and sharpening as they pass the front, blurring and fading as they slip behind, around a thin violet ring that slowly breathes.`}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: BG, cursor: 'grab', userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', cursor: 'none', touchAction: 'pan-y'}}/>
  </div>;
}

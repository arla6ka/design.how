'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {MisprintType} from './engine';
import {FILL_WEIGHT, FONT_VAR, GROUND, OUTLINE_WEIGHT} from './params';

export default function MisprintTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<MisprintType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    const host = box.current;
    if (!element || !host) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily || 'sans-serif';
      probe.remove();

      const next = new MisprintType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const first = family.split(',')[0].replace(/["']/g, '').trim();
      if (document.fonts?.load) {
        Promise.all([document.fonts.load(`${FILL_WEIGHT} 1em "${first}"`), document.fonts.load(`${OUTLINE_WEIGHT} 1em "${first}"`)])
          .then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
      }
    });

    const onMove = (event: PointerEvent) => {
      const r = host.getBoundingClientRect();
      if (r.width && r.height) engine.current?.point(((event.clientX - r.left) / r.width) * 2 - 1, ((event.clientY - r.top) / r.height) * 2 - 1);
    };
    const onDown = (event: PointerEvent) => { onMove(event); engine.current?.hold(true); };
    const onUp = () => engine.current?.hold(false);
    const onLeave = () => { engine.current?.point(null); engine.current?.hold(false); };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointerup', onUp);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('pointercancel', onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointerup', onUp);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointercancel', onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="The words HOLD ON in tall warm-white capitals on a hot orange field, two lines, with a thin black outline that does not line up with the white letters, as if printed slightly off, and slivers of holographic foil at the letter edges. The white ink carries faint vertical streaks and tiny pinholes, like a screen print. Pointing at the picture tilts it a little: the outline slides across the white with a soft shadow and the foil changes colour. Every few seconds a new sheet goes through and the outline lands somewhere else. Pressing and holding pulls everything onto the white; letting go lets it slip again."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND, userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

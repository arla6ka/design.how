// Cloud type (https://design.how/vault/cloud-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (GROUND, GLYPHS, PLAY_RATE, DRIFT_PER_FRAME, ENTRY.thr, EXIT.thr, DITHER, WIND, FONT_VAR, FONT_WEIGHT).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {CloudType} from './engine';
import {FONT_VAR, FONT_WEIGHT, GROUND, SCENE_H, SCENE_W} from './params';

export default function CloudTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<CloudType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const reduced = prefersReducedMotion();
    let cancelled = false;

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily || 'sans-serif';
      probe.remove();

      const next = new CloudType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (reduced) next.renderStill();
      else if (running.current) next.start();

      const first = family.split(',')[0].replace(/["']/g, '').trim();
      document.fonts?.load?.(`${FONT_WEIGHT} 1em "${first}"`).then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
    });

    const onMove = (event: PointerEvent) => {
      if (reduced) return;
      const r = element.getBoundingClientRect();
      if (r.width && r.height) engine.current?.setWind(((event.clientX - r.left) / r.width) * SCENE_W, ((event.clientY - r.top) / r.height) * SCENE_H);
    };
    const onLeave = () => engine.current?.clearWind();
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerdown', onMove);
    for (const type of ['pointerleave', 'pointercancel'] as const) element.addEventListener(type, onLeave);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerdown', onMove);
      for (const type of ['pointerleave', 'pointercancel'] as const) element.removeEventListener(type, onLeave);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="The words Drift into focus in bold white letters on a pale sky blue field. The letters arrive from the lower left as soft white puffs of cloud, land on the line one after another from left to right and come into focus, each edge fuzzy with a fine grain. The line holds and drifts slowly upward, then the letters lift away to the upper right, softening back into cloud and thinning until nothing is left. Moving the pointer over the words lifts and softens the letters nearest to it very slightly, like a breath of wind."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', touchAction: 'pan-y'}}/>
  </div>;
}

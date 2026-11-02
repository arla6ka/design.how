// Rush type (https://design.how/vault/rush-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORDS, SY_PEAK, SX_PEAK, REST_S, SHUTTER_K, SAMPLES, ORBIT_YAW, ORBIT_PITCH, CRT_GAIN, HOLD_STRENGTH, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {RushType} from './engine';
import {FONT_VAR, WORDS} from './params';

export default function RushTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<RushType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const next = new RushType(host);
      engine.current = next;
      if (!next.ok) return;
      next.renderStill();
      if (!prefersReducedMotion() && running.current) next.start();
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:${FONT_VAR}`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      probe.remove();
      document.fonts?.load?.(`400 1em "${family}"`).then(() => { if (!cancelled) engine.current?.refreshFont(); }, () => {});
    });

    const grab = () => engine.current?.setHeld(true);
    const release = () => engine.current?.setHeld(false);
    host.addEventListener('pointerenter', grab);
    host.addEventListener('pointerdown', grab);
    for (const type of ['pointerleave', 'pointerup', 'pointercancel'] as const) host.addEventListener(type, release);

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.onResize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      host.removeEventListener('pointerenter', grab);
      host.removeEventListener('pointerdown', grab);
      for (const type of ['pointerleave', 'pointerup', 'pointercancel'] as const) host.removeEventListener(type, release);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`The words ${WORDS.join(', ')} one at a time on a dark field. Each word holds still and sharp for a beat, then swings up and toward you, turning, until it stretches off the top and bottom of the frame and tears into vertical streaks of green and violet light, and the next word falls back out of the blur. Pointing at it holds the word at its largest.`}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: '#000', touchAction: 'pan-y'}}
  />;
}

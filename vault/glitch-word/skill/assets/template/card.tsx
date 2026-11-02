// Glitch word (https://design.how/vault/glitch-word), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORD, LAYERS, IDLE, ACTIVE, WORD_SIZE, GREENS, GROUND, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef, type CSSProperties} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {GlitchWord} from './engine';
import {ACTIVE, FONT_VAR, GREENS, GROUND, IDLE, LAYERS, WORD, WORD_SIZE} from './params';

const PULL = 0.18;
const SPRING = 'cubic-bezier(0.175, 0.885, 0.32, 1.1)';

const CSS = `
@property --glitch-green { syntax: "<color>"; inherits: true; initial-value: ${GREENS[0]}; }
@keyframes glitch-hue-drift {
  0% { --glitch-green: ${GREENS[0]}; } 30% { --glitch-green: ${GREENS[1]}; } 55% { --glitch-green: ${GREENS[2]}; }
  80% { --glitch-green: ${GREENS[3]}; } 100% { --glitch-green: ${GREENS[0]}; }
}
.glitch-badge {
  position: absolute; inset: -0.13em -0.4em; border-radius: 0.27em;
  animation: glitch-hue-drift 17s ease-in-out infinite;
  background:
    radial-gradient(120% 140% at 50% 50%, rgba(0, 0, 0, 0) 55%, rgba(0, 40, 18, 0.14) 100%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 46%, rgba(0, 30, 14, 0.1) 100%),
    var(--glitch-green);
  box-shadow:
    inset 0 1px 0 -0.5px rgba(255, 255, 255, 0.4), inset 0 -1px 0 -0.5px rgba(0, 32, 15, 0.3),
    inset 0 0 0 1px rgba(0, 40, 18, 0.09), 0 1px 2px rgba(6, 46, 24, 0.22), 0 4px 10px -4px rgba(6, 46, 24, 0.28);
}
[data-glitch-paused] .glitch-badge { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .glitch-badge { animation: none; } }
`;

const CELL: CSSProperties = {gridColumnStart: 1, gridRowStart: 1};
const TEXT: CSSProperties = {fontFamily: `var(${FONT_VAR})`, fontWeight: 500, fontSize: '1em', lineHeight: 1, letterSpacing: '0.01em', whiteSpace: 'pre'};

export default function GlitchWordCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<GlitchWord | null>(null);
  const paused = (run: boolean) => {
    if (run) delete box.current?.dataset.glitchPaused;
    else if (box.current) box.current.dataset.glitchPaused = '';
  };
  const running = usePause(box, run => {
    paused(run);
    if (run) engine.current?.start();
    else engine.current?.stop();
  });

  useEffect(() => {
    const host = box.current;
    const base = host?.querySelector<HTMLElement>('[data-glitch-base]');
    if (!host || !base) return;
    const reduced = prefersReducedMotion();
    const layers = Array.from(host.querySelectorAll<HTMLElement>('[data-glitch-layer]'));
    const next = new GlitchWord(base, layers, WORD, reduced);
    engine.current = next;
    paused(running.current);
    if (running.current) next.start();

    const magnet = host.querySelector<HTMLElement>('[data-glitch-magnet]');
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (!magnet || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = host.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const falloff = Math.max(0, 1 - Math.hypot(dx, dy) / (Math.hypot(r.width, r.height) / 2));
        const k = PULL * falloff * falloff;
        magnet.style.transition = 'none';
        magnet.style.transform = `translate3d(${(dx * k).toFixed(2)}px,${(dy * k).toFixed(2)}px,0)`;
      });
    };
    const onEnter = () => next.setOptions(ACTIVE);
    const onLeave = () => {
      next.setOptions(IDLE);
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!magnet) return;
      magnet.style.transition = `transform 620ms ${SPRING}`;
      magnet.style.transform = 'translate3d(0,0,0)';
    };
    const fine = window.matchMedia('(pointer: fine)').matches && !reduced;
    if (fine) {
      host.addEventListener('pointerenter', onEnter);
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointermove', onMove);
    }
    return () => {
      if (fine) {
        host.removeEventListener('pointerenter', onEnter);
        host.removeEventListener('pointerleave', onLeave);
        host.removeEventListener('pointermove', onMove);
      }
      if (raf) cancelAnimationFrame(raf);
      next.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`The word "${WORD}" in a small green badge, tearing itself apart: stacked copies clipped into bands and shoved sideways while a few letters flicker into lookalikes.`}
    className={className}
    style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', background: GROUND, containerType: 'inline-size'}}
  >
    <style href="glitch-word" precedence="default">{CSS}</style>
    <span data-glitch-magnet style={{position: 'relative', display: 'inline-block', willChange: 'transform', fontSize: `${WORD_SIZE}cqw`}}>
      <span style={{position: 'relative', display: 'grid', placeItems: 'center'}}>
        <span aria-hidden="true" style={{...CELL, ...TEXT, visibility: 'hidden'}}>{WORD}</span>
        <span data-glitch-base style={{...CELL, position: 'relative', zIndex: 10}}>
          <span data-glitch-badge className="glitch-badge"/>
          <span data-glitch-text style={{...TEXT, position: 'relative', color: '#fff'}}>{WORD}</span>
        </span>
        {Array.from({length: LAYERS}, (_, i) => <span key={i} data-glitch-layer aria-hidden="true" style={{...CELL, opacity: 0, pointerEvents: 'none', position: 'relative', zIndex: 10}}>
          <span className="glitch-badge" style={{animationDelay: `${-(i * 2.4).toFixed(1)}s`}}/>
          <span data-glitch-text style={{...TEXT, position: 'relative', color: '#fff'}}>{WORD}</span>
        </span>)}
      </span>
    </span>
  </div>;
}

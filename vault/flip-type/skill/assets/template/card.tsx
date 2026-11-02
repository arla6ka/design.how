// Flip type (https://design.how/vault/flip-type), card.tsx.
// FIXED. Change the VARIABLE values in params instead (GROUND, INK, PLAY_RATE, BREATH, BOUNCE, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef, type PointerEvent} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {FlipType} from './engine';
import {FONT_VAR, FONT_WEIGHT, GROUND, SCENE_H, SCENE_W, WORDS} from './params';

export default function FlipTypeCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<FlipType | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    const r = event.currentTarget.getBoundingClientRect();
    if (r.width && r.height) engine.current?.poke(((event.clientX - r.left) / r.width) * SCENE_W, ((event.clientY - r.top) / r.height) * SCENE_H);
  };

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

    const build = () => {
      if (cancelled) return;
      const next = new FlipType(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const first = family.split(',')[0].replace(/["']/g, '').trim();
    if (document.fonts?.load) document.fonts.load(`${FONT_WEIGHT} 1em "${first}"`).then(build, build);
    else build();

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`One bold word in butter yellow on a midnight indigo field that keeps becoming the next word: ${WORDS.join(', ')}, and back. Each change moves the line to another row, every letter dropping or climbing on its own through a few random letters, middle letters first. Moving the pointer over a resting letter makes it flip through two strangers and come back.`}
    onPointerMove={onPointer}
    onPointerDown={onPointer}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND, touchAction: 'pan-y', userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

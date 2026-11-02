// Loud burst (https://design.how/vault/loud-burst), card.tsx.
// FIXED. Change the VARIABLE values in params instead (SENTENCES, PAPER, INK, BODY_TINT, FPS, FLECK_COUNT, FONT_CSS).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {LoudBurst} from './engine';
import {FONT_CSS, FONT_WEIGHT, PAPER} from './params';

export default function LoudBurstCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<LoudBurst | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    let fallback = 0;
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden';
    probe.style.fontFamily = FONT_CSS;
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily || 'sans-serif';
    probe.remove();

    const build = () => {
      window.clearTimeout(fallback);
      if (cancelled || engine.current) return;
      const next = new LoudBurst(element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const first = family.split(',')[0].replace(/["']/g, '').trim();
    if (document.fonts?.load) {
      fallback = window.setTimeout(build, 350);
      document.fonts.load(`${FONT_WEIGHT} 1em "${first}"`).then(build, build);
    } else build();

    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A sentence types itself onto white paper one word at a time, each word landing slightly blurred and snapping into focus. One word takes on vivid colour, trembles, and dissolves into colourful drawn strokes that scatter in every direction while the rest of the sentence rushes off the sides. A few last strokes sweep the paper clean, and a different sentence begins the loop in a different palette."
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: PAPER}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

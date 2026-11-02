// Pixel scan (https://design.how/vault/pixel-scan), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORD, ACCENT, ACCENT2, TEXT_COLOR, GROUND, ENTRANCE_SECONDS, MODE, SPOT_RADIUS, TRAIL_LIFE, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PixelScan} from './engine';
import {FONT_VAR, FONT_WEIGHT, GROUND, WORD} from './params';

export default function PixelScanCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<PixelScan | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    const element = canvas.current;
    if (!host || !element) return;
    let cancelled = false;
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR}), Georgia, serif`;
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily || 'Georgia, serif';
    probe.remove();

    const build = () => {
      if (cancelled) return;
      const next = new PixelScan(host, element, family);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const first = family.split(',')[0].replace(/["']/g, '').trim();
    if (document.fonts?.load) document.fonts.load(`${FONT_WEIGHT} 40px "${first}"`, WORD).then(build, build);
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
    aria-label={`The word "${WORD}" assembled by a diagonal band that breaks it into a spray of tiny blue and pink blocks, then resting as solid type, with a pool of blocks lighting under the pointer.`}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: GROUND, userSelect: 'none'}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%', touchAction: 'pan-y'}}/>
  </div>;
}

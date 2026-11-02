'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {KineticType} from './engine';
import {DEFAULT_PARAMS, FONT_VAR, FONT_WEIGHT, type KineticParams} from './params';

export default function KineticTypographyCard({params = DEFAULT_PARAMS, className}: {params?: KineticParams; className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<KineticType | null>(null);
  const first = useRef(params);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let cancelled = false;
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR}), Georgia, serif`;
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily || 'Georgia, serif';
    probe.remove();

    const next = new KineticType(element, first.current, family);
    engine.current = next;
    if (next.ok) {
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
      const name = family.split(',')[0].replace(/["']/g, '').trim();
      document.fonts?.load(`${FONT_WEIGHT} 64px "${name}"`).then(() => { if (!cancelled) engine.current?.refreshLetter(); }, () => {});
    }
    return () => {
      cancelled = true;
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  useEffect(() => { engine.current?.setParams(params); }, [params]);

  return <div
    ref={box}
    role="img"
    aria-label={`The letter "${params.text}" cut into a grid of tiles that each slip on their own wave, so it ripples like cloth, with a thin coloured fringe on the moving edges.`}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: params.paper}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {LiquidMetal} from './engine';
import {DEFAULT_RAMP, FONT_CSS, FONT_WEIGHT, RAMPS, WORD} from './params';

export default function LiquidMetalCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<LiquidMetal | null>(null);
  const [ramp, setRamp] = useState(DEFAULT_RAMP);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    let built = false;
    let timer = 0;
    const build = (family?: string) => {
      window.clearTimeout(timer);
      if (cancelled || built) return;
      built = true;
      const next = new LiquidMetal(host, family ? `"${family}", sans-serif` : undefined);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const raf = requestAnimationFrame(() => {
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:${FONT_CSS}`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      probe.remove();
      if (!family || !document.fonts?.load) return build();
      timer = window.setTimeout(() => build(family), 350);
      document.fonts.load(`${FONT_WEIGHT} 1em "${family}"`).then(() => build(family), () => build(family));
    });

    let resizeTimer = 0;
    const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  const cycle = () => {
    const next = (ramp + 1) % RAMPS.length;
    setRamp(next);
    engine.current?.setRamp(next);
  };

  return <div
    ref={box}
    role="button"
    tabIndex={0}
    aria-label={`The word ${WORD} as flowing liquid metal in ${RAMPS[ramp].name}. Move the pointer to tilt the reflection; press to change the colourway.`}
    onClick={cycle}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); cycle(); } }}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#0c0d10', cursor: 'pointer', touchAction: 'pan-y'}}
  />;
}

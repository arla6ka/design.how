'use client';

import './fonts.css';
import {useEffect, useRef, type PointerEvent as ReactPointerEvent} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {Embroidery} from './engine';
import {FABRIC} from './patches';

const FONT_VAR = '--visual-wide';
const [r, g, b] = FABRIC.map(c => Math.round(c * 0.8 * 255));

export default function FolderEmbroideryCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<Embroidery | null>(null);
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
      const next = new Embroidery(host, family ? `"${family}", sans-serif` : undefined);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const raf = requestAnimationFrame(() => {
      const probe = document.createElement('span');
      probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${FONT_VAR})`;
      probe.textContent = 'Ag';
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
      probe.remove();
      if (!family || !document.fonts?.load) return build();
      timer = window.setTimeout(() => build(family), 350);
      document.fonts.load(`800 1em "${family}"`).then(() => build(family), () => build(family));
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

  const press = (event: ReactPointerEvent) => {
    const rect = box.current?.getBoundingClientRect();
    if (rect?.width && rect.height) engine.current?.pressTap((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
    else engine.current?.pressTap(0.5, 0.5);
  };

  return <div
    ref={box}
    role="img"
    aria-label="Three embroidered word patches, made, with and love, in blue, yellow and pink cloth with black lettering and white stitched borders, overlapping on purple fabric. Hovering sends a glint across the threads; pressing pushes them into the cloth."
    onPointerEnter={() => engine.current?.setHover(1)}
    onPointerLeave={() => engine.current?.setHover(0)}
    onPointerDown={press}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: `rgb(${r}, ${g}, ${b})`, touchAction: 'pan-y'}}
  />;
}

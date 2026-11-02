'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {ImageSphere} from './engine';
import {SPHERE_IMAGES} from './images';

export default function ImageSphereCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<ImageSphere | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const raf = requestAnimationFrame(() => {
      const next = new ImageSphere(host, SPHERE_IMAGES);
      engine.current = next;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    });
    return () => {
      cancelAnimationFrame(raf);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A slowly turning sphere of landscape, animal and fruit photos that can be dragged to spin and clicked to enlarge."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', backgroundColor: '#fcfcfc'}}
  />;
}

// Brick reveal (https://design.how/vault/brick-reveal), card.tsx.
// FIXED. Change the VARIABLE values in params instead (STYLES, STYLE_HOLD, STYLE_FADE, TRAIL_SIZE, TRAIL_SIZE_AUTO, scene()).
'use client';

import {useEffect, useRef, type CSSProperties} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {BrickReveal, type BrickFrameState} from './engine';

const GLOW = 'rgb(255, 222, 80)';

export default function BrickRevealCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const engine = useRef<BrickReveal | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const reduced = prefersReducedMotion();
    const onFrame = (s: BrickFrameState) => {
      const t = tilt.current;
      if (t) {
        t.style.transform = `perspective(900px) rotateX(${s.tiltX}deg) rotateY(${s.tiltY}deg)`;
        t.style.setProperty('--glow', s.glowColor);
      }
      const g = glow.current;
      if (g) {
        g.style.setProperty('--gx', `${s.glowX * 100}%`);
        g.style.setProperty('--gy', `${s.glowY * 100}%`);
        g.style.setProperty('--glow', s.glowColor);
        g.style.opacity = String(Math.min(0.95, 0.24 + 0.7 * s.glowI));
        g.style.transform = `translate(-50%, -50%) scale(${0.96 + 0.08 * s.glowI})`;
      }
    };
    const raf = requestAnimationFrame(() => {
      const next = new BrickReveal(element, reduced ? undefined : onFrame);
      engine.current = next;
      if (!next.ok) return;
      if (reduced) next.renderStill();
      else if (running.current) next.start();
    });
    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="A square picture of a mountain lake at sunset, restyled in turn as toy bricks, voxel blocks and a cartoon, that melts back to the plain picture in rounded blocks along a trail behind the pointer."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', userSelect: 'none', backgroundColor: '#f2f1ef'}}
  >
    <div
      ref={glow}
      aria-hidden
      style={{
        '--gx': '50%', '--gy': '50%', '--glow': GLOW,
        position: 'absolute', left: '50%', top: '50%', height: '46%', aspectRatio: '1', borderRadius: 10, pointerEvents: 'none',
        boxShadow: [
          '0 0 8px 0px color-mix(in srgb, var(--glow) 36%, transparent)',
          '0 1px 13px 1px color-mix(in srgb, var(--glow) 25%, transparent)',
          '0 2px 20px 2px color-mix(in srgb, var(--glow) 15%, transparent)',
          '0 3px 27px 3px color-mix(in srgb, color-mix(in srgb, var(--glow) 70%, white) 9%, transparent)',
          '0 5px 34px 4px color-mix(in srgb, color-mix(in srgb, var(--glow) 55%, white) 5%, transparent)',
        ].join(', '),
        background: 'color-mix(in srgb, var(--glow) 26%, transparent)',
        transform: 'translate(-50%, -50%)',
        opacity: 0.5,
      } as CSSProperties}
    />
    <div
      ref={tilt}
      style={{
        '--glow': GLOW,
        position: 'relative', zIndex: 1, height: '80%', aspectRatio: '1', overflow: 'hidden', borderRadius: 9,
        transformStyle: 'preserve-3d', willChange: 'transform', touchAction: 'pan-y',
        boxShadow: [
          'inset 0 0 0 1px rgba(255,255,255,0.9)',
          '0 0 0 1.5px #f2f1ef',
          '0 0 0 2.5px color-mix(in srgb, var(--glow) 55%, transparent)',
          '0 0 0 3px rgba(0,0,0,0.06)',
          '0 2px 4px -1px rgba(20,20,25,0.18)',
          '0 16px 28px -10px rgba(20,20,30,0.28)',
        ].join(', '),
      } as CSSProperties}
    >
      <div ref={host} style={{position: 'absolute', inset: 0}}/>
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, borderRadius: 9, pointerEvents: 'none',
          boxShadow: ['inset 2px 2px 3px rgba(255,255,255,0.5)', 'inset -2px -2px 3px rgba(0,0,0,0.42)', 'inset 0 0 0 1px rgba(255,255,255,0.12)'].join(', '),
        }}
      />
    </div>
  </div>;
}

// Image galaxy (https://design.how/vault/image-galaxy), card.tsx.
// FIXED. Change the VARIABLE values in params instead (IMAGES, COUNT_DESKTOP, COUNT_MOBILE, IMAGE_SIZE, IMAGE_SIZE_MOBILE, DESIGN_WIDTH, CONFIG, Z_POOL, SPEED_POOL, GROUND).
'use client';

import {useEffect, useRef, useState} from 'react';
import {mediaUrl} from './runtime/media';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {ImageGalaxy} from './engine';
import {COUNT_DESKTOP, COUNT_MOBILE, DESIGN_WIDTH, GROUND, IMAGES, IMAGE_SIZE, IMAGE_SIZE_MOBILE, PERSPECTIVE} from './params';

const SHOWN = Array.from({length: COUNT_DESKTOP}, (_, i) => IMAGES[i % IMAGES.length]);

export default function ImageGalaxyCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const engine = useRef<ImageGalaxy | null>(null);
  const [scale, setScale] = useState(1);
  const [size, setSize] = useState(IMAGE_SIZE);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()), {threshold: 0.15});

  useEffect(() => {
    const host = box.current;
    const stage = field.current;
    if (!host || !stage) return;
    const phone = window.matchMedia('(max-width: 639px)').matches;
    const count = phone ? COUNT_MOBILE : COUNT_DESKTOP;
    setSize(phone ? IMAGE_SIZE_MOBILE : IMAGE_SIZE);
    const all = Array.from(stage.querySelectorAll<HTMLElement>('[data-galaxy="image"]'));
    all.forEach((el, i) => { el.style.display = i < count ? '' : 'none'; });
    const imgs = all.slice(0, count);
    const next = new ImageGalaxy(stage, imgs, imgs.map(el => el.querySelector<HTMLElement>('[data-galaxy="overlay"]')));
    engine.current = next;
    if (prefersReducedMotion()) next.renderStill();
    else if (running.current) next.start();

    const ro = new ResizeObserver(() => {
      setScale(Math.max(1, host.clientWidth / DESIGN_WIDTH));
      requestAnimationFrame(() => next.layout());
    });
    ro.observe(host);

    let lastY = window.scrollY;
    const onScroll = () => {
      const v = window.scrollY - lastY;
      lastY = window.scrollY;
      if (v) next.addScroll(v, Math.sign(v));
    };
    window.addEventListener('scroll', onScroll, {passive: true});

    let dragging = false;
    let lastDrag = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      dragging = true;
      lastDrag = e.clientY;
      host.style.cursor = 'grabbing';
      host.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - lastDrag;
      lastDrag = e.clientY;
      if (dy) next.addScroll(-dy * 2.2, Math.sign(-dy));
    };
    const onUp = () => {
      dragging = false;
      host.style.cursor = 'grab';
    };
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      next.destroy();
      engine.current = null;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label="Small square photographs of landscapes and animals drifting through a depth field."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', cursor: 'grab', touchAction: 'pan-y', background: GROUND}}
  >
    <div style={{position: 'absolute', left: 0, top: 0, width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
    <div ref={field} aria-hidden style={{position: 'absolute', left: 0, right: 0, top: '-25%', height: '150%', perspective: PERSPECTIVE, pointerEvents: 'none'}}>
      {SHOWN.map((src, i) => <div key={i} data-galaxy="image" style={{position: 'absolute', width: size, aspectRatio: '1', overflow: 'hidden', willChange: 'transform'}}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(src)} alt="" decoding="async" style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}}/>
        <div data-galaxy="overlay" style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: GROUND}}/>
      </div>)}
    </div>
    </div>
  </div>;
}

// Word carousel (https://design.how/vault/word-carousel), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORDS, INK, INK_FAR, BG, FONT_FAMILY, SCALE_SMALL, SCALE_TINY, TINY_ALPHA, BLUR_STAMPS_MIN, BLUR_STAMPS_MAX).
'use client';

import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {WordCarousel} from './engine';
import {BG, WORDS} from './params';

export default function WordCarouselCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<WordCarousel | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const raf = requestAnimationFrame(() => {
      const next = new WordCarousel(element);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
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
    aria-label={`Four blue words on white, ${WORDS.join(', ')}, set as a small word, a large word and another small word on one line. Every half second the row slams one position to the left with a horizontal motion blur, cycling which word is large.`}
    className={className}
    style={{width: '100%', height: '100%', backgroundColor: BG}}
  >
    <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
  </div>;
}

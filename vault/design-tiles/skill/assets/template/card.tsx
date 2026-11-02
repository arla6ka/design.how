// Design tiles (https://design.how/vault/design-tiles), card.tsx.
// FIXED. Change the VARIABLE values in params instead (WORDS, SWATCHES, INITIAL, SHUFFLE_MIN, SHUFFLE_MAX, FLY_STAGGER, FLY_MS, WORD_HEIGHT, FONT_STACK).
'use client';

import './fonts.css';
import {useEffect, useRef} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {DesignTiles} from './engine';
import {FONT_STACK, FONT_WEIGHT, WORDS} from './params';

export default function DesignTilesCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<DesignTiles | null>(null);
  const ready = useRef(false);
  const running = usePause(box, run => {
    if (!run) engine.current?.stop();
    else if (ready.current) engine.current?.start();
  });

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const reduced = prefersReducedMotion();
    const next = new DesignTiles(host);
    engine.current = next;
    if (reduced) next.renderStill();

    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:${FONT_STACK}`;
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
    probe.remove();
    const done = () => {
      if (cancelled || ready.current) return;
      ready.current = true;
      next.refreshFont();
      if (!reduced && running.current) next.start();
    };
    if (document.fonts?.load) document.fonts.load(`${FONT_WEIGHT} 1em "${family}"`, WORDS.join(' ')).then(done, done);
    else done();
    const timer = window.setTimeout(done, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      next.destroy();
      engine.current = null;
      ready.current = false;
    };
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`The sentence "${WORDS.join(' ')}" as five words on bold colour fields packed into one bar, each field stepped to the height of its letters, the colours shuffling.`}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: 'light-dark(#ffffff, #242423)', containerType: 'size', userSelect: 'none'}}
  />;
}

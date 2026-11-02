// Ghosty reveal (https://design.how/vault/ghosty-reveal), card.tsx.
// FIXED. Change the VARIABLE values in params instead (IMAGES, SLOTS, MASK_SCALE, DURATION, HOLD, EASING, DIRECTION).
'use client';

import {useEffect, useRef, useState} from 'react';
import {mediaUrl} from './runtime/media';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {GhostReveal} from './ghost-reveal';
import {GhostLoop} from './loop';
import {DIRECTION, DURATION, EASING, GROUND, HOLD, IMAGES, MASK_SCALE, SLOTS} from './params';

const STAGGER = 700;

function Spot({index, run, still}: {index: number; run: boolean; still: boolean}) {
  const slot = SLOTS[index];
  const [image, setImage] = useState(index * 2);
  const [shown, setShown] = useState(true);
  const loop = useRef<GhostLoop | null>(null);

  useEffect(() => {
    if (still) return;
    const next = new GhostLoop(() => ({duration: DURATION, hold: HOLD}), setShown, () => setImage(i => (i + SLOTS.length) % IMAGES.length), index * STAGGER, true);
    loop.current = next;
    return () => {
      next.destroy();
      loop.current = null;
    };
  }, [index, still]);

  useEffect(() => {
    if (run) loop.current?.start();
    else loop.current?.stop();
  }, [run]);

  return <GhostReveal
    play={shown}
    scale={MASK_SCALE}
    duration={DURATION}
    easing={EASING}
    direction={DIRECTION}
    style={{position: 'absolute', left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, aspectRatio: '4 / 3'}}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={mediaUrl(IMAGES[image % IMAGES.length])} alt="" decoding="async" style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}}/>
  </GhostReveal>;
}

export default function GhostyRevealCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  const [still] = useState(prefersReducedMotion);
  usePause(box, setRun);

  return <div
    ref={box}
    role="img"
    aria-label="Photographs scattered over a white card, each bleeding in through a soft cloudy edge and fading back out."
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: GROUND}}
  >
    {SLOTS.map((_, i) => <Spot key={i} index={i} run={run && !still} still={still}/>)}
  </div>;
}

'use client';

import {useEffect, useRef, useState} from 'react';
import {Panel, SegmentedControl, Slider} from './runtime/controls';
import {mediaUrl} from './runtime/media';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {GhostReveal, type GhostDirection} from './ghost-reveal';
import {GhostLoop} from './loop';
import {EASING, GROUND, HOLD, IMAGES, MASK_SCALE} from './params';

const DIRECTIONS = [{id: 'up', label: 'Up'}, {id: 'down', label: 'Down'}, {id: 'left', label: 'Left'}, {id: 'right', label: 'Right'}];
const EASINGS = [
  {id: EASING, label: 'Glide'},
  {id: 'cubic-bezier(0.22, 1, 0.36, 1)', label: 'Soft out'},
  {id: 'ease-in-out', label: 'In-out'},
  {id: 'linear', label: 'Linear'},
];

function Reveal({direction, easing, duration}: {direction: GhostDirection; easing: string; duration: number}) {
  const box = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState(0);
  const [shown, setShown] = useState(false);
  const timing = useRef({duration, hold: HOLD});
  timing.current = {duration, hold: HOLD};
  const loop = useRef<GhostLoop | null>(null);
  usePause(box, run => (run ? loop.current?.start() : loop.current?.stop()));

  useEffect(() => {
    if (prefersReducedMotion()) { setShown(true); return; }
    const next = new GhostLoop(() => timing.current, setShown, () => setImage(i => (i + 1) % IMAGES.length), 300);
    loop.current = next;
    next.start();
    return () => {
      next.destroy();
      loop.current = null;
    };
  }, []);

  return <div ref={box} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16 / 9', background: GROUND, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', overflow: 'hidden'}}>
    <GhostReveal play={shown} scale={MASK_SCALE} duration={duration} easing={easing} direction={direction} style={{width: '65%', height: '65%'}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(IMAGES[image])} alt="" style={{display: 'block', width: '100%', height: '100%', objectFit: 'contain'}}/>
    </GhostReveal>
  </div>;
}

export default function GhostyRevealPlayground() {
  const [direction, setDirection] = useState<GhostDirection>('up');
  const [easing, setEasing] = useState(EASING);
  const [duration, setDuration] = useState(1500);
  return <div>
    <Reveal key={direction} direction={direction} easing={easing} duration={duration}/>
    <Panel>
      <SegmentedControl options={DIRECTIONS} activeId={direction} onPick={id => setDirection(id as GhostDirection)}/>
      <SegmentedControl options={EASINGS} activeId={easing} onPick={setEasing}/>
      <Slider label="Duration" value={duration} min={400} max={2600} step={50} format={v => `${(v / 1000).toFixed(2)}s`} onChange={setDuration}/>
    </Panel>
  </div>;
}

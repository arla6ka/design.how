'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {Panel, SegmentedControl} from './runtime/controls';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {HoloBody} from './card';
import {FOILS} from './engine';
import {GROUND} from './params';
import {HOLO_CSS} from './styles';
import {HoloTilt} from './tilt';

const OPTIONS = FOILS.map(f => ({id: f.key, label: f.label}));

export default function HoloPlayground() {
  const [key, setKey] = useState(FOILS[0].key);
  const box = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const engine = useRef<HoloTilt | null>(null);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    const el = card.current;
    if (!host || !el) return;
    const next = new HoloTilt(host, el, FOILS.find(f => f.key === key) ?? FOILS[0]);
    engine.current = next;
    if (prefersReducedMotion()) next.renderStill();
    else if (running.current) next.start();
    return () => {
      next.destroy();
      engine.current = null;
    };
  }, [key, running]);

  return <div>
    <style href="holo" precedence="default">{HOLO_CSS}</style>
    <div ref={box} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16 / 9', perspective: 1100, background: GROUND, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', overflow: 'hidden', userSelect: 'none'}}>
      <HoloBody ref={card} height="70%"/>
    </div>
    <Panel>
      <SegmentedControl options={OPTIONS} activeId={key} onPick={setKey}/>
    </Panel>
  </div>;
}

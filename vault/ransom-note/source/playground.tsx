'use client';

import './fonts.css';
import {useEffect, useMemo, useState} from 'react';
import {GhostButton, Panel, PromptInput, Slider} from './runtime/controls';
import {composeLine, hashSeed} from './compose';
import {RansomLine} from './line';
import {GROUND, JITTER} from './params';

export default function RansomNotePlayground() {
  const [text, setText] = useState('cut and paste');
  const [mess, setMess] = useState(1);
  const [roll, setRoll] = useState(0);
  const [shown, setShown] = useState(false);
  const placed = useMemo(() => composeLine(text, hashSeed(text) + roll * 7919, {rot: JITTER.rot * mess, dy: JITTER.dy * mess, scale: JITTER.scale * mess, gap: JITTER.gap * mess}), [text, mess, roll]);
  useEffect(() => {
    setShown(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(id);
  }, [roll]);
  return <div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16 / 9', padding: '0 24px', background: GROUND, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', overflow: 'hidden'}}>
      <RansomLine placed={placed} lineH={44} revealed={shown} direction="in"/>
    </div>
    <Panel>
      <PromptInput label="Note" value={text} onChange={v => setText(v.slice(0, 28))}/>
      <Slider label="Messiness" value={mess} min={0} max={2.5} format={v => `${Math.round(v * 100)}%`} onChange={setMess}/>
      <GhostButton onClick={() => setRoll(r => r + 1)}>Re-roll</GhostButton>
    </Panel>
  </div>;
}

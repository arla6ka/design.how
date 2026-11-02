'use client';

import {useEffect, useState} from 'react';
import {GhostButton, Panel, SegmentedControl, Slider} from './runtime/controls';
import {prefersReducedMotion} from './runtime/use-pause';
import {PeakGradient} from './gradient';
import {BARS, BLUR, GROUND, PALETTES, PEAK, VALLEY} from './params';

const NAMES = Object.keys(PALETTES).map(id => ({id, label: id}));

export default function PeakGradientPlayground() {
  const [bars, setBars] = useState(BARS);
  const [blur, setBlur] = useState(BLUR);
  const [peak, setPeak] = useState(PEAK);
  const [valley, setValley] = useState(VALLEY);
  const [palette, setPalette] = useState('Peak');
  const [shown, setShown] = useState(false);
  const [replay, setReplay] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) { setShown(true); return; }
    setShown(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(id);
  }, [replay]);

  return <div>
    <div style={{position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', background: GROUND, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)'}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '78%'}}>
        <PeakGradient bars={bars} blur={blur} peak={peak} valley={valley} stops={PALETTES[palette]} shown={shown}/>
      </div>
    </div>
    <Panel>
      <SegmentedControl options={NAMES} activeId={palette} onPick={setPalette}/>
      <Slider label="Bars" value={bars} min={3} max={21} step={1} format={v => `${Math.round(v)}`} onChange={v => setBars(Math.round(v))}/>
      <Slider label="Blur" value={blur} min={2} max={40} step={1} format={v => `${Math.round(v)}`} onChange={setBlur}/>
      <Slider label="Peak" value={peak} min={0.4} max={1} format={v => `${Math.round(v * 100)}%`} onChange={setPeak}/>
      <Slider label="Valley" value={valley} min={0.1} max={1} format={v => `${Math.round(v * 100)}%`} onChange={setValley}/>
      <GhostButton onClick={() => setReplay(r => r + 1)}>Replay</GhostButton>
    </Panel>
  </div>;
}

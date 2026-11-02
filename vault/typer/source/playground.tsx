'use client';

import './fonts.css';
import {useState} from 'react';
import {GhostButton, Panel, PromptInput, Select, Slider} from './runtime/controls';
import {TyperLines} from './lines';
import {FONT_VAR, LINES, STAGGER} from './params';
import {PRESETS} from './presets';

const LOOKS = PRESETS.map(p => ({id: p.name, label: p.name}));

export default function TyperPlayground() {
  const [text, setText] = useState(LINES[0]);
  const [look, setLook] = useState(PRESETS[0].name);
  const p = PRESETS.find(x => x.name === look) ?? PRESETS[0];
  const [fps, setFps] = useState(p.fps);
  const [cycles, setCycles] = useState(p.cycles);
  const [replay, setReplay] = useState(0);
  const pick = (name: string) => {
    const next = PRESETS.find(x => x.name === name) ?? PRESETS[0];
    setLook(name);
    setFps(next.fps);
    setCycles(next.cycles);
  };
  return <div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1344 / 520', padding: '0 16px', background: p.bg, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', overflow: 'hidden', containerType: 'inline-size'}}>
      <TyperLines
        lines={[text || ' ']} variations={p.pool} fps={fps} cycles={cycles} stagger={STAGGER}
        fg={p.fg} bg={p.bg} accent={p.accent} accentInk={p.accentInk} playKey={replay}
        lineStyle={{fontFamily: `var(${FONT_VAR})`, fontSize: 'max(18px, 6cqw)', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.01em'}}
      />
    </div>
    <Panel>
      <PromptInput label="Text" value={text} onChange={setText}/>
      <Select options={LOOKS} activeId={look} onPick={pick} ariaLabel="Look"/>
      <Slider label="Frame rate" value={fps} min={8} max={40} step={1} format={v => `${Math.round(v)} fps`} onChange={v => setFps(Math.round(v))}/>
      <Slider label="States" value={cycles} min={1} max={8} step={1} format={v => `${Math.round(v)}`} onChange={v => setCycles(Math.round(v))}/>
      <GhostButton onClick={() => setReplay(r => r + 1)}>Replay</GhostButton>
    </Panel>
  </div>;
}

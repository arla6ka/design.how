'use client';

import {useState} from 'react';
import {Panel, SegmentedControl} from './runtime/controls';
import {mediaUrl} from './runtime/media';
import {DepthButton} from './depth-button';
import {GlassFilter} from './glass-filter';
import {GLASS_BACKDROP} from './params';
import {RECIPES} from './recipes';
import {COLOR_DEPTH_CSS} from './styles';

const OPTIONS = RECIPES.map(r => ({id: r.id, label: r.name}));
const BACKDROP = {light: {background: '#f8f9fb'}, dark: {background: '#111214'}, color: {}} as const;

export default function ColorDepthPlayground() {
  const [id, setId] = useState(RECIPES[0].id);
  const r = RECIPES.find(x => x.id === id) ?? RECIPES[0];
  const stage = r.backdrop === 'color' ? {backgroundImage: `url("${mediaUrl(GLASS_BACKDROP)}")`, backgroundSize: 'cover', backgroundPosition: 'center'} : BACKDROP[r.backdrop];
  return <div>
    <style href="color-depth" precedence="default">{COLOR_DEPTH_CSS}</style>
    <GlassFilter/>
    <div style={{display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', aspectRatio: '16 / 7', borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', overflow: 'hidden', ...stage}}>
      <div style={{transform: 'scale(1.4)'}}><DepthButton className={r.className}/></div>
    </div>
    <Panel>
      <SegmentedControl options={OPTIONS} activeId={id} onPick={setId}/>
      <p style={{margin: 0, color: 'light-dark(#71706f, #a09f9d)'}}>{r.note}</p>
    </Panel>
  </div>;
}

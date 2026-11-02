'use client';

import './fonts.css';
import {useState} from 'react';
import {ColorControl, GhostButton, Panel, SegmentedControl} from './runtime/controls';
import {VectorEditor, type Mirror} from './editor';
import {FRAME, GROUND, PAD, SHAPE, SHAPE_W, VIEW_BOX} from './params';
import {parsePath} from './parse';
import {SelectionFrame} from './selection-frame';

const H = Math.round(SHAPE_W * (VIEW_BOX[3] / VIEW_BOX[2]));
const MIRRORS = [{id: 'angle-length', label: 'Mirror'}, {id: 'angle', label: 'Angle only'}, {id: 'none', label: 'Free'}];

export default function VectorEditorPlayground() {
  const [path, setPath] = useState(() => parsePath(SHAPE));
  const [mirror, setMirror] = useState<Mirror>('angle-length');
  const [accent, setAccent] = useState(FRAME.accent);
  return <div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '16 / 9', background: GROUND, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', overflow: 'hidden', touchAction: 'none'}}>
      <SelectionFrame style={{...FRAME, accent, badgeBg: accent}} width={SHAPE_W + PAD * 2} height={H + PAD * 2}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: SHAPE_W + PAD * 2, height: H + PAD * 2}}>
          <VectorEditor path={path} onChange={setPath} viewBox={VIEW_BOX} width={SHAPE_W} height={H} mirror={mirror} rigScale={0.7}/>
        </div>
      </SelectionFrame>
    </div>
    <Panel>
      <SegmentedControl options={MIRRORS} activeId={mirror} onPick={id => setMirror(id as Mirror)}/>
      <ColorControl label="Accent" value={accent} onChange={setAccent}/>
      <GhostButton onClick={() => setPath(parsePath(SHAPE))}>Reset shape</GhostButton>
    </Panel>
  </div>;
}

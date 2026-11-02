'use client';

import './fonts.css';
import {useState} from 'react';
import {Panel, SegmentedControl, Slider} from './runtime/controls';
import {GlossySquircle, InkLabel} from './glossy';
import {BUTTON_W, CONTROL_H, EXPONENT, FONT_VAR, GROUND, LABEL, SMOOTHING, radiusFor} from './params';

const SHAPES = [{id: 'squircle', label: 'Squircle'}, {id: 'round', label: 'Border radius'}];

export default function SquirclePlayground() {
  const [smoothing, setSmoothing] = useState(SMOOTHING);
  const [exponent, setExponent] = useState(EXPONENT);
  const [radius, setRadius] = useState(radiusFor(CONTROL_H));
  const [shape, setShape] = useState('squircle');
  return <div>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1344 / 660', background: GROUND, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', fontFamily: `var(${FONT_VAR})`, overflow: 'hidden'}}>
      <div style={{transform: 'scale(2)'}}>
        <GlossySquircle w={BUTTON_W} h={CONTROL_H} radius={radius} smoothing={smoothing} exponent={exponent} compare={shape === 'round'}>
          <InkLabel>{LABEL}</InkLabel>
        </GlossySquircle>
      </div>
    </div>
    <Panel>
      <SegmentedControl options={SHAPES} activeId={shape} onPick={setShape}/>
      <Slider label="Radius" value={radius} min={0} max={CONTROL_H / 2} step={0.5} format={v => `${v}px`} onChange={setRadius}/>
      <Slider label="Smoothing" value={smoothing} min={0} max={1} format={v => `${Math.round(v * 100)}%`} onChange={setSmoothing}/>
      <Slider label="Exponent" value={exponent} min={2} max={10} step={0.1} format={v => v.toFixed(1)} onChange={setExponent}/>
    </Panel>
  </div>;
}

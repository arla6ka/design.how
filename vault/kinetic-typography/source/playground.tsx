'use client';

import './fonts.css';
import {useRef, useState} from 'react';
import {ColorControl, GhostButton, Panel, PromptInput, Slider} from './runtime/controls';
import KineticTypographyCard from './card';
import {DEFAULT_PARAMS, type KineticParams} from './params';

function hslHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (n: number) => Math.round(255 * f(n)).toString(16).padStart(2, '0');
  return `#${to(0)}${to(8)}${to(4)}`;
}
const rand = (a: number, b: number) => a + Math.random() * (b - a);

type Look = Omit<KineticParams, 'text' | 'grain'>;
const RECIPES: ((h: number) => Look)[] = [
  h => ({ink: hslHex(h, rand(82, 95), rand(58, 66)), paper: hslHex((h + 200) % 360, rand(25, 45), rand(6, 10)), accent: hslHex((h + 180) % 360, rand(82, 95), rand(58, 66)), tiles: 15, offset: 30, speed: 0.036, spread: 0.034, chroma: 0.9, shade: 0.4}),
  h => ({ink: hslHex(h, rand(60, 80), rand(28, 38)), paper: hslHex((h + 30) % 360, rand(20, 35), rand(93, 97)), accent: hslHex((h + 40) % 360, rand(70, 88), rand(55, 62)), tiles: 9, offset: 20, speed: 0.011, spread: 0.01, chroma: 0.25, shade: 0.6}),
  h => ({ink: hslHex(h, rand(45, 65), rand(72, 82)), paper: hslHex(h, rand(35, 55), rand(14, 22)), accent: hslHex((h + 150) % 360, rand(60, 80), rand(60, 70)), tiles: 12, offset: 52, speed: 0.017, spread: 0.016, chroma: 0.5, shade: 0.75}),
  h => ({ink: hslHex(h, rand(75, 92), rand(45, 55)), paper: hslHex((h + 60) % 360, rand(8, 18), rand(94, 98)), accent: hslHex((h + 120) % 360, rand(78, 92), rand(52, 62)), tiles: 10, offset: 34, speed: 0.024, spread: 0.02, chroma: 0.6, shade: 0.35}),
  h => ({ink: hslHex(h, rand(78, 92), rand(60, 70)), paper: hslHex(0, 0, rand(4, 8)), accent: hslHex((h + 150) % 360, rand(80, 95), rand(58, 66)), tiles: 14, offset: 62, speed: 0.042, spread: 0.05, chroma: 1, shade: 0.5}),
  h => ({ink: hslHex(h, rand(6, 16), rand(18, 26)), paper: hslHex(h, rand(4, 10), rand(95, 98)), accent: hslHex((h + 20) % 360, rand(70, 88), rand(55, 62)), tiles: 9, offset: 16, speed: 0.009, spread: 0.008, chroma: 0.3, shade: 0.5}),
];

export default function KineticTypographyPlayground() {
  const [p, setP] = useState<KineticParams>(DEFAULT_PARAMS);
  const set = <K extends keyof KineticParams>(key: K) => (value: KineticParams[K]) => setP(prev => ({...prev, [key]: value}));
  const letter = useRef(0);
  const lastRecipe = useRef(-1);

  const remix = () => {
    letter.current = (letter.current + 1) % 26;
    let pick = Math.floor(Math.random() * RECIPES.length);
    if (pick === lastRecipe.current) pick = (pick + 1) % RECIPES.length;
    lastRecipe.current = pick;
    setP(prev => ({...prev, text: String.fromCharCode(97 + letter.current), ...RECIPES[pick](Math.floor(rand(0, 360)))}));
  };

  return <div>
    <div style={{aspectRatio: '16 / 9', borderRadius: '6px', overflow: 'hidden', border: '1px solid light-dark(#ececeb, #2a2a29)'}}>
      <KineticTypographyCard params={p}/>
    </div>
    <Panel>
      <PromptInput label="Text" value={p.text} onChange={v => set('text')(v.slice(0, 12))}/>
      <ColorControl label="Ink" value={p.ink} onChange={set('ink')}/>
      <ColorControl label="Paper" value={p.paper} onChange={set('paper')}/>
      <ColorControl label="Split" value={p.accent} onChange={set('accent')}/>
      <Slider label="Tiles" value={p.tiles} min={6} max={80} step={1} format={v => `${v}`} onChange={set('tiles')}/>
      <Slider label="Offset" value={p.offset} min={0} max={90} step={1} format={v => `${v}px`} onChange={set('offset')}/>
      <Slider label="Speed" value={p.speed} min={0} max={0.08} step={0.002} format={v => v.toFixed(3)} onChange={set('speed')}/>
      <Slider label="Spread" value={p.spread} min={0} max={0.3} step={0.005} format={v => v.toFixed(3)} onChange={set('spread')}/>
      <Slider label="Chroma" value={p.chroma} min={0} max={1} step={0.02} format={v => v.toFixed(2)} onChange={set('chroma')}/>
      <Slider label="Depth" value={p.shade} min={0} max={1} step={0.02} format={v => v.toFixed(2)} onChange={set('shade')}/>
      <Slider label="Grain" value={p.grain} min={0} max={1} step={0.02} format={v => v.toFixed(2)} onChange={set('grain')}/>
      <GhostButton onClick={remix}>Remix</GhostButton>
    </Panel>
  </div>;
}

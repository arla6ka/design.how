'use client';

import './fonts.css';
import {useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {ColorControl, GhostButton, Panel, PromptInput, Slider} from './runtime/controls';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import frame from './runtime/frame.module.css';
import {ChromaGlow, type ChromaParams} from './engine';
import {defaultChromaParams, fromHex, remixChromaParams, toHex} from './params';
import {wordFamily} from './card';

export default function ChromaGlowPlayground() {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<ChromaGlow | null>(null);
  const [params, setParams] = useState<ChromaParams>(() => defaultChromaParams());
  const [word, setWord] = useState('boom');
  const full = useMemo<ChromaParams>(() => ({...params, word: word.slice(0, 14)}), [params, word]);
  const latest = useRef(full);
  useEffect(() => { latest.current = full; });
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    let cancelled = false;
    const family = wordFamily();
    const build = () => {
      if (cancelled) return;
      const next = new ChromaGlow(host, latest.current);
      engine.current = next;
      if (!next.ok) return;
      next.setFont(family);
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const first = family.split(',')[0].replace(/["']/g, '').trim();
    if (document.fonts?.load) document.fonts.load(`800 1em "${first}"`).then(build, build);
    else build();
    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  useEffect(() => { engine.current?.setParams(full); }, [full]);

  const patch = (p: Partial<ChromaParams>) => setParams(prev => ({...prev, ...p}));
  const remix = () => {
    const {word: _drop, ...colours} = remixChromaParams();
    void _drop;
    setParams(prev => ({...prev, ...colours}));
  };

  return <div style={{display: 'grid', gap: '12px'}}>
    <div ref={box} className={frame.frame} style={{aspectRatio: '1344 / 620', touchAction: 'pan-y', backgroundColor: toHex(params.bg)} as CSSProperties}/>
    <Panel>
      <PromptInput label="Word" value={word} onChange={setWord}/>
      <Slider label="Bloom" value={params.bloom} min={0.4} max={2} step={0.01} format={v => v.toFixed(2)} onChange={v => patch({bloom: v})}/>
      <Slider label="Split" value={params.split} min={0} max={20} step={0.5} format={v => `${v.toFixed(1)}px`} onChange={v => patch({split: v})}/>
      <Slider label="Core" value={params.core} min={0} max={1.4} step={0.01} format={v => v.toFixed(2)} onChange={v => patch({core: v})}/>
      <Slider label="Spectral" value={params.spectral} min={0} max={1} step={0.01} format={v => v.toFixed(2)} onChange={v => patch({spectral: v})}/>
      <Slider label="Grain" value={params.noise} min={0} max={0.4} step={0.01} format={v => v.toFixed(2)} onChange={v => patch({noise: v})}/>
      <ColorControl label="Warm" value={toHex(params.warm)} onChange={hex => patch({warm: fromHex(hex)})}/>
      <ColorControl label="Cool" value={toHex(params.cool)} onChange={hex => patch({cool: fromHex(hex)})}/>
      <ColorControl label="Fringe" value={toHex(params.red)} onChange={hex => patch({red: fromHex(hex)})}/>
      <ColorControl label="Background" value={toHex(params.bg)} onChange={hex => patch({bg: fromHex(hex)})}/>
      <div><GhostButton onClick={remix}>Remix</GhostButton></div>
    </Panel>
  </div>;
}

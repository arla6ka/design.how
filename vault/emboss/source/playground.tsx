'use client';

import './fonts.css';
import {useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties} from 'react';
import {ColorControl, GhostButton, Panel, PromptInput, SegmentedControl, Select, Slider} from './runtime/controls';
import {usePause} from './runtime/use-pause';
import frame from './runtime/frame.module.css';
import {EmbossPlayground} from './pg-engine';
import {PRESETS, defaultParams, remixParams, type EmbossParams} from './params';
import {BUILTIN_SVGS, type Content} from './content-mask';
import {whenFace} from './card';

const toHex = (c: [number, number, number]) => '#' + c.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
const fromHex = (h: string): [number, number, number] => {
  const n = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2) || '0', 16) / 255) as [number, number, number];
};

export default function EmbossPlaygroundPanel() {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<EmbossPlayground | null>(null);
  const [params, setParams] = useState<EmbossParams>(() => defaultParams());
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [word, setWord] = useState('emboss');
  const [shapeId, setShapeId] = useState(BUILTIN_SVGS[0].id);
  const [svg, setSvg] = useState<string | null>(BUILTIN_SVGS[0].svg);
  const fileRef = useRef<HTMLInputElement>(null);
  const content: Content = useMemo(() => (mode === 'text' ? {word: word.slice(0, 16), svg: null} : {word: '', svg}), [mode, word, svg]);
  const latest = useRef({params, content});
  useEffect(() => { latest.current = {params, content}; });
  const [seen, setSeen] = useState(false);
  usePause(box, run => { if (run) setSeen(true); });

  useEffect(() => {
    const host = box.current;
    if (!host || !seen) return;
    const cancel = whenFace(family => {
      const next = new EmbossPlayground(host, latest.current.params, latest.current.content);
      engine.current = next;
      if (next.ok) next.setFont(family);
    });
    let timer = 0;
    const onResize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancel();
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [seen]);

  useEffect(() => { engine.current?.setParams(params); }, [params]);
  useEffect(() => { engine.current?.setContent(content); }, [content]);

  const patch = (p: Partial<EmbossParams>) => setParams(prev => ({...prev, ...p}));
  const pickShape = (id: string) => {
    if (id === 'upload') { fileRef.current?.click(); return; }
    const shape = BUILTIN_SVGS.find(s => s.id === id);
    if (shape) { setShapeId(id); setSvg(shape.svg); }
  };
  const onUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setShapeId('upload'); setSvg(String(reader.result || '')); };
    reader.readAsText(file);
    e.target.value = '';
  };

  return <div style={{display: 'grid', gap: '12px'}}>
    <div ref={box} className={frame.frame} style={{aspectRatio: '1344 / 620', backgroundColor: '#ffffff'} as CSSProperties}/>
    <Panel>
      <SegmentedControl activeId={mode} onPick={id => setMode(id as 'text' | 'image')} options={[{id: 'text', label: 'Text'}, {id: 'image', label: 'Shape'}]}/>
      {mode === 'text'
        ? <PromptInput label="Word" value={word} onChange={setWord}/>
        : <>
          <Select ariaLabel="Shape" activeId={shapeId} onPick={pickShape} options={[...BUILTIN_SVGS.map(s => ({id: s.id, label: s.name})), {id: 'upload', label: 'Upload SVG'}]}/>
          <input ref={fileRef} type="file" accept=".svg,image/svg+xml" onChange={onUpload} hidden/>
        </>}
      <Select ariaLabel="Preset" activeId="" onPick={id => { const preset = PRESETS.find(p => p.id === id); if (preset) setParams({...preset.params}); }} options={[{id: '', label: 'Load a preset'}, ...PRESETS.map(p => ({id: p.id, label: p.name}))]}/>
      <Slider label="Depth" value={params.depth} min={0.2} max={2} step={0.01} format={v => v.toFixed(2)} onChange={v => patch({depth: v})}/>
      <Slider label="Size" value={params.size} min={1} max={24} step={0.5} format={v => `${v.toFixed(1)}px`} onChange={v => patch({size: v})}/>
      <Slider label="Soften" value={params.soften} min={0} max={12} step={0.5} format={v => `${v.toFixed(1)}px`} onChange={v => patch({soften: v})}/>
      <Slider label="Angle" value={params.angle} min={0} max={360} step={1} format={v => `${v | 0}°`} onChange={v => patch({angle: v})}/>
      <Slider label="Altitude" value={params.altitude} min={0} max={90} step={1} format={v => `${v | 0}°`} onChange={v => patch({altitude: v})}/>
      <Slider label="Highlight" value={params.highlight} min={0} max={0.6} step={0.01} format={v => `${(v * 100) | 0}%`} onChange={v => patch({highlight: v})}/>
      <Slider label="Shadow" value={params.shadow} min={0} max={0.6} step={0.01} format={v => `${(v * 100) | 0}%`} onChange={v => patch({shadow: v})}/>
      <Slider label="Brightness" value={params.bright} min={0.8} max={2.4} step={0.01} format={v => v.toFixed(2)} onChange={v => patch({bright: v})}/>
      <Slider label="Grain" value={params.contrast} min={0} max={1.4} step={0.01} format={v => v.toFixed(2)} onChange={v => patch({contrast: v})}/>
      <Slider label="Texture zoom" value={params.texScale} min={0.4} max={2.4} step={0.01} format={v => `${v.toFixed(2)}x`} onChange={v => patch({texScale: v})}/>
      <ColorControl label="Tint" value={toHex(params.tint)} onChange={hex => patch({tint: fromHex(hex)})}/>
      <div><GhostButton onClick={() => setParams(remixParams())}>Remix</GhostButton></div>
    </Panel>
  </div>;
}

'use client';

import {useEffect, useRef, useState, type ChangeEvent, type CSSProperties} from 'react';
import {ColorControl, GhostButton, Panel, Select, Slider} from './runtime/controls';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {mediaUrl} from './runtime/media';
import {watchContextLoss} from './runtime/dispose';
import frame from './runtime/frame.module.css';
import {GLYPHS} from './glyphs';
import {PRESETS} from './presets';
import {SandboxRenderer} from './SandboxRenderer';
import {newCanvas} from './engine';

const DEFAULT_STOPS = [0, 0.25, 0.5, 0.75, 1];
const glyphOptions = GLYPHS.map((g, i) => ({id: String(i), label: g.name}));

export default function SandboxPlayground() {
  const box = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const renderer = useRef<SandboxRenderer | null>(null);
  const [cell, setCell] = useState(8);
  const [bandColors, setBandColors] = useState<string[]>(PRESETS[0].colors);
  const [stops, setStops] = useState(DEFAULT_STOPS);
  const [bandGlyphs, setBandGlyphs] = useState<number[]>(PRESETS[0].glyphs);
  const [zoom, setZoom] = useState(PRESETS[0].zoom ?? 1);
  const [bg, setBg] = useState('#ffffff');
  const [presetIdx, setPresetIdx] = useState(0);
  const [isVideo, setIsVideo] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [recording, setRecording] = useState(false);
  const wantPlay = useRef(true);
  const running = usePause(box, run => {
    if (!run) renderer.current?.pause();
    else if (wantPlay.current) renderer.current?.resume();
  });

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const element = newCanvas(host);
    const r = new SandboxRenderer(element, {cell: 8, bandColors: PRESETS[0].colors, bandStops: DEFAULT_STOPS, bandGlyphs: PRESETS[0].glyphs, zoom: PRESETS[0].zoom ?? 1, bg: '#ffffff'});
    renderer.current = r;
    const unwatch = watchContextLoss(element, () => r.pause());
    r.setVideo(mediaUrl(PRESETS[0].video), {colors: PRESETS[0].colors, glyphs: PRESETS[0].glyphs, zoom: PRESETS[0].zoom ?? 1});
    if (prefersReducedMotion()) { wantPlay.current = false; setPlaying(false); }
    r.onCommit = () => { if (!wantPlay.current || !running.current) requestAnimationFrame(() => r.pause()); };
    const ro = new ResizeObserver(() => r.resize());
    ro.observe(element);
    return () => {
      unwatch();
      ro.disconnect();
      r.dispose();
      element.remove();
      renderer.current = null;
    };
  }, [running]);

  useEffect(() => { renderer.current?.setCellStops(cell, stops); }, [cell, stops]);
  useEffect(() => { renderer.current?.setColors(bandColors); }, [bandColors]);
  useEffect(() => { renderer.current?.setZoom(zoom); }, [zoom]);
  useEffect(() => { renderer.current?.setBg(bg); }, [bg]);

  const remix = () => {
    const next = ((presetIdx < 0 ? 0 : presetIdx) + 1) % PRESETS.length;
    const p = PRESETS[next];
    setPresetIdx(next);
    setBandColors(p.colors);
    setBandGlyphs(p.glyphs);
    setZoom(p.zoom ?? 1);
    setIsVideo(true);
    wantPlay.current = true;
    setPlaying(true);
    renderer.current?.setVideo(mediaUrl(p.video), {colors: p.colors, glyphs: p.glyphs, zoom: p.zoom ?? 1});
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPresetIdx(-1);
    const url = URL.createObjectURL(file);
    const video = file.type.startsWith('video/');
    setIsVideo(video);
    if (video) { renderer.current?.setVideo(url); wantPlay.current = true; setPlaying(true); }
    else { renderer.current?.setImage(url); wantPlay.current = false; setPlaying(false); }
    e.target.value = '';
  };
  const onGlyph = (band: number, glyph: number) => {
    setBandGlyphs(list => list.map((x, j) => (j === band ? glyph : x)));
    renderer.current?.setGlyph(band, glyph);
  };
  const togglePlay = () => {
    const now = renderer.current?.playPause() ?? false;
    wantPlay.current = now;
    setPlaying(now);
  };

  return <div style={{display: 'grid', gap: '12px'}}>
    <div ref={box} className={frame.frame} style={{aspectRatio: '16 / 9', backgroundColor: '#ffffff'} as CSSProperties}/>
    <Panel>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
        <GhostButton onClick={remix}>Remix</GhostButton>
        <GhostButton onClick={() => fileRef.current?.click()}>Upload</GhostButton>
        {isVideo && <GhostButton onClick={togglePlay}>{playing ? 'Pause' : 'Play'}</GhostButton>}
        <GhostButton onClick={() => renderer.current?.exportPNG()}>Save PNG</GhostButton>
        <GhostButton onClick={() => setRecording(renderer.current?.toggleRecord() ?? false)}>{recording ? 'Stop recording' : 'Record'}</GhostButton>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onFile} hidden/>
      </div>
      <Slider label="Cell size" value={cell} min={2} max={40} step={1} format={v => `${v}px`} onChange={setCell}/>
      <Slider label="Zoom" value={zoom} min={0.4} max={2.5} step={0.01} format={v => `${v.toFixed(2)}x`} onChange={setZoom}/>
      <ColorControl label="Background" value={bg} onChange={setBg}/>
      {[0, 1, 2, 3].map(b => <div key={b} style={{display: 'grid', gap: '4px'}}>
        <ColorControl label={`Band ${b + 1} colour`} value={bandColors[b]} onChange={v => setBandColors(list => list.map((x, j) => (j === b ? v : x)))}/>
        <Select ariaLabel={`Band ${b + 1} symbol`} options={glyphOptions} activeId={String(bandGlyphs[b])} onPick={id => onGlyph(b, Number(id))}/>
      </div>)}
      {[1, 2, 3].map(i => <Slider key={i} label={`Edge ${i}`} value={stops[i]} min={0} max={1} step={0.01} format={v => `${Math.round(v * 100)}%`} onChange={v => setStops(s => s.map((x, j) => (j === i ? v : x)))}/>)}
    </Panel>
  </div>;
}

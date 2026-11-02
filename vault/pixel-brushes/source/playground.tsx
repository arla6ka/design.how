'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {GhostButton, Panel, Select, Slider} from './runtime/controls';
import {BRUSHES, DEFAULT_BRUSH, INK, PAPER, remixBrush, remixPalette, type Brush, type Ink} from './params';
import {spiralPath, stroke, trailPath, type PathPoint} from './engine';

type Numbers = Pick<Brush, 'spacing' | 'jitter' | 'scatter' | 'follow' | 'size' | 'speedSize' | 'hueDrift'>;
const numbers = (b: Brush): Numbers => ({spacing: b.spacing, jitter: b.jitter, scatter: b.scatter, follow: b.follow, size: b.size, speedSize: b.speedSize, hueDrift: b.hueDrift});

export default function PixelBrushesPlayground() {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<{path: PathPoint[]; brush: Brush; ink: Ink}[]>([]);
  const live = useRef<{x: number; y: number}[]>([]);
  const dpr = useRef(1);

  const [base, setBase] = useState<Brush>(DEFAULT_BRUSH);
  const [n, setN] = useState<Numbers>(numbers(DEFAULT_BRUSH));
  const [ink, setInk] = useState<Ink>(INK);
  const [paper, setPaper] = useState(PAPER);
  const brush = useCallback((): Brush => ({...base, ...n}), [base, n]);
  const brushRef = useRef(brush);
  const inkRef = useRef(ink);
  useEffect(() => { brushRef.current = brush; inkRef.current = ink; }, [brush, ink]);

  const repaint = useCallback(() => {
    const c = canvas.current, h = host.current, ctx = c?.getContext('2d');
    if (!c || !h || !ctx) return;
    const short = Math.min(h.clientWidth, h.clientHeight);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of strokes.current) stroke(ctx, s.path, s.brush, short, {dpr: dpr.current, ink: s.ink});
    if (live.current.length > 1) stroke(ctx, trailPath(live.current), brushRef.current(), short, {dpr: dpr.current, ink: inkRef.current});
  }, []);

  const seed = useCallback((b: Brush, i: Ink) => {
    const h = host.current;
    if (!h) return;
    const short = Math.min(h.clientWidth, h.clientHeight);
    strokes.current = [{path: spiralPath(h.clientWidth / 2, h.clientHeight / 2, short * 0.34), brush: b, ink: i}];
    live.current = [];
  }, []);

  const pick = (id: string) => {
    const b = BRUSHES.find(x => x.id === id);
    if (!b) return;
    setBase(b);
    setN(numbers(b));
    seed(b, ink);
  };

  const remix = () => {
    const b = remixBrush(Math.random);
    const palette = remixPalette(Math.random);
    setBase(b);
    setN(numbers(b));
    setInk(palette.ink);
    setPaper(palette.paper);
    seed(b, palette.ink);
  };

  useEffect(() => {
    const h = host.current, c = canvas.current;
    if (!h || !c) return;
    const size = () => {
      dpr.current = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(h.clientWidth * dpr.current), hh = Math.round(h.clientHeight * dpr.current);
      if (c.width !== w || c.height !== hh) { c.width = w; c.height = hh; }
    };
    size();
    seed(DEFAULT_BRUSH, INK);
    repaint();
    const ro = new ResizeObserver(() => { size(); repaint(); });
    ro.observe(h);

    let drawing = false;
    const local = (e: PointerEvent) => { const r = h.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; };
    const onDown = (e: PointerEvent) => { drawing = true; h.setPointerCapture?.(e.pointerId); live.current = [local(e)]; };
    const onMove = (e: PointerEvent) => {
      if (!drawing) return;
      const p = local(e);
      const last = live.current[live.current.length - 1];
      if (last && Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
      live.current.push(p);
      repaint();
    };
    const onUp = () => {
      if (!drawing) return;
      drawing = false;
      const path = trailPath(live.current);
      if (path.length > 1) strokes.current.push({path, brush: brushRef.current(), ink: inkRef.current});
      live.current = [];
      repaint();
    };
    h.addEventListener('pointerdown', onDown);
    h.addEventListener('pointermove', onMove);
    for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) h.addEventListener(type, onUp);
    return () => {
      ro.disconnect();
      h.removeEventListener('pointerdown', onDown);
      h.removeEventListener('pointermove', onMove);
      for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) h.removeEventListener(type, onUp);
    };
  }, [repaint, seed]);

  useEffect(() => {
    const s = strokes.current;
    if (s.length === 1) { s[0].brush = brush(); s[0].ink = ink; }
    repaint();
  }, [brush, ink, repaint]);

  const slider = (key: keyof Numbers, label: string, min: number, max: number, step: number, digits = 3) =>
    <Slider label={label} value={n[key]} min={min} max={max} step={step} format={v => (key === 'hueDrift' ? `${Math.round(v)} deg` : v.toFixed(digits))} onChange={v => setN(prev => ({...prev, [key]: v}))}/>;

  return <div>
    <div ref={host} style={{position: 'relative', aspectRatio: '1344 / 620', background: paper, cursor: 'crosshair', touchAction: 'none', borderRadius: '6px', overflow: 'hidden', border: '1px solid light-dark(#ececeb, #2a2a29)'}}>
      <canvas ref={canvas} style={{display: 'block', width: '100%', height: '100%'}}/>
    </div>
    <Panel>
      <Select
        ariaLabel="Brush"
        options={[...(base.id === 'remix' ? [{id: 'remix', label: base.name}] : []), ...BRUSHES.map(b => ({id: b.id, label: b.name}))]}
        activeId={base.id}
        onPick={pick}
      />
      {slider('spacing', 'Spacing', 0.02, 0.8, 0.005)}
      {slider('scatter', 'Scatter', 0, 1.2, 0.01, 2)}
      {slider('jitter', 'Jitter', 0, 0.4, 0.005)}
      {slider('follow', 'Follow path', 0, 1, 0.01, 2)}
      {slider('size', 'Size', 0.015, 0.12, 0.002)}
      {slider('speedSize', 'Speed thins', 0, 1, 0.01, 2)}
      {slider('hueDrift', 'Hue drift', 0, 360, 1)}
      <GhostButton onClick={remix}>Remix</GhostButton>
    </Panel>
  </div>;
}

'use client';

import './fonts.css';
import {useEffect, useRef, useState, type PointerEvent} from 'react';
import {Panel, SegmentedControl, Slider} from './runtime/controls';
import {LiquidCard, LiquidGroup} from './group';
import {GROUND, SKIN, SMOOTH} from './params';
import {DESKTOP_SET, PG_VH, PG_VW, type ScenePiece} from './scenes';

const SCENES = DESKTOP_SET.playground;
const OPTIONS = SCENES.map((_, i) => ({id: String(i), label: `Scene ${i + 1}`}));

export default function LiquidUiPlayground() {
  const [scene, setScene] = useState(0);
  const [pieces, setPieces] = useState<ScenePiece[]>(() => SCENES[0].pieces.map(p => ({...p})));
  const [k, setK] = useState(SCENES[0].k);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{id: string; dx: number; dy: number} | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / PG_VW));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const load = (i: number) => {
    setScene(i);
    setPieces(SCENES[i].pieces.map(p => ({...p})));
    setK(SCENES[i].k);
  };
  const local = (e: PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    const s = r.width / PG_VW;
    return {x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s};
  };
  const onDown = (id: string) => (e: PointerEvent<HTMLDivElement>) => {
    const p = pieces.find(q => q.id === id)!;
    const at = local(e);
    drag.current = {id, dx: at.x - p.x, dy: at.y - p.y};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const at = local(e);
    setPieces(list => list.map(p => (p.id === d.id ? {...p, x: at.x - d.dx, y: at.y - d.dy} : p)));
  };

  return <div>
    <div ref={frame} style={{position: 'relative', aspectRatio: `${PG_VW} / ${PG_VH}`, background: GROUND, borderRadius: '6px', border: '1px solid light-dark(#ececeb, #2a2a29)', overflow: 'hidden'}}>
      <div ref={stage} onPointerMove={onMove} onPointerUp={() => { drag.current = null; }} style={{position: 'absolute', left: 0, top: 0, width: PG_VW, height: PG_VH, transformOrigin: '0 0', transform: `scale(${scale})`, touchAction: 'none'}}>
        <LiquidGroup k={k} cardRadius={DESKTOP_SET.cardRadius} cell={SCENES[scene].cell} smooth={SMOOTH} fill={SKIN} style={{width: '100%', height: '100%'}}>
          {pieces.map(pc => <LiquidCard key={pc.id} id={pc.id} x={pc.x} y={pc.y} w={pc.w} h={pc.h} radius={pc.radius}>
            <div onPointerDown={onDown(pc.id)} style={{width: '100%', height: '100%', cursor: 'grab'}}>{pc.content}</div>
          </LiquidCard>)}
        </LiquidGroup>
      </div>
    </div>
    <Panel>
      <SegmentedControl options={OPTIONS} activeId={String(scene)} onPick={id => load(Number(id))}/>
      <Slider label="Blend" value={k} min={0} max={90} step={1} format={v => `${Math.round(v)}`} onChange={setK}/>
    </Panel>
  </div>;
}

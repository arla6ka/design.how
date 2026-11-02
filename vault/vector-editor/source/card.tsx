'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {usePause} from './runtime/use-pause';
import {VectorEditor} from './editor';
import {FRAME, GROUND, PAD, SHAPE, SHAPE_W, VIEW_BOX} from './params';
import {parsePath} from './parse';
import {SelectionFrame} from './selection-frame';

const H = Math.round(SHAPE_W * (VIEW_BOX[3] / VIEW_BOX[2]));
const FW = SHAPE_W + PAD * 2;
const FH = H + PAD * 2;
const PATH = parsePath(SHAPE);

class Fit {
  private readonly ro: ResizeObserver;
  constructor(private readonly host: HTMLElement, private readonly onScale: (s: number) => void) {
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(host);
  }
  measure() {
    const w = this.host.clientWidth;
    this.onScale(w >= 528 ? w / 528 : Math.min(1, (w - (w < 520 ? 64 : 24)) / FW));
  }
  destroy() { this.ro.disconnect(); }
}

export default function VectorEditorCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [intro, setIntro] = useState(0);
  usePause(box, run => { if (run) setIntro(i => i + 1); });

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const fit = new Fit(host, setScale);
    fit.measure();
    return () => fit.destroy();
  }, []);

  return <div ref={box} role="img" aria-label="A shape selected in a design tool: a blue frame with corner handles and a size badge around a blob, a star and a rounded square showing their bezier anchors and handles." className={className} style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', background: GROUND}}>
    <div style={{transform: `scale(${scale})`, transformOrigin: 'center', pointerEvents: 'none'}}>
      <SelectionFrame key={intro} style={FRAME} width={FW} height={FH}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: FW, height: FH}}>
          <VectorEditor path={PATH} onChange={() => {}} viewBox={VIEW_BOX} width={SHAPE_W} height={H} rigScale={0.5}/>
        </div>
      </SelectionFrame>
    </div>
  </div>;
}

'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {LiquidCard, LiquidGroup} from './group';
import {GROUND, HOLD_MS, MORPH_MS, SKIN, SMOOTH} from './params';
import {CARD_VH, CARD_VW, COMPACT_SET, DESKTOP_SET, MOBILE_QUERY, type SceneSet, type SceneSpec, type ScenePiece} from './scenes';

const FIT_WIDTH = 528;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Frame = {k: number; pieces: ScenePiece[]};

function frameAt(scenes: SceneSpec[], from: number, to: number, p: number, drift: number, driftScale: number): Frame {
  const a = scenes[from % scenes.length];
  const b = scenes[to % scenes.length];
  const dx = Math.sin(drift * 0.007) * 11 * driftScale;
  const dy = Math.cos(drift * 0.005) * 6 * driftScale;
  return {
    k: lerp(a.k, b.k, p),
    pieces: a.pieces.map((fp, i) => {
      const tp = b.pieces[i] ?? fp;
      const wob = fp.id === 'tab' ? 1 : 0.25;
      return {
        id: fp.id,
        x: lerp(fp.x, tp.x, p) + dx * wob,
        y: lerp(fp.y, tp.y, p) + dy * wob,
        w: lerp(fp.w, tp.w, p),
        h: lerp(fp.h, tp.h, p),
        radius: lerp(fp.radius ?? 24, tp.radius ?? 24, p),
        content: p < 0.5 ? fp.content : tp.content,
      };
    }),
  };
}

class SceneCycle {
  private raf = 0;
  private running = false;
  private from = 0;
  private to = 0;
  private phase: 'hold' | 'morph' = 'hold';
  private start = 0;
  private drift = 0;
  private prev = 0;
  constructor(private readonly scenes: SceneSpec[], private readonly driftScale: number, private readonly onFrame: (f: Frame) => void) {}
  run() {
    if (this.running) return;
    this.running = true;
    this.prev = 0;
    this.start = 0;
    this.raf = requestAnimationFrame(this.tick);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
  destroy() {
    this.stop();
  }
  private tick = (now: number) => {
    if (!this.running) return;
    if (!this.start) this.start = now;
    this.drift += this.prev ? now - this.prev : 16;
    this.prev = now;
    const elapsed = now - this.start;
    if (this.phase === 'hold' && elapsed >= HOLD_MS) {
      this.phase = 'morph';
      this.start = now;
      this.from = this.to;
      this.to = (this.to + 1) % this.scenes.length;
    } else if (this.phase === 'morph' && elapsed >= MORPH_MS) {
      this.phase = 'hold';
      this.start = now;
      this.from = this.to;
    }
    const p = this.phase === 'morph' ? ease(Math.min(1, (now - this.start) / MORPH_MS)) : 0;
    this.onFrame(frameAt(this.scenes, this.from, this.to, p, this.drift, this.driftScale));
    this.raf = requestAnimationFrame(this.tick);
  };
}

export default function LiquidUiCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const cycle = useRef<SceneCycle | null>(null);
  const [set, setSet] = useState<SceneSet>(DESKTOP_SET);
  const compact = set === COMPACT_SET;
  const [frame, setFrame] = useState<Frame>(() => frameAt(DESKTOP_SET.card, 0, 0, 0, 0, 1));
  const [scale, setScale] = useState(1);
  const running = usePause(box, run => (run ? cycle.current?.run() : cycle.current?.stop()));

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const ro = new ResizeObserver(() => setScale(host.clientWidth / (set === COMPACT_SET ? set.vw : FIT_WIDTH)));
    ro.observe(host);
    return () => ro.disconnect();
  }, [set]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setSet(mq.matches ? COMPACT_SET : DESKTOP_SET);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const driftScale = compact ? 0.6 : 1;
    setFrame(frameAt(set.card, 0, 0, 0, 0, driftScale));
    if (prefersReducedMotion()) return;
    const next = new SceneCycle(set.card, driftScale, setFrame);
    cycle.current = next;
    if (running.current) next.run();
    return () => {
      next.destroy();
      cycle.current = null;
    };
  }, [set, compact, running]);

  return <div ref={box} role="img" aria-label="Soft white cards that fuse where they meet, the corner between them curving inward, stepping through a grid panel with a tab, a chat bubble and a share card with a button." className={className} style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', background: GROUND}}>
    <div style={{position: 'absolute', left: '50%', top: '50%', width: compact ? set.vw : CARD_VW, height: compact ? set.vh : CARD_VH, transform: `translate(-50%, -50%) scale(${scale})`}}>
      <LiquidGroup k={frame.k} cardRadius={set.cardRadius} cell={set.card[0].cell} smooth={SMOOTH} fill={SKIN} style={{width: '100%', height: '100%'}}>
        {frame.pieces.map(pc => <LiquidCard key={pc.id} id={pc.id} x={pc.x} y={pc.y} w={pc.w} h={pc.h} radius={pc.radius}>{pc.content}</LiquidCard>)}
      </LiquidGroup>
    </div>
  </div>;
}

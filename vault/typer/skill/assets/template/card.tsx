// Typer (https://design.how/vault/typer), card.tsx.
// FIXED. Change the VARIABLE values in params instead (LINES, PRESETS, REPLAY_MS, STAGGER, SIZE_CQW, SIZE_MIN, FONT_VAR).
'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {TyperLines} from './lines';
import {FONT_VAR, LINES, REPLAY_MS, SIZE_CQW, SIZE_MIN, STAGGER} from './params';
import {PRESETS} from './presets';

class Cycle {
  private timer = 0;
  constructor(private readonly next: () => void) {}
  start() {
    if (this.timer) return;
    this.timer = window.setInterval(this.next, REPLAY_MS);
  }
  stop() {
    window.clearInterval(this.timer);
    this.timer = 0;
  }
  destroy() {
    this.stop();
  }
}

export default function TyperCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const cycle = useRef<Cycle | null>(null);
  const [step, setStep] = useState(0);
  const [play, setPlay] = useState(false);
  const running = usePause(box, run => {
    setPlay(run);
    if (run) cycle.current?.start();
    else cycle.current?.stop();
  }, {threshold: 0.3});

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const next = new Cycle(() => setStep(s => s + 1));
    cycle.current = next;
    if (running.current) next.start();
    return () => {
      next.destroy();
      cycle.current = null;
    };
  }, [running]);

  const p = PRESETS[step % PRESETS.length];
  return <div
    ref={box}
    role="img"
    aria-label={`${LINES.join(' ')}, revealed character by character.`}
    className={className}
    style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', padding: '0 16px', background: p.bg, transition: 'background-color 500ms cubic-bezier(0.23, 1, 0.32, 1)', containerType: 'inline-size'}}
  >
    <TyperLines
      lines={LINES} variations={p.pool} fps={p.fps} cycles={p.cycles} stagger={STAGGER}
      fg={p.fg} bg={p.bg} accent={p.accent} accentInk={p.accentInk} playKey={step} play={play}
      lineStyle={{fontFamily: `var(${FONT_VAR})`, fontSize: `max(${SIZE_MIN}px, ${SIZE_CQW}cqw)`, fontWeight: 600, lineHeight: 1.12, letterSpacing: '-0.01em'}}
    />
  </div>;
}

'use client';

import './fonts.css';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {composeLine, hashSeed, type Placed} from './compose';
import {RansomLine} from './line';
import {CROSS_OVERLAP, GROUND, PHRASES, REVEAL_HOLD} from './params';

const OUT_MS = 260;

type Slot = {key: number; phrase: number; placed: Placed[]; direction: 'in' | 'out'; revealed: boolean};
const slotFor = (key: number, phrase: number): Slot => ({key, phrase, placed: composeLine(PHRASES[phrase], hashSeed(PHRASES[phrase])), direction: 'in', revealed: false});

class NoteCycle {
  private timers = new Set<number>();
  private running = false;
  private seq = 1;
  constructor(private readonly set: (fn: (s: Slot[]) => Slot[]) => void) {}
  private after(fn: () => void, ms: number) {
    const id = window.setTimeout(() => { this.timers.delete(id); fn(); }, ms);
    this.timers.add(id);
  }
  private reveal = () => this.set(s => s.map((sl, i) => (i === s.length - 1 ? {...sl, revealed: true} : sl)));
  private next = () => {
    if (!this.running) return;
    const key = this.seq++;
    this.set(s => {
      const cur = s[s.length - 1];
      return [{...cur, direction: 'out', revealed: false}, slotFor(key, (cur.phrase + 1) % PHRASES.length)];
    });
    this.after(() => this.set(s => s.slice(-1)), OUT_MS);
    this.after(this.reveal, CROSS_OVERLAP);
    this.after(this.next, CROSS_OVERLAP + REVEAL_HOLD);
  };
  start() {
    if (this.running) return;
    this.running = true;
    this.reveal();
    this.after(this.next, REVEAL_HOLD);
  }
  stop() {
    this.running = false;
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
  }
  destroy() {
    this.stop();
  }
}

export default function RansomNoteCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const cycle = useRef<NoteCycle | null>(null);
  const [slots, setSlots] = useState<Slot[]>(() => [{...slotFor(0, 0), revealed: true}]);
  const [width, setWidth] = useState(900);
  const [fit, setFit] = useState(1);
  const hovering = useRef(false);
  const onScreen = useRef(false);
  const sync = () => (onScreen.current && !hovering.current ? cycle.current?.start() : cycle.current?.stop());
  const running = usePause(box, run => { onScreen.current = run; sync(); });

  const lineH = Math.max(30, Math.round(width * 0.072)) * fit;
  const current = slots[slots.length - 1];
  useLayoutEffect(() => setFit(1), [current.key, width]);
  useLayoutEffect(() => {
    const el = line.current?.lastElementChild?.firstElementChild as HTMLElement | null;
    if (!el || fit !== 1) return;
    const usable = width * 0.86;
    if (el.scrollWidth > usable) setFit(usable / el.scrollWidth);
  }, [fit, width, current.key]);

  useEffect(() => {
    const host = box.current;
    if (!host) return;
    const ro = new ResizeObserver(() => setWidth(host.clientWidth));
    ro.observe(host);
    if (prefersReducedMotion()) {
      setSlots(s => [{...s[s.length - 1], revealed: true}]);
      return () => ro.disconnect();
    }
    const next = new NoteCycle(setSlots);
    cycle.current = next;
    onScreen.current = running.current;
    sync();
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onEnter = () => {
      hovering.current = true;
      sync();
      setSlots(s => [{...s[s.length - 1], direction: 'in', revealed: true}]);
    };
    const onLeave = () => { hovering.current = false; sync(); };
    if (fine) {
      host.addEventListener('pointerenter', onEnter);
      host.addEventListener('pointerleave', onLeave);
    }
    return () => {
      ro.disconnect();
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
      next.destroy();
      cycle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return <div
    ref={box}
    role="img"
    aria-label={`Short phrases spelled out as a ransom note in cut paper letters: ${PHRASES.join(', ')}.`}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', background: GROUND}}
  >
    <div ref={line} style={{position: 'absolute', inset: 0}}>
      {slots.map(sl => <div key={sl.key} style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <RansomLine placed={sl.placed} lineH={lineH} revealed={sl.revealed} direction={sl.direction}/>
      </div>)}
    </div>
  </div>;
}

// Hover video button (https://design.how/vault/hover-video), hover-button.tsx.
// FIXED. Change the VARIABLE values in params instead (BUTTONS, PROMPTS, DESIGN_WIDTH).
'use client';

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {mediaUrl, videoSources} from './runtime/media';
import {prefersReducedMotion} from './runtime/use-pause';
import type {ButtonConfig} from './params';

type Phase = 'idle' | 'fwd' | 'rev';

const BASE: CSSProperties = {
  position: 'relative', zIndex: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  cursor: 'pointer', borderRadius: 9999, padding: '10px 20px', border: 0, fontFamily: 'var(--visual-grotesk)',
};

function pill(variant: ButtonConfig['variant']): {style: CSSProperties; overlays?: ReactNode; labelStyle?: CSSProperties} {
  if (variant === 'blue') return {
    style: {
      ...BASE, fontSize: 15, fontWeight: 500, color: '#fff',
      background: 'linear-gradient(180deg, #3CB2CD 0%, #1D6EB1 100%)',
      boxShadow: 'rgba(142,217,255,0.5) 0px -1px 4.1px 0.5px inset, rgb(190,226,255) 0px 0px 4px 0px inset, rgba(43,162,189,0.5) 0px -36px 14.2px -28px inset',
    },
    labelStyle: {textShadow: '0px 1px 2px rgba(0,0,0,0.5)'},
    overlays: <span aria-hidden style={{pointerEvents: 'none', position: 'absolute', left: 10, right: 10, top: -4.5, height: 28, borderRadius: 500, background: 'linear-gradient(to top, rgba(255,255,255,0), #fff)', opacity: 0.7, filter: 'blur(1px)'}}/>,
  };
  if (variant === 'dark') return {
    style: {...BASE, fontSize: 14, fontWeight: 400, lineHeight: '20px', letterSpacing: '0.02em', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', background: 'transparent'},
    overlays: <span aria-hidden style={{pointerEvents: 'none', position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.56)'}}>
      <span style={{position: 'absolute', inset: 0, opacity: 0.12, background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%)'}}/>
      <span style={{position: 'absolute', inset: 0, opacity: 0.32, background: 'radial-gradient(65.62% 65.62% at 50% 50%, #000 0%, rgba(0,0,0,0) 100%)'}}/>
      <span style={{
        position: 'absolute', inset: 0, opacity: 0.24, padding: 1, borderRadius: 'inherit',
        background: 'linear-gradient(180deg, #fff 0%, #999 55%, #fff 80%, #999 95%)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude',
      }}/>
    </span>,
  };
  return {
    style: {
      ...BASE, fontSize: 15, fontWeight: 500, color: '#1b1b1b', border: '1px solid #f0f0f0', backdropFilter: 'blur(2px)',
      background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0) 100%), #f1f0ea',
      boxShadow: '0 -1px 1.5px 0 rgba(71,58,45,0.12) inset, 0 1.5px 6px rgba(71,58,45,0.06)',
    },
  };
}

function sources(base: string, alpha: boolean): ReactNode {
  if (alpha) return <>
    <source src={mediaUrl(`${base}.alpha.webm`)} type="video/webm"/>
    <source src={mediaUrl(`${base}.alpha.hevc.mp4`)} type='video/mp4; codecs="hvc1"'/>
  </>;
  return videoSources(base).map(s => <source key={s.src} src={s.src} type={s.type}/>);
}

function releaser(videos: (HTMLVideoElement | null)[]) {
  return {
    destroy() {
      for (const v of videos) v?.pause();
    },
  };
}

const SPRING = {amp: 0.6, decay: 3.5, freq: 11};
const TAIL = {start: 0.6, slow: 0.62};
const LEAN = {strength: 0.1, max: 9};

export function HoverVideoButton({config, active}: {config: ButtonConfig; active: boolean}) {
  const {label, video, reverseVideo, width, variant, speed, alpha, offsetX, offsetY} = config;
  const wrap = useRef<HTMLDivElement>(null);
  const fwdRef = useRef<HTMLVideoElement>(null);
  const revRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [reduced] = useState(() => prefersReducedMotion());
  const hoverable = useRef(true);
  useEffect(() => { hoverable.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches; }, []);

  useEffect(() => { if (!active) setPhase('idle'); }, [active]);

  const lean = useRef({tx: 0, ty: 0, x: 0, y: 0});
  const pop = useRef({target: 0, pos: 0, vel: 0});
  const raf = useRef(0);
  const tick = () => {
    const el = wrap.current;
    if (!el) { raf.current = 0; return; }
    const l = lean.current;
    const p = pop.current;
    l.x += (l.tx - l.x) * 0.2;
    l.y += (l.ty - l.y) * 0.2;
    p.target *= 0.9;
    if (p.target < 0.001) p.target = 0;
    p.vel = (p.vel + (p.target - p.pos) * 0.22) * 0.68;
    p.pos += p.vel;
    el.style.transform = `translate(${l.x.toFixed(2)}px, ${l.y.toFixed(2)}px) scale(${(1 + p.pos).toFixed(3)})`;
    const rest = Math.abs(l.tx - l.x) < 0.08 && Math.abs(l.ty - l.y) < 0.08 && !p.target && Math.abs(p.pos) < 0.001 && Math.abs(p.vel) < 0.001;
    if (rest && !l.tx && !l.ty) { el.style.transform = ''; raf.current = 0; }
    else raf.current = requestAnimationFrame(tick);
  };
  const wake = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };

  useEffect(() => {
    const box = wrap.current?.parentElement;
    if (reduced || !box) return;
    const clamp = (v: number) => Math.max(-LEAN.max, Math.min(LEAN.max, v));
    const onMove = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      lean.current.tx = clamp((e.clientX - (r.left + r.width / 2)) * LEAN.strength);
      lean.current.ty = clamp((e.clientY - (r.top + r.height / 2)) * LEAN.strength);
      wake();
    };
    const onLeave = () => { lean.current.tx = lean.current.ty = 0; wake(); };
    box.addEventListener('pointermove', onMove);
    box.addEventListener('pointerleave', onLeave);
    return () => {
      box.removeEventListener('pointermove', onMove);
      box.removeEventListener('pointerleave', onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const enter = () => { if (!reduced && active) setPhase('fwd'); };
  const leave = () => { if (!reduced) setPhase(reverseVideo ? 'rev' : 'idle'); };

  useEffect(() => {
    const fwd = fwdRef.current;
    const rev = revRef.current;
    if (reduced || !fwd) return;
    if (phase === 'fwd') {
      rev?.pause();
      fwd.currentTime = 0;
      fwd.playbackRate = speed;
      fwd.play().catch(() => {});
    } else if (phase === 'rev' && rev) {
      const d = fwd.duration || rev.duration || 0;
      const t = Math.min(fwd.currentTime || 0, d);
      fwd.pause();
      rev.currentTime = Math.max(0, d - t);
      rev.playbackRate = speed * 1.3;
      rev.play().catch(() => {});
    } else {
      fwd.pause();
      fwd.currentTime = 0;
      rev?.pause();
    }
  }, [phase, speed, reduced]);

  useEffect(() => {
    const el = fwdRef.current;
    if (reduced || phase !== 'fwd' || !el) return;
    let frame = 0;
    const step = () => {
      if (el.ended) return;
      const p = Math.min(1, (el.currentTime || 0) / (el.duration || 1));
      const wobble = 1 + SPRING.amp * Math.exp(-SPRING.decay * p) * Math.sin(SPRING.freq * p);
      const tp = Math.max(0, (p - TAIL.start) / (1 - TAIL.start));
      const slow = 1 - TAIL.slow * tp * tp * (3 - 2 * tp);
      el.playbackRate = Math.max(0.25, speed * wobble * slow);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, speed, reduced]);

  useEffect(() => {
    if (reduced || !active) return;
    let cancelled = false;
    const warm = (v: HTMLVideoElement | null) => {
      if (!v || v.dataset.warm) return;
      v.dataset.warm = '1';
      v.muted = true;
      v.play()?.then(() => { if (cancelled) return; v.pause(); v.currentTime = 0; }).catch(() => {});
    };
    const id = window.setTimeout(() => { warm(fwdRef.current); warm(revRef.current); }, 250);
    return () => { cancelled = true; window.clearTimeout(id); };
  }, [reduced, active]);

  useEffect(() => {
    const clips = releaser([fwdRef.current, revRef.current]);
    return () => clips.destroy();
  }, []);

  useEffect(() => {
    if (phase === 'idle' || hoverable.current) return;
    const onDoc = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) leave(); };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const p = pill(variant);
  const visible = phase !== 'idle' && !reduced;
  return <div
    ref={wrap}
    style={{position: 'relative', display: 'inline-flex', cursor: 'pointer'}}
    onPointerEnter={() => hoverable.current && enter()}
    onPointerLeave={() => hoverable.current && leave()}
    onPointerDown={() => {
      if (reduced) return;
      pop.current.target = Math.min(pop.current.target + 0.06, 0.28);
      wake();
    }}
  >
    <button type="button" onClick={() => { if (!hoverable.current) { if (phase === 'fwd') leave(); else enter(); } }} style={{...p.style, opacity: visible ? 0 : 1}}>
      {p.overlays}
      <span style={{position: 'relative', zIndex: 10, ...p.labelStyle}}>{label}</span>
    </button>
    {!reduced && <div aria-hidden style={{pointerEvents: 'none', position: 'absolute', left: '50%', top: '50%', zIndex: 10, width, opacity: visible ? 1 : 0, transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`}}>
      <video ref={fwdRef} muted playsInline preload={active ? 'auto' : 'none'} loop={!reverseVideo} style={{display: 'block', width: '100%', height: 'auto', opacity: phase === 'rev' ? 0 : 1}}>{sources(video, alpha)}</video>
      {reverseVideo && <video ref={revRef} muted playsInline preload={active ? 'auto' : 'none'} onEnded={() => setPhase('idle')} style={{position: 'absolute', inset: 0, display: 'block', width: '100%', height: 'auto', opacity: phase === 'rev' ? 1 : 0}}>{sources(reverseVideo, alpha)}</video>}
    </div>}
  </div>;
}

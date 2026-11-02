'use client';

import {useEffect, useRef, useState} from 'react';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {VoiceWave} from './engine';

type MicState = 'off' | 'asking' | 'on' | 'denied';

export default function VoiceWaveCard({className}: {className?: string}) {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const engine = useRef<VoiceWave | null>(null);
  const [mic, setMic] = useState<MicState>('off');
  const [ready, setReady] = useState(false);
  const running = usePause(box, run => (run ? engine.current?.start() : engine.current?.stop()));

  useEffect(() => {
    const host = stage.current;
    if (!host) return;
    const raf = requestAnimationFrame(() => {
      const next = new VoiceWave(host);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) return next.renderStill();
      setReady(true);
      if (running.current) next.start();
    });
    return () => {
      cancelAnimationFrame(raf);
      engine.current?.destroy();
      engine.current = null;
      setMic('off');
      setReady(false);
    };
  }, [running]);

  const toggleMic = async () => {
    const wave = engine.current;
    if (!wave) return;
    if (wave.micLive) {
      wave.disableMic();
      setMic('off');
      return;
    }
    setMic('asking');
    const ok = await wave.enableMic();
    if (engine.current === wave) setMic(ok ? 'on' : 'denied');
  };

  const label = mic === 'on' ? 'Stop listening' : mic === 'asking' ? 'Asking for the microphone' : mic === 'denied' ? 'Microphone unavailable' : 'Use my voice';
  const why = mic === 'on'
    ? 'Listening. Nothing is recorded or sent.'
    : mic === 'denied'
      ? 'No microphone. The wave keeps its own voice.'
      : 'Follows your voice. Nothing is recorded.';

  return <div
    ref={box}
    className={className}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: 'light-dark(#ffffff, #0e0e0d)'}}
  >
    <div
      ref={stage}
      role="img"
      aria-label="A ribbon of light that ripples like a voice and splits into violet, magenta and coral where it bends, with a soft reflection below."
      style={{position: 'absolute', inset: 0}}
    />
    {ready && <div style={{position: 'absolute', left: 0, right: 0, bottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '0 12px', textAlign: 'center'}}>
      <button
        type="button"
        onClick={toggleMic}
        disabled={mic === 'asking'}
        aria-pressed={mic === 'on'}
        style={{display: 'inline-flex', alignItems: 'center', gap: '8px', height: 28, padding: '0 8px', border: '1px solid light-dark(#ececeb, #2a2a29)', borderRadius: '6px', background: 'light-dark(#ffffff, #0e0e0d)', color: 'light-dark(#161514, #e8e8e6)', font: 'inherit', fontSize: '13px', cursor: mic === 'asking' ? 'default' : 'pointer', opacity: mic === 'asking' ? 0.6 : 1}}
      >
        {mic === 'on'
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="7" y="7" width="10" height="10" rx="2.5"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/></svg>}
        {label}
      </button>
      <span style={{color: 'light-dark(#71706f, #a09f9d)', fontSize: '13px', lineHeight: '20px'}}>{why}</span>
    </div>}
  </div>;
}

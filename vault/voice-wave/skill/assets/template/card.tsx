// Voice wave (https://design.how/vault/voice-wave), card.tsx.
// FIXED. Change the VARIABLE values in params instead (PALETTE, PHRASES, ZOOM).
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

  return <div
    ref={box}
    className={['voice-wave', className].filter(Boolean).join(' ')}
    style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', backgroundColor: 'light-dark(#ffffff, #0e0e0d)'}}
  >
    <style href="voice-wave-mic" precedence="default">{MIC_CSS}</style>
    <div
      ref={stage}
      role="img"
      aria-label="A ribbon of light that ripples like a voice and splits into violet, magenta and coral where it bends, with a soft reflection below."
      style={{position: 'absolute', inset: 0}}
    />
    {ready && <div className="voice-wave-mic" data-live={mic === 'on' || mic === 'asking' || undefined}>
      <button type="button" onClick={toggleMic} disabled={mic === 'asking'} aria-pressed={mic === 'on'} aria-label={label} title={label}>
        {mic === 'on'
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="7" y="7" width="10" height="10" rx="2.5"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/></svg>}
      </button>
    </div>}
  </div>;
}

const MIC_CSS = `
.voice-wave-mic { position: absolute; bottom: 16px; left: 50%; z-index: 10; transform: translateX(-50%); opacity: 0; transition: opacity .2s cubic-bezier(.215, .61, .355, 1); }
.voice-wave:hover .voice-wave-mic, .voice-wave-mic:focus-within, .voice-wave-mic[data-live] { opacity: 1; }
@media (hover: none) { .voice-wave-mic { opacity: 1; } }
.voice-wave-mic button { display: flex; align-items: center; justify-content: center; padding: 6px; border: 0; border-radius: 6px; background: transparent; color: #6b6b6b; cursor: pointer; transition: background-color .15s cubic-bezier(.215, .61, .355, 1), color .15s cubic-bezier(.215, .61, .355, 1), transform .15s cubic-bezier(.215, .61, .355, 1); }
.voice-wave-mic button:hover { background: #f7f7f7; color: #1b1b1b; }
.voice-wave-mic button:active { transform: scale(.96); }
.voice-wave-mic button:disabled { opacity: .5; cursor: default; }
`;

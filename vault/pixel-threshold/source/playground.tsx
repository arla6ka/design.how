'use client';

import './fonts.css';
import {useEffect, useRef, useState} from 'react';
import {GhostButton, Panel, PromptInput, Slider} from './runtime/controls';
import {prefersReducedMotion, usePause} from './runtime/use-pause';
import {PixelThreshold} from './engine';
import {COLORWAYS, DEFAULTS, FONT_CSS, FONT_WEIGHT} from './params';

export default function PixelThresholdPlayground() {
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<PixelThreshold | null>(null);
  const running = usePause(host, run => (run ? engine.current?.start() : engine.current?.stop()));

  const [word, setWord] = useState(DEFAULTS.word);
  const [threshold, setThreshold] = useState(DEFAULTS.threshold);
  const [cols, setCols] = useState(DEFAULTS.cols);
  const [keyline, setKeyline] = useState(DEFAULTS.keyline);
  const [shadow, setShadow] = useState(DEFAULTS.keylineOffset[0]);
  const [separation, setSeparation] = useState(DEFAULTS.separation);
  const [swim, setSwim] = useState(DEFAULTS.swim);
  const [pull, setPull] = useState(DEFAULTS.pull);
  const [magnetReach, setMagnetReach] = useState(DEFAULTS.magnetReach);
  const [texture, setTexture] = useState(DEFAULTS.texture);
  const [colorway, setColorway] = useState(0);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    const probe = document.createElement('span');
    probe.style.cssText = `position:absolute;visibility:hidden;font-family:${FONT_CSS}`;
    probe.textContent = 'Ag';
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily.split(',')[0].replace(/["']/g, '').trim();
    probe.remove();

    let built = false;
    const build = () => {
      if (cancelled || built) return;
      built = true;
      const next = new PixelThreshold(element, family ? `"${family}", sans-serif` : undefined);
      engine.current = next;
      if (!next.ok) return;
      if (prefersReducedMotion()) next.renderStill();
      else if (running.current) next.start();
    };
    const timer = window.setTimeout(build, 350);
    if (family && document.fonts?.load) document.fonts.load(`${FONT_WEIGHT} 1em "${family}"`).then(build, build);
    else build();

    let resizeTimer = 0;
    const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => engine.current?.resize(), 120); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      engine.current?.destroy();
      engine.current = null;
    };
  }, [running]);

  useEffect(() => {
    engine.current?.setParams({word, threshold, cols, keyline, keylineOffset: [shadow, shadow], texture, separation, swim, pull, magnetReach});
  }, [word, threshold, cols, keyline, shadow, texture, separation, swim, pull, magnetReach]);

  const remix = () => {
    const next = (colorway + 1) % COLORWAYS.length;
    setColorway(next);
    engine.current?.setColorway(next);
  };
  const cells = (v: number) => `${Math.round(v)} cells`;

  return <div style={{display: 'grid', gap: '12px', minWidth: 0}}>
    <div
      ref={host}
      role="img"
      aria-label={`The word ${word} burnt into a flat colour poster by a threshold, its edges quantised into hard blocks.`}
      style={{position: 'relative', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: '6px', backgroundColor: '#eb0809', touchAction: 'pan-y'}}
    />
    <Panel>
      <PromptInput label="Word" value={word} onChange={v => setWord(v.slice(0, 14))}/>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px'}}>
        <span style={{color: 'light-dark(#71706f, #a09f9d)', fontSize: '13px'}}>Colourway: {COLORWAYS[colorway].name}</span>
        <GhostButton onClick={remix}>Remix</GhostButton>
      </div>
      <Slider label="Threshold" value={threshold} min={0.25} max={0.85} step={0.005} onChange={setThreshold}/>
      <Slider label="Grid" value={cols} min={40} max={260} step={2} format={cells} onChange={setCols}/>
      <Slider label="Keyline" value={keyline} min={0} max={8} step={1} format={cells} onChange={setKeyline}/>
      <Slider label="Shadow" value={shadow} min={0} max={6} step={1} format={cells} onChange={setShadow}/>
      <Slider label="Magnet" value={magnetReach} min={0} max={7} step={1} format={cells} onChange={setMagnetReach}/>
      <Slider label="Pull" value={pull} min={0} max={0.04} step={0.002} format={v => v.toFixed(3)} onChange={setPull}/>
      <Slider label="Swim" value={swim} min={0} max={2.5} step={0.1} onChange={setSwim}/>
      <Slider label="Separation" value={separation} min={0} max={3} step={0.1} onChange={setSeparation}/>
      <Slider label="Texture" value={texture} min={0} max={1.6} step={0.02} onChange={setTexture}/>
    </Panel>
  </div>;
}

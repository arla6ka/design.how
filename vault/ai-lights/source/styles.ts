import {PULSE_MS} from './params';

export const CSS = `
@property --ai-bg1 { syntax: "<color>"; inherits: true; initial-value: #f7f9fc; }
@property --ai-bg2 { syntax: "<color>"; inherits: true; initial-value: #eef4fb; }
@property --ai-bg3 { syntax: "<color>"; inherits: true; initial-value: #e6f0fa; }
@property --ai-deg-start { syntax: "<angle>"; inherits: false; initial-value: 180deg; }
@property --ai-stop-2 { syntax: "<angle>"; inherits: false; initial-value: 16deg; }
@property --ai-stop-3 { syntax: "<angle>"; inherits: false; initial-value: 30deg; }
@property --ai-stop-4 { syntax: "<angle>"; inherits: false; initial-value: 43deg; }
@property --ai-stop-5 { syntax: "<angle>"; inherits: false; initial-value: 59deg; }
@property --ai-stop-6 { syntax: "<angle>"; inherits: false; initial-value: 72deg; }
@property --ai-stop-7 { syntax: "<angle>"; inherits: false; initial-value: 84deg; }

.ail-card {
  position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;
  width: 100%; height: 100%; user-select: none;
  font-family: var(--visual-sans, system-ui, sans-serif);
  background: linear-gradient(180deg, var(--ai-bg1) 0%, var(--ai-bg2) 55%, var(--ai-bg3) 100%);
  transition: --ai-bg1 1200ms ease-out, --ai-bg2 1200ms ease-out, --ai-bg3 1200ms ease-out;
}
.ail-probe { position: absolute; top: 0; left: 0; visibility: hidden; pointer-events: none; z-index: -1; }
.ail-probe > div { display: inline-block; }

/* The one body. Its tokens are scoped here, a heavier border and a deeper stack of greys than the site's. */
.ail-body {
  position: relative; padding: 1px; border-radius: var(--r);
  box-shadow: 0 1px 2px rgba(12,38,77,0.06), 0 8px 24px rgba(12,38,77,0.08);
  transition: width var(--m) cubic-bezier(0.22,1,0.36,1), height var(--m) cubic-bezier(0.22,1,0.36,1), border-radius var(--m) cubic-bezier(0.22,1,0.36,1);
  --s-border-1: #e0e0e0; --s-text-primary: #1a1a1a; --s-text-body: #3b3b3b; --s-text-muted: #707070;
  --s-text-subtle: #8c8c8c; --s-surface-2: #ffffff;
}
.ail-layer { position: absolute; pointer-events: none; mask-repeat: no-repeat; mask-size: 100% 100%; }
/* While the body morphs the layers leave the render tree: ten masks rescaled per frame for a glow nobody can see. */
.ail-body[data-morphing="true"] .ail-layer { display: none; }
.ail-layer::before {
  content: ""; position: absolute; inset: 0; opacity: 0;
  background: conic-gradient(from var(--ai-deg-start) at 50% 50%,
    var(--ai-c1, #005bf6) 0deg, var(--ai-c2, #b0c6e9) var(--ai-stop-2), var(--ai-c3, #feca00) var(--ai-stop-3),
    var(--ai-c4, #ff1c11) var(--ai-stop-4), var(--ai-c5, #ff00ea) var(--ai-stop-5), var(--ai-c6, #ffa2fbcc) var(--ai-stop-6),
    transparent var(--ai-stop-7), transparent 324deg, var(--ai-tail, #95c1ffa1) 349deg, var(--ai-c1, #005bf6) 360deg);
}
.ail-body[data-playing="true"] .ail-layer::before { will-change: opacity; animation: ail-pulse ${PULSE_MS}ms cubic-bezier(0.26,0.94,0.6,1) both; }
/* The still: the pulse's look a quarter of the way in, written as static values rather than a paused animation, so
   nothing that finishes animations can fade it out. */
.ail-body[data-still="true"] .ail-layer::before {
  opacity: 1; --ai-deg-start: 127deg; --ai-stop-2: 12.5deg; --ai-stop-3: 23deg; --ai-stop-4: 34deg; --ai-stop-5: 52deg; --ai-stop-6: 78deg; --ai-stop-7: 97deg;
}
/* Fade up, hold, fade out, while the wedge swings back from 180 to 30 degrees and every stop blooms outward. */
@keyframes ail-pulse {
  0% { opacity: 0; }
  10%, 30% { opacity: 1; animation-timing-function: linear; }
  88% { opacity: 0; animation-timing-function: linear; }
  100% { opacity: 0; --ai-deg-start: 30deg; --ai-stop-2: 6deg; --ai-stop-3: 11deg; --ai-stop-4: 17deg; --ai-stop-5: 40deg; --ai-stop-6: 90deg; --ai-stop-7: 120deg; }
}

.ail-face { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: calc(var(--r) - 1px); transition: background-color var(--m) cubic-bezier(0.22,1,0.36,1); }
.ail-face > span { position: absolute; inset: 0; pointer-events: none; border-radius: inherit; }
.ail-content { position: relative; width: 100%; height: 100%; transition: opacity var(--f) ease-out; }
.ail-pad { padding: 14px 20px; }
.ail-pad-control { padding: 10px 10px 10px 20px; }

.ail-rise { display: block; line-height: 1; white-space: nowrap; }
.ail-char { display: inline-block; vertical-align: middle; animation: ail-char 300ms cubic-bezier(0.66,0,0.34,1) both; }
.ail-fade { animation: ail-fade 300ms ease both; }
@keyframes ail-char { from { opacity: 0; transform: translateY(16px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ail-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ail-spin { to { transform: rotate(360deg); } }
@keyframes ail-ring { 0% { opacity: 0.55; transform: scale(0.72); } 70%, 100% { opacity: 0; transform: scale(1.5); } }

.ail-row { display: flex; align-items: center; gap: 8px; }
.ail-grow { min-width: 0; flex: 1; }
.ail-trail { flex-shrink: 0; font-size: 13px; line-height: 1; font-variant-numeric: tabular-nums; color: var(--s-text-subtle); }
.ail-track { position: relative; display: flex; align-items: flex-start; }
.ail-line { position: absolute; top: 7px; left: 16.667%; right: 16.667%; height: 1px; background: var(--s-border-1); }
.ail-step { display: flex; flex: 1; flex-direction: column; align-items: center; gap: 8px; }
.ail-dot { position: relative; display: grid; place-items: center; width: 14px; height: 14px; flex-shrink: 0; }
.ail-dot > i { width: 12px; height: 12px; border-radius: 4px; }
.ail-pulse-ring { position: absolute; inset: -3px; border-radius: 6px; border: 1px solid var(--s-text-primary); animation: ail-ring 1.8s ease-out infinite; }
.ail-label { font-size: 14px; line-height: 1; }
.ail-mono { font-family: var(--visual-mono, ui-monospace, monospace); }
.ail-send { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 9px; background: var(--s-text-primary); }

@media (prefers-reduced-motion: reduce) {
  .ail-body[data-playing="true"] .ail-layer::before, .ail-char, .ail-pulse-ring, .ail-spin { animation: none; }
  .ail-body, .ail-card { transition: none; }
}
`;

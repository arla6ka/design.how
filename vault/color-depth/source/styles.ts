export const COLOR_DEPTH_CSS = `
.depth-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  font: 500 15px/1 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.01em;
  color: #fff;
  cursor: pointer;
  isolation: isolate;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  transition:
    filter 0.2s ease,
    box-shadow 0.2s ease;
}
.depth-label {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
}
.depth-btn.depth-icon {
  width: 44px;
  padding: 0;
  border-radius: 14px;
}
.depth-btn.depth-toggle {
  width: 76px;
  padding: 0;
  cursor: pointer;
}
.depth-knob {
  position: absolute;
  z-index: 3;
  top: 7px;
  left: 7px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background:
    radial-gradient(120% 120% at 50% 22%, rgba(255, 255, 255, var(--knob-hi, 0.55)), rgba(255, 255, 255, 0) 55%),
    radial-gradient(120% 120% at 50% 100%, rgba(0, 0, 0, var(--knob-lo, 0.22)), rgba(0, 0, 0, 0) 55%),
    var(--knob, #ffffff);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.35),
    0 2px 5px rgba(0, 0, 0, 0.22),
    inset 0 1px 1px rgba(255, 255, 255, var(--knob-hi, 0.5)),
    inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.depth-toggle[data-on="true"] .depth-knob {
  transform: translateX(32px);
}
.depth-toggle[data-on="false"] {
  filter: saturate(0.6) brightness(0.94);
}
.depth-inset,
.depth-satin,
.depth-metal,
.depth-glass {
  --knob: #2a2f3a;
  --knob-hi: 0.14;
  --knob-lo: 0.08;
}
.depth-btn::before,
.depth-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 1;
  pointer-events: none;
}
.depth-glossy {
  overflow: hidden;
  background: linear-gradient(180deg, #ffb347 0%, #e06c1f 100%);
  box-shadow:
    inset 0 -1px 4.1px 0.5px rgba(255, 224, 160, 0.55),
    inset 0 0 4px 0 rgb(255, 234, 200),
    inset 0 -36px 14.2px -28px rgba(180, 80, 20, 0.5),
    0 3px 8px rgba(200, 96, 30, 0.35);
  text-shadow: 0 1px 2px rgba(90, 40, 0, 0.5);
}
.depth-glossy::after {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  top: -5px;
  height: 28px;
  border-radius: 500px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0), #fff);
  filter: blur(1px);
  opacity: 0.7;
  transition: opacity 0.3s ease, top 0.3s ease;
  z-index: 1;
}
.depth-glossy:hover::after {
  opacity: 0.9;
  top: -3px;
}
.depth-glow {
  color: #fdeaff;
  text-shadow: 0 1px 2px rgba(40, 0, 48, 0.55);
  background: linear-gradient(180deg, #2a0a45 0%, #a01fd0 100%);
  box-shadow:
    inset 0 -1.5px 2px 0 #d67bff,
    inset 0 0 10px 0 #b01ffb,
    inset 0 0 8px 0 #b01ffb,
    0 2px 6px rgba(140, 20, 200, 0.35);
}
.depth-glow::before {
  opacity: 0;
  transition: opacity 0.2s ease;
  background: linear-gradient(180deg, #45108a 9%, #c31ffb 100%);
  box-shadow:
    inset 0 -0.5px 1px 0 #ff8cf0,
    inset 0 -1px 3px 0 #ff8cf0,
    inset 0 -1.5px 5px 0 #ff9ce8,
    inset 0 0 12px 0 #d155ff,
    inset 0 0 10px 0 #d155ff;
}
.depth-glow:hover::before {
  opacity: 1;
}
.depth-metal {
  --pointer-x: 50%;
  color: #1c2230;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
  overflow: hidden;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.05) 0px,
      rgba(0, 0, 0, 0.04) 1px,
      rgba(255, 255, 255, 0.05) 2px
    ),
    linear-gradient(180deg, #f4f6f9 0%, #c3cad6 48%, #aab2c0 52%, #d3d9e2 100%);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 1px 0 rgba(30, 38, 56, 0.35),
    inset 0 0 0 1px rgba(255, 255, 255, 0.25),
    0 3px 8px rgba(30, 38, 56, 0.28);
}
.depth-metal::after {
  opacity: 0.85;
  background: radial-gradient(
    120% 140% at var(--pointer-x, 50%) -20%,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 255, 255, 0.25) 18%,
    rgba(255, 255, 255, 0) 42%
  );
  transition: opacity 0.3s ease, background 0.12s linear;
}
.depth-metal:hover::after {
  opacity: 1;
}
.depth-layered {
  overflow: hidden;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 40%,
      rgba(0, 0, 0, 0.12) 100%
    ),
    rgba(0, 0, 0, 0.55);
}
.depth-layered::before {
  opacity: 0.1;
  background: linear-gradient(180deg, #fff 0%, rgba(255, 255, 255, 0) 60%);
  transition: opacity 0.2s ease;
}
.depth-layered:hover::before {
  opacity: 0.15;
}
.depth-layered:active::before {
  opacity: 0;
  transition-duration: 0.05s;
}
.depth-layered::after {
  opacity: 1;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.16),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.14);
}
.depth-inset {
  color: #5b6473;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
  background: linear-gradient(180deg, #dfe3ea 0%, #eef1f6 100%);
  box-shadow:
    inset 0 3px 4px -1px rgba(60, 70, 90, 0.5),
    inset 0 6px 10px -6px rgba(60, 70, 90, 0.45),
    inset 0 -2px 2px -1px rgba(255, 255, 255, 0.95),
    inset 0 0 0 1px rgba(60, 70, 90, 0.12),
    0 1px 0 0 rgba(255, 255, 255, 0.9);
}
.depth-inset:hover {
  transform: none;
  box-shadow:
    inset 0 4px 6px -1px rgba(60, 70, 90, 0.58),
    inset 0 8px 12px -6px rgba(60, 70, 90, 0.5),
    inset 0 -2px 2px -1px rgba(255, 255, 255, 1),
    inset 0 0 0 1px rgba(60, 70, 90, 0.16),
    0 1px 0 0 rgba(255, 255, 255, 0.9);
}
.depth-inset:active {
  box-shadow:
    inset 0 1px 2px 0 rgba(60, 70, 90, 0.4),
    inset 0 0 0 1px rgba(60, 70, 90, 0.12);
}
.depth-glass {
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
  -webkit-backdrop-filter: blur(2px) saturate(1.5) brightness(1.05);
  backdrop-filter: blur(2px) saturate(1.5) brightness(1.05);
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.18),
    0 4px 24px rgba(0, 0, 0, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.4);
}
@supports (backdrop-filter: url(#liquid-glass-filter)) or
  (-webkit-backdrop-filter: url(#liquid-glass-filter)) {
  .depth-glass {
    -webkit-backdrop-filter: url(#liquid-glass-filter) saturate(1.5) brightness(1.05);
    backdrop-filter: url(#liquid-glass-filter) saturate(1.5) brightness(1.05);
  }
}
.depth-glass::before {
  opacity: 1;
  padding: 1px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.1) 45%,
    transparent 100%
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
.depth-glass::after {
  opacity: 0.8;
  inset: 2px;
  border-radius: inherit;
  background:
    linear-gradient(to right, transparent 10%, rgba(255, 255, 255, 0.6) 50%, transparent 90%)
      top / 100% 1px no-repeat,
    linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
}
.depth-glass:hover {
  box-shadow:
    0 12px 40px rgba(31, 38, 135, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.25),
    0 6px 30px rgba(0, 0, 0, 0.08),
    inset 0 2px 2px rgba(255, 255, 255, 0.5);
}
.depth-foil {
  --foil-shift: 0%;
  --glare-x: 50%;
  --glare-y: 50%;
  --pointer-x: 50%;
  --pointer-y: 50%;
  --shine-angle: 135deg;
  color: #14202e;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  overflow: hidden;
  background: linear-gradient(135deg, #eee 0%, #dcdcdc 40%, #c9c9c9 72%, #e8e8e8 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.7),
    inset 0 -2px 4px rgba(60, 70, 90, 0.3),
    0 3px 10px rgba(30, 38, 56, 0.3);
}
.depth-foil-l {
  position: absolute;
  inset: -48%;
  z-index: 1;
  background-repeat: no-repeat;
  pointer-events: none;
}
.depth-foil-base {
  background: linear-gradient(
    112deg,
    transparent 22%,
    rgba(0, 220, 255, 0.4) 30%,
    rgba(80, 255, 190, 0.34) 36%,
    rgba(190, 255, 80, 0.26) 41%,
    rgba(255, 230, 70, 0.24) 47%,
    rgba(255, 70, 180, 0.36) 55%,
    rgba(150, 90, 255, 0.36) 63%,
    rgba(60, 120, 255, 0.3) 70%,
    transparent 80%
  );
  background-size: 240% 100%;
  filter: saturate(1.3) contrast(1.25);
  animation: depth-foil-drift 7s ease-in-out infinite alternate;
}
.depth-foil-film {
  background:
    radial-gradient(ellipse at 20% 30%, rgba(255, 70, 180, 0.34) 0%, transparent 48%),
    radial-gradient(ellipse at 70% 20%, rgba(0, 220, 255, 0.34) 0%, transparent 52%),
    radial-gradient(ellipse at 78% 74%, rgba(80, 255, 190, 0.34) 0%, transparent 56%);
  background-size: 150% 150%, 160% 160%, 145% 145%;
  filter: blur(0.4px) saturate(1.4);
  mix-blend-mode: screen;
  opacity: 0.7;
  animation: depth-foil-drift 9s ease-in-out infinite alternate-reverse;
}
@keyframes depth-foil-drift {
  from {
    background-position: 0% center;
  }
  to {
    background-position: 100% center;
  }
}
@media (prefers-reduced-motion: reduce) {
  .depth-foil-base,
  .depth-foil-film {
    animation: none;
  }
}
.depth-foil-pearl {
  z-index: 2;
  inset: 0;
  background: radial-gradient(
    120% 120% at var(--glare-x, 50%) var(--glare-y, 50%),
    rgba(230, 238, 245, 0.6) 0%,
    rgba(205, 217, 226, 0.2) 26%,
    transparent 58%
  );
  mix-blend-mode: soft-light;
  opacity: 0.95;
  transition: background 0.12s linear;
}
.depth-foil-shine {
  z-index: 4;
  inset: 0;
  background: linear-gradient(
    var(--shine-angle, 120deg),
    transparent 30%,
    rgba(226, 235, 242, 0.5) 48%,
    rgba(0, 124, 255, 0.1) 58%,
    rgba(255, 0, 147, 0.1) 66%,
    transparent 82%
  );
  background-size: 200% 100%;
  background-position: calc(var(--pointer-x, 50%)) center;
  filter: blur(0.25px);
  mix-blend-mode: screen;
  opacity: 0.6;
  transition: background-position 0.12s linear;
}
.depth-foil-glare {
  z-index: 5;
  inset: 0;
  background: radial-gradient(
    circle at var(--glare-x, 50%) var(--glare-y, 50%),
    rgba(230, 238, 245, 0.55) 0%,
    rgba(205, 218, 228, 0.16) 10%,
    transparent 38%
  );
  mix-blend-mode: screen;
  opacity: 0.5;
  transition: background 0.12s linear;
}
@media (prefers-reduced-motion: reduce) {
  .depth-foil-l {
    transition: none;
  }
}
.depth-tube {
  --tube: #35f0ff;
  color: #eafeff;
  background:
    linear-gradient(180deg, rgba(53, 240, 255, 0) 55%, color-mix(in srgb, var(--tube) 12%, transparent) 100%),
    #0b1016;
  text-shadow: 0 0 5px color-mix(in srgb, var(--tube) 55%, transparent);
}
.depth-tube::before {
  opacity: 1;
  box-shadow:
    inset 0 0 0 1px var(--tube),
    inset 0 0 2px 0 color-mix(in srgb, var(--tube) 45%, transparent);
  transition: box-shadow 0.25s ease;
}
.depth-tube:hover::before {
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--tube) 55%, #fff),
    inset 0 0 4px 0 color-mix(in srgb, var(--tube) 60%, transparent),
    0 0 4px -2px color-mix(in srgb, var(--tube) 50%, transparent);
}
.depth-duotone {
  background: linear-gradient(180deg, #ff8a4b 0%, #f2612f 100%);
  color: #fff;
  text-shadow: 0 1px 0 rgba(140, 50, 10, 0.6);
  box-shadow:
    inset 0 1px 0 rgba(255, 220, 190, 0.9),
    0 1px 0 #c9481c,
    0 2px 0 #c9481c,
    0 3px 0 #b23f18,
    0 4px 0 #b23f18,
    0 5px 0 #9c3714,
    0 6px 0 #9c3714,
    0 8px 8px rgba(120, 40, 10, 0.35);
  transition:
    transform 0.12s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.12s ease;
}
.depth-duotone:hover {
  transform: translateY(-1px);
}
.depth-duotone:active {
  transform: translateY(5px);
  box-shadow:
    inset 0 1px 0 rgba(255, 220, 190, 0.9),
    0 1px 0 #b23f18,
    0 2px 4px rgba(120, 40, 10, 0.35);
}
.depth-satin {
  color: #6a4a86;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
  background:
    radial-gradient(
      120% 140% at 50% 38%,
      rgba(255, 255, 255, 0.5) 0%,
      rgba(255, 255, 255, 0) 55%
    ),
    radial-gradient(
      130% 130% at 50% 100%,
      rgba(150, 120, 200, 0.22) 0%,
      rgba(150, 120, 200, 0) 60%
    ),
    #e7dcfb;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.45),
    0 6px 18px -6px rgba(160, 130, 210, 0.4);
  transition:
    filter 0.25s ease,
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.depth-satin:hover {
  filter: brightness(1.03);
}
.depth-satin:active {
  box-shadow:
    inset 0 2px 6px 0 rgba(150, 120, 200, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
`;

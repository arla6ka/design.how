export const HOLO_CSS = `
.holo-text p { margin: 0; }
.holo-card {
  position: relative;
  container-type: inline-size;
  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  border-radius: 22px;
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(16, 22, 40, 0.14),
    0 18px 40px -18px rgba(16, 22, 40, 0.4);
  will-change: transform;
}
.holo-card > * {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
.holo-body {
  background-image: var(--body-grad);
}
.holo-pattern,
.holo-pattern--lit {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27120%27%20height%3D%27120%27%20viewBox%3D%270%200%20120%20120%27%3E%20%3Cg%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-width%3D%273%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%20%3Cpath%20d%3D%27M14%2026c-6-7.5-1-15.5%204.8-14.2%202.8.6%204.4%203%205.1%204.6%201-1.7%202.9-4%206-3.8%206.3.4%208.8%209%201.4%2015-3.3%202.7-6.4%204.6-8%206-1.7-1.5-5.5-4.6-9.3-7.6z%27%20transform%3D%27rotate%28-10%2025%2022%29%27%2F%3E%20%3Cpath%20d%3D%27M74%2018c-5.2-6.6-.6-13.6%204.6-12.3%202.5.6%203.9%202.7%204.5%204.2.9-1.5%202.7-3.5%205.4-3.2%205.6.6%207.6%208%20.9%2013.2-3%202.3-5.7%204-7.1%205.2-1.5-1.3-5-4-8.3-7.1z%27%20transform%3D%27rotate%2814%2084%2015%29%27%2F%3E%20%3Cpath%20d%3D%27M44%2066c-7-8.6-1.4-17.8%205.4-16.2%203.2.7%205%203.4%205.8%205.2%201.1-1.9%203.3-4.5%206.8-4.3%207.2.5%2010%2010.3%201.6%2017.2-3.8%203.1-7.3%205.3-9.1%206.9-1.9-1.7-6.3-5.3-10.5-8.8z%27%20transform%3D%27rotate%28-5%2055%2060%29%27%2F%3E%20%3Cpath%20d%3D%27M96%2074c-5.6-6.9-1-14.2%204.4-12.9%202.6.6%204%202.9%204.7%204.4%201-1.6%202.8-3.7%205.5-3.4%205.8.6%208%208.4%201.1%2013.8-3.1%202.4-5.9%204.2-7.3%205.4-1.6-1.3-5.2-4.2-8.4-7.3z%27%20transform%3D%27rotate%288%20105%2070%29%27%2F%3E%20%3Cpath%20d%3D%27M18%2096c-6.4-7.9-1.2-16.2%205-14.7%202.9.7%204.6%203.2%205.3%204.8%201.1-1.7%203.1-4.1%206.2-3.8%206.6.5%209.1%209.4%201.3%2015.7-3.5%202.8-6.7%204.8-8.4%206.2-1.8-1.6-5.8-4.9-9.4-8.2z%27%20transform%3D%27rotate%28-14%2029%2092%29%27%2F%3E%20%3C%2Fg%3E%3C%2Fsvg%3E");
  background-size: 21% auto;
  background-repeat: repeat;
  opacity: var(--reveal, 0);
}
.holo-pattern {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27120%27%20height%3D%27120%27%20viewBox%3D%270%200%20120%20120%27%3E%20%3Cg%20fill%3D%27none%27%20stroke%3D%27%23571034%27%20stroke-width%3D%273%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%20%3Cpath%20d%3D%27M14%2026c-6-7.5-1-15.5%204.8-14.2%202.8.6%204.4%203%205.1%204.6%201-1.7%202.9-4%206-3.8%206.3.4%208.8%209%201.4%2015-3.3%202.7-6.4%204.6-8%206-1.7-1.5-5.5-4.6-9.3-7.6z%27%20transform%3D%27rotate%28-10%2025%2022%29%27%2F%3E%20%3Cpath%20d%3D%27M74%2018c-5.2-6.6-.6-13.6%204.6-12.3%202.5.6%203.9%202.7%204.5%204.2.9-1.5%202.7-3.5%205.4-3.2%205.6.6%207.6%208%20.9%2013.2-3%202.3-5.7%204-7.1%205.2-1.5-1.3-5-4-8.3-7.1z%27%20transform%3D%27rotate%2814%2084%2015%29%27%2F%3E%20%3Cpath%20d%3D%27M44%2066c-7-8.6-1.4-17.8%205.4-16.2%203.2.7%205%203.4%205.8%205.2%201.1-1.9%203.3-4.5%206.8-4.3%207.2.5%2010%2010.3%201.6%2017.2-3.8%203.1-7.3%205.3-9.1%206.9-1.9-1.7-6.3-5.3-10.5-8.8z%27%20transform%3D%27rotate%28-5%2055%2060%29%27%2F%3E%20%3Cpath%20d%3D%27M96%2074c-5.6-6.9-1-14.2%204.4-12.9%202.6.6%204%202.9%204.7%204.4%201-1.6%202.8-3.7%205.5-3.4%205.8.6%208%208.4%201.1%2013.8-3.1%202.4-5.9%204.2-7.3%205.4-1.6-1.3-5.2-4.2-8.4-7.3z%27%20transform%3D%27rotate%288%20105%2070%29%27%2F%3E%20%3Cpath%20d%3D%27M18%2096c-6.4-7.9-1.2-16.2%205-14.7%202.9.7%204.6%203.2%205.3%204.8%201.1-1.7%203.1-4.1%206.2-3.8%206.6.5%209.1%209.4%201.3%2015.7-3.5%202.8-6.7%204.8-8.4%206.2-1.8-1.6-5.8-4.9-9.4-8.2z%27%20transform%3D%27rotate%28-14%2029%2092%29%27%2F%3E%20%3C%2Fg%3E%3C%2Fsvg%3E");
  mix-blend-mode: multiply;
  mask-image:
    radial-gradient(
      ellipse 82% 96% at var(--reveal-x, 50%) var(--reveal-y, 50%),
      #000 0%,
      rgba(0, 0, 0, 0.8) 38%,
      transparent 76%
    ),
    linear-gradient(
      var(--reveal-angle, 90deg),
      #000 12%,
      rgba(0, 0, 0, 0.5) 46%,
      transparent 62%
    );
  -webkit-mask-image:
    radial-gradient(
      ellipse 82% 96% at var(--reveal-x, 50%) var(--reveal-y, 50%),
      #000 0%,
      rgba(0, 0, 0, 0.8) 38%,
      transparent 76%
    ),
    linear-gradient(
      var(--reveal-angle, 90deg),
      #000 12%,
      rgba(0, 0, 0, 0.5) 46%,
      transparent 62%
    );
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
.holo-pattern--lit {
  mix-blend-mode: screen;
  opacity: calc(var(--reveal, 0) * 0.85);
  mask-image:
    radial-gradient(
      ellipse 82% 96% at var(--reveal-x, 50%) var(--reveal-y, 50%),
      #000 0%,
      rgba(0, 0, 0, 0.8) 38%,
      transparent 76%
    ),
    linear-gradient(
      var(--reveal-angle, 90deg),
      transparent 38%,
      rgba(0, 0, 0, 0.5) 54%,
      #000 88%
    );
  -webkit-mask-image:
    radial-gradient(
      ellipse 82% 96% at var(--reveal-x, 50%) var(--reveal-y, 50%),
      #000 0%,
      rgba(0, 0, 0, 0.8) 38%,
      transparent 76%
    ),
    linear-gradient(
      var(--reveal-angle, 90deg),
      transparent 38%,
      rgba(0, 0, 0, 0.5) 54%,
      #000 88%
    );
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
.holo-foil,
.holo-foil--b,
.holo-foil--c {
  background-repeat: repeat;
}
.holo-foil {
  background-image: var(--l1-img, none);
  background-size: var(--l1-size, 400% 400%);
  background-position: var(--l1-x, 50%) var(--l1-y, 50%);
  background-blend-mode: var(--l1-bgblend, normal);
  mix-blend-mode: var(--l1-blend, overlay);
  filter: var(--l1-filter, none);
  opacity: var(--l1-o, 0);
}
.holo-foil--b {
  background-image: var(--l2-img, none);
  background-size: var(--l2-size, 300% 300%);
  background-position: var(--l2-x, 50%) var(--l2-y, 50%);
  background-blend-mode: var(--l2-bgblend, normal);
  mix-blend-mode: var(--l2-blend, overlay);
  filter: var(--l2-filter, none);
  opacity: var(--l2-o, 0);
}
.holo-foil--c {
  background-image: var(--l3-img, none);
  background-size: var(--l3-size, 200% 200%);
  background-position: var(--l3-x, 50%) var(--l3-y, 50%);
  background-blend-mode: var(--l3-bgblend, normal);
  mix-blend-mode: var(--l3-blend, overlay);
  filter: var(--l3-filter, none);
  opacity: var(--l3-o, 0);
}
[data-holo-lite] .holo-foil--c {
  opacity: calc(var(--l3-o, 0) * 0.5);
}
.holo-glare {
  background-image: radial-gradient(
    farthest-corner circle at var(--gx, 50%) var(--gy, 50%),
    hsla(0, 0%, 100%, 0.75) 10%,
    hsla(0, 0%, 100%, 0.55) 20%,
    hsla(0, 0%, 0%, 0.5) 120%
  );
  mix-blend-mode: overlay;
  opacity: calc(var(--glare-o, 0.55) * (0.93 + var(--breath, 0.5) * 0.07));
}
.holo-sheen {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, calc(var(--edge-t, 0) * 0.55 + 0.1)),
    inset 0 -1px 0 rgba(255, 255, 255, calc(var(--edge-b, 0) * 0.5 + 0.06)),
    inset 1px 0 0 rgba(255, 255, 255, calc(var(--edge-l, 0) * 0.5 + 0.06)),
    inset -1px 0 0 rgba(255, 255, 255, calc(var(--edge-r, 0) * 0.5 + 0.06)),
      inset 0 -2px 4px rgba(90, 20, 55, calc(var(--edge-t, 0) * 0.09)),
    inset 0 2px 4px rgba(90, 20, 55, calc(var(--edge-b, 0) * 0.09)),
    inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}
.holo-spot {
  background: radial-gradient(
    ellipse 130% 110% at var(--gx, 50%) var(--gy, 50%),
    rgba(255, 255, 255, 0.34) 0%,
    rgba(255, 244, 252, 0.14) 38%,
    transparent 74%
  );
  mix-blend-mode: soft-light;
  opacity: calc(var(--spot, 0) * 0.55);
}
.holo-smear {
  background: linear-gradient(
    var(--smear-angle, 0deg),
    transparent 26%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 74%
  );
  background-size: 260% 260%;
  background-position: var(--gx, 50%) var(--gy, 50%);
  mix-blend-mode: soft-light;
  opacity: calc(var(--smear, 0) * 0.3);
}
.holo-noise {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23p)' opacity='.5'/%3E%3C/svg%3E");
  background-size: 26% auto;
  mix-blend-mode: overlay;
  opacity: 0.14;
}
.holo-content {
  z-index: 2;
  isolation: isolate;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4%;
  padding: 7% 7% 6%;
  color: #6b1a3d;
}
.holo-text {
  min-width: 0;
}
.holo-name,
.holo-since {
  font-family: var(--visual-sans, system-ui, sans-serif);
  font-weight: 600;
}
.holo-name {
  font-size: clamp(13px, 4.2cqw, 34px);
  line-height: 1.15;
  letter-spacing: -0.015em;
  text-shadow:
    var(--emboss-x, 0) var(--emboss-y, 0) 0 rgba(255, 255, 255, 0.34),
    calc(var(--emboss-x, 0) * -1) calc(var(--emboss-y, 0) * -1) 1px
      rgba(110, 30, 70, 0.17);
}
.holo-since {
  margin-top: 0.2em;
  font-size: clamp(10px, 2.7cqw, 22px);
  font-weight: 600;
  line-height: 1.25;
  color: rgba(107, 26, 61, 0.72);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}
.holo-tile {
  position: relative;
  flex: none;
  align-self: flex-end;
  width: 27%;
  aspect-ratio: 0.86;
  border-radius: 14px;
  overflow: hidden;
  background: var(--tile-dark, #8e3a63);
  box-shadow:
    calc(var(--emboss-x, 0) * -1.5) calc(var(--emboss-y, 0) * -1.5 + 2px) 3px
      rgba(120, 40, 80, 0.18),
    calc(var(--emboss-x, 0) * -3) calc(var(--emboss-y, 0) * -3 + 8px) 18px -8px
      rgba(120, 40, 80, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transform: translate(
    calc(var(--emboss-x, 0) * -1.1),
    calc(var(--emboss-y, 0) * -1.1)
  );
}
.holo-tile > * {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.holo-tile__photo,
.holo-tile__photo--neg {
  background-image: var(--tile-src);
  background-repeat: no-repeat;
  background-size: 132%;
  background-position: var(--tile-x, 50%) 32%;
}
.holo-tile__photo {
  filter: grayscale(1) contrast(1.18) brightness(1.16);
}
.holo-tile__photo--neg {
  filter: grayscale(1) contrast(1.42) brightness(0.92) invert(1)
    sepia(0.55) hue-rotate(var(--tile-hue, 190deg)) saturate(2.1);
  mask-image: linear-gradient(
    var(--tile-sweep-angle, 90deg),
    rgba(0, 0, 0, 1) calc(var(--tile-invert, 0) * 210% - 78%),
    rgba(0, 0, 0, 0.98) calc(var(--tile-invert, 0) * 210% - 64%),
    rgba(0, 0, 0, 0.91) calc(var(--tile-invert, 0) * 210% - 50%),
    rgba(0, 0, 0, 0.75) calc(var(--tile-invert, 0) * 210% - 36%),
    rgba(0, 0, 0, 0.5) calc(var(--tile-invert, 0) * 210% - 22%),
    rgba(0, 0, 0, 0.25) calc(var(--tile-invert, 0) * 210% - 8%),
    rgba(0, 0, 0, 0.09) calc(var(--tile-invert, 0) * 210% + 6%),
    rgba(0, 0, 0, 0.02) calc(var(--tile-invert, 0) * 210% + 20%),
    transparent calc(var(--tile-invert, 0) * 210% + 34%)
  );
  -webkit-mask-image: linear-gradient(
    var(--tile-sweep-angle, 90deg),
    rgba(0, 0, 0, 1) calc(var(--tile-invert, 0) * 210% - 78%),
    rgba(0, 0, 0, 0.98) calc(var(--tile-invert, 0) * 210% - 64%),
    rgba(0, 0, 0, 0.91) calc(var(--tile-invert, 0) * 210% - 50%),
    rgba(0, 0, 0, 0.75) calc(var(--tile-invert, 0) * 210% - 36%),
    rgba(0, 0, 0, 0.5) calc(var(--tile-invert, 0) * 210% - 22%),
    rgba(0, 0, 0, 0.25) calc(var(--tile-invert, 0) * 210% - 8%),
    rgba(0, 0, 0, 0.09) calc(var(--tile-invert, 0) * 210% + 6%),
    rgba(0, 0, 0, 0.02) calc(var(--tile-invert, 0) * 210% + 20%),
    transparent calc(var(--tile-invert, 0) * 210% + 34%)
  );
  opacity: 0.94;
}
.holo-tile__grain {
  background-image:
    repeating-linear-gradient(
      63deg,
      rgba(255, 255, 255, 0.16) 0px,
      rgba(255, 255, 255, 0) 1px,
      rgba(0, 0, 0, 0.13) 2px,
      rgba(255, 255, 255, 0) 3px
    ),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='90' height='90' filter='url(%23g)' opacity='.55'/%3E%3C/svg%3E");
  background-size:
    auto,
    42% auto;
  mix-blend-mode: overlay;
  opacity: 0.34;
}
.holo-tile__wear {
  background-image: repeating-linear-gradient(
    28deg,
    transparent 0px,
    transparent 9px,
    rgba(255, 255, 255, 0.09) 9px,
    rgba(255, 255, 255, 0.09) 10px,
    transparent 10px,
    transparent 23px,
    rgba(255, 255, 255, 0.05) 23px,
    rgba(255, 255, 255, 0.05) 24px,
    transparent 24px,
    transparent 51px
  );
  mix-blend-mode: soft-light;
  opacity: calc(0.28 + var(--tile-invert, 0) * 0.4);
}
.holo-tile__vignette {
  background: radial-gradient(
    ellipse 78% 74% at 50% 42%,
    transparent 40%,
    rgba(80, 30, 60, 0.16) 78%,
    rgba(80, 30, 60, 0.34) 100%
  );
}
.holo-tile__duo {
  background-image: linear-gradient(
    160deg,
    var(--tile-dark, #d81f6a),
    var(--tile-light, #6bb8dd)
  );
  mix-blend-mode: color;
}
.holo-tile__tone {
  background-image: linear-gradient(
    160deg,
    var(--tile-dark, #d81f6a),
    var(--tile-light, #6bb8dd)
  );
  mix-blend-mode: soft-light;
  opacity: 0.9;
}
.holo-tile__foil {
  background-image: repeating-linear-gradient(
    98deg,
    hsl(2, 100%, 76%) 0%,
    hsl(53, 100%, 72%) 3%,
    hsl(93, 100%, 72%) 6%,
    hsl(176, 100%, 78%) 9%,
    hsl(228, 100%, 77%) 12%,
    hsl(283, 100%, 76%) 15%,
    hsl(2, 100%, 76%) 18%
  );
  background-size: 300% 300%;
  background-position: var(--tile-x, 50%) calc(var(--tile-invert, 0) * 100%);
  mix-blend-mode: color-dodge;
  filter: contrast(1.7) saturate(0.85);
  opacity: calc(var(--tile-invert, 0) * 0.5);
}
.holo-tile__gloss {
  background-image: radial-gradient(
    farthest-corner circle at var(--gx, 50%) var(--gy, 50%),
    rgba(255, 255, 255, 0.26) 0%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(60, 20, 45, 0.16) 110%
  );
  mix-blend-mode: soft-light;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
  border-radius: inherit;
}
@media (prefers-reduced-motion: reduce) {
  .holo-card {
    transform: none;
  }
}
`;

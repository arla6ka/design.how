// Colour depth (https://design.how/vault/color-depth), glass-filter.tsx.
// FIXED. Change the VARIABLE values in params instead (SHOWCASE, RECIPES, LABEL, GROUND, DESIGN_WIDTH).
const MAP =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">` +
      `<defs>` +
      `<linearGradient id="r" x1="0%" x2="100%"><stop offset="0%" stop-color="#f00"/><stop offset="50%" stop-color="#808080"/><stop offset="100%" stop-color="#0f0"/></linearGradient>` +
      `<linearGradient id="b" y1="0%" y2="100%"><stop offset="0%" stop-color="#00f"/><stop offset="50%" stop-color="#808080"/><stop offset="100%" stop-color="#ff0"/></linearGradient>` +
      `</defs>` +
      `<rect width="200" height="80" rx="40" fill="url(#r)"/>` +
      `<rect width="200" height="80" rx="40" fill="url(#b)" style="mix-blend-mode:overlay"/>` +
      `<rect x="14" y="14" width="172" height="52" rx="26" fill="#808080" style="filter:blur(14px)"/>` +
      `</svg>`,
  );

export function GlassFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      <defs>
        <filter id="liquid-glass-filter" colorInterpolationFilters="sRGB">
          <feImage href={MAP} x="0" y="0" width="100%" height="100%" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={-14}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispRed"
          />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="red"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={-13}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispGreen"
          />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="green"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={-12}
            xChannelSelector="R"
            yChannelSelector="G"
            result="dispBlue"
          />
          <feColorMatrix
            in="dispBlue"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="blue"
          />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur in="output" stdDeviation="0.4" />
        </filter>
      </defs>
    </svg>
  );
}

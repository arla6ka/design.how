// Ghosty reveal (https://design.how/vault/ghosty-reveal), mask.ts.
// FIXED. Change the VARIABLE values in params instead (IMAGES, SLOTS, MASK_SCALE, DURATION, HOLD, EASING, DIRECTION).
const svg = (x2: number, y2: number) => {
  const body = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' preserveAspectRatio='none'>`
    + `<defs><linearGradient id='g' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='${x2 * 200}' y2='${y2 * 200}'>`
    + `<stop offset='0.25' stop-color='#fff' stop-opacity='0'/><stop offset='0.4' stop-color='#fff' stop-opacity='0.3'/>`
    + `<stop offset='0.55' stop-color='#fff' stop-opacity='0.78'/><stop offset='0.67' stop-color='#fff' stop-opacity='1'/></linearGradient>`
    + `<filter id='f' x='-20%' y='-20%' width='140%' height='140%'><feTurbulence type='fractalNoise' baseFrequency='0.035' numOctaves='3' seed='4'/>`
    + `<feDisplacementMap in='SourceGraphic' scale='26' xChannelSelector='R' yChannelSelector='G'/></filter></defs>`
    + `<rect x='-40' y='-40' width='280' height='280' fill='url(#g)' filter='url(#f)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(body)}`;
};

export const MASK = svg(0, 1);
export const MASK_H = svg(1, 0);

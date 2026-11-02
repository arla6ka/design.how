const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'>`
  + `<defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3b4a6b'/><stop offset='0.55' stop-color='#d9a27a'/><stop offset='1' stop-color='#f3dcc0'/></linearGradient>`
  + `<radialGradient id='u' cx='0.5' cy='0.5' r='0.5'><stop offset='0' stop-color='#fff8e8'/><stop offset='0.6' stop-color='#ffe2a8'/><stop offset='1' stop-color='#ffe2a8' stop-opacity='0'/></radialGradient>`
  + `<linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a7b4c4'/><stop offset='1' stop-color='#2c3346'/></linearGradient></defs>`
  + `<rect width='300' height='300' fill='url(#s)'/>`
  + `<circle cx='182' cy='150' r='64' fill='url(#u)'/><circle cx='182' cy='150' r='30' fill='#fffaf0'/>`
  + `<path d='M0 190 L58 128 L96 160 L150 104 L214 172 L250 146 L300 182 L300 300 L0 300 Z' fill='#5a5470'/>`
  + `<path d='M0 214 L40 186 L86 206 L132 172 L190 210 L240 188 L300 214 L300 300 L0 300 Z' fill='#2f2c3d'/>`
  + `<rect y='228' width='300' height='72' fill='url(#w)'/>`
  + `<path d='M150 232 h64 M164 246 h40 M172 262 h22' stroke='#fff3d6' stroke-width='3' stroke-linecap='round' opacity='0.7'/>`
  + `</svg>`;

export const TILE_IMAGE = `data:image/svg+xml,${encodeURIComponent(svg)}`;

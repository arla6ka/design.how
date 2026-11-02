export const PULSE_MS = 1600;
export const FADE_OUT_MS = 160;
export const MORPH_MS = 380;
export const HANDOVER_AT = PULSE_MS + 120;
export const SETTLED_MS = 260;
export const MASK_SETTLE_MS = 90;
export const GAP_MS = HANDOVER_AT - PULSE_MS + FADE_OUT_MS + MORPH_MS + 80 + SETTLED_MS;

export type MaskStop = {color: string; stop: number};

export const RIM_STOPS: MaskStop[] = [
  {color: '#000', stop: 54},
  {color: 'transparent', stop: 126},
  {color: 'transparent', stop: 333},
  {color: 'rgba(0,0,0,0.10)', stop: 347},
  {color: '#000', stop: 360},
];

export const RIM_LAYERS: {strokeWidth: number; blur: number; alpha: number; ring?: number}[] = [
  {strokeWidth: 0, blur: 0, alpha: 1, ring: 1},
  {strokeWidth: 4, blur: 4, alpha: 0.3},
  {strokeWidth: 8, blur: 8, alpha: 0.2},
  {strokeWidth: 16, blur: 12, alpha: 0.1},
  {strokeWidth: 20, blur: 20, alpha: 0.32},
];

export const ARC_MIN = 90;
export const ARC_MAX = 190;
export const STILL_ANCHOR = 220;
export const STILL_ARC = 150;

export const FACE = '#ffffff';
export const FACE_DARK = '#1e1e1e';

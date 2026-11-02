// Vector editor (https://design.how/vault/vector-editor), params.ts.
// VARIABLE: SHAPE, VIEW_BOX, SHAPE_W, PAD, FRAME, GROUND. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
import type { FrameStyle } from './selection-frame';

export const SHAPE = 'M88.0 18.5C107.8 18.5 117.4 35.0 129.0 46.0C140.6 57.1 162.0 65.1 162.0 85.0C162.0 104.9 144.2 114.9 131.8 126.6C119.4 138.4 108.4 153.4 88.0 153.4C67.6 153.4 59.6 133.3 48.4 122.6C37.2 112.0 12.0 105.4 12.0 85.0C12.0 64.6 33.6 56.1 45.6 44.7C57.6 33.3 68.2 18.5 88.0 18.5ZM262.0 12.0L282.0 62.5L336.2 65.9L294.3 100.5L307.8 153.1L262.0 124.0L216.2 153.1L229.7 100.5L187.8 65.9L242.0 62.5ZM402 26L458 26C476.7 26 492 41.3 492 60L492 116C492 134.7 476.7 150 458 150L402 150C383.3 150 368 134.7 368 116L368 60C368 41.3 383.3 26 402 26Z';
export const VIEW_BOX: [number, number, number, number] = [0, 0, 520, 170];

export const SHAPE_W = 300;
export const PAD = 40;

export const FRAME: FrameStyle = {
  accent: '#0d99ff',
  handleSize: 8,
  handleFill: '#ffffff',
  borderWidth: 1,
  showHandles: true,
  showBadge: true,
  badgeBg: '#0d99ff',
  badgeText: '#ffffff',
};

export const GROUND = '#f7f7f7';

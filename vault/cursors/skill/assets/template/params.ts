// Cursors (https://design.how/vault/cursors), params.ts.
// VARIABLE: CURSORS, WORD, GROUND, INK, WORD_FONT, FONT_VAR, DESIGN_WIDTH. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
import type { CursorDef } from './engine';

export const CURSORS: CursorDef[] = [
  {name: 'Wexel', color: '#4b3bff'},
  {name: 'Orbo', color: '#e5484d'},
  {name: 'Visitor', color: '#12a150'},
];

export const WORD = 'Multiplayer';

export const GROUND = '#fcfcfc';
export const INK = '#1b1b1b';

export const FONT_VAR = '--visual-sans';
export const WORD_FONT = 'ui-serif, Georgia, "Times New Roman", serif';

export const DESIGN_WIDTH = 600;

export const STILL_T = 1.1;

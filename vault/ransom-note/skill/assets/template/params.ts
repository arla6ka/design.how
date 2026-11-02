// Ransom note (https://design.how/vault/ransom-note), params.ts.
// VARIABLE: PHRASES, JITTER, PAPERS, FACES, REVEAL_HOLD, GROUND. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export const PHRASES = ['stay weird', 'make stuff', 'be kind', 'trust me', 'keep going', 'no rules'];

export const REVEAL_HOLD = 1800;
export const CROSS_OVERLAP = 150;

export const JITTER = {rot: 8, dy: 0.06, scale: 0.12, gap: 0.05};

export const PAPERS: {paper: string; inks: string[]}[] = [
  {paper: '#f4efe3', inks: ['#111111', '#c8102e', '#1d3fa8']},
  {paper: '#111111', inks: ['#ffffff', '#ffd400', '#ff4fa3']},
  {paper: '#ffd400', inks: ['#111111', '#c8102e']},
  {paper: '#e83a2f', inks: ['#ffffff', '#111111']},
  {paper: '#1d3fa8', inks: ['#ffffff', '#ffd400']},
  {paper: '#ff8fc4', inks: ['#111111', '#ffffff']},
  {paper: '#2fa36b', inks: ['#ffffff', '#111111']},
  {paper: '#ffffff', inks: ['#111111', '#e83a2f', '#2fa36b']},
  {paper: '#cfc6b4', inks: ['#111111', '#7a1f12']},
  {paper: '#7b61ff', inks: ['#ffffff', '#111111']},
];

export const FACES: {family: string; weights: number[]; italic?: boolean}[] = [
  {family: 'var(--visual-serif, Georgia, serif)', weights: [700]},
  {family: 'var(--visual-display, Georgia, serif)', weights: [500]},
  {family: 'var(--visual-grotesk, system-ui, sans-serif)', weights: [400, 700]},
  {family: 'var(--visual-sans, system-ui, sans-serif)', weights: [500, 600]},
  {family: 'var(--visual-wide, system-ui, sans-serif)', weights: [500]},
  {family: 'var(--visual-mono, ui-monospace, monospace)', weights: [700]},
  {family: 'var(--visual-pixel, ui-monospace, monospace)', weights: [400]},
  {family: 'Georgia, "Times New Roman", serif', weights: [400, 700], italic: true},
];

export const GROUND = '#fcfcfc';

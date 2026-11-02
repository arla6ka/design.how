// Hover video button (https://design.how/vault/hover-video), params.ts.
// VARIABLE: BUTTONS, PROMPTS, DESIGN_WIDTH. Change these freely. Everything else here is FIXED: it is the effect, so changing it makes a different visual.
export type ButtonConfig = {
  label: string;
  video: string;
  reverseVideo?: string;
  variant: 'light' | 'blue' | 'dark';
  width: number;
  speed: number;
  alpha: boolean;
  offsetX: number;
  offsetY: number;
  boxBg: string;
};

export const BUTTONS: ButtonConfig[] = [
  {label: 'boop me', video: '/buttons/boop', reverseVideo: '/buttons/boop-rev', variant: 'light', width: 140, speed: 5.9, alpha: true, offsetX: 1, offsetY: 0, boxBg: '#FFFEFB'},
  {label: 'do not press', video: '/buttons/do-not-press', reverseVideo: '/buttons/do-not-press-rev', variant: 'blue', width: 139, speed: 2.69, alpha: true, offsetX: 1, offsetY: 1, boxBg: '#FAFCFC'},
  {label: 'touch grass', video: '/buttons/grass', reverseVideo: '/buttons/grass-rev', variant: 'dark', width: 137, speed: 2.2, alpha: true, offsetX: 1, offsetY: 0, boxBg: '#FBFFFA'},
];

export const PROMPTS = [
  'A seamless 2-3 second loop, no cuts. The words "boop me" inflate into glossy, puffy 3D balloon letters: soft cream-white pillowy shapes with dark espresso-brown lettering, like blown-up plastic, with a gentle squish-and-breathe motion. Warm soft studio lighting, soft reflections. Plain solid pure-white (#ffffff) background edge to edge, nothing behind the letters. Centered, nothing cut off, loops cleanly. Muted.',
  'A seamless 2-3 second loop, no cuts. The words "do not press" wobble in as glossy, see-through jelly letters with a cool blue tint (cyan #3CB2CD), thick and refractive like clear gummy, with bright specular highlights, jiggling and settling with a soft bounce. Plain solid pure-white (#ffffff) background edge to edge. Centered, nothing cut off, loops cleanly. Muted.',
  'A seamless 2-3 second loop, no cuts. The words "touch grass" inflate into glossy, puffy 3D balloon letters in vivid fresh green, a gradient from bright lime #7CCF4B down to deep grass green #2E8B3D, soft and bouncy like blown-up plastic, with a lively squish-and-breathe wobble and a wet, high-gloss sheen with crisp white speculars and a faint dewy drop or two. Soft studio lighting, soft reflections, a subtle contact shadow. Plain solid pure-white (#ffffff) background edge to edge, nothing behind the letters. Centered, nothing cut off, loops cleanly. Muted.',
];

export const DESIGN_WIDTH = 600;

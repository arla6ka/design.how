// Smooth corners (https://design.how/vault/squircle), styles.ts.
// FIXED. Change the VARIABLE values in params instead (radiusFor, SMOOTHING, EXPONENT, BUTTON_W, CONTROL_H, LABEL, GROUND, FONT_VAR).
export const PRESS_CSS = `
.squircle-press { transition: transform 150ms, filter 150ms; }
.squircle-press:active { transform: scale(0.97); filter: brightness(1.04); }
@media (prefers-reduced-motion: reduce) { .squircle-press { transition: none; } .squircle-press:active { transform: none; } }
`;

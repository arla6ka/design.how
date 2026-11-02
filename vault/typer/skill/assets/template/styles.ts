// Typer (https://design.how/vault/typer), styles.ts.
// FIXED. Change the VARIABLE values in params instead (LINES, PRESETS, REPLAY_MS, STAGGER, SIZE_CQW, SIZE_MIN, FONT_VAR).
export const TYPER_CSS = `
[data-typer] {
  --typer-fg: #1b1b1b;
  --typer-bg: #fcfcfc;
  --typer-accent: #12a150;
  --typer-accent-ink: #fcfcfc;
  --typer-radius: 5px;
}
[data-typer][data-typer-type="initial"] {
  opacity: 0;
}
[data-typer] .word {
  white-space: pre;
}
[data-typer] .word .char {
  box-sizing: content-box;
  display: inline-block;
  color: var(--typer-fg);
  background: transparent;
  transition: none;
}
[data-typer] .word .char.charInit {
  color: transparent;
}
[data-typer] .word .char.charFill {
  color: var(--typer-bg);
  background: var(--typer-fg);
  border-radius: var(--typer-radius);
}
[data-typer] .word .char.charFill:has(+ .charFill) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charFill + .charFill {
  border-radius: 0;
}
[data-typer] .word .char.charFill + .charFill:last-child,
[data-typer] .word .char.charFill + .charFill:has(+ :not(.charFill)) {
  border-radius: 0 var(--typer-radius) var(--typer-radius) 0;
}
[data-typer] .word .char.charInverse {
  color: var(--typer-bg);
  background: var(--typer-fg);
}
[data-typer] .word .char.charAccent {
  color: var(--typer-accent);
  background: transparent;
}
[data-typer] .word .char.charAccentInverse {
  color: var(--typer-accent-ink);
  background: var(--typer-accent);
  border-radius: var(--typer-radius);
}
[data-typer] .word .char.charAccentInverse:has(+ .charAccentInverse) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charAccentInverse + .charAccentInverse {
  border-radius: 0;
}
[data-typer] .word .char.charAccentInverse + .charAccentInverse:last-child,
[data-typer]
  .word
  .char.charAccentInverse
  + .charAccentInverse:has(+ :not(.charAccentInverse)) {
  border-radius: 0 var(--typer-radius) var(--typer-radius) 0;
}
[data-typer] .word .char.charAccentFill {
  color: var(--typer-accent);
  background: var(--typer-accent);
}
[data-typer] .word .char.charBorder {
  position: relative;
  color: var(--typer-fg);
}
[data-typer] .word .char.charBorder::after {
  content: "";
  display: inline-block;
  position: absolute;
  inset: 0;
  border: 1px solid var(--typer-accent);
  border-radius: var(--typer-radius);
}
[data-typer] .word .char.charBorder:has(+ .charBorder)::after {
  border-right: 1px solid transparent;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
[data-typer] .word .char.charBorder + .charBorder::after {
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  border-radius: 0;
}
[data-typer] .word .char.charBorder + .charBorder:last-child::after,
[data-typer] .word .char.charBorder + .charBorder:has(+ :not(.charBorder))::after {
  border-left: 1px solid transparent;
  border-right: 1px solid var(--typer-accent);
  border-radius: 0 var(--typer-radius) var(--typer-radius) 0;
}
@media (prefers-reduced-motion: reduce) {
  [data-typer][data-typer-type="initial"] {
    opacity: 1;
  }
  [data-typer] .word .char.charInit {
    color: var(--typer-fg);
  }
}
`;

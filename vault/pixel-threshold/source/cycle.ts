export const SEQUENCE = ["pixel", "insert coin", "player one", "game over"];

export const FINE = 150;
export const COARSE = 55;

export const HOLD_MS = 1900;
export const COLLAPSE_MS = 240;
export const RESOLVE_MS = 380;

export type Phase = "hold" | "collapse" | "resolve";

export function cellsAt(phase: Phase, t: number): number {
  if (phase === "hold") return FINE;
  const k = phase === "collapse" ? easeIn(t) : 1 - easeOut(t);
  return Math.round(FINE * Math.pow(COARSE / FINE, k));
}

function easeIn(t: number): number {
  return t * t;
}

function easeOut(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

export function phaseMs(phase: Phase): number {
  return phase === "hold"
    ? HOLD_MS
    : phase === "collapse"
      ? COLLAPSE_MS
      : RESOLVE_MS;
}

export function nextPhase(phase: Phase): Phase {
  return phase === "hold" ? "collapse" : phase === "collapse" ? "resolve" : "hold";
}

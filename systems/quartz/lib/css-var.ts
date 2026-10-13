export function cssNumber(el: Element | null | undefined, name: string, fallback: number): number {
  if (!el || typeof getComputedStyle === 'undefined') return fallback;
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const match = raw.match(/^(-?[\d.]+)(px|ms|s)?$/);
  if (!match) return fallback;
  const n = parseFloat(match[1]);
  return match[2] === 's' ? n * 1000 : n;
}

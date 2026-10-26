export const LINT_IGNORES = ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/out/**', '**/components/ui/**'];

export const RAW = /(?<![A-Za-z0-9&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/;

export const NAMED = new Set(['white', 'black', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'silver', 'navy', 'teal', 'aqua',
  'cyan', 'magenta', 'fuchsia', 'lime', 'maroon', 'olive', 'brown', 'gold', 'indigo', 'violet', 'coral', 'salmon', 'tomato', 'crimson', 'beige', 'ivory',
  'khaki', 'lavender', 'turquoise', 'tan', 'whitesmoke', 'gainsboro', 'lightgray', 'lightgrey', 'darkgray', 'darkgrey', 'dimgray', 'slategray']);

export function handPickedValue(base, inside) {
  const tracks = inside.replace(/minmax\(0,/g, 'minmax(').replace(/(?<![A-Za-z0-9.])\d+(?:\.\d+)?fr(?![a-z0-9])/g, '');
  if (/^transition-\[/.test(base) || !/\d/.test(tracks)) return false;
  if (/^-?\d+(?:\.\d+)?(?:%|d?vh|svh|lvh|d?vw|svw|lvw)$/.test(inside)) return false;
  return !/var\(--|--spacing\(/.test(inside);
}

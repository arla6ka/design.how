import {cn} from './utils';

export const popupClass = cn(
  'relative isolate z-(--z-popover) max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-panel bg-raised p-1 text-fg shadow-menu outline-none',
  'transition-[opacity,scale] duration-(--dur-base) ease-(--ease-out)',
  'data-starting-style:scale-(--scale-enter) data-starting-style:opacity-0 data-ending-style:scale-(--scale-enter) data-ending-style:opacity-0 data-ending-style:duration-(--dur-fast) data-ending-style:ease-(--ease-in)',
);

export const itemClass = cn(
  'relative flex min-h-9 w-full cursor-default items-center gap-2 rounded-md py-1.5 ps-3 pe-8 text-sm outline-none select-none',
  'data-highlighted:bg-surface-2 data-selected:font-medium focus-visible:-outline-offset-2',
  'data-disabled:cursor-not-allowed data-disabled:text-fg-disabled [&_svg]:pointer-events-none [&_svg]:shrink-0',
);

export const groupLabelClass = 'px-3 pt-2 pb-1 text-xs font-medium text-fg-3';
export const separatorClass = '-mx-1 my-1 h-px bg-line';

'use client';

import {useSyncExternalStore} from 'react';
import {cn} from '../lib/utils';

type Platform = 'mac' | 'other';

const subscribe = () => () => {};
const detect = (): Platform => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? 'mac' : 'other');
function usePlatform(): Platform | 'unknown' {
  return useSyncExternalStore<Platform | 'unknown'>(subscribe, detect, () => 'unknown');
}

const names: Record<string, {mac: string; other: string; spoken: {mac: string; other: string}}> = {
  mod: {mac: '⌘', other: 'Ctrl', spoken: {mac: 'Command', other: 'Control'}},
  cmd: {mac: '⌘', other: 'Win', spoken: {mac: 'Command', other: 'Windows'}},
  ctrl: {mac: '⌃', other: 'Ctrl', spoken: {mac: 'Control', other: 'Control'}},
  shift: {mac: '⇧', other: 'Shift', spoken: {mac: 'Shift', other: 'Shift'}},
  alt: {mac: '⌥', other: 'Alt', spoken: {mac: 'Option', other: 'Alt'}},
  enter: {mac: '↵', other: 'Enter', spoken: {mac: 'Return', other: 'Enter'}},
  esc: {mac: 'Esc', other: 'Esc', spoken: {mac: 'Escape', other: 'Escape'}},
  backspace: {mac: '⌫', other: 'Backspace', spoken: {mac: 'Delete', other: 'Backspace'}},
  tab: {mac: '⇥', other: 'Tab', spoken: {mac: 'Tab', other: 'Tab'}},
  space: {mac: 'Space', other: 'Space', spoken: {mac: 'Space', other: 'Space'}},
  up: {mac: '↑', other: '↑', spoken: {mac: 'Up arrow', other: 'Up arrow'}},
  down: {mac: '↓', other: '↓', spoken: {mac: 'Down arrow', other: 'Down arrow'}},
  left: {mac: '←', other: '←', spoken: {mac: 'Left arrow', other: 'Left arrow'}},
  right: {mac: '→', other: '→', spoken: {mac: 'Right arrow', other: 'Right arrow'}},
};

function shortcut(keys: string, platform: Platform) {
  return keys.split('+').map(k => k.trim()).filter(Boolean).map(k => {
    const known = names[k.toLowerCase()];
    const shown = known ? known[platform] : k.length === 1 ? k.toUpperCase() : k;
    return {shown, spoken: known ? known.spoken[platform] : shown};
  });
}

const kbdClass = cn(
  'frame [--frame-radius:var(--radius-inner)] pointer-events-none inline-flex min-h-(--tag) w-fit max-w-full min-w-(--tag) items-center justify-center gap-1 bg-page px-1 text-center type-tag text-text-2 select-none [overflow-wrap:anywhere] [--frame-color:var(--line-control)]',
  'in-data-[slot=tooltip-content]:text-text-1 in-data-[slot=text-hint]:text-text-1 in-data-[slot=sidebar-tooltip]:text-text-1',
  'forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1',
  '[&_svg]:size-3 [&_svg]:shrink-0',
);

type KbdProps = React.ComponentProps<'kbd'> & {
  keys?: string;
};

function Kbd({className, keys, children, ...props}: KbdProps) {
  if (keys !== undefined) return <KbdShortcut keys={keys} className={className} {...props}/>;
  return <kbd data-slot="kbd" className={cn(kbdClass, className)} {...props}>{children}</kbd>;
}

function KbdShortcut({keys, className, ...props}: Omit<KbdProps, 'children'> & {keys: string}) {
  const platform = usePlatform();
  const parts = shortcut(keys, platform === 'unknown' ? 'other' : platform);
  const neutral = platform === 'unknown' ? shortcut(keys, 'mac').map((m, i) => m.shown === parts[i].shown) : null;
  return <kbd
    data-slot="kbd-group"
    data-platform={platform === 'unknown' ? undefined : platform}
    className={cn('relative inline-flex max-w-full flex-wrap items-center gap-1 font-[inherit]', className)}
    {...props}
  >
    {parts.map((p, i) => neutral && !neutral[i]
      ? <kbd key={i} data-slot="kbd" data-placeholder="" aria-hidden className={kbdClass}/>
      : <kbd key={i} data-slot="kbd" aria-hidden className={kbdClass}>{p.shown}</kbd>)}
    {platform !== 'unknown' && <span className="sr-only">{parts.map(p => p.spoken).join(' ')}</span>}
  </kbd>;
}

function KbdGroup({className, ...props}: React.ComponentProps<'kbd'>) {
  return <kbd data-slot="kbd-group" className={cn('inline-flex max-w-full flex-wrap items-center gap-1 font-[inherit]', className)} {...props}/>;
}

export {Kbd, KbdGroup, shortcut, type KbdProps};

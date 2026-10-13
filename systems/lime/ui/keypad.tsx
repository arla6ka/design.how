'use client';

import {Delete, Icon} from '../icon';
import {cn} from '../lib/utils';

type KeypadProps = Omit<React.ComponentProps<'div'>, 'onChange' | 'children'> & {
  value: string;
  onValueChange?: (value: string) => void;
  decimal?: boolean;
  maxDigits?: number;
  disabled?: boolean;
};

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function pressKey(value: string, key: string, {decimal = true, maxDigits = 7}: {decimal?: boolean; maxDigits?: number} = {}) {
  if (key === 'delete') return value.slice(0, -1);
  const [whole, cents] = value.split('.');
  if (key === '.') {
    if (!decimal || value.includes('.')) return value;
    return value === '' ? '0.' : `${value}.`;
  }
  if (!/^\d$/.test(key)) return value;
  if (cents !== undefined) return cents.length >= 2 ? value : value + key;
  if (whole === '0') return key;
  if (whole.length >= maxDigits) return value;
  return value + key;
}

const keyClass = cn(
  'flex h-14 items-center justify-center rounded-panel text-2xl font-medium text-fg tabular-nums select-none',
  'transition-[background-color,scale] duration-(--dur-instant) [-webkit-tap-highlight-color:transparent]',
  'hover:bg-surface-2 active:bg-surface-3 active:scale-(--scale-press)',
  'disabled:cursor-not-allowed disabled:text-fg-disabled disabled:hover:bg-transparent',
);

function Keypad({value, onValueChange, decimal = true, maxDigits = 7, disabled, className, onKeyDown, ...props}: KeypadProps) {
  const press = (key: string) => {
    const next = pressKey(value, key, {decimal, maxDigits});
    if (next !== value) onValueChange?.(next);
  };
  return (
    <div
      data-slot="keypad"
      role="group"
      aria-label="Amount keypad"
      onKeyDown={e => {
        onKeyDown?.(e);
        if (disabled || e.metaKey || e.ctrlKey || e.altKey) return;
        const key = e.key === 'Backspace' ? 'delete' : e.key === ',' ? '.' : e.key;
        if (key === 'delete' || key === '.' || /^\d$/.test(key)) { e.preventDefault(); press(key); }
      }}
      className={cn('grid w-full max-w-80 grid-cols-3 gap-1', className)}
      {...props}
    >
      {DIGITS.map(d => <button key={d} type="button" data-slot="keypad-key" disabled={disabled} onClick={() => press(d)} className={keyClass}>{d}</button>)}
      {decimal
        ? <button type="button" data-slot="keypad-key" disabled={disabled} onClick={() => press('.')} aria-label="Decimal point" className={keyClass}>.</button>
        : <span aria-hidden="true"/>}
      <button type="button" data-slot="keypad-key" disabled={disabled} onClick={() => press('0')} className={keyClass}>0</button>
      <button type="button" data-slot="keypad-key" disabled={disabled} onClick={() => press('delete')} aria-label="Delete" className={keyClass}>
        <Icon icon={Delete} size={24}/>
      </button>
    </div>
  );
}

export {Keypad, pressKey, type KeypadProps};

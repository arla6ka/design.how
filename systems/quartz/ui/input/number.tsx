'use client';

import {useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref} from 'react';
import {NumberField as NumberFieldPrimitive} from '@base-ui/react/number-field';
import {Icon, Subtract, Add} from '../../icon';
import {cn, mergeRefs} from '../../lib/utils';
import {InputPrefix, InputRoot, splitBox, useControllable, useOff, type BoxProps} from './parts';

type NumberModeProps = Omit<BoxProps, 'ref'> & {
  mode: 'number';
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number | 'auto';
  unit?: ReactNode;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  ref?: Ref<HTMLInputElement>;
};

function autoStep(value: number | null, direction: 1 | -1) {
  const v = value ?? 0;
  const shrinking = direction === -1 ? v > 0 : v < 0;
  const magnitude = Math.abs(v) - (shrinking ? 1e-9 : 0);
  if (magnitude < 10) return 1;
  return 10 ** (Math.floor(Math.log10(magnitude)) - 1);
}

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

function stepHint(down: number, up: number, fmt: Intl.NumberFormat) {
  return down === up ? `±${fmt.format(up)}` : `−${fmt.format(down)} +${fmt.format(up)}`;
}

function readNumber(text: string, locale: string, percent: boolean) {
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.1).find(p => p.type === 'decimal')?.value ?? '.';
  const cleaned = text.replace(/[\u2212\u2012-\u2014]/g, '-').split('').filter((c, i) => /\d/.test(c) || c === decimal || (c === '-' && !text.slice(0, i).replace(/\s/g, ''))).join('').replace(decimal, '.');
  const n = Number(cleaned);
  if (!cleaned || cleaned === '-' || Number.isNaN(n)) return null;
  return percent ? n / 100 : n;
}

function writeText(el: HTMLInputElement, text: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, text);
  el.dispatchEvent(new Event('input', {bubbles: true}));
}

function NumberMode({
  mode: _mode, size = 'default', prefix, className, controlClassName, value, defaultValue = null, onValueChange, min, max, step = 1, unit, format,
  locale = 'en-US', name, id, disabled: disabledProp, readOnly, required, placeholder, 'aria-label': ariaLabel, 'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid, ref, ...all
}: NumberModeProps) {
  const disabled = useOff(disabledProp);
  const {box} = splitBox(all as Record<string, unknown>);
  const [current, set] = useControllable<number | null>(value, defaultValue, onValueChange);
  const auto = step === 'auto';
  const stepFor = (direction: 1 | -1) => auto ? autoStep(current, direction) : step;
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const fmt = new Intl.NumberFormat(locale, format);

  const latest = useRef(current);
  latest.current = current;
  const inputEl = useRef<HTMLInputElement | null>(null);
  const setInputEl = useMemo(() => mergeRefs<HTMLInputElement>(inputEl, ref), [ref]);
  const percent = format?.style === 'percent';

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 128));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const nudge = (direction: 1 | -1, multiplier = 1) => {
    if (disabled || readOnly) return false;
    const el = inputEl.current;
    let now = latest.current;
    if (el) {
      const shown = now === null ? '' : fmt.format(now);
      if (el.value !== shown) now = readNumber(el.value, locale, percent);
    }
    const s = (auto ? autoStep(now, direction) : step as number) * multiplier;
    const base = now ?? (direction === 1 ? (min ?? 0) - s : (max ?? 0) + s);
    const next = clamp(Number((base + direction * s).toFixed(Math.max(decimals(s), decimals(base)))));
    if (next === now) return false;
    latest.current = next;
    set(next);
    if (el && document.activeElement === el) writeText(el, fmt.format(next));
    return true;
  };

  const repeat = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stopRepeat = () => { clearTimeout(repeat.current); repeat.current = undefined; };
  useEffect(() => stopRepeat, []);
  const hold = (direction: 1 | -1) => (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const multiplier = e.shiftKey ? 10 : 1;
    stopRepeat();
    if (!nudge(direction, multiplier)) return;
    const tick = () => { repeat.current = nudge(direction, multiplier) ? setTimeout(tick, 60) : undefined; };
    repeat.current = setTimeout(tick, 400);
    window.addEventListener('pointerup', stopRepeat, {once: true});
    window.addEventListener('pointercancel', stopRepeat, {once: true});
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement> & {preventBaseUIHandler?: () => void}) => {
    const keys: Record<string, [1 | -1, number]> = {ArrowUp: [1, 1], ArrowDown: [-1, 1], PageUp: [1, 10], PageDown: [-1, 10]};
    const hit = keys[e.key];
    if (!hit) return;
    e.preventDefault();
    e.preventBaseUIHandler?.();
    nudge(hit[0], e.shiftKey ? hit[1] * 10 : hit[1]);
  };

  const up = stepFor(1);
  const down = stepFor(-1);
  const digits = Math.max(2, current === null ? 0 : fmt.format(current).length) + 1;
  const atMax = max !== undefined && current !== null && current >= max;
  const atMin = min !== undefined && current !== null && current <= min;
  const stepper = 'group-data-compact/field-box:hidden flex shrink-0 items-center justify-center self-stretch rounded-none text-text-2 select-none hover:not-disabled:bg-hover hover:not-disabled:text-text-1 active:not-disabled:bg-pressed disabled:cursor-not-allowed disabled:text-text-disabled';
  const stepperSize = size === 'sm' ? 'w-(--control-sm)' : size === 'lg' ? 'w-(--control-lg)' : 'w-(--control)';
  const decCell = 'shadow-[inset_-1px_0_0_var(--line-row)] rtl:shadow-[inset_1px_0_0_var(--line-row)]';
  const incCell = 'rule-col';

  return <NumberFieldPrimitive.Root
    ref={rootRef}
    value={current}
    onValueChange={next => set(next)}
    min={min}
    max={max}
    step={auto ? 'any' : step}
    format={format}
    locale={locale}
    name={name}
    id={id}
    disabled={disabled}
    readOnly={readOnly}
    required={required}
    render={<InputRoot size={size} disabled={disabled} readOnly={readOnly} invalid={ariaInvalid} className={cn('gap-0 overflow-clip px-0', className)} data-mode="number" data-compact={compact || undefined} {...box}/>}
  >
    {prefix !== undefined && <InputPrefix className="ps-2">{prefix}</InputPrefix>}
    <button type="button" tabIndex={-1} data-slot="input-decrement" aria-label={`Decrease by ${fmt.format(down)}`} title={`−${fmt.format(down)}`} disabled={disabled || readOnly || atMin} onPointerDown={hold(-1)} onPointerLeave={stopRepeat} onClick={e => { if (e.detail === 0) nudge(-1, e.shiftKey ? 10 : 1); }} className={cn(stepper, stepperSize, decCell)}>
      <Icon icon={Subtract} size={16}/>
    </button>
    <span className="flex min-w-0 flex-auto items-center justify-center gap-1 self-stretch" style={{'--digits': `${digits}ch`} as CSSProperties}>
      {auto && <span
        data-slot="input-step"
        aria-hidden
        className="max-w-0 min-w-0 shrink overflow-hidden type-label-sm whitespace-nowrap text-text-3 opacity-0 transition-opacity duration-(--dur-fast) group-has-[[data-control]:focus-visible]/field-box:max-w-40 group-has-[[data-control]:focus-visible]/field-box:opacity-100 group-data-force-focus-visible/field-box:max-w-40 group-data-force-focus-visible/field-box:opacity-100"
      >{stepHint(down, up, fmt)}</span>}
      <NumberFieldPrimitive.Input
        ref={setInputEl}
        data-slot="input-control"
        data-control=""
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid || undefined}
        role="spinbutton"
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={current !== null && unit !== undefined && typeof unit === 'string' ? `${fmt.format(current)} ${unit}` : undefined}
        onKeyDown={onKeyDown}
        className={cn(
          'h-full w-auto min-w-(--digits) flex-1 field-sizing-content bg-transparent text-center type-label data text-inherit pointer-coarse:text-base placeholder:text-text-3 disabled:cursor-not-allowed',
          unit !== undefined && 'text-end',
          controlClassName,
        )}
      />
      {unit !== undefined && <span data-slot="input-unit" aria-hidden className="min-w-0 shrink overflow-hidden type-label whitespace-nowrap text-text-3 group-has-[[data-control]:disabled]/field-box:text-text-disabled">{unit}</span>}
    </span>
    <button type="button" tabIndex={-1} data-slot="input-increment" aria-label={`Increase by ${fmt.format(up)}`} title={`+${fmt.format(up)}`} disabled={disabled || readOnly || atMax} onPointerDown={hold(1)} onPointerLeave={stopRepeat} onClick={e => { if (e.detail === 0) nudge(1, e.shiftKey ? 10 : 1); }} className={cn(stepper, stepperSize, incCell)}>
      <Icon icon={Add} size={16}/>
    </button>
  </NumberFieldPrimitive.Root>;
}

export {NumberMode, autoStep, type NumberModeProps};

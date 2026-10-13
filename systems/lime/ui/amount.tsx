import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

type Affordability = 'unknown' | 'insufficient' | 'tight' | 'comfortable';

type FormatOptions = {currency?: string; compact?: boolean; signed?: boolean};

const MINUS = '−';

const UNAVAILABLE = 'Unavailable';

function toMoney(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

function formatAmount(raw: number, {currency = 'USD', compact, signed}: FormatOptions = {}) {
  const value = toMoney(raw);
  if (value === null) return UNAVAILABLE;
  const digits = compact ? {minimumFractionDigits: 0, maximumFractionDigits: 0} : {};
  const number = new Intl.NumberFormat('en-US', {style: 'currency', currency, ...digits}).format(Math.abs(value));
  if (value < 0) return `${MINUS}${number}`;
  return signed && value > 0 ? `+${number}` : number;
}

function spokenAmount(raw: number, {currency = 'USD', signed}: Pick<FormatOptions, 'currency' | 'signed'> = {}) {
  const value = toMoney(raw);
  if (value === null) return 'amount unavailable';
  const words = new Intl.NumberFormat('en-US', {style: 'currency', currency, currencyDisplay: 'name'}).format(Math.abs(value));
  if (value < 0) return `minus ${words}`;
  return signed && value > 0 ? `plus ${words}` : words;
}

function amountAffordability(raw: number, rawAvailable: number | null | undefined): Affordability {
  const value = toMoney(raw);
  const available = toMoney(rawAvailable);
  if (value === null || available === null) return 'unknown';
  const spend = value < 0 ? -value : 0;
  if (spend > available) return 'insufficient';
  if (spend > 0 && available - spend < spend * 0.2) return 'tight';
  return 'comfortable';
}

const amountVariants = cva('inline-flex shrink-0 items-center rounded-control font-medium whitespace-nowrap tabular-nums', {
  variants: {
    tone: {
      neutral: 'bg-surface-2 text-fg-2',
      accent: 'bg-accent-wash text-fg',
      warn: 'bg-warn-tint text-warn-text',
      danger: 'bg-danger-tint text-danger-text',
    },
    size: {
      sm: 'h-5 px-2 text-xs',
      md: 'h-6 px-2.5 text-xs',
      lg: 'h-7 px-3 text-sm',
    },
  },
  defaultVariants: {tone: 'neutral', size: 'md'},
});

type AmountProps = Omit<React.ComponentProps<'span'>, 'children'> & VariantProps<typeof amountVariants> & {
  value: number;
  currency?: string;
  available?: number | null;
  signed?: boolean;
  compact?: boolean;
  approximate?: boolean;
  atLeast?: boolean;
};

function Amount({value, currency = 'USD', available, signed, compact, approximate, atLeast, tone, size, className, ...props}: AmountProps) {
  const afford = amountAffordability(value, available);
  const resolved = tone ?? (afford === 'insufficient' ? 'danger' : afford === 'tight' ? 'warn' : 'neutral');
  const base = formatAmount(value, {currency, compact, signed});
  if (base === UNAVAILABLE) {
    return <span data-slot="amount" data-affordability={afford} className={cn(amountVariants({tone: tone ?? 'neutral', size}), className)} {...props}>{UNAVAILABLE}</span>;
  }
  const text = approximate ? `~${base}` : atLeast ? `${base}+` : base;
  const spoken = `${approximate ? 'about ' : atLeast ? 'at least ' : ''}${spokenAmount(value, {currency, signed})}${afford === 'insufficient' ? ', more than you have available' : ''}`;
  return (
    <span data-slot="amount" data-affordability={afford} className={cn(amountVariants({tone: resolved, size}), className)} {...props}>
      <span dir="ltr" aria-hidden="true">{text}</span>
      <span className="sr-only">{spoken}</span>
    </span>
  );
}

export {Amount, amountAffordability, formatAmount, spokenAmount, toMoney, amountVariants, type AmountProps, type Affordability};

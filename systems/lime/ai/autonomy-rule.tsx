'use client';

import {cn} from '../lib/utils';
import {Input} from '../ui/input';

type AutonomyRuleProps = Omit<React.ComponentProps<'div'>, 'children' | 'onChange'> & {
  before?: string;
  after?: string;
  value: string;
  onValueChange?: (value: string) => void;
  kind?: 'amount' | 'number';
  size?: 'sm' | 'inline';
  disabled?: boolean;
};

function AutonomyRule({before, after, value, onValueChange, kind = 'amount', size = 'sm', disabled, className, style, ...props}: AutonomyRuleProps) {
  const amount = kind === 'amount';
  const inline = size === 'inline';
  const label = [before, amount ? `$${value || '…'}` : value || '…', after].filter(Boolean).join(' ');
  return (
    <div
      data-slot="autonomy-rule"
      data-kind={kind}
      data-size={size}
      style={inline ? {'--autonomy-chars': Math.max(value.length, 1) + (amount ? 1 : 0), ...style} as React.CSSProperties : style}
      className={cn('flex min-w-0 items-center', inline ? 'gap-1.5' : 'gap-2 text-sm', disabled ? 'text-fg-disabled' : !inline && 'text-fg', className)}
      {...props}
    >
      {before && <span className="min-w-0 truncate">{before}</span>}
      <span className="relative flex shrink-0">
        {amount && <span aria-hidden="true" className={cn('pointer-events-none absolute inset-y-0 flex items-center', inline ? 'start-1.5' : 'start-2.5', disabled ? 'text-fg-disabled' : 'text-fg-3')}>$</span>}
        <Input
          size="sm"
          inputMode={amount ? 'decimal' : 'numeric'}
          aria-label={label}
          value={value}
          disabled={disabled}
          onValueChange={v => onValueChange?.(v.replace(amount ? /[^\d.]/g : /\D/g, ''))}
          className={cn(
            'font-medium tabular-nums',
            inline
              ? 'h-lh w-[calc(var(--autonomy-chars)*1ch+--spacing(3)+2px)] rounded-sm px-1.5 text-start text-[length:inherit] leading-[inherit] focus-visible:-outline-offset-2'
              : cn('text-center', amount ? 'w-16 ps-5' : 'w-12 px-2'),
            inline && amount && 'ps-[calc(1ch+--spacing(1.5))]',
          )}
        />
      </span>
      {after && <span className="shrink-0 whitespace-nowrap">{after}</span>}
    </div>
  );
}

export {AutonomyRule, type AutonomyRuleProps};

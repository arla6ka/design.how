import {cva, type VariantProps} from 'class-variance-authority';
import {Icon, Wallet} from '../icon';
import {cn} from '../lib/utils';
import {formatAmount, spokenAmount, toMoney} from './amount';

const balanceVariants = cva([
  'inline-flex h-(--control-sm) items-center gap-1.5 rounded-control px-3 text-sm font-medium whitespace-nowrap tabular-nums transition-[background-color,color,box-shadow,scale] duration-(--dur-instant)',
  'active:not-disabled:scale-(--scale-press) disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-fg-disabled',
], {
  variants: {
    low: {
      true: 'bg-warn-tint text-warn-text hover:not-disabled:inset-ring hover:not-disabled:inset-ring-warn',
      false: 'glow glow-accent glow-subtle bg-accent text-on-accent',
    },
  },
  defaultVariants: {low: false},
});

type BalanceProps = Omit<React.ComponentProps<'button'>, 'children'> & VariantProps<typeof balanceVariants> & {
  value: number;
  currency?: string;
  actionLabel?: string;
};

function Balance({value, currency = 'USD', low, actionLabel = 'Add money', className, ...props}: BalanceProps) {
  const isLow = Boolean(low) && toMoney(value) !== null;
  return (
    <button type="button" data-slot="balance" aria-label={`${spokenAmount(value, {currency})}${isLow ? ', running low' : ''}. ${actionLabel}`} className={cn(balanceVariants({low: isLow}), className)} {...props}>
      <Icon icon={Wallet} size={16}/>
      <span aria-hidden="true">{formatAmount(value, {currency})}</span>
      {isLow && <span aria-hidden="true" className="font-normal">left</span>}
    </button>
  );
}

export {Balance, balanceVariants, type BalanceProps};

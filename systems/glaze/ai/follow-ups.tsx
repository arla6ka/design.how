'use client';

import {cva} from 'class-variance-authority';
import {Icon, FollowUp} from '../icon';
import {cn} from '../lib/utils';

type FollowUpsLabels = {
  group?: string;
};

const defaultLabels: Required<FollowUpsLabels> = {group: 'Suggested follow-ups'};

const followUpVariants = cva(
  [
    'group/follow-up relative inline-flex min-w-0 cursor-pointer items-center text-start text-text-1 select-none [-webkit-tap-highlight-color:transparent]',
    'transition-[background-color,border-color,color,scale] duration-(--dur-state) ease-out',
    'disabled:cursor-not-allowed disabled:text-text-disabled',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      layout: {
        chips: [
          'h-(--control-sm) max-w-full rounded-pill border border-line-control bg-paper px-2.5 type-label-sm whitespace-nowrap focus-sm',
          'hover:not-disabled:border-line-focus active:not-disabled:scale-(--scale-press) active:duration-(--dur-press)',
          'disabled:border-line-faint forced-colors:border-[ButtonText]',
        ],
        rows: [
          'min-h-(--control) w-full items-start gap-2 rounded-tag px-2 py-1.5 type-body-sm focus-visible:focus-ring-inset',
          'hover:not-disabled:bg-hover active:not-disabled:bg-pressed',
          '[&_svg]:size-(--icon) [&_svg]:text-text-3 disabled:[&_svg]:text-text-disabled',
        ],
      },
    },
    defaultVariants: {layout: 'chips'},
  },
);

type FollowUpsProps = Omit<React.ComponentProps<'div'>, 'onSelect' | 'children'> & {
  suggestions: readonly string[];
  onSelect: (suggestion: string, index: number) => void;
  layout?: 'chips' | 'rows';
  max?: number;
  disabled?: boolean;
  labels?: FollowUpsLabels;
};

function FollowUps({suggestions, onSelect, layout = 'chips', max = 3, disabled, labels, className, ...props}: FollowUpsProps) {
  const words = {...defaultLabels, ...labels};
  const shown = suggestions.map(s => s.trim()).filter(Boolean).slice(0, max);
  if (!shown.length) return null;
  return <div
    data-slot="follow-ups"
    data-layout={layout}
    role="group"
    aria-label={words.group}
    className={cn('flex min-w-0', layout === 'chips' ? 'flex-wrap gap-1' : 'flex-col', className)}
    {...props}
  >
    {shown.map((text, index) => <button
      key={text}
      type="button"
      data-slot="follow-up"
      disabled={disabled}
      title={layout === 'chips' ? text : undefined}
      onClick={() => onSelect(text, index)}
      className={followUpVariants({layout})}
    >
      {layout === 'rows' && <span aria-hidden className="flex h-lh shrink-0 items-center"><Icon icon={FollowUp}/></span>}
      <span className={cn('min-w-0', layout === 'chips' ? 'truncate' : '[overflow-wrap:anywhere]')}>{text}</span>
    </button>)}
  </div>;
}

export {FollowUps, followUpVariants, type FollowUpsProps, type FollowUpsLabels};

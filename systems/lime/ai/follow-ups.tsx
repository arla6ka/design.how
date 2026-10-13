'use client';

import {cn} from '../lib/utils';

type FollowUpsLabels = {
  group?: string;
};

const defaultLabels: Required<FollowUpsLabels> = {group: 'Suggested follow ups'};

type FollowUpsProps = Omit<React.ComponentProps<'div'>, 'onSelect'> & {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  labels?: FollowUpsLabels;
};

function FollowUps({suggestions, onSelect, labels, className, ...props}: FollowUpsProps) {
  const words = {...defaultLabels, ...labels};
  if (!suggestions.length) return null;
  return (
    <div data-slot="follow-ups" role="group" aria-label={words.group} className={cn('flex flex-wrap gap-2', className)} {...props}>
      {suggestions.slice(0, 3).map(text => (
        <button
          key={text}
          type="button"
          data-slot="follow-up"
          onClick={() => onSelect(text)}
          className="inline-flex min-h-(--control-sm) max-w-full items-center rounded-panel border border-line-strong bg-page px-3 py-1 text-start text-sm text-fg transition-colors duration-(--dur-instant) hover:bg-surface"
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export {FollowUps, type FollowUpsProps, type FollowUpsLabels};

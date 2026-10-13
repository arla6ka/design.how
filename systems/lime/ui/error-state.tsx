'use client';

import {Icon, Renew, WarningFilled} from '../icon';
import {cn} from '../lib/utils';
import {Button} from './button';

type ErrorStateProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  title: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  retryLabel?: string;
  layout?: 'block' | 'inline';
};

function ErrorState({title, description, onRetry, retrying, retryLabel = 'Try again', layout = 'block', className, ...props}: ErrorStateProps) {
  const retry = onRetry && (
    <Button variant="secondary" size="sm" pending={!!retrying} icon={<Icon icon={Renew} size={16}/>} onClick={onRetry} className={layout === 'inline' ? 'shrink-0' : 'mt-1'}>
      {retryLabel}
    </Button>
  );
  if (layout === 'inline') {
    return (
      <div data-slot="error-state" data-layout="inline" role="status" className={cn('flex min-h-(--control-lg) w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2 py-2', className)} {...props}>
        <Icon icon={WarningFilled} size={16} className="shrink-0 text-danger-text"/>
        <div className="flex min-w-32 flex-1 flex-col">
          <p className="label text-fg">{title}</p>
          {description && <p className="text-sm text-fg-2">{description}</p>}
        </div>
        {retry}
      </div>
    );
  }
  return (
    <div data-slot="error-state" data-layout="block" role="status" className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)} {...props}>
      <div aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-danger-tint text-danger-text">
        <Icon icon={WarningFilled} size={20}/>
      </div>
      <p className="text-lg leading-tight font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-fg-2">{description}</p>}
      {retry}
    </div>
  );
}

export {ErrorState, type ErrorStateProps};

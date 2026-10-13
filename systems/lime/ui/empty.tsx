import {cn} from '../lib/utils';

function Empty({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="empty" className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)} {...props}/>;
}

function EmptyIcon({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="empty-icon" aria-hidden="true" className={cn('flex size-12 items-center justify-center rounded-full bg-surface text-fg-2', className)} {...props}/>;
}

function EmptyTitle({className, ...props}: React.ComponentProps<'h3'>) {
  return <h3 data-slot="empty-title" className={cn('text-lg leading-tight font-semibold', className)} {...props}/>;
}

function EmptyDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="empty-description" className={cn('max-w-sm text-sm text-fg-2', className)} {...props}/>;
}

function EmptyActions({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="empty-actions" className={cn('mt-1 flex flex-wrap items-center justify-center gap-2', className)} {...props}/>;
}

export {Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyActions};

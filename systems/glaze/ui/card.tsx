import {Children, isValidElement, type ReactNode} from 'react';
import {cn} from '../lib/utils';
import {Panel} from './panel';

function isPart(node: ReactNode, part: unknown) {
  return isValidElement(node) && node.type === part;
}

type CardProps = React.ComponentProps<'div'>;

function Card({className, children, ...props}: CardProps) {
  const parts = Children.toArray(children);
  const footer = parts.filter(part => isPart(part, CardFooter));
  const body = parts.filter(part => !isPart(part, CardFooter));
  const ownPanels = body.some(part => isPart(part, Panel));
  return <div
    data-slot="card"
    data-footer={footer.length ? '' : undefined}
    className={cn(
      'group/card shell relative text-text-1',
      '[&>[data-slot=panel]~[data-slot=panel]]:mt-(--shell-inset)',
      'has-[[data-slot=card-link]:focus-visible]:focus-ring',
      'forced-colors:border-[CanvasText]',
      className,
    )}
    {...props}
  >
    {ownPanels ? body : <div data-slot="card-panel" className="panel flex min-w-0 flex-col forced-colors:border-[CanvasText]">{body}</div>}
    {footer}
  </div>;
}

function CardHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="card-header"
    className={cn('grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 p-3 [&+[data-slot=card-content]:not([data-flush])]:pt-0', className)}
    {...props}
  />;
}

function CardTitle({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('col-start-1 min-w-0 type-label text-text-1 [overflow-wrap:anywhere]', className)} {...props}/>;
}

function CardDescription({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('col-start-1 min-w-0 max-w-(--measure-hint) type-body-sm text-text-2', className)} {...props}/>;
}

function CardAction({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('relative z-(--z-raised) col-start-2 row-span-2 row-start-1 -my-1 flex items-center gap-1 self-start', className)} {...props}/>;
}

type CardContentProps = React.ComponentProps<'div'> & {
  flush?: boolean;
};

function CardContent({className, flush, ...props}: CardContentProps) {
  return <div
    data-slot="card-content"
    data-flush={flush || undefined}
    className={cn(
      'flex min-w-0 flex-col gap-3 type-body-sm text-text-1',
      flush ? 'gap-0 not-first:border-t not-first:border-line-faint' : 'p-3',
      className,
    )}
    {...props}
  />;
}

function CardFooter({className, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="card-footer"
    className={cn('shell-foot relative z-(--z-raised) justify-end [&>[data-slot=card-meta]:first-child]:me-auto [&>[data-slot=card-meta]:last-child]:pe-3', className)}
    {...props}
  />;
}

function CardMeta({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="card-meta" className={cn('min-w-0 truncate type-caption text-text-2', className)} {...props}/>;
}

function CardLink({className, ...props}: React.ComponentProps<'a'>) {
  return <a
    data-slot="card-link"
    data-control=""
    className={cn('after:absolute after:inset-0 after:rounded-shell after:content-[""] hover:underline hover:decoration-1 hover:underline-offset-2', className)}
    {...props}
  />;
}

export {Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter, CardMeta, CardLink, type CardProps, type CardContentProps};

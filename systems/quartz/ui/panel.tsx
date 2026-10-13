import {cn} from '../lib/utils';
import {ButtonSize} from './button';

function Panel({className, ...props}: React.ComponentProps<'section'>) {
  return <section data-slot="panel" className={cn('relative flex min-w-0 flex-col overflow-hidden bg-(--surface-frame) text-text-1 frame forced-colors:outline forced-colors:outline-1', className)} {...props}/>;
}

function PanelHeader({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="panel-header" className={cn('frame-head', className)} {...props}/>;
}

function PanelTitle({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="panel-title" className={cn('min-w-0 truncate type-label text-text-1', className)} {...props}/>;
}

function PanelMeta({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="panel-meta" className={cn('shrink-0 type-label text-text-3 data', className)} {...props}/>;
}

function PanelAction({className, children, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="panel-action" className={cn('frame-head-action', className)} {...props}><ButtonSize size="xs">{children}</ButtonSize></div>;
}

function PanelBody({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="panel-body" className={cn('frame mx-1 mb-1 flex min-w-0 flex-col bg-page [--frame-color:var(--line-row)] [--frame-radius:calc(var(--radius-frame)-4px)] has-[+[data-slot=panel-footer]]:mb-0', className)} {...props}/>;
}

function PanelFooter({className, children, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="panel-footer" className={cn('frame-foot type-body-sm text-text-3 has-[button]:justify-end', className)} {...props}><ButtonSize size="sm">{children}</ButtonSize></div>;
}

export {Panel, PanelHeader, PanelTitle, PanelMeta, PanelAction, PanelBody, PanelFooter};

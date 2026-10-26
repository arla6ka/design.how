import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../lib/utils';

const frameVariants = cva('relative flex min-w-0 flex-col text-text-1 forced-colors:border-[CanvasText]', {
  variants: {
    variant: {
      frame: 'frame',
      panel: 'panel',
    },
  },
  defaultVariants: {variant: 'frame'},
});

type FrameProps = React.ComponentProps<'section'> & VariantProps<typeof frameVariants>;

function Frame({className, variant = 'frame', ...props}: FrameProps) {
  const v = variant ?? 'frame';
  return <section
    data-slot="frame"
    data-variant={v}
    className={cn(frameVariants({variant: v}), className)}
    {...props}
  />;
}

function FrameHeader({className, ...props}: React.ComponentProps<'header'>) {
  return <header data-slot="frame-header" className={cn('panel-head justify-between', className)} {...props}/>;
}

function FrameTitle({className, ...props}: React.ComponentProps<'h2'>) {
  return <h2 data-slot="frame-title" className={cn('me-auto min-w-0 truncate text-text-1 [&:has(+[data-slot=frame-value])]:me-0', className)} {...props}/>;
}

function FrameStatus({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="frame-status" className={cn('flex min-w-0 shrink-0 items-center', className)} {...props}/>;
}

type FrameValueProps = React.ComponentProps<'span'> & {
  meta?: boolean;
};

function FrameValue({className, meta = false, ...props}: FrameValueProps) {
  return <span data-slot={meta ? 'frame-header-meta' : 'frame-value'} className={cn('type-code-sm normal-case', meta ? 'shrink-0 text-text-2' : 'me-auto min-w-0 truncate text-text-1', className)} {...props}/>;
}

function FrameActions({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="frame-actions" className={cn('panel-head-actions', className)} {...props}/>;
}

type FrameBodyProps = React.ComponentProps<'div'> & {
  padding?: 'default' | 'none';
};

function FrameBody({className, padding = 'default', ...props}: FrameBodyProps) {
  return <div
    data-slot="frame-body"
    data-padding={padding}
    className={cn('flex min-w-0 flex-1 flex-col [[data-slot=frame-body]+&]:border-t [[data-slot=frame-body]+&]:border-line', padding === 'default' && 'gap-3 p-inset', className)}
    {...props}
  />;
}

function FrameDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="frame-description" className={cn('max-w-(--measure-hint) type-body-sm text-text-2', className)} {...props}/>;
}

function FrameFooter({className, ...props}: React.ComponentProps<'footer'>) {
  return <footer data-slot="frame-footer" className={cn('flex flex-wrap items-center justify-end gap-2 border-t border-line p-inset', className)} {...props}/>;
}

function FrameMeta({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="frame-meta" className={cn('me-auto min-w-0 truncate type-code-sm text-text-2', className)} {...props}/>;
}

export {Frame, FrameHeader, FrameTitle, FrameStatus, FrameValue, FrameActions, FrameBody, FrameDescription, FrameFooter, FrameMeta, frameVariants, type FrameProps, type FrameValueProps};

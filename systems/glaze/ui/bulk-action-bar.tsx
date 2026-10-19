'use client';

import * as React from 'react';
import {Toolbar as ToolbarPrimitive} from '@base-ui/react/toolbar';
import {Icon, Close} from '../icon';
import {cn, mergeClass} from '../lib/utils';
import {Button, type ButtonProps} from './button';

type BulkActionBarProps = Omit<ToolbarPrimitive.Root.Props, 'children'> & {
  count: number;
  noun?: [string, string];
  onClear?: () => void;
  position?: 'inline' | 'floating';
  children?: React.ReactNode;
};

function BulkActionBar({count, noun = ['item', 'items'], onClear, position = 'inline', className, children, onKeyDown, ...props}: BulkActionBarProps) {
  const label = `${count.toLocaleString('en-US')} ${count === 1 ? noun[0] : noun[1]} selected`;
  const [announcement, setAnnouncement] = React.useState('');
  const previous = React.useRef(count);
  React.useEffect(() => {
    if (count === previous.current) return;
    setAnnouncement(count === 0 ? 'Selection cleared' : label);
    previous.current = count;
  }, [count, label]);

  return <>
    <ToolbarPrimitive.Root
      data-slot="bulk-action-bar"
      data-position={position}
      aria-label={`Actions for ${label}`}
      hidden={count === 0}
      onKeyDown={event => {
        if (event.key === 'Escape' && onClear) { event.preventDefault(); onClear(); }
        onKeyDown?.(event);
      }}
      className={mergeClass([
        'flex h-(--control-lg) w-fit max-w-full min-w-0 items-center gap-1 rounded-pill border border-line bg-paper ps-4 pe-1 text-text-1',
        'forced-colors:border-[CanvasText]',
        'data-[position=floating]:fixed data-[position=floating]:inset-x-4 data-[position=floating]:bottom-6 data-[position=floating]:z-(--z-sticky) data-[position=floating]:mx-auto',
        count === 0 && 'hidden',
      ], className)}
      {...props}
    >
      <span data-slot="bulk-action-bar-count" className="shrink-0 type-label whitespace-nowrap"><span className="data">{count.toLocaleString('en-US')}</span> selected</span>
      <span aria-hidden className="mx-2 h-4 w-px shrink-0 bg-line"/>
      <div data-slot="bulk-action-bar-actions" className="-my-1 flex min-w-0 items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none]">{children}</div>
      {onClear && <ToolbarPrimitive.Button
        render={<Button variant="ghost" size="icon-sm"/>}
        aria-label="Clear selection"
        onClick={onClear}
        className="ms-1 shrink-0"
      ><Icon icon={Close} size={12}/></ToolbarPrimitive.Button>}
    </ToolbarPrimitive.Root>
    <span role="status" className="sr-only">{announcement}</span>
  </>;
}

type BulkActionProps = Omit<ButtonProps, 'size'> & {
  variant?: 'secondary' | 'primary' | 'destructive';
};

function BulkAction({variant = 'secondary', className, ...props}: BulkActionProps) {
  return <ToolbarPrimitive.Button
    data-slot="bulk-action"
    render={<Button variant={variant} size="sm"/>}
    className={mergeClass(cn('shrink-0'), className as string | undefined)}
    {...(props as ToolbarPrimitive.Button.Props)}
  />;
}

export {BulkActionBar, BulkAction, type BulkActionBarProps, type BulkActionProps};

'use client';

import {ScrollArea as ScrollAreaPrimitive} from '@base-ui/react/scroll-area';
import {cn, mergeClass} from '../lib/utils';

type ScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  orientation?: 'vertical' | 'horizontal' | 'both';
};

function ScrollArea({className, children, orientation = 'vertical', ...props}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root data-slot="scroll-area" className={mergeClass('relative overflow-hidden', className)} {...props}>
      <ScrollAreaPrimitive.Viewport data-slot="scroll-area-viewport" className="size-full rounded-[inherit] focus-visible:-outline-offset-2">
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== 'horizontal' && <ScrollBar orientation="vertical"/>}
      {orientation !== 'vertical' && <ScrollBar orientation="horizontal"/>}
      <ScrollAreaPrimitive.Corner/>
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({orientation}: {orientation: 'vertical' | 'horizontal'}) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none p-0.5 opacity-0 transition-opacity duration-(--dur-fast) select-none data-hovering:opacity-100 data-scrolling:opacity-100',
        orientation === 'vertical' ? 'w-2.5 flex-col' : 'h-2.5 flex-row',
      )}
    >
      <ScrollAreaPrimitive.Thumb data-slot="scroll-area-thumb" className="relative shrink-0 rounded-full bg-line-strong hover:bg-control"/>
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export {ScrollArea, type ScrollAreaProps};

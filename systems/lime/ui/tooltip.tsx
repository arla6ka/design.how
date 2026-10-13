'use client';

import {Tooltip as TooltipPrimitive} from '@base-ui/react/tooltip';
import {useLimePortal} from '../lib/portal';
import {mergeClass} from '../lib/utils';

function TooltipProvider({delay = 400, closeDelay = 0, ...props}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} closeDelay={closeDelay} {...props}/>;
}

function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props}/>;
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props}/>;
}

type TooltipContentProps = TooltipPrimitive.Popup.Props & Pick<TooltipPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset'>;

function TooltipContent({className, side = 'top', align = 'center', sideOffset = 6, ...props}: TooltipContentProps) {
  const container = useLimePortal();
  return (
    <TooltipPrimitive.Portal container={container}>
      <TooltipPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} collisionPadding={8} className="isolate z-(--z-popover)">
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={mergeClass([
            'max-w-64 origin-(--transform-origin) rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium text-fg-inverse break-words',
            'transition-[opacity,scale] duration-(--dur-fast) ease-out data-starting-style:scale-(--scale-enter) data-starting-style:opacity-0 data-ending-style:opacity-0 data-instant:duration-0',
          ], className)}
          {...props}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export {Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, type TooltipContentProps};

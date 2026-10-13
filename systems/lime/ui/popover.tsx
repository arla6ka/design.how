'use client';

import {Popover as PopoverPrimitive} from '@base-ui/react/popover';
import {useLimePortal} from '../lib/portal';
import {mergeClass} from '../lib/utils';

function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props}/>;
}

function PopoverTrigger(props: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props}/>;
}

type PopoverContentProps = PopoverPrimitive.Popup.Props & Pick<PopoverPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'alignOffset'>;

function PopoverContent({className, side = 'bottom', align = 'center', sideOffset = 8, alignOffset = 0, ...props}: PopoverContentProps) {
  const container = useLimePortal();
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset} collisionPadding={8} className="isolate z-(--z-popover)">
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={mergeClass([
            'flex w-72 max-w-(--available-width) origin-(--transform-origin) flex-col gap-3 rounded-panel bg-raised p-4 text-sm text-fg shadow-menu outline-none',
            'transition-[opacity,scale] duration-(--dur-base) ease-(--ease-out)',
            'data-starting-style:scale-(--scale-enter) data-starting-style:opacity-0 data-ending-style:scale-(--scale-enter) data-ending-style:opacity-0 data-ending-style:duration-(--dur-fast)',
          ], className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverTitle({className, ...props}: PopoverPrimitive.Title.Props) {
  return <PopoverPrimitive.Title data-slot="popover-title" className={mergeClass('text-base leading-tight font-semibold', className)} {...props}/>;
}

function PopoverDescription({className, ...props}: PopoverPrimitive.Description.Props) {
  return <PopoverPrimitive.Description data-slot="popover-description" className={mergeClass('text-sm text-fg-2', className)} {...props}/>;
}

function PopoverClose(props: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props}/>;
}

export {Popover, PopoverTrigger, PopoverContent, PopoverTitle, PopoverDescription, PopoverClose};

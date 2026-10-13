'use client';

import {Slider as SliderPrimitive} from '@base-ui/react/slider';
import {useMemo} from 'react';
import {cn, mergeClass} from '../lib/utils';

type SliderProps = SliderPrimitive.Root.Props & {
  thumbLabels?: string[];
  showValue?: boolean;
};

function Slider({className, defaultValue, value, min = 0, max = 100, thumbLabels, showValue, ...props}: SliderProps) {
  const values = useMemo(() => {
    const v = value ?? defaultValue;
    return Array.isArray(v) ? v : [v ?? min];
  }, [value, defaultValue, min]);
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={mergeClass('flex w-full items-center gap-3', className)}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control data-slot="slider-control" className="relative flex h-6 w-full touch-none items-center select-none data-disabled:cursor-not-allowed">
        <SliderPrimitive.Track data-slot="slider-track" className="relative h-1.5 w-full grow rounded-full bg-surface-3 select-none">
          <SliderPrimitive.Indicator data-slot="slider-range" className="h-full rounded-full bg-accent ring-1 ring-accent-line ring-inset select-none data-disabled:bg-fg-disabled data-disabled:ring-0"/>
          {values.map((_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              data-slot="slider-thumb"
              index={index}
              getAriaLabel={thumbLabels ? i => thumbLabels[i] ?? '' : undefined}
              className={cn(
                'block size-5 shrink-0 cursor-grab rounded-full border-2 border-ink bg-page shadow-card select-none',
                'transition-[scale] duration-(--dur-fast) ease-out hover:not-data-disabled:scale-105 data-dragging:cursor-grabbing data-dragging:scale-110 motion-reduce:scale-100!',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
                'data-disabled:cursor-not-allowed data-disabled:border-line-strong',
              )}
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
      {showValue && (
        <SliderPrimitive.Value data-slot="slider-value" className="min-w-10 shrink-0 text-end text-sm font-medium tabular-nums">
          {formatted => formatted.join(' to ')}
        </SliderPrimitive.Value>
      )}
    </SliderPrimitive.Root>
  );
}

export {Slider, type SliderProps};

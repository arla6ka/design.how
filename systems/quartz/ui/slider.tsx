'use client';

import {DirectionProvider} from '@base-ui/react/direction-provider';
import {Slider as SliderPrimitive} from '@base-ui/react/slider';
import {useMemo, useRef} from 'react';
import {useDomDirection} from '../lib/direction';
import {cn, mergeClass, mergeRefs} from '../lib/utils';

type SliderProps = SliderPrimitive.Root.Props & {
  thumbLabels?: string[];
  showValue?: boolean;
};

function Slider({className, defaultValue, value, min = 0, max = 100, step = 1, thumbLabels, showValue, format, locale = 'en-US', ref, ...props}: SliderProps) {
  const values = useMemo(() => {
    const v = value ?? defaultValue;
    return Array.isArray(v) ? v : [v ?? min];
  }, [value, defaultValue, min]);
  const box = useRef<HTMLDivElement | null>(null);
  const boxRefs = useMemo(() => mergeRefs(box, ref), [ref]);
  const dir = useDomDirection(box);

  const fmt = useMemo(() => new Intl.NumberFormat(locale, format), [locale, format]);
  const reserve = useMemo(() => {
    const longest = [min, max, Math.min(max, min + step), Math.max(min, max - step)]
      .map(n => fmt.format(n))
      .reduce((a, b) => (b.length > a.length ? b : a), '');
    return values.length > 1 ? `${longest} – ${longest}` : longest;
  }, [fmt, min, max, step, values.length]);

  return <DirectionProvider direction={dir}>
    <SliderPrimitive.Root
      ref={boxRefs}
      data-slot="slider"
      className={mergeClass('flex items-center gap-3 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:flex-col', className)}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      format={format}
      thumbAlignment="edge"
      locale={locale}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className={cn(
          'relative flex w-full touch-none items-center select-none',
          'data-[orientation=horizontal]:h-6 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-6 data-[orientation=vertical]:flex-col',
          'data-disabled:cursor-not-allowed',
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow rounded-soft bg-line-row select-none data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1 forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="rounded-soft bg-ink select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full data-disabled:bg-text-disabled forced-colors:[forced-color-adjust:none] forced-colors:bg-[Highlight]"
          />
          {values.map((_, index) => <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={index}
            getAriaLabel={thumbLabels ? i => thumbLabels[i] ?? '' : undefined}
            className={cn(
              'block size-4 shrink-0 cursor-grab rounded-soft bg-ink shadow-(--ring-thumb) select-none [-webkit-tap-highlight-color:transparent]',
              'transition-[background-color] duration-(--dur-fast) ease-(--ease-step)',
              'hover:not-data-disabled:bg-button-primary-hover data-dragging:cursor-grabbing data-dragging:bg-button-primary-hover',
              'has-focus-visible:focus-ring',
              'data-disabled:cursor-not-allowed data-disabled:bg-(--surface-disabled) data-disabled:shadow-[inset_0_0_0_1px_var(--text-disabled),var(--ring-thumb)]',
              'forced-colors:[forced-color-adjust:none] forced-colors:bg-[CanvasText] forced-colors:shadow-[0_0_0_--spacing(0.5)_Canvas] forced-colors:data-disabled:bg-[GrayText]',
            )}
          />)}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
      {showValue && <span data-slot="slider-value" className="grid shrink-0 justify-items-end type-label tabular-nums [grid-template-areas:'v']">
        <span aria-hidden data-slot="slider-value-reserve" className="invisible [grid-area:v]">{reserve}</span>
        <SliderPrimitive.Value className="[grid-area:v] data-disabled:text-text-disabled">
          {formatted => formatted.join(' – ')}
        </SliderPrimitive.Value>
      </span>}
    </SliderPrimitive.Root>
  </DirectionProvider>;
}

export {Slider, type SliderProps};

'use client';

import {createContext, useContext, useId, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {Radio as RadioPrimitive} from '@base-ui/react/radio';
import {RadioGroup as RadioGroupPrimitive} from '@base-ui/react/radio-group';
import {Toggle as TogglePrimitive} from '@base-ui/react/toggle';
import {ToggleGroup as ToggleGroupPrimitive} from '@base-ui/react/toggle-group';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, controlHeight} from '../lib/utils';

const segmentedVariants = cva('inline-flex w-fit max-w-full items-stretch gap-0.5 rounded-pill border border-line-faint bg-paper p-0.5 forced-colors:border-[CanvasText]', {
  variants: {
    size: {
      sm: `${controlHeight.sm} type-label-sm`,
      default: `${controlHeight.default} type-label`,
      lg: `${controlHeight.lg} type-label-lg`,
    },
    fill: {
      true: 'flex w-full *:flex-1',
      false: '',
    },
  },
  defaultVariants: {size: 'default', fill: false},
});

type Size = 'sm' | 'default' | 'lg';
type Mode = {size: Size; countMax?: number; multiple: boolean; sliding?: boolean};
const ModeContext = createContext<Mode>({size: 'default', multiple: false});

function useThumb() {
  const track = useRef<HTMLDivElement | null>(null);
  const thumb = useRef<HTMLSpanElement | null>(null);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const el = track.current, th = thumb.current;
    if (!el || !th) return;
    let first = true;
    const place = () => {
      const on = el.querySelector<HTMLElement>(':scope > [data-slot=segmented-control-item][data-checked]');
      th.hidden = !on;
      if (!on) return;
      if (first) th.style.transition = 'none';
      el.style.setProperty('--seg-x', `${on.offsetLeft}px`);
      el.style.setProperty('--seg-w', `${on.offsetWidth}px`);
      th.toggleAttribute('data-disabled', on.hasAttribute('data-disabled'));
      if (first) { void th.offsetWidth; th.style.transition = ''; first = false; }
    };
    place();
    setReady(true);
    const mo = new MutationObserver(place);
    mo.observe(el, {subtree: true, attributes: true, attributeFilter: ['data-checked', 'data-disabled']});
    const ro = new ResizeObserver(place);
    ro.observe(el);
    el.querySelectorAll(':scope > [data-slot=segmented-control-item]').forEach(item => ro.observe(item));
    return () => { mo.disconnect(); ro.disconnect(); };
  }, []);
  return {track, thumb, ready};
}

type Common = VariantProps<typeof segmentedVariants> & {
  className?: string;
  children?: ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  countMax?: number;
};

type SingleProps = Common & Omit<RadioGroupPrimitive.Props, 'value' | 'defaultValue' | 'onValueChange' | 'className' | 'children'> & {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

type MultipleProps = Common & Omit<ToggleGroupPrimitive.Props, 'value' | 'defaultValue' | 'onValueChange' | 'className' | 'children' | 'multiple'> & {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

type SegmentedControlProps = SingleProps | MultipleProps;

function SegmentedControl(props: SegmentedControlProps) {
  const {className, size = 'default', fill = false, children} = props;
  const classes = cn(segmentedVariants({size, fill}), className);
  const {track, thumb, ready} = useThumb();
  const ctx: Mode = {size: size ?? 'default', countMax: props.countMax, multiple: !!props.multiple, sliding: ready};
  if (props.multiple) {
    const {multiple: _m, onValueChange, size: _s, fill: _f, className: _c, children: _ch, countMax: _cm, ...rest} = props;
    return <ToggleGroupPrimitive data-slot="segmented-control" data-size={size} data-multiple="" multiple onValueChange={value => onValueChange?.(value as string[])} className={classes} {...rest}>
      <ModeContext.Provider value={ctx}>{children}</ModeContext.Provider>
    </ToggleGroupPrimitive>;
  }
  const {multiple: _m, onValueChange, size: _s, fill: _f, className: _c, children: _ch, countMax: _cm, ...rest} = props;
  return <RadioGroupPrimitive ref={track} data-slot="segmented-control" data-size={size} onValueChange={value => onValueChange?.(value as string)} className={cn('relative', classes)} {...rest}>
    <span
      ref={thumb}
      aria-hidden
      data-slot="segmented-control-thumb"
      className={cn(
        'glaze-sm pointer-events-none absolute inset-y-0.5 left-0 w-(--seg-w) translate-x-(--seg-x) rounded-pill',
        'transition-[translate,width] duration-(--dur-slide) ease-out motion-reduce:transition-none',
        !ready && 'invisible',
      )}
    />
    <ModeContext.Provider value={ctx}>{children}</ModeContext.Provider>
  </RadioGroupPrimitive>;
}

type SegmentedControlItemProps = {
  value: string;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  count?: number;
  countMax?: number;
  'aria-label'?: string;
};

const fmt = new Intl.NumberFormat('en-US');

const itemBase = [
  'relative inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-pill focus-sm border border-transparent whitespace-nowrap select-none [-webkit-tap-highlight-color:transparent]',
  'transition-[color,background-color] duration-(--dur-slide) ease-out motion-reduce:transition-none',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  'data-disabled:cursor-not-allowed',
].join(' ');
const itemSize: Record<Size, string> = {
  sm: 'px-2.5 type-label-sm [&_svg]:size-(--icon-sm)',
  default: 'px-3 type-label [&_svg]:size-(--icon)',
  lg: 'px-3.5 type-label-lg [&_svg]:size-(--icon-lg)',
};
const on = 'glaze-sm forced-colors:[forced-color-adjust:none] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]';
const onThumb = 'text-(--glaze-sm-text) data-disabled:text-text-disabled forced-colors:[forced-color-adjust:none] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]';
const off = 'text-text-2 hover:not-data-disabled:text-text-1 active:not-data-disabled:bg-hover data-disabled:text-text-disabled forced-colors:data-disabled:text-[GrayText]';

function SegmentedControlItem({className, children, count, countMax: itemMax, ...props}: SegmentedControlItemProps) {
  const {size, countMax: groupMax, multiple, sliding} = useContext(ModeContext);
  const countId = useId();
  const seen = useRef(0);
  if (count !== undefined) seen.current = Math.max(seen.current, count);
  const reserve = itemMax ?? groupMax ?? seen.current;
  const title = typeof children === 'string' ? children : undefined;
  const content = <>
    <span data-slot="segmented-control-label" className="inline-flex min-w-0 items-center gap-1.5"><span className="min-w-0 truncate">{children}</span></span>
    {count !== undefined && <span data-slot="segmented-control-count" aria-hidden className="grid shrink-0 justify-items-start tabular-nums opacity-70 [grid-template-areas:'c']">
      <span className="invisible [grid-area:c]">{fmt.format(Math.max(reserve, count))}</span>
      <span id={countId} className="[grid-area:c]">{fmt.format(count)}</span>
    </span>}
  </>;
  const shared = {'data-slot': 'segmented-control-item', title, 'aria-describedby': count !== undefined ? countId : undefined};
  if (multiple) return <TogglePrimitive {...shared} {...props} className={state => cn(itemBase, itemSize[size], state.pressed ? on : off, className)}>{content}</TogglePrimitive>;
  return <RadioPrimitive.Root {...shared} {...props} className={state => cn(itemBase, itemSize[size], state.checked ? (sliding ? onThumb : on) : off, className)}>{content}</RadioPrimitive.Root>;
}

export {SegmentedControl, SegmentedControlItem, segmentedVariants, type SegmentedControlProps, type SegmentedControlItemProps};

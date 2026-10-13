'use client';

import * as React from 'react';
import {Radio as RadioPrimitive} from '@base-ui/react/radio';
import {RadioGroup as RadioGroupPrimitive} from '@base-ui/react/radio-group';
import {Toggle as TogglePrimitive} from '@base-ui/react/toggle';
import {ToggleGroup as ToggleGroupPrimitive} from '@base-ui/react/toggle-group';
import {cva, type VariantProps} from 'class-variance-authority';
import type {Kind} from '../lib/kind';
import {cn, controlHeight} from '../lib/utils';

const segmentedVariants = cva(['inline-flex w-fit max-w-full items-stretch gap-0.5 rounded-soft bg-well p-0.5 forced-colors:border forced-colors:border-solid forced-colors:border-[CanvasText]'], {
  variants: {
    size: {
      xs: controlHeight.xs,
      sm: controlHeight.sm,
      default: controlHeight.default,
    },
    fill: {
      true: 'flex w-full *:flex-1',
      false: '',
    },
  },
  defaultVariants: {size: 'default', fill: false},
});

type Mode = {size: 'xs' | 'sm' | 'default'; multiple: boolean; countMax?: number};
const ModeContext = React.createContext<Mode>({size: 'default', multiple: false});

type Common = VariantProps<typeof segmentedVariants> & {
  className?: string;
  children?: React.ReactNode;
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
  const ctx = {size: size ?? 'default', multiple: !!props.multiple, countMax: props.countMax};
  if (props.multiple) {
    const {multiple: _m, onValueChange, size: _s, fill: _f, className: _c, children: _ch, countMax: _cm, ...rest} = props;
    return <ToggleGroupPrimitive
      data-slot="segmented-control"
      data-size={size}
      data-multiple=""
      multiple
      onValueChange={value => onValueChange?.(value as string[])}
      className={classes}
      {...rest}
    ><ModeContext.Provider value={ctx}>{children}</ModeContext.Provider></ToggleGroupPrimitive>;
  }
  const {multiple: _m, onValueChange, size: _s, fill: _f, className: _c, children: _ch, countMax: _cm, ...rest} = props;
  return <RadioGroupPrimitive
    data-slot="segmented-control"
    data-size={size}
    onValueChange={value => onValueChange?.(value as string)}
    className={classes}
    {...rest}
  ><ModeContext.Provider value={ctx}>{children}</ModeContext.Provider></RadioGroupPrimitive>;
}

type SegmentedControlItemProps = {
  value: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  count?: number;
  countMax?: number;
  kind?: Kind;
  'aria-label'?: string;
};

const fmt = new Intl.NumberFormat('en-US');

function useOverflow<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [over, setOver] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOver(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const mo = new MutationObserver(check);
    mo.observe(el, {childList: true, characterData: true, subtree: true});
    const fonts = el.ownerDocument.fonts;
    fonts?.addEventListener('loadingdone', check);
    fonts?.ready.then(check);
    return () => { ro.disconnect(); mo.disconnect(); fonts?.removeEventListener('loadingdone', check); };
  }, []);
  return [ref, over] as const;
}

function SegmentedControlItem({className, children, count, countMax: itemMax, kind, ...props}: SegmentedControlItemProps) {
  const {size, multiple, countMax: groupMax} = React.useContext(ModeContext);
  const countId = React.useId();
  const [labelRef, over] = useOverflow<HTMLSpanElement>();
  const seen = React.useRef(0);
  if (count !== undefined) seen.current = Math.max(seen.current, count);
  const reserve = itemMax ?? groupMax ?? seen.current;
  const title = over && typeof children === 'string' ? children : undefined;
  const classes = cn(
    'relative inline-flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-inner whitespace-nowrap select-none touch-target [-webkit-tap-highlight-color:transparent]',
    'text-text-2 transition-[background-color,color,outline-color] duration-(--dur-fast) ease-(--ease-step)',
    size === 'xs' ? 'px-2 type-label-sm' : 'px-3 type-label',
    'hover:not-data-disabled:not-data-checked:not-data-pressed:text-text-1 active:not-data-disabled:not-data-checked:not-data-pressed:bg-hover',
    'data-checked:bg-(--surface-thumb) data-checked:text-text-1 data-checked:shadow-(--elev-thumb) data-pressed:bg-(--surface-thumb) data-pressed:text-text-1 data-pressed:shadow-(--elev-thumb)',
    'focus-visible:focus-ring-inset',
    'data-disabled:cursor-not-allowed data-disabled:text-text-disabled data-disabled:data-checked:bg-pressed data-disabled:data-checked:text-text-disabled data-disabled:data-pressed:bg-pressed data-disabled:data-pressed:text-text-disabled',
    'forced-colors:data-checked:[forced-color-adjust:none] forced-colors:data-checked:bg-[Highlight]! forced-colors:data-checked:text-[HighlightText]!',
    'forced-colors:data-pressed:[forced-color-adjust:none] forced-colors:data-pressed:bg-[Highlight]! forced-colors:data-pressed:text-[HighlightText]!',
    'forced-colors:data-disabled:text-[GrayText] forced-colors:data-disabled:data-checked:bg-[Canvas]! forced-colors:data-disabled:data-checked:text-[GrayText]! forced-colors:data-disabled:data-pressed:bg-[Canvas]! forced-colors:data-disabled:data-pressed:text-[GrayText]!',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    className,
  );
  const content = <>
    <span
      ref={labelRef}
      data-slot="segmented-control-label"
      data-overflow={over || undefined}
      className="inline-flex min-w-0 items-center gap-1.5 overflow-hidden data-overflow:[mask-image:linear-gradient(to_right,#000_calc(100%-var(--fade-line-end)),transparent)] rtl:data-overflow:[mask-image:linear-gradient(to_left,#000_calc(100%-var(--fade-line-end)),transparent)]"
    >{children}</span>
    {count !== undefined && <span data-slot="segmented-control-count" aria-hidden className="grid shrink-0 justify-items-end tabular-nums [grid-template-areas:'c']">
      <span className="invisible [grid-area:c]">{fmt.format(Math.max(reserve, count))}</span>
      <span id={countId} className="[grid-area:c]">{fmt.format(count)}</span>
    </span>}
  </>;
  const shrink = typeof children === 'string' ? Math.max(1, children.length ** 3) : 1;
  const floorCh = typeof children === 'string' ? Math.min(children.length * 0.8, 6) : 0;
  const countCh = count !== undefined ? fmt.format(Math.max(reserve, count)).length : 0;
  const minWidth = `calc(${floorCh + countCh}ch + ${(size === 'xs' ? 16 : 24) + (count !== undefined ? 6 : 0)}px)`;
  const shared = {'data-slot': 'segmented-control-item', 'data-kind': kind, 'aria-describedby': count !== undefined ? countId : undefined, title, style: {flexShrink: shrink, minWidth}, className: classes};
  if (multiple) return <TogglePrimitive {...shared} {...props}>{content}</TogglePrimitive>;
  return <RadioPrimitive.Root {...shared} {...props}>{content}</RadioPrimitive.Root>;
}

export {SegmentedControl, SegmentedControlItem, segmentedVariants, type SegmentedControlProps, type SegmentedControlItemProps};

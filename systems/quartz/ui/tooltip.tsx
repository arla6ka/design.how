'use client';

import * as React from 'react';
import {Tooltip as TooltipPrimitive} from '@base-ui/react/tooltip';
import {cn, mergeClass} from '../lib/utils';
import {useQuartzPortal} from '../lib/portal';
import {isPart} from '../lib/children';
import {Kbd, KbdGroup} from './kbd';

function TooltipProvider({delay = 500, closeDelay = 0, ...props}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} closeDelay={closeDelay} {...props}/>;
}

const LabelContext = React.createContext<string | null>(null);

function Tooltip({children, ...props}: TooltipPrimitive.Root.Props) {
  let label: string | null = null;
  React.Children.forEach(children as React.ReactNode, child => {
    if (isPart(child, TooltipContent)) label = readLabel(child.props.children, false).text || null;
  });
  return <LabelContext.Provider value={label}>
    <TooltipPrimitive.Root data-slot="tooltip" {...props}>{children}</TooltipPrimitive.Root>
  </LabelContext.Provider>;
}

function textOf(node: React.ReactNode): string {
  let text = '';
  React.Children.forEach(node, child => {
    if (typeof child === 'string' || typeof child === 'number') text += child;
    else if (React.isValidElement<{children?: React.ReactNode; 'aria-hidden'?: unknown}>(child) && !child.props['aria-hidden']) text += textOf(child.props.children);
  });
  return text.trim();
}

const wrapperClass = 'rounded-soft [&>:disabled]:pointer-events-none [&>[data-disabled]]:pointer-events-none';

function TooltipTrigger({className, render, children, ...props}: TooltipPrimitive.Trigger.Props) {
  const label = React.useContext(LabelContext);
  const el = React.isValidElement<Record<string, unknown>>(render) ? render : null;
  const named = props['aria-label'] || props['aria-labelledby'] || el?.props['aria-label'] || el?.props['aria-labelledby']
    || textOf(children as React.ReactNode) || textOf(el?.props.children as React.ReactNode);
  const naming = !named && label ? {'aria-label': label, 'data-tooltip-named': ''} : undefined;
  return <TooltipPrimitive.Trigger
    data-slot="tooltip-trigger"
    render={render}
    className={mergeClass(wrapperClass, className)}
    {...naming}
    {...props}
  >{children}</TooltipPrimitive.Trigger>;
}

type TooltipPart = string | number | React.ReactElement | false | null | undefined;
type TooltipChildren = TooltipPart | TooltipPart[];

function readLabel(children: TooltipChildren, warn = true) {
  let text = '';
  let shortcut: React.ReactElement | null = null;
  for (const child of React.Children.toArray(children)) {
    if (typeof child === 'string' || typeof child === 'number') text += child;
    else if (isPart(child, TooltipShortcut)) shortcut = child;
    else if (warn && child && process.env.NODE_ENV !== 'production') console.error('Tooltip holds a label and a TooltipShortcut only. Move links, buttons and longer text into a Popover.');
  }
  return {text: text.trim(), shortcut};
}

type TooltipContentProps = Omit<TooltipPrimitive.Popup.Props, 'children'> & Pick<TooltipPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset' | 'collisionPadding'> & {
  children: TooltipChildren;
  shortcut?: string[];
};

const tooltipPopupClass = cn(
  'inline-flex min-h-6 w-fit max-w-(--tooltip-max) items-center gap-2 rounded-soft bg-page px-2 py-1 type-label-sm text-text-1 break-words shadow-overlay',
  'has-data-[slot=tooltip-shortcut]:pe-1',
  'forced-colors:outline-solid forced-colors:outline-1 forced-colors:outline-[CanvasText]',
);

const tooltipMotionClass = 'transition-opacity duration-(--dur-base) ease-(--ease-step) data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-(--dur-fast) data-instant:duration-0 data-instant:data-ending-style:duration-0 motion-reduce:transition-none';

function TooltipChip({className, children, shortcut, ...props}: Omit<React.ComponentProps<'div'>, 'children'> & {children: string; shortcut?: string[]}) {
  return <div data-slot="tooltip-content" data-surface="inverse" role="presentation" className={cn(tooltipPopupClass, className)} {...props}>
    <span className="min-w-0">{children}</span>
    {shortcut && <TooltipShortcut keys={shortcut}/>}
  </div>;
}

function TooltipContent({className, side = 'top', sideOffset = 6, align = 'center', alignOffset = 0, collisionPadding = 8, children, shortcut, ...props}: TooltipContentProps) {
  const container = useQuartzPortal();
  const {text, shortcut: shortcutChild} = readLabel(children);
  if (!text && !shortcut?.length && !shortcutChild) return null;
  return <TooltipPrimitive.Portal container={container}>
    <TooltipPrimitive.Positioner
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className="isolate z-(--z-overlay)"
    >
      <TooltipPrimitive.Popup
        data-slot="tooltip-content"
        data-surface="inverse"
        className={mergeClass([tooltipPopupClass, tooltipMotionClass], className)}
        {...props}
      >
        <span className="min-w-0">{text}</span>
        {shortcut ? <TooltipShortcut keys={shortcut}/> : shortcutChild}
      </TooltipPrimitive.Popup>
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>;
}

function TooltipShortcut({keys, className, ...props}: React.ComponentProps<'kbd'> & {keys: string[]}) {
  return <KbdGroup data-slot="tooltip-shortcut" className={cn('shrink-0 flex-nowrap gap-0.5', className)} {...props}>
    {keys.map((key, i) => <Kbd key={i}>{key}</Kbd>)}
  </KbdGroup>;
}

export {Tooltip, TooltipTrigger, TooltipContent, TooltipChip, TooltipProvider, TooltipShortcut, tooltipPopupClass, tooltipMotionClass, type TooltipContentProps};

'use client';

import {useRef, type ReactNode} from 'react';
import {cva} from 'class-variance-authority';
import {cn} from '../lib/utils';
import {useDrawn, useElementDirection} from './chart-parts';
import {formatExact, unitFormat, type ChartUnit} from './chart-scale';

type BarBlockTone = 'accent' | 'well' | 'ok' | 'warn' | 'fail';

type BarBlock = {
  label: string;
  value: number;
  tone?: BarBlockTone;
};

const blockVariants = cva('relative flex min-w-0 flex-col justify-between overflow-hidden border border-line', {
  variants: {
    tone: {
      accent: 'bg-selected text-text-1',
      well: 'bg-well text-text-1',
      ok: 'bg-ok-tint text-ok-text',
      warn: 'bg-warn-tint text-warn-text',
      fail: 'bg-fail-tint text-fail-text',
    },
    size: {
      sm: 'p-2 [--block-h:calc(var(--control-lg)*2.5)]',
      default: 'p-2 [--block-h:calc(var(--control-lg)*5)]',
      lg: 'p-3 [--block-h:calc(var(--control-lg)*7)]',
    },
  },
  defaultVariants: {tone: 'well', size: 'default'},
});

const floor = {sm: '[--block-floor:calc(var(--space-2)*9)]', default: '[--block-floor:calc(var(--space-2)*11)]', lg: '[--block-floor:calc(var(--space-2)*17)]'} as const;
const floorWidth = (n: number) => `min(var(--block-floor), calc((100% - var(--space-1) * ${n - 1}) / ${n}))`;

function blockTone(blocks: BarBlock[], i: number): BarBlockTone {
  if (blocks[i].tone) return blocks[i].tone!;
  return blocks.slice(0, i).some(b => !b.tone) ? 'well' : 'accent';
}

type BarBlocksProps = Omit<React.ComponentProps<'figure'>, 'children'> & {
  label: string;
  data: BarBlock[];
  size?: 'sm' | 'default' | 'lg';
  valueFormat?: (value: number) => string;
  unit?: ChartUnit;
  empty?: ReactNode;
};

function BarBlocks({label, data, size = 'default', valueFormat, unit, empty = 'Nothing to show yet.', className, ...props}: BarBlocksProps) {
  const ref = useRef<HTMLElement>(null);
  const rtl = useElementDirection(ref) === 'rtl';
  const drawn = useDrawn();
  const parts = data.filter(b => Number.isFinite(b.value) && b.value > 0);
  const total = parts.reduce((sum, b) => sum + b.value, 0);
  const format = valueFormat ?? (unit ? (v: number) => unitFormat(unit, [v])!(v) : formatExact);

  if (!total) {
    return <figure ref={ref} data-slot="bar-blocks" data-state="empty" className={cn('flex min-w-0 flex-col', className)} {...props}>
      <figcaption className="sr-only">{label}</figcaption>
      <div className={cn(blockVariants({tone: 'well', size}), 'h-(--block-h) w-full justify-start type-body-sm text-text-2')}>{empty}</div>
    </figure>;
  }

  const share = (v: number) => `${Math.round((v / total) * 100)}%`;

  return <figure ref={ref} data-slot="bar-blocks" data-state={drawn ? 'drawn' : 'start'} className={cn('flex min-w-0 flex-col', className)} {...props}>
    <figcaption className="sr-only">{label}</figcaption>
    <ul className={cn('flex min-w-0 gap-1', floor[size])}>
      {parts.map((block, i) => {
        const tone = blockTone(parts, i);
        return <li
          key={`${block.label}-${i}`}
          data-slot="bar-block"
          data-tone={tone}
          className={cn(blockVariants({tone, size}), 'h-(--block-h) basis-0')}
          style={{
            flexGrow: block.value,
            minWidth: floorWidth(parts.length),
            clipPath: drawn ? 'inset(0)' : rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)',
            transition: `clip-path var(--dur-wipe) var(--ease-linear) calc(var(--dur-wipe) * ${i})`,
          }}
        >
          <span className="sr-only">{block.label}: {format(block.value)}, {share(block.value)} of the total</span>
          <span aria-hidden className="truncate type-code">{format(block.value)}</span>
          <span aria-hidden className="min-h-0 truncate type-micro [writing-mode:vertical-rl] rotate-180">{block.label}</span>
        </li>;
      })}
    </ul>
  </figure>;
}

export {BarBlocks, blockVariants, type BarBlocksProps, type BarBlock, type BarBlockTone};

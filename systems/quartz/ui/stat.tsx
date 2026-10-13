import {cva, type VariantProps} from 'class-variance-authority';
import {Children, Fragment} from 'react';
import {Icon, ArrowDownRight, ArrowRight, ArrowUpRight} from '../icon';
import type {Kind} from '../lib/kind';
import {Sparkline} from './chart';
import {cn} from '../lib/utils';

const statVariants = cva('group/stat flex min-w-0 flex-col', {
  variants: {
    size: {
      default: 'gap-2',
      lg: 'gap-3',
      xl: 'gap-4',
    },
    variant: {
      plain: '',
      framed: 'frame bg-page px-4 py-3',
      /** @deprecated Use framed. */
      card: 'frame bg-page px-4 py-3',
    },
  },
  defaultVariants: {size: 'default', variant: 'plain'},
});

type StatProps = React.ComponentProps<'div'> & VariantProps<typeof statVariants> & {
  loading?: boolean;
  kind?: Kind;
  status?: 'warn' | 'fail';
};

function Stat({className, size = 'default', variant = 'plain', loading, kind, status, ...props}: StatProps) {
  return <div
    data-slot="stat"
    data-size={size}
    data-variant={variant === 'card' ? 'framed' : variant}
    data-kind={kind}
    data-status={status}
    data-loading={loading || undefined}
    aria-busy={loading || undefined}
    className={cn(statVariants({size, variant}), className)}
    {...props}
  />;
}

type StatGroupProps = React.ComponentProps<'div'> & {
  kind?: Kind;
  /** framed: the strip's own frame (frame is the deprecated name). plain: no edge, for a strip inside another frame, which draws only the rules. `frame` is a @deprecated alias of framed. */
  variant?: 'framed' | 'plain' | 'frame';
};

function StatGroup({kind, variant = 'framed', className, children, ...props}: StatGroupProps) {
  return <div
    data-slot="stat-group"
    data-kind={kind}
    className={cn('@container/stats min-w-0', variant !== 'plain' && 'frame bg-page', className)}
    {...props}
  >
    <div className="grid grid-cols-1 [&>*]:px-4 [&>*]:py-3 [&>*+*]:rule-top @md/stats:grid-flow-col @md/stats:auto-cols-fr @md/stats:[&>*+*]:rule-col">{children}</div>
  </div>;
}

function StatLabel({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="stat-label" className={cn('type-label text-text-2', className)} {...props}/>;
}

function groupsOf(text: string) {
  return text.split(/(?<=[,.\s])/).map((part, i) => <Fragment key={i}><span className="whitespace-nowrap">{part}</span><wbr/></Fragment>);
}

function StatValue({className, children, ...props}: React.ComponentProps<'div'>) {
  return <div
    data-slot="stat-value"
    className={cn(
      'flex min-w-0 flex-wrap items-baseline gap-x-1 type-stat data text-text-1 group-data-[size=lg]/stat:type-stat-lg group-data-[size=xl]/stat:type-stat-xl',
      className,
    )}
    {...props}
  >
    <span className="contents group-data-[loading]/stat:hidden">{Children.map(children, child => typeof child === 'string' || typeof child === 'number' ? <span className="min-w-0 [overflow-wrap:normal]">{groupsOf(String(child))}</span> : child)}</span>
    <span aria-hidden className="hidden h-(--line-box) w-(--stat-placeholder) bg-(--surface-skeleton) group-data-[loading]/stat:block"/>
  </div>;
}

function StatUnit({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="stat-unit" className={cn('ms-0.5 type-label text-text-2 group-data-[size=lg]/stat:type-body-lg group-data-[size=xl]/stat:type-heading-sm', className)} {...props}/>;
}

type Trend = 'up' | 'down' | 'flat';
const trendIcon = {up: ArrowUpRight, down: ArrowDownRight, flat: ArrowRight};
const trendWord = {up: 'Up', down: 'Down', flat: 'No change'};

const plain = (n: number) => n.toLocaleString('en-US', {maximumFractionDigits: 1});

function deltaOf(from: number, to: number) {
  const diff = to - from;
  const pct = from === 0 ? (to === 0 ? 0 : Infinity) : (diff / Math.abs(from)) * 100;
  const trend: Trend = !Number.isFinite(pct) ? (diff > 0 ? 'up' : 'down') : Math.abs(pct) < 0.05 ? 'flat' : pct > 0 ? 'up' : 'down';
  const change = !Number.isFinite(pct) ? 'new' : `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct).toLocaleString('en-US', {maximumFractionDigits: 1})}%`;
  return {trend, change};
}

type StatDeltaProps = React.ComponentProps<'div'> & {
  trend?: Trend;
  from?: number;
  to?: number;
  format?: (n: number) => string;
  period?: string;
};

function StatDelta({trend: given, from, to, format = plain, period, className, children, ...props}: StatDeltaProps) {
  const known = from !== undefined && to !== undefined && Number.isFinite(from) && Number.isFinite(to);
  if (!known && from !== undefined && to !== undefined && children === undefined) return null;
  const computed = known ? deltaOf(from, to) : undefined;
  const trend = given ?? computed?.trend ?? 'flat';
  if (computed && from === 0 && to === 0 && children === undefined) return null;
  return <div data-slot="stat-delta" data-trend={trend} className={cn('relative inline-flex min-w-0 flex-wrap items-center gap-x-1 type-label-sm text-text-2 group-data-[loading]/stat:invisible', className)} {...props}>
    <Icon icon={trendIcon[trend]} size={12} className="rtl:-scale-x-100"/>
    <span className="sr-only">{trendWord[trend]}</span>
    <span className="data">{children ?? computed?.change}</span>
    {computed && <span data-slot="stat-baseline" className="text-text-3">vs <span className="data">{format(from!)}</span>{period && ` ${period}`}</span>}
  </div>;
}

function StatDescription({className, ...props}: React.ComponentProps<'p'>) {
  return <p data-slot="stat-description" className={cn('type-body-sm text-text-3 group-data-[status=warn]/stat:text-warn-text group-data-[status=fail]/stat:text-fail-text', className)} {...props}/>;
}

function StatTrend({data, labels, label = 'Trend', className}: {data: (number | null)[]; labels?: string[]; label?: string; className?: string}) {
  if (data.length < 2) return null;
  const values = data.filter((v): v is number => v !== null && Number.isFinite(v));
  const f = (v: number) => v.toLocaleString('en-US');
  const first = values[0], last = values[values.length - 1];
  const words = values.length ? `${last > first ? 'up' : last < first ? 'down' : 'flat'} from ${f(first)} to ${f(last)}, low ${f(Math.min(...values))}, high ${f(Math.max(...values))}` : 'no data';
  return <div data-slot="stat-trend" role="img" aria-label={`${label}: ${words}`} className={cn('mb-1 block w-24 min-w-10 shrink group-data-[loading]/stat:invisible', className)}>
    <div aria-hidden="true"><Sparkline data={data} labels={labels} label={label} size="lg" area className="w-full"/></div>
  </div>;
}

function StatRow({className, ...props}: React.ComponentProps<'div'>) {
  return <div data-slot="stat-row" className={cn('flex min-w-0 items-end justify-between gap-4', className)} {...props}/>;
}

export {Stat, StatGroup, StatLabel, StatValue, StatUnit, StatDelta, StatDescription, StatTrend, StatRow, statVariants, deltaOf, type StatGroupProps, type StatProps, type Trend};

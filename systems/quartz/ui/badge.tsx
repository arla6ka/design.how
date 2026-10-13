import {mergeProps} from '@base-ui/react/merge-props';
import {useRender} from '@base-ui/react/use-render';
import {cva, type VariantProps} from 'class-variance-authority';
import type {Kind} from '../lib/kind';
import {cn} from '../lib/utils';

type BadgeStatus = 'warn' | 'fail';

const kindLabels: Record<Kind | BadgeStatus, string> = {
  agent: 'Agent',
  key: 'Key',
  run: 'Run',
  deploy: 'Deploy',
  model: 'Model',
  warn: 'Warning',
  fail: 'Failed',
};

const outlined = 'frame [--frame-radius:var(--radius-inner)] bg-page text-text-1 [a]:hover:bg-hover';

const badgeVariants = cva(
  [
    'group/badge relative inline-flex w-fit shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-inner',
    'transition-colors duration-(--dur-fast) ease-(--ease-step)',
    '[&>svg]:pointer-events-none [&>svg]:shrink-0',
    'forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1',
  ],
  {
    variants: {
      variant: {
        secondary: 'bg-accent-tint text-accent-label [a]:hover:bg-hover',
        outline: cn(outlined, '[--frame-color:var(--line-control)]'),
        ghost: 'bg-transparent text-text-2 [a]:hover:bg-hover [a]:hover:text-text-1',
        warn: cn(outlined, '[--frame-color:var(--accent-line)]'),
        destructive: cn(outlined, '[--frame-color:var(--accent-line)]'),
        link: 'h-auto px-0 text-text-1 underline-offset-4 decoration-1 [a]:hover:underline',
      },
      size: {
        default: 'min-h-(--tag) min-w-(--tag) gap-1 py-0.5 px-1.5 type-label-sm has-data-[icon=inline-start]:ps-1 has-data-[icon=inline-end]:pe-1',
        sm: 'min-h-4 min-w-4 gap-0.5 px-1 type-label-sm',
      },
    },
    defaultVariants: {variant: 'secondary', size: 'default'},
  },
);

type BadgeProps = useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & {
  kind?: Kind;
  status?: BadgeStatus;
  label?: React.ReactNode;
  count?: number;
  max?: number;
};

function Badge({className, variant, size = 'default', kind, status, label, count, max = 99, render, children, ...props}: BadgeProps) {
  const tone = status ?? (variant === 'destructive' ? 'fail' : variant === 'warn' ? 'warn' : undefined);
  const named = kind ?? status;
  const capped = count !== undefined && count > max;
  const word = label ?? children ?? (named ? kindLabels[named] : undefined);
  const shown = count === undefined ? word : capped ? `${max}+` : count.toLocaleString('en-US');
  const look = tone ? (tone === 'fail' ? 'destructive' : 'warn') : variant;
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({variant: look, size}), className),
        children: capped ? <><span aria-hidden>{shown}</span><span className="sr-only">{count.toLocaleString('en-US')}</span></> : shown,
      },
      {'data-slot': 'badge', 'data-kind': kind, 'data-status': tone, 'data-size': size, title: capped ? count.toLocaleString('en-US') : undefined} as React.ComponentProps<'span'>,
      props,
    ),
    render,
    state: {slot: 'badge', variant},
  });
}

type CodeTagStatus = 'neutral' | 'warn' | 'fail';
/** @deprecated Use CodeTagStatus. */
type CodeTagTone = CodeTagStatus;

function codeStatus(code: number | string | undefined): CodeTagStatus {
  const n = Number(code);
  if (!Number.isInteger(n)) return 'neutral';
  if (n >= 500 && n < 600) return 'fail';
  if (n >= 400 && n < 500) return 'warn';
  return 'neutral';
}

type CodeTagProps = React.ComponentProps<'span'> & {
  code?: number | string;
  status?: CodeTagStatus;
  /** @deprecated Use status. */
  tone?: CodeTagStatus;
  fill?: 'soft' | 'solid' | 'outline';
};

function CodeTag({code, status, tone, fill = 'soft', className, children, ...props}: CodeTagProps) {
  const t = status ?? tone ?? codeStatus(code);
  return <span
    data-slot="code-tag"
    data-fill={fill}
    data-status={t === 'neutral' ? undefined : t}
    className={cn(
      'frame [--frame-radius:var(--radius-inner)] inline-flex h-(--tag) min-w-(--tag) shrink-0 items-center justify-center px-1.5 type-tag whitespace-nowrap text-text-1',
      'data-[fill=soft]:bg-selected data-[fill=soft]:[--frame-color:transparent] data-[fill=soft]:data-status:[--frame-color:var(--accent-line)]',
      'data-[fill=solid]:bg-inverse data-[fill=solid]:text-text-inverse data-[fill=solid]:[--frame-color:transparent] data-[fill=solid]:data-status:bg-(--accent-mark) data-[fill=solid]:data-status:text-on-field',
      'data-[fill=outline]:bg-page data-[fill=outline]:[--frame-color:var(--line-control)] data-[fill=outline]:data-status:[--frame-color:var(--accent-line)]',
      'forced-colors:outline forced-colors:outline-1 forced-colors:-outline-offset-1',
      className,
    )}
    {...props}
  >{children ?? code}</span>;
}

/** @deprecated Use codeStatus. */
const codeTone = codeStatus;

export {Badge, badgeVariants, CodeTag, codeStatus, codeTone, kindLabels, type BadgeProps, type BadgeStatus, type CodeTagProps, type CodeTagStatus, type CodeTagTone};

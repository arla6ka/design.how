'use client';

import * as React from 'react';
import {Icon, Check, FailedMark, Pending} from '../icon';
import {cn} from '../lib/utils';

type StepState = 'done' | 'current' | 'upcoming' | 'pending' | 'error';
type Orientation = 'horizontal' | 'vertical';
type StepsSize = 'sm' | 'default';

type StepsContextValue = {value: number; orientation: Orientation; size: StepsSize; onValueChange?: (step: number) => void; linear: boolean};
const StepsContext = React.createContext<StepsContextValue | null>(null);
const StepContext = React.createContext<{step: number; state: StepState; disabled: boolean} | null>(null);

function useSteps() {
  const ctx = React.useContext(StepsContext);
  if (!ctx) throw new Error('Step parts must be inside <Steps>.');
  return ctx;
}
function useStep() {
  const ctx = React.useContext(StepContext);
  if (!ctx) throw new Error('Step parts must be inside <Step>.');
  return ctx;
}

type StepsProps = Omit<React.ComponentProps<'ol'>, 'onChange'> & {
  value: number;
  onValueChange?: (step: number) => void;
  orientation?: Orientation;
  size?: StepsSize;
  linear?: boolean;
};

function Steps({value, onValueChange, orientation = 'horizontal', size = 'default', linear = true, className, ...props}: StepsProps) {
  const ctx = React.useMemo(() => ({value, onValueChange, orientation, size, linear}), [value, onValueChange, orientation, size, linear]);
  return <StepsContext.Provider value={ctx}>
    <ol
      data-slot="steps"
      data-orientation={orientation}
      data-size={size}
      className={cn('group/steps flex w-full min-w-0', orientation === 'horizontal' ? 'flex-row items-start' : 'flex-col', className)}
      {...props}
    />
  </StepsContext.Provider>;
}

type StepProps = React.ComponentProps<'li'> & {
  step: number;
  state?: StepState;
  disabled?: boolean;
};

function Step({step, state: stateProp, disabled = false, className, ...props}: StepProps) {
  const {value, orientation, size} = useSteps();
  const state: StepState = stateProp ?? (step < value ? 'done' : step === value ? 'current' : 'upcoming');
  const ctx = React.useMemo(() => ({step, state, disabled}), [step, state, disabled]);
  return <StepContext.Provider value={ctx}>
    <li
      data-slot="step"
      data-state={state}
      aria-current={step === value ? 'step' : undefined}
      className={cn(
        'group/step relative flex min-w-0 flex-col',
        orientation === 'horizontal' ? 'flex-1 pe-2 last:flex-none last:pe-0' : cn('last:pb-0', size === 'sm' ? 'pb-3' : 'pb-4'),
        className,
      )}
      {...props}
    />
  </StepContext.Provider>;
}

function StepTrigger({className, children, ...props}: React.ComponentProps<'button'>) {
  const {onValueChange, value, linear, orientation, size} = useSteps();
  const {step, disabled} = useStep();
  const base = cn(
    'relative flex min-w-0 text-start',
    orientation === 'horizontal' ? cn('flex-col items-start', size === 'sm' ? 'gap-1.5' : 'gap-2') : cn('items-start', size === 'sm' ? 'gap-2' : 'gap-3'),
    className,
  );
  if (!onValueChange) return <div data-slot="step-trigger" className={base}>{children}</div>;
  const blocked = disabled || (linear && step > value);
  return <button
    type="button"
    data-slot="step-trigger"
    disabled={blocked}
    onClick={() => onValueChange(step)}
    className={cn(base, 'cursor-pointer rounded-tag decoration-line-strong underline-offset-4 enabled:hover:[&_[data-slot=step-title]]:underline disabled:cursor-not-allowed')}
    {...props}
  >{children}</button>;
}

const stepWord: Record<StepState, string> = {done: ', done', current: ', current', upcoming: '', pending: ', running', error: ''};

function StepIndicator({className, children, ...props}: React.ComponentProps<'span'>) {
  const {size} = useSteps();
  const {step, state} = useStep();
  return <span
    data-slot="step-indicator"
    data-state={state}
    className={cn(
      'grid shrink-0 place-items-center rounded-pill type-label-sm leading-none data transition-colors duration-(--dur-state) ease-out',
      size === 'sm' ? 'h-4 w-5.5' : 'h-5 w-7',
      'bg-field text-text-3',
      'data-[state=done]:glaze-sm data-[state=done]:text-(--glaze-sm-text)',
      'data-[state=current]:bg-paper data-[state=current]:text-text-1 data-[state=current]:inset-ring data-[state=current]:inset-ring-ink',
      'data-[state=pending]:bg-paper data-[state=pending]:text-text-1 data-[state=pending]:inset-ring data-[state=pending]:inset-ring-ink',
      'data-[state=error]:bg-fail-tint data-[state=error]:text-fail',
      'forced-colors:border forced-colors:border-[CanvasText]',
      className,
    )}
    {...props}
  >
    {children ?? (state === 'done' ? <Icon icon={Check} size={12} weight="bold"/>
      : state === 'error' ? <Icon icon={FailedMark} size={size === 'sm' ? 12 : 14}/>
      : state === 'pending' ? <Icon icon={Pending} size={12} className="animate-spin motion-reduce:animate-none"/>
      : String(step))}
    {stepWord[state] && <span className="sr-only">{stepWord[state]}</span>}
  </span>;
}

function StepText({className, ...props}: React.ComponentProps<'span'>) {
  return <span
    data-slot="step-text"
    className={cn('flex min-w-0 flex-col gap-0.5 group-data-[orientation=vertical]/steps:group-data-[size=default]/steps:pt-px', className)}
    {...props}
  />;
}

type StepTitleProps = React.ComponentProps<'span'> & {
  errorText?: React.ReactNode;
};

function StepTitle({className, children, errorText = 'Failed', ...props}: StepTitleProps) {
  const {size} = useSteps();
  const {state} = useStep();
  return <span
    data-slot="step-title"
    className={cn(
      'inline-flex min-w-0 max-w-full items-baseline gap-1.5 text-text-1 group-data-[state=upcoming]/step:text-text-2',
      size === 'sm' ? 'type-label-sm' : 'type-label',
      className,
    )}
    {...props}
  >
    <span className="truncate">{children}</span>
    {state === 'error' && <span data-slot="step-error" className="shrink-0 text-fail-text">{errorText}</span>}
  </span>;
}

function StepDescription({className, ...props}: React.ComponentProps<'span'>) {
  return <span data-slot="step-description" className={cn('block max-w-(--measure-hint) truncate type-caption text-text-2', className)} {...props}/>;
}

function StepSeparator({className, ...props}: React.ComponentProps<'span'>) {
  const {orientation, size, value} = useSteps();
  const {step} = useStep();
  const filled = step < value;
  const horizontal = orientation === 'horizontal';
  return <span
    aria-hidden
    data-slot="step-separator"
    data-filled={filled ? '' : undefined}
    className={cn(
      'absolute block overflow-hidden rounded-pill bg-line group-last/step:hidden forced-colors:bg-[GrayText]',
      horizontal
        ? cn('end-2 h-0.5 -translate-y-1/2', size === 'sm' ? 'start-7.5 top-2' : 'start-9 top-2.5')
        : cn('bottom-1 w-0.5 -translate-x-1/2 rtl:translate-x-1/2', size === 'sm' ? 'start-2.75 top-5' : 'start-3.5 top-6'),
      className,
    )}
    {...props}
  >
    <span
      data-slot="step-separator-fill"
      className={cn(
        'block size-full rounded-pill transition-transform duration-(--dur-overlay) ease-out motion-reduce:transition-none forced-colors:bg-[CanvasText]',
        horizontal ? 'glaze-sm glaze-sm-x origin-left rtl:origin-right' : 'glaze-sm origin-top',
        filled ? 'scale-100' : horizontal ? 'scale-x-0' : 'scale-y-0',
      )}
    />
  </span>;
}

export {Steps, Step, StepTrigger, StepIndicator, StepText, StepTitle, StepDescription, StepSeparator, type StepsProps, type StepProps, type StepState, type StepsSize};

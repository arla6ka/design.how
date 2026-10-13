'use client';

import {createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode} from 'react';
import {Field as FieldPrimitive} from '@base-ui/react/field';
import {Fieldset as FieldsetPrimitive} from '@base-ui/react/fieldset';
import {Form as FormPrimitive} from '@base-ui/react/form';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, mergeClass} from '../lib/utils';

const fieldControlVariants = cva(
  [
    'w-full min-w-0 rounded-soft bg-page control-edge text-text-1 type-label pointer-coarse:text-base forced-colors:border',
    'transition-[background-color,box-shadow,outline-color] duration-(--dur-fast) ease-(--ease-step)',
    'placeholder:text-text-3',
    'focus-visible:outline-none focus-visible:[--frame-color:var(--border-focus)]! focus-visible:[--control-lift:var(--focus-halo)]!',
    'aria-invalid:[--frame-color:var(--fail-line)] data-invalid:[--frame-color:var(--fail-line)]',
    'hover:not-disabled:not-data-disabled:not-aria-invalid:not-data-invalid:not-[[readonly]]:[--frame-color:var(--line-control-hover)]',
    'disabled:cursor-not-allowed disabled:text-text-disabled disabled:placeholder:text-text-disabled disabled:[--frame-color:var(--line-row)] disabled:[--control-lift:var(--elev-none)]',
    'data-disabled:cursor-not-allowed data-disabled:text-text-disabled data-disabled:[--frame-color:var(--line-row)] data-disabled:[--control-lift:var(--elev-none)]',
    '[&[readonly]]:bg-well [&[readonly]]:[--frame-color:transparent] [&[readonly]]:[--control-lift:var(--elev-none)]',
  ],
  {
    variants: {
      size: {
        sm: 'h-(--control-sm) px-2',
        default: 'h-(--control) px-3',
        lg: 'h-(--control-lg) px-4',
      },
    },
    defaultVariants: {size: 'default'},
  },
);

type ControlSize = NonNullable<VariantProps<typeof fieldControlVariants>['size']>;

const fieldBoxVariants = cva(
  [
    'group/field-box relative flex w-full min-w-0 items-center rounded-soft bg-page control-edge text-text-1 type-label pointer-coarse:text-base forced-colors:border',
    'transition-[background-color,box-shadow,outline-color] duration-(--dur-fast) ease-(--ease-step)',
    'has-[[data-control]:focus]:[--frame-color:var(--border-focus)]! has-[[data-control]:focus]:[--control-lift:var(--focus-halo)]!',
    'data-[status=fail]:[--frame-color:var(--fail-line)]',
    'has-[[data-control][aria-invalid=true]]:[--frame-color:var(--fail-line)] has-[[data-control][data-invalid]]:[--frame-color:var(--fail-line)]',
    'hover:not-data-disabled:not-has-[[data-control]:disabled]:not-data-readonly:not-data-[status=fail]:not-has-[[data-control][aria-invalid=true]]:not-has-[[data-control][data-invalid]]:[--frame-color:var(--line-control-hover)]',
    'data-disabled:cursor-not-allowed data-disabled:text-text-disabled data-disabled:[--frame-color:var(--line-row)] data-disabled:[--control-lift:var(--elev-none)]',
    'has-[[data-control]:disabled]:cursor-not-allowed has-[[data-control]:disabled]:text-text-disabled has-[[data-control]:disabled]:[--frame-color:var(--line-row)] has-[[data-control]:disabled]:[--control-lift:var(--elev-none)]',
    'data-readonly:bg-well data-readonly:[--frame-color:transparent] data-readonly:[--control-lift:var(--elev-none)]',
  ],
  {
    variants: {
      size: {
        sm: 'h-(--control-sm)',
        default: 'h-(--control)',
        lg: 'h-(--control-lg)',
      },
    },
    defaultVariants: {size: 'default'},
  },
);

const labelClasses = [
  'inline-flex w-fit max-w-full min-w-0 items-center gap-2 type-label text-text-1 select-none [overflow-wrap:anywhere]',
  '[&_svg]:shrink-0 [&_svg]:text-text-2',
  'group-data-disabled/field:text-text-disabled group-data-disabled/field:cursor-not-allowed',
  'peer-disabled:text-text-disabled peer-disabled:cursor-not-allowed',
].join(' ');

type LabelProps = ComponentProps<'label'> & {
  optional?: boolean;
};

function Label({className, optional, children, ...props}: LabelProps) {
  return <label data-slot="label" className={cn(labelClasses, className)} {...props}>
    {children}
    {optional && <LabelHint>Optional</LabelHint>}
  </label>;
}

function LabelHint({className, ...props}: ComponentProps<'span'>) {
  return <span data-slot="label-hint" className={cn('type-body-sm text-text-3', className)} {...props}/>;
}

const InField = createContext(false);

const FieldDisabled = createContext(false);

function useFieldDisabled() {
  return useContext(FieldDisabled);
}

function FieldGroup({className, ...props}: ComponentProps<'div'>) {
  return <div
    data-slot="field-group"
    className={cn('group/field-group @container/field-group flex w-full flex-col gap-6 *:data-[slot=field-group]:gap-4', className)}
    {...props}
  />;
}

function FieldSet({className, ...props}: FieldsetPrimitive.Root.Props) {
  return <FieldsetPrimitive.Root
    data-slot="field-set"
    className={mergeClass('flex min-w-0 flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3', className)}
    {...props}
  />;
}

function FieldLegend({className, variant = 'legend', ...props}: FieldsetPrimitive.Legend.Props & {variant?: 'legend' | 'label'}) {
  return <FieldsetPrimitive.Legend
    data-slot="field-legend"
    data-variant={variant}
    className={mergeClass([
      'text-text-1 data-[variant=label]:type-label data-[variant=legend]:type-heading-sm',
      'data-disabled:text-text-disabled',
    ], className)}
    {...props}
  />;
}

const fieldVariants = cva('group/field flex w-full min-w-0 gap-2', {
  variants: {
    orientation: {
      vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
      horizontal: 'flex-row items-center gap-3 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto',
      responsive: [
        'flex-col *:w-full [&>.sr-only]:w-auto',
        '@field-group/field-group:flex-row @field-group/field-group:items-center @field-group/field-group:gap-6 @field-group/field-group:*:w-auto',
        '@field-group/field-group:has-[>[data-slot=field-content]]:items-start @field-group/field-group:*:data-[slot=field-label]:flex-auto',
        '@field-group/field-group:*:data-[slot=field-content]:flex-auto',
      ].join(' '),
    },
  },
  defaultVariants: {orientation: 'vertical'},
});

type FieldProps = FieldPrimitive.Root.Props & VariantProps<typeof fieldVariants>;

function FieldRoot({rootProps, invalid, disabled, onValidity}: {rootProps: ComponentProps<'div'>; invalid: boolean; disabled: boolean; onValidity: (invalid: boolean) => void}) {
  useEffect(() => { onValidity(invalid); }, [invalid, onValidity]);
  return <FieldDisabled.Provider value={disabled}><div {...rootProps} data-status={invalid ? 'fail' : undefined}/></FieldDisabled.Provider>;
}

function Field({className, orientation = 'vertical', validationMode, ...props}: FieldProps) {
  const [invalid, setInvalid] = useState(false);
  const nested = useContext(InField);
  useEffect(() => {
    if (nested && process.env.NODE_ENV !== 'production') console.warn('Quartz Field: a Field inside a Field binds its control to the outer label. Use FieldSet to group fields.');
  }, [nested]);
  return <InField.Provider value>
    <FieldPrimitive.Root
      data-slot="field"
      data-orientation={orientation}
      validationMode={validationMode ?? (invalid ? 'onChange' : 'onBlur')}
      className={mergeClass(fieldVariants({orientation}), className)}
      render={(rootProps, state) => <FieldRoot rootProps={rootProps as ComponentProps<'div'>} invalid={state.valid === false} disabled={!!state.disabled} onValidity={setInvalid}/>}
      {...props}
    />
  </InField.Provider>;
}

function FieldContent({className, ...props}: ComponentProps<'div'>) {
  return <div data-slot="field-content" className={cn('group/field-content flex flex-1 flex-col gap-1', className)} {...props}/>;
}

type FieldLabelProps = FieldPrimitive.Label.Props & {
  optional?: boolean;
};

function FieldLabel({className, optional, children, ...props}: FieldLabelProps) {
  return <FieldPrimitive.Label data-slot="field-label" className={mergeClass([labelClasses, 'data-disabled:text-text-disabled'], className)} {...props}>
    {children}
    {optional && <LabelHint>Optional</LabelHint>}
  </FieldPrimitive.Label>;
}

function FieldTitle({className, ...props}: ComponentProps<'div'>) {
  return <div data-slot="field-title" className={cn('flex w-fit items-center gap-2 type-label text-text-1 group-data-disabled/field:text-text-disabled', className)} {...props}/>;
}

function FieldDescription({className, ...props}: FieldPrimitive.Description.Props) {
  const inField = useContext(InField);
  const base = [
    'max-w-(--measure-hint) type-body-sm text-text-2 [overflow-wrap:anywhere] group-data-disabled/field:text-text-3 [[data-slot=field-legend]+&]:-mt-4',
    '[&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_code]:type-code-sm',
  ];
  if (!inField) {
    const {render: _render, className: _className, ...rest} = props as FieldPrimitive.Description.Props;
    return <p data-slot="field-description" className={cn(base, typeof className === 'string' && className)} {...(rest as ComponentProps<'p'>)}/>;
  }
  return <FieldPrimitive.Description data-slot="field-description" className={mergeClass(base, className)} {...props}/>;
}

function FieldSeparator({children, className, ...props}: ComponentProps<'div'> & {children?: ReactNode}) {
  return <div data-slot="field-separator" data-content={!!children} className={cn('relative flex h-5 items-center', className)} {...props}>
    <div aria-hidden className="h-px w-full bg-line-row"/>
    {children && <span data-slot="field-separator-content" className="absolute start-1/2 -translate-x-1/2 bg-page px-2 type-body-sm text-text-3 rtl:translate-x-1/2">{children}</span>}
  </div>;
}

type FieldErrorProps = FieldPrimitive.Error.Props & {
  errors?: Array<{message?: string} | undefined>;
};

function FieldError({className, children, errors, match, ...props}: FieldErrorProps) {
  const unique = errors ? [...new Map(errors.filter(e => e?.message).map(e => [e!.message, e!])).values()] : [];
  const content = children ?? (unique.length === 1 ? unique[0].message : unique.length > 1
    ? <ul className="flex flex-col gap-1">{unique.map(e => <li key={e.message}>{e.message}</li>)}</ul>
    : undefined);
  const always = content !== undefined;
  const inField = useContext(InField);
  if (errors && !unique.length && children === undefined) return null;
  const base = 'flex min-w-0 items-start gap-2 type-body-sm text-fail-text [overflow-wrap:anywhere]';
  if (!inField) {
    if (!always) return null;
    const {render: _render, ...rest} = props;
    return <div data-slot="field-error" data-status="fail" role="alert" className={cn(base, typeof className === 'string' && className)} {...(rest as ComponentProps<'div'>)}>{content}</div>;
  }

  return <FieldPrimitive.Error
    data-slot="field-error"
    data-status="fail"
    match={match ?? (always ? true : undefined)}
    className={mergeClass(base, className)}
    {...props}
    {...(always ? {children: content} : {})}
  />;
}

type FormProps = FormPrimitive.Props & {
  pending?: boolean;
};

function Form({className, pending, onSubmit, onFormSubmit, ...props}: FormProps) {
  return <FormPrimitive
    data-slot="form"
    aria-busy={pending || undefined}
    data-pending={pending || undefined}
    onSubmit={e => {
      if (pending) { e.preventDefault(); return; }
      onSubmit?.(e);
    }}
    onFormSubmit={onFormSubmit && ((values, details) => { if (!pending) onFormSubmit(values, details); })}
    className={mergeClass('flex w-full min-w-0 flex-col gap-6', className)}
    {...props}
  />;
}

function FormActions({className, ...props}: ComponentProps<'div'>) {
  return <div data-slot="form-actions" className={cn('flex flex-wrap items-center gap-2', className)} {...props}/>;
}

type FormStatusProps = ComponentProps<'p'> & {
  status?: 'ok' | 'fail';
  /** @deprecated Use status. */
  tone?: 'ok' | 'fail';
};

function FormStatus({className, status: statusProp, tone, children, ...props}: FormStatusProps) {
  const status = statusProp ?? tone;
  return <p
    data-slot="form-status"
    role="status"
    data-status={status === 'fail' ? 'fail' : undefined}
    className={cn(
      'flex min-h-5 items-start gap-2 type-body-sm text-text-1',
      status === 'fail' && 'text-fail-text',
      className,
    )}
    {...props}
  >{children}</p>;
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  Form,
  FormActions,
  FormStatus,
  Label,
  LabelHint,
  fieldBoxVariants,
  fieldControlVariants,
  labelClasses,
  useFieldDisabled,
  type ControlSize,
  type FieldProps,
  type FormProps,
  type LabelProps,
};

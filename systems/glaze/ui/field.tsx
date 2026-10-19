'use client';

import {createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode} from 'react';
import {Field as FieldPrimitive} from '@base-ui/react/field';
import {Fieldset as FieldsetPrimitive} from '@base-ui/react/fieldset';
import {Form as FormPrimitive} from '@base-ui/react/form';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn, mergeClass} from '../lib/utils';

const InField = createContext(false);

const FieldDisabled = createContext(false);

function useFieldDisabled() {
  return useContext(FieldDisabled);
}

const labelClasses = [
  'inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 type-label text-text-1 select-none [overflow-wrap:anywhere]',
  '[&_svg]:size-(--icon) [&_svg]:shrink-0 [&_svg]:text-text-3',
  'group-data-disabled/field:cursor-not-allowed group-data-disabled/field:text-text-disabled',
].join(' ');

function LabelHint({className, ...props}: ComponentProps<'span'>) {
  return <span data-slot="label-hint" className={cn('type-body-sm whitespace-nowrap text-text-2 group-data-disabled/field:text-text-disabled', className)} {...props}/>;
}

type Mark = {
  optional?: boolean;
  required?: boolean;
};

function marks({optional, required}: Mark) {
  if (optional) return <LabelHint>Optional</LabelHint>;
  if (required) return <LabelHint>Required</LabelHint>;
  return null;
}

type LabelProps = ComponentProps<'label'> & Mark;

function Label({className, optional, required, children, ...props}: LabelProps) {
  return <label data-slot="label" className={cn(labelClasses, 'peer-disabled:text-text-disabled', className)} {...props}>
    {children}
    {marks({optional, required})}
  </label>;
}

function FieldGroup({className, ...props}: ComponentProps<'div'>) {
  return <div
    data-slot="field-group"
    className={cn('group/field-group @container/field-group flex w-full min-w-0 flex-col gap-4 has-[>[data-slot=field-set]]:gap-6', className)}
    {...props}
  />;
}

function FieldSet({className, disabled, children, ...props}: FieldsetPrimitive.Root.Props) {
  return <FieldDisabled.Provider value={!!disabled}>
    <FieldsetPrimitive.Root
      data-slot="field-set"
      disabled={disabled}
      className={mergeClass('flex min-w-0 flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3', className)}
      {...props}
    >{children}</FieldsetPrimitive.Root>
  </FieldDisabled.Provider>;
}

function FieldLegend({className, variant = 'legend', ...props}: FieldsetPrimitive.Legend.Props & {variant?: 'legend' | 'label'}) {
  return <FieldsetPrimitive.Legend
    data-slot="field-legend"
    data-variant={variant}
    className={mergeClass('text-text-1 data-[variant=label]:type-label data-[variant=legend]:type-heading-sm data-disabled:text-text-disabled', className)}
    {...props}
  />;
}

const fieldVariants = cva('group/field flex w-full min-w-0', {
  variants: {
    orientation: {
      vertical: 'flex-col gap-1.5',
      horizontal: [
        'flex-row items-center gap-3 has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto *:data-[slot=field-label]:shrink-0',
        'has-[>[data-slot=input]]:gap-4 has-[>[data-slot=input]]:*:data-[slot=field-label]:w-(--label-col) has-[>[data-slot=input]]:*:data-[slot=field-label]:flex-none has-[>[data-slot=input]]:*:data-[slot=input]:flex-1',
        'has-[>[data-slot=textarea]]:items-start has-[>[data-slot=textarea]]:gap-4 has-[>[data-slot=textarea]]:*:data-[slot=field-label]:w-(--label-col) has-[>[data-slot=textarea]]:*:data-[slot=field-label]:flex-none has-[>[data-slot=textarea]]:*:data-[slot=field-label]:pt-1.5',
      ].join(' '),
      responsive: [
        'flex-col gap-1.5',
        '@md/field-group:flex-row @md/field-group:items-center @md/field-group:gap-6',
        '@md/field-group:*:data-[slot=field-label]:w-40 @md/field-group:*:data-[slot=field-label]:shrink-0 @md/field-group:*:data-[slot=field-content]:flex-auto',
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
  const inSet = useFieldDisabled();
  useEffect(() => {
    if (nested && process.env.NODE_ENV !== 'production') console.warn('Glaze Field: a Field inside a Field binds its control to the outer label. Use FieldSet to group fields.');
  }, [nested]);
  return <InField.Provider value>
    <FieldPrimitive.Root
      data-slot="field"
      data-orientation={orientation}
      validationMode={validationMode ?? (invalid ? 'onChange' : 'onBlur')}
      className={mergeClass(fieldVariants({orientation}), className)}
      render={(rootProps, state) => <FieldRoot rootProps={rootProps as ComponentProps<'div'>} invalid={state.valid === false} disabled={!!state.disabled || inSet} onValidity={setInvalid}/>}
      {...props}
    />
  </InField.Provider>;
}

function FieldContent({className, ...props}: ComponentProps<'div'>) {
  return <div data-slot="field-content" className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props}/>;
}

type FieldLabelProps = FieldPrimitive.Label.Props & Mark;

function FieldLabel({className, optional, required, children, ...props}: FieldLabelProps) {
  return <FieldPrimitive.Label data-slot="field-label" className={mergeClass([labelClasses, 'data-disabled:text-text-disabled'], className)} {...props}>
    {children}
    {marks({optional, required})}
  </FieldPrimitive.Label>;
}

function FieldTitle({className, optional, required, children, ...props}: ComponentProps<'div'> & Mark) {
  return <div data-slot="field-title" className={cn(labelClasses, className)} {...props}>
    {children}
    {marks({optional, required})}
  </div>;
}

const descriptionClasses = 'max-w-(--measure-hint) type-body-sm text-text-2 [overflow-wrap:anywhere] group-data-disabled/field:text-text-disabled [&_a]:underline [&_a]:underline-offset-2';

function FieldDescription({className, ...props}: FieldPrimitive.Description.Props) {
  const inField = useContext(InField);
  if (!inField) {
    const {render: _render, ...rest} = props;
    return <p data-slot="field-description" className={cn(descriptionClasses, typeof className === 'string' && className)} {...(rest as ComponentProps<'p'>)}/>;
  }
  return <FieldPrimitive.Description data-slot="field-description" className={mergeClass(descriptionClasses, className)} {...props}/>;
}

function FieldSeparator({children, className, ...props}: ComponentProps<'div'> & {children?: ReactNode}) {
  return <div data-slot="field-separator" role="separator" className={cn('flex items-center gap-3 type-caption text-text-2', className)} {...props}>
    <span aria-hidden className="h-px flex-1 bg-line"/>
    {children && <><span>{children}</span><span aria-hidden className="h-px flex-1 bg-line"/></>}
  </div>;
}

type FieldErrorProps = FieldPrimitive.Error.Props & {
  errors?: Array<{message?: string} | undefined>;
};

const errorClasses = 'flex min-w-0 max-w-(--measure-hint) flex-col gap-0.5 type-body-sm text-fail-text [overflow-wrap:anywhere]';

function FieldError({className, children, errors, match, ...props}: FieldErrorProps) {
  const unique = errors ? [...new Map(errors.filter(e => e?.message).map(e => [e!.message, e!])).values()] : [];
  const content = children ?? (unique.length === 1 ? unique[0].message : unique.length > 1
    ? <ul className="flex flex-col gap-0.5">{unique.map(e => <li key={e.message}>{e.message}</li>)}</ul>
    : undefined);
  const always = content !== undefined;
  const inField = useContext(InField);
  if (errors && !unique.length && children === undefined) return null;
  if (!inField) {
    if (!always) return null;
    const {render: _render, ...rest} = props;
    return <div data-slot="field-error" data-status="fail" role="alert" className={cn(errorClasses, typeof className === 'string' && className)} {...(rest as ComponentProps<'div'>)}>{content}</div>;
  }
  return <FieldPrimitive.Error
    data-slot="field-error"
    data-status="fail"
    match={match ?? (always ? true : undefined)}
    className={mergeClass(errorClasses, className)}
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
    onSubmit={e => {
      if (pending) { e.preventDefault(); return; }
      onSubmit?.(e);
    }}
    onFormSubmit={onFormSubmit && ((values, details) => { if (!pending) onFormSubmit(values, details); })}
    className={mergeClass('flex w-full min-w-0 flex-col gap-4', className)}
    {...props}
  />;
}

function FormActions({className, ...props}: ComponentProps<'div'>) {
  return <div data-slot="form-actions" className={cn('flex flex-wrap items-center gap-2', className)} {...props}/>;
}

function FormStatus({className, status, ...props}: ComponentProps<'p'> & {status?: 'ok' | 'fail'}) {
  return <p
    data-slot="form-status"
    role="status"
    data-status={status}
    className={cn('min-h-lh type-body-sm text-text-1 data-[status=fail]:text-fail-text data-[status=ok]:text-ok-text', className)}
    {...props}
  />;
}

export {
  Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle,
  Form, FormActions, FormStatus, Label, LabelHint, labelClasses, useFieldDisabled,
  type FieldProps, type FieldErrorProps, type FormProps, type LabelProps,
};

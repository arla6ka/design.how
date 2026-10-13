'use client';

import {Field as FieldPrimitive} from '@base-ui/react/field';
import {mergeClass} from '../lib/utils';

function Field({className, ...props}: FieldPrimitive.Root.Props) {
  return <FieldPrimitive.Root data-slot="field" className={mergeClass('flex w-full flex-col gap-1.5', className)} {...props}/>;
}

function FieldLabel({className, ...props}: FieldPrimitive.Label.Props) {
  return <FieldPrimitive.Label data-slot="field-label" className={mergeClass('text-sm font-medium text-fg data-disabled:text-fg-disabled', className)} {...props}/>;
}

function FieldDescription({className, ...props}: FieldPrimitive.Description.Props) {
  return <FieldPrimitive.Description data-slot="field-description" className={mergeClass('text-xs text-fg-3', className)} {...props}/>;
}

function FieldError({className, ...props}: FieldPrimitive.Error.Props) {
  return <FieldPrimitive.Error data-slot="field-error" className={mergeClass('text-xs text-danger-text', className)} {...props}/>;
}

export {Field, FieldLabel, FieldDescription, FieldError};

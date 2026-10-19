'use client';

import {useId, type ReactNode} from 'react';
import {cn} from '../lib/utils';
import {Item, ItemActions, ItemContent, ItemDescription, ItemTitle} from '../ui/item';
import {SegmentedControl, SegmentedControlItem} from '../ui/segmented-control';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../ui/select';

type AutonomyLevel = 'auto' | 'ask' | 'never';

type AutonomyOption<Value extends string> = {value: Value; label: string};

const defaultOptions: AutonomyOption<AutonomyLevel>[] = [
  {value: 'auto', label: 'Do it'},
  {value: 'ask', label: 'Ask first'},
  {value: 'never', label: 'Never'},
];

type AutonomyRuleProps<Value extends string = AutonomyLevel> = Omit<React.ComponentProps<'div'>, 'title' | 'children' | 'defaultValue' | 'onChange'> & {
  title: ReactNode;
  description?: ReactNode;
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  options?: AutonomyOption<Value>[];
  control?: 'segmented' | 'select';
  disabled?: boolean;
};

function AutonomyRule<Value extends string = AutonomyLevel>({
  title, description, value, defaultValue, onValueChange, options = defaultOptions as unknown as AutonomyOption<Value>[],
  control = 'segmented', disabled, className, ...props
}: AutonomyRuleProps<Value>) {
  const titleId = useId();
  const change = (next: string | null) => { if (next !== null) onValueChange?.(next as Value); };
  return <Item
    data-slot="autonomy-rule"
    data-control={control}
    disabled={disabled}
    className={cn('flex-wrap gap-y-2', className)}
    {...props}
  >
    <ItemContent className="min-w-40 basis-40">
      <ItemTitle id={titleId} data-slot="autonomy-rule-title"><span>{title}</span></ItemTitle>
      {description && <ItemDescription data-slot="autonomy-rule-description">{description}</ItemDescription>}
    </ItemContent>
    <ItemActions className="me-0 ms-auto">
      {control === 'select'
        ? <Select items={options} value={value} defaultValue={defaultValue} onValueChange={change} disabled={disabled}>
            <SelectTrigger size="sm" aria-labelledby={titleId} className="w-32"><SelectValue/></SelectTrigger>
            <SelectContent size="sm" align="end">{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        : <SegmentedControl size="sm" aria-labelledby={titleId} value={value} defaultValue={defaultValue} onValueChange={change} disabled={disabled}>
            {options.map(o => <SegmentedControlItem key={o.value} value={o.value}>{o.label}</SegmentedControlItem>)}
          </SegmentedControl>}
    </ItemActions>
  </Item>;
}

export {AutonomyRule, type AutonomyRuleProps, type AutonomyLevel, type AutonomyOption};

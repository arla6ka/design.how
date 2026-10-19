'use client';

import {AutonomyRule, type AutonomyLevel} from '../ai/autonomy-rule';
import {ItemGroup} from '../ui/item';

const rules: {title: string; level: AutonomyLevel}[] = [
  {title: 'Pay bills under $50', level: 'auto'},
  {title: 'Book tables and visits', level: 'ask'},
  {title: 'Message people for you', level: 'ask'},
  {title: 'Spend over $200', level: 'never'},
];

export function AssistantLimits({className}: {className?: string}) {
  return (
    <ItemGroup aria-label="On its own" className={className ?? 'w-full max-w-sm'}>
      {rules.map(r => <AutonomyRule key={r.title} title={r.title} defaultValue={r.level} control="select"/>)}
    </ItemGroup>
  );
}

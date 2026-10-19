'use client';

import {Button} from '../ui/button';
import {Card, CardFooter, CardHeader, CardMeta, CardTitle} from '../ui/card';
import {Chart} from '../ui/chart';
import {Panel} from '../ui/panel';
import {Status} from '../ui/status';

const days = [
  {day: 'Oct 8', control: 61, test: 62},
  {day: 'Oct 9', control: 60, test: 64},
  {day: 'Oct 10', control: 62, test: 66},
  {day: 'Oct 11', control: 61, test: 67},
  {day: 'Oct 12', control: 63, test: 69},
  {day: 'Oct 13', control: 62, test: 68},
  {day: 'Oct 14', control: 61, test: 69},
];

const arms = [
  {name: 'v14, control', rate: '61.4%'},
  {name: 'v15, test', rate: '67.9%', lead: '+6.5 pts'},
];

export function Experiment({className}: {className?: string}) {
  return (
    <Card aria-label="Refund flow experiment" className={className ?? 'w-full max-w-md'}>
      <Panel padding="none">
        <CardHeader>
          <CardTitle>Refund prompt test</CardTitle>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-3 px-3">
          {arms.map(a => <div key={a.name} className="flex min-w-0 flex-col gap-0.5">
            <dt className="type-caption text-text-2">{a.name}</dt>
            <dd className="flex items-baseline gap-2">
              <span className="type-heading data">{a.rate}</span>
              {a.lead && <Status status="ok" size="sm">{a.lead}</Status>}
            </dd>
          </div>)}
        </dl>
        <Chart type="line" frame="plain" title={<span className="sr-only">Resolved, by day</span>} label="Resolved, by day" data={days} xKey="day" valueFormat={v => `${v}%`} height={96} zero={false}
          config={{day: {label: 'Day'}, test: {label: 'v15'}, control: {label: 'v14'}}} className="p-3"/>
      </Panel>
      <CardFooter>
        <CardMeta>Day 7 of 14</CardMeta>
        <Button size="sm" variant="secondary">Stop test</Button>
        <Button size="sm" variant="confirm">Ship v15</Button>
      </CardFooter>
    </Card>
  );
}

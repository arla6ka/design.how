'use client';

import {Button} from '../ui/button';
import {Card, CardFooter, CardHeader, CardMeta, CardTitle, CardDescription} from '../ui/card';
import {Chart} from '../ui/chart';
import {Panel} from '../ui/panel';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../ui/table';

const week = [
  {day: 'Mon', conversations: 1610},
  {day: 'Tue', conversations: 1690},
  {day: 'Wed', conversations: 1655},
  {day: 'Thu', conversations: 1820},
  {day: 'Fri', conversations: 1975},
  {day: 'Sat', conversations: 1905},
  {day: 'Sun', conversations: 2000},
];

const topics = [
  {name: 'Return window', count: 3120, change: '+41%'},
  {name: 'Late delivery', count: 2486, change: '+22%'},
  {name: 'Wrong size', count: 1904, change: '-6%'},
];

const total = week.reduce((sum, d) => sum + d.conversations, 0);

export function ConversationInsights({className}: {className?: string}) {
  return (
    <Card aria-label="Conversation insights" className={className ?? 'w-full max-w-md'}>
      <Panel padding="none">
        <CardHeader>
          <CardTitle>Why are conversations up this week?</CardTitle>
          <CardDescription>Mostly the shorter return window.</CardDescription>
        </CardHeader>
        <p className="flex items-baseline gap-2 px-3">
          <span className="type-heading data">{total.toLocaleString('en-US')}</span>
          <span className="type-body-sm text-text-2 data">conversations, +18%</span>
        </p>
        <Chart type="line" frame="plain" title={<span className="sr-only">Conversations by day</span>} label="Conversations by day" data={week} xKey="day" area zero={false} height={88}
          valueFormat={v => `${(v / 1000).toFixed(1)}k`}
          config={{day: {label: 'Day'}, conversations: {label: 'Conversations'}}} className="px-3 pb-3"/>
      </Panel>
      <Panel padding="none">
        <Table frame="none" aria-label="Top topics">
          <TableHeader>
            <TableRow><TableHead>Topic</TableHead><TableHead numeric>Count</TableHead><TableHead numeric>Change</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {topics.map(t => <TableRow key={t.name}>
              <TableCell>{t.name}</TableCell>
              <TableCell numeric>{t.count.toLocaleString('en-US')}</TableCell>
              <TableCell numeric>{t.change}</TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      </Panel>
      <CardFooter>
        <CardMeta>Oct 10 to 16</CardMeta>
        <Button size="sm">Open report</Button>
      </CardFooter>
    </Card>
  );
}

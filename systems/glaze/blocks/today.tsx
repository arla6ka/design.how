'use client';

import {Response} from '../ai/response';
import {Button} from '../ui/button';
import {Card, CardContent, CardFooter, CardHeader, CardMeta, CardTitle} from '../ui/card';
import {Item, ItemContent, ItemGroup, ItemTitle} from '../ui/item';
import {Status, type StatusValue} from '../ui/status';

const handled: {task: string; status: StatusValue; word: string}[] = [
  {task: 'Renewed the car insurance', status: 'ok', word: 'Paid'},
  {task: 'Dentist moved to Thursday', status: 'ok', word: 'Moved'},
  {task: 'Table for four on Friday', status: 'waiting', word: 'Needs you'},
];

export function Today({className}: {className?: string}) {
  return (
    <section aria-label="Today" className={className ?? 'flex w-full max-w-sm flex-col gap-3'}>
      <Response>Nothing until 4 pm. One thing waits on you.</Response>
      <Card>
        <CardHeader>
          <CardTitle>Since 7 am</CardTitle>
        </CardHeader>
        <CardContent flush>
          <ItemGroup variant="plain" aria-label="Handled">
            {handled.map(h => <Item key={h.task}>
              <ItemContent><ItemTitle>{h.task}</ItemTitle></ItemContent>
              <Status status={h.status} size="sm" className="shrink-0">{h.word}</Status>
            </Item>)}
          </ItemGroup>
        </CardContent>
        <CardFooter>
          <CardMeta>Saturday, Oct 17</CardMeta>
          <Button size="sm">Ask by voice</Button>
        </CardFooter>
      </Card>
    </section>
  );
}

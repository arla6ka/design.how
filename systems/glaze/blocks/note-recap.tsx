'use client';

import {Response} from '../ai/response';
import {Button} from '../ui/button';
import {Card, CardContent, CardFooter, CardHeader, CardMeta, CardTitle} from '../ui/card';
import {Checkbox} from '../ui/checkbox';

const summary = 'A plumber can come **Tuesday, 9 to 11 am**, and I asked the landlord to cover it.';

const todos = [
  {label: 'Clear the cupboard under the sink', done: true},
  {label: 'Send two photos of the leak', done: false},
  {label: 'Be home Tuesday morning', done: false},
];

export function NoteRecap({className}: {className?: string}) {
  return (
    <section aria-label="Kitchen leak" className={className ?? 'flex w-full max-w-sm flex-col gap-3'}>
      <Response>{summary}</Response>
      <Card>
        <CardHeader>
          <CardTitle>Kitchen leak</CardTitle>
        </CardHeader>
        <CardContent className="gap-2.5 pt-0">
          {todos.map(t => <label key={t.label} className="flex items-center gap-2.5 type-body-sm">
            <Checkbox defaultChecked={t.done}/>
            <span className={t.done ? 'text-text-2 line-through' : undefined}>{t.label}</span>
          </label>)}
        </CardContent>
        <CardFooter>
          <CardMeta>From a voice note, 9:12 am</CardMeta>
          <Button size="sm">Share note</Button>
        </CardFooter>
      </Card>
    </section>
  );
}

import {Mention} from '../ai/mention';
import {Button} from '../ui/button';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardMeta, CardTitle} from '../ui/card';

type Part = string | {type: 'command' | 'doc' | 'agent'; label: string};

const steps: Part[][] = [
  ['Find the order with ', {type: 'command', label: 'lookup_order'}, '.'],
  ['If it is flagged for fraud, hand off to ', {type: 'agent', label: 'Trust and safety'}, ' and stop.'],
  ['Check the window in ', {type: 'doc', label: 'returns-policy.md'}, ' and offer an exchange first.'],
  ['Refund with ', {type: 'command', label: 'refund'}, '. Over $500, ask ', {type: 'agent', label: 'Support lead'}, ' first.'],
];

function Sentence({parts}: {parts: Part[]}) {
  return <>{parts.map((p, i) => typeof p === 'string' ? <span key={i}>{p}</span> : <Mention key={i} type={p.type}>{p.label}</Mention>)}</>;
}

export function AgentProcedure({className}: {className?: string}) {
  return (
    <Card aria-label="Refund procedure" className={className ?? 'w-full max-w-md'}>
      <CardHeader>
        <CardTitle>Refund procedure</CardTitle>
        <CardDescription>Runs when a customer asks for their money back.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex list-decimal flex-col gap-2 ps-5 type-body-sm text-text-1 marker:data marker:text-text-3">
          {steps.map((s, i) => <li key={i} className="ps-1"><Sentence parts={s}/></li>)}
        </ol>
      </CardContent>
      <CardFooter>
        <CardMeta>v7, edited 2h ago</CardMeta>
        <Button size="sm" variant="secondary">Test</Button>
        <Button size="sm">Publish</Button>
      </CardFooter>
    </Card>
  );
}

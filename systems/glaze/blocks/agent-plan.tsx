'use client';

import {AgentTurn, Message, MessageBubble, MessageBubbleContent, MessageContent, MessageHeader, MessageTime} from '../ai/message';
import {Response} from '../ai/response';
import {Button} from '../ui/button';
import {Card, CardContent, CardFooter, CardHeader, CardMeta, CardTitle} from '../ui/card';
import {Item, ItemContent, ItemGroup, ItemTitle} from '../ui/item';
import {Status, type StatusValue} from '../ui/status';

const changes: {name: string; status: StatusValue; word: string}[] = [
  {name: 'Returns journey', status: 'ok', word: 'Written'},
  {name: 'Order and refund tools', status: 'ok', word: 'Connected'},
  {name: '50 simulated customers', status: 'ok', word: '48 passed'},
  {name: 'Chat and email', status: 'waiting', word: 'Needs you'},
];

export function AgentPlan({className}: {className?: string}) {
  return (
    <section aria-label="Agent builder" className={className ?? 'flex w-full max-w-md flex-col gap-3'}>
      <Message from="user">
        <MessageContent>
          <MessageHeader>You<MessageTime>10:02</MessageTime></MessageHeader>
          <MessageBubble variant="outline">
            <MessageBubbleContent>Build a returns agent for our shoe store.</MessageBubbleContent>
          </MessageBubble>
        </MessageContent>
      </Message>
      <AgentTurn name="Agent builder" state="waiting" time="10:06">
        <Response>Built and tested. It goes live when you say so.</Response>
        <Card>
          <CardHeader>
            <CardTitle>Returns agent</CardTitle>
          </CardHeader>
          <CardContent flush>
            <ItemGroup variant="plain" aria-label="Changes">
              {changes.map(c => <Item key={c.name} size="sm">
                <ItemContent><ItemTitle>{c.name}</ItemTitle></ItemContent>
                <Status status={c.status} size="sm" className="shrink-0">{c.word}</Status>
              </Item>)}
            </ItemGroup>
          </CardContent>
          <CardFooter>
            <CardMeta>3 of 4</CardMeta>
            <Button size="sm" variant="secondary">View changes</Button>
            <Button size="sm" variant="confirm">Publish agent</Button>
          </CardFooter>
        </Card>
      </AgentTurn>
    </section>
  );
}

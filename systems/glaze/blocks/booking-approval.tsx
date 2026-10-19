'use client';

import {Message, MessageBubble, MessageBubbleContent, MessageContent, MessageHeader, AgentTurn} from '../ai/message';
import {Response} from '../ai/response';
import {Button} from '../ui/button';
import {Card, CardContent, CardFooter, CardHeader, CardMeta, CardTitle} from '../ui/card';
import {Item, ItemContent, ItemGroup, ItemTitle} from '../ui/item';

const booking = [
  {label: 'When', value: 'Fri, Oct 23, 7:30 pm'},
  {label: 'Where', value: 'Linden Table'},
  {label: 'Deposit', value: '$40'},
];

export function BookingApproval({className}: {className?: string}) {
  return (
    <section aria-label="Book a table" className={className ?? 'flex w-full max-w-sm flex-col gap-3'}>
      <Message from="user" className="px-0">
        <MessageContent>
          <MessageHeader className="sr-only">You</MessageHeader>
          <MessageBubble variant="outline">
            <MessageBubbleContent>Book a quiet table for four on Friday.</MessageBubbleContent>
          </MessageBubble>
        </MessageContent>
      </Message>
      <AgentTurn name="Assistant" state="waiting" className="px-0">
        <Response>Found a corner table. It needs a deposit, so I&apos;m asking first.</Response>
        <Card>
          <CardHeader>
            <CardTitle>Table for four</CardTitle>
          </CardHeader>
          <CardContent flush>
            <ItemGroup variant="plain" aria-label="Booking">
              {booking.map(b => <Item key={b.label}>
                <ItemContent><ItemTitle className="text-text-2">{b.label}</ItemTitle></ItemContent>
                <span className="shrink-0 type-body-sm data">{b.value}</span>
              </Item>)}
            </ItemGroup>
          </CardContent>
          <CardFooter>
            <CardMeta>Held till 6 pm</CardMeta>
            <Button size="sm" variant="secondary">Not now</Button>
            <Button size="sm" variant="confirm">Book table</Button>
          </CardFooter>
        </Card>
      </AgentTurn>
    </section>
  );
}

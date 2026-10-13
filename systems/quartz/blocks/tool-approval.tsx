'use client';

import {useEffect} from 'react';
import {AgentTurn, Message, MessageBubble, MessageBubbleContent, MessageContent, MessageHeader, MessageTime} from '../ai/message';
import {formatCount} from '../lib/format';
import {Response} from '../ai/response';
import {ToolCallList, registerTool, useToolCalls, type ToolCallData, type ToolReply} from '../ai/tool-call';

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const money = (v: unknown) => (typeof v === 'number' ? `$${formatCount(v)}` : undefined);

registerTool('search_policy', {
  active: 'Checking the refund policy', done: 'Checked the refund policy', ask: 'Check the refund policy', noun: 'policy check', lines: 8, detailMono: false,
  summary: {key: 'policy', one: 'checked a policy', many: n => `checked ${n} policies`},
});
registerTool('refund', {
  active: 'Refunding', done: 'Refunded', ask: 'Refund', noun: 'refund', lines: 8, detailMono: false,
  confirm: input => `Send a ${money(input.amount)} refund?`,
  summary: {key: 'refund', one: 'sent a refund', many: n => `sent ${n} refunds`},
  detail: input => [money(input.amount), str(input.customer) && `to ${str(input.customer)}`].filter(Boolean).join(' '),
});

function useApproval(calls: ToolCallData[], id: string) {
  const [state, dispatch] = useToolCalls(calls);
  const current = state.calls.find(c => c.id === id)!;
  const running = current.status === 'running';
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => dispatch({type: 'result', seq: 3, id, status: 'completed'}), 1200);
    return () => clearTimeout(timer);
  }, [running, dispatch, id]);
  const onReply = (call: ToolCallData, reply: ToolReply) => dispatch({type: 'reply', seq: 2, id: call.id, reply});
  return {calls: state.calls, current, onReply};
}

const order = '#4821';

const policy: ToolCallData = {id: 'c0', seq: 1, tool: 'search_policy', status: 'completed', input: {query: 'refund policy'}, startedAt: 0, endedAt: 90};
const refund: ToolCallData = {
  id: 'c1', seq: 1, tool: 'refund', status: 'awaiting-permission',
  input: {amount: 640, customer: 'Maya Chen', order},
  permission: {patterns: [`$640.00 to Maya Chen, order ${order}`], message: `Refunds Maya Chen for order ${order}. The card network pays it out in 5 to 10 days.`},
};

export function ToolApproval({ask = true, reason = true, label = 'Tool approval', className}: {ask?: boolean; reason?: boolean; label?: string; className?: string}) {
  const {calls, current, onReply} = useApproval([policy, refund], refund.id);
  const turn = current.status === 'awaiting-permission' ? 'waiting' : current.status === 'running' ? 'live' : 'done';
  return (
    <section aria-label={label} className={className ?? 'flex w-full max-w-xl flex-col gap-3'}>
      {ask && <Message from="user">
        <MessageContent>
          <MessageHeader>Ana<MessageTime>14:03</MessageTime></MessageHeader>
          <MessageBubble><MessageBubbleContent>Maya Chen was double charged. Refund her.</MessageBubbleContent></MessageBubble>
        </MessageContent>
      </Message>}
      <AgentTurn name="support-agent" state={turn} time="14:03">
        {reason && <Response>{`Maya was charged twice for order ${order}, $640 each time. Refunding one charge fixes it. It moves money, so I need your go-ahead.`}</Response>}
        <ToolCallList calls={calls} live onReply={onReply}/>
        {current.status === 'completed' && <Response>Done. Maya has her refund and a reply.</Response>}
        {current.status === 'denied' && <Response>Left the refund alone. Maya is still charged twice.</Response>}
      </AgentTurn>
    </section>
  );
}

export function Approval() {
  return <ToolApproval reason={false} label="Approval" className="flex w-full max-w-md flex-col gap-3"/>;
}

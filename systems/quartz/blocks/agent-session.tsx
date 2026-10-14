'use client';

import {Fragment, useCallback, useEffect, useRef, useState} from 'react';
import {
  Conversation, ConversationContent, ConversationJump, ConversationProvider, ConversationTail, ConversationTimeline, ConversationViewport,
  useConversation, type ConversationRow, type ConversationStatus,
} from '../ai/conversation';
import {AgentTurn as Turn, Message, MessageBubble, MessageBubbleContent, MessageContent, MessageFooter, MessageHeader, MessageModel, MessageTime, type MessageStatusProps} from '../ai/message';
import {PromptInput, PromptQueue, type PromptInputHandle, type PromptValue, type QueuedMessage} from '../ai/prompt-input';
import {Response} from '../ai/response';
import type {SendStatus} from '../ai/send-button';
import {ToolCallList, registerTool, useToolCalls, type ToolCallData, type ToolRenderer} from '../ai/tool-call';
import {CopyButton} from '../ui/copy-button';

const order = '#4821';
const earlier = '#4790';
const agent = 'support-agent';
const t = (s: number) => ({startedAt: 0, endedAt: s * 1000});

const supportTool = (active: string, done: string, ask: string, noun: string, key: string, one: string, many: (n: number) => string, detail?: (input: Record<string, unknown>) => string | undefined): ToolRenderer => ({
  active, done, ask, noun, lines: 8, detailMono: !!detail,
  summary: {key, one, many}, detail,
});
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

registerTool('lookup_order', supportTool('Looking up order', 'Looked up order', 'Look up order', 'order', 'order', 'looked up an order', n => `looked up ${n} orders`, input => str(input.order)));
registerTool('search_policy', supportTool('Checking the refund policy', 'Checked the refund policy', 'Check the refund policy', 'policy check', 'policy', 'checked a policy', n => `checked ${n} policies`));
registerTool('draft_reply', supportTool('Drafting the reply', 'Drafted the reply', 'Draft the reply', 'reply', 'reply', 'drafted a reply', n => `drafted ${n} replies`));
registerTool('run_eval', supportTool('Running evals', 'Ran evals', 'Run evals', 'eval run', 'eval', 'ran evals', n => `ran evals ${n} times`, input => str(input.suite)));

const workCalls: ToolCallData[] = [
  {id: 'w1', seq: 1, tool: 'lookup_order', status: 'completed', input: {order}, ...t(0.2)},
  {id: 'w2', seq: 1, tool: 'search_policy', status: 'completed', input: {query: 'refund policy'}, ...t(0.4)},
  {id: 'w3', seq: 1, tool: 'draft_reply', status: 'completed', input: {order}, ...t(1.1)},
  {id: 'w4', seq: 1, tool: 'run_eval', status: 'running', input: {suite: 'refund-policy'}, startedAt: Date.now() - 4200},
];

const runCalls: ToolCallData[] = [workCalls[0], workCalls[1], {id: 'r3', seq: 1, tool: 'draft_reply', status: 'running', input: {order}, startedAt: Date.now() - 2600}];

export function AgentRun() {
  const [asks, setAsks] = useState<{id: number; text: string; reply?: string}[]>([]);
  const [status, setStatus] = useState<SendStatus>('ready');
  const [run, setRun] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = (value: PromptValue) => {
    const id = run + 1;
    setRun(id);
    setStatus('streaming');
    setAsks(a => [...a, {id, text: value.serialized}]);
    timer.current = setTimeout(() => {
      setAsks(a => a.map(m => (m.id === id ? {...m, reply: 'Done. Maya has her refund and a reply.'} : m)));
      setStatus('ready');
    }, 900);
  };
  const stop = (generation: string | number | undefined) => {
    if (generation !== run) return;
    clearTimeout(timer.current);
    setStatus('ready');
  };
  return (
    <section aria-label="Agent run" className="flex w-full max-w-md flex-col gap-3 *:data-[slot=message]:px-0">
      <Message from="user">
        <MessageContent>
          <MessageHeader>Ana<MessageTime>14:02</MessageTime></MessageHeader>
          <MessageBubble><MessageBubbleContent>Refund order {order} and let the customer know.</MessageBubbleContent></MessageBubble>
        </MessageContent>
      </Message>
      <AgentTurn state="live" time="14:02"><ToolCallList calls={runCalls} live/></AgentTurn>
      {asks.map(m => <Fragment key={m.id}>
        <Message from="user">
          <MessageContent>
            <MessageHeader>Ana<MessageTime>14:03</MessageTime></MessageHeader>
            <MessageBubble><MessageBubbleContent>{m.text}</MessageBubbleContent></MessageBubble>
          </MessageContent>
        </Message>
        {m.reply && <AgentTurn time="14:03"><Response>{m.reply}</Response></AgentTurn>}
      </Fragment>)}
      <PromptInput
        label={`Message ${agent}`}
        layout="inline"
        placeholder="Ask support-agent to do something"
        status={status}
        generation={run}
        onStop={stop}
        onSubmit={send}
        onAttach={() => {}}
      />
    </section>
  );
}

const earlierCalls: ToolCallData[] = [
  {id: 'e1', seq: 1, tool: 'search_policy', status: 'completed', input: {query: 'refund limit'}, ...t(6.2)},
  {id: 'e2', seq: 1, tool: 'lookup_order', status: 'completed', input: {order: earlier}, ...t(14)},
];

function AgentTurn({state = 'done', time, children}: {state?: MessageStatusProps['state']; time: string; children: React.ReactNode}) {
  return <Turn name={agent} state={state} time={time}>{children}</Turn>;
}

function TurnFooter({model, text}: {model: string; text: string}) {
  return <MessageFooter>
    <CopyButton value={text} label="answer" size="icon-sm"/>
    <MessageModel model={model}/>
  </MessageFooter>;
}

const firstAnswer = 'Every refund over **$500** waits for a person to approve it. 37 have queued since 06:00, and the oldest has waited 52 minutes.';
const lastAnswer = 'Sent the replies and logged each one on its ticket.';

const history: ConversationRow[] = [
  {type: 'user', id: 'u1', name: 'Ana', meta: '14:01', text: 'Why are refund replies slow since this morning?'},
  {type: 'assistant', id: 'a1', content: <AgentTurn time="14:01">
    <ToolCallList calls={earlierCalls}/>
    <Response>{firstAnswer}</Response>
    <TurnFooter model="model-s" text={firstAnswer.replaceAll('**', '')}/>
  </AgentTurn>},
  {type: 'user', id: 'u2', name: 'Ana', meta: '14:02', text: 'Draft replies for the queued refunds and run the refund evals.'},
];

function Composer({busy, queue, setQueue, onSend, status, run, onStop}: {
  busy: boolean; queue: QueuedMessage[]; setQueue: React.Dispatch<React.SetStateAction<QueuedMessage[]>>;
  onSend: (text: string) => void; status: SendStatus; run: number; onStop: (generation: string | number | undefined) => void;
}) {
  const composer = useRef<PromptInputHandle>(null);
  const {snap} = useConversation();
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => {
    const head = queue[0];
    if (busy || !head || head.status === 'failed' || editing === head.id) return;
    setQueue(q => q.slice(1));
    onSend(head.text);
  }, [busy, queue, editing, setQueue, onSend]);
  const submit = (value: PromptValue) => {
    if (busy || queue.length) setQueue(q => [...q, {id: `q${Date.now()}`, text: value.serialized}]);
    else onSend(value.serialized);
    snap();
  };
  return <div className="flex flex-col">
    <PromptQueue
      items={queue}
      editingId={editing}
      onEditingChange={setEditing}
      onEdit={(id, text) => setQueue(q => q.map(m => (m.id === id ? {...m, text, status: 'queued', error: undefined} : m)))}
      onRemove={id => setQueue(q => q.filter(m => m.id !== id))}
      onRetry={id => setQueue(q => q.map(m => (m.id === id ? {...m, status: 'queued', error: undefined} : m)))}
      onMove={(id, index) => setQueue(q => { const item = q.find(m => m.id === id); const next = q.filter(m => m.id !== id); if (item) next.splice(index, 0, item); return next; })}
      returnFocus={() => composer.current?.focus()}
    />
    <PromptInput
      ref={composer}
      label={`Message ${agent}`}
      draftKey={`session:${agent}`}
      status={status}
      generation={run}
      onStop={onStop}
      onSubmit={submit}
      placeholder={busy ? 'Queue a follow-up' : 'Ask support-agent to do something'}
    />
  </div>;
}

export function AgentSession() {
  const [tools, dispatch] = useToolCalls(workCalls);
  const [rows, setRows] = useState(history);
  const [status, setStatus] = useState<SendStatus>('streaming');
  const [run, setRun] = useState(1);
  const [queue, setQueue] = useState<QueuedMessage[]>([{id: 'q1', text: 'Then send the replies to the customers'}]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const busy = status === 'submitted' || status === 'streaming' || status === 'stopping';

  const latest = useRef(1);
  const send = useCallback((text: string) => {
    const id = ++latest.current;
    setRun(id);
    setStatus('submitted');
    setRows(rs => [...rs, {type: 'user', id: `u${id}`, name: 'Ana', text}, {type: 'thinking', id: `t${id}`, author: agent}]);
    timers.current.push(setTimeout(() => {
      if (latest.current !== id) return;
      setRows(rs => [...rs.filter(row => row.type !== 'thinking'), {type: 'assistant', id: `a${id}`, content: <AgentTurn time="14:04"><Response>{lastAnswer}</Response><TurnFooter model="model-s" text={lastAnswer}/></AgentTurn>}]);
      setStatus('ready');
    }, 900));
  }, []);
  const stop = (generation: string | number | undefined) => {
    if (generation !== run) return;
    if (run === 1) dispatch({type: 'stop', gen: tools.gen});
    timers.current.forEach(clearTimeout);
    setRows(rs => [...rs.filter(row => row.type !== 'thinking'), {type: 'divider', id: `s${run}`, reason: 'interrupted'}]);
    setStatus('ready');
  };

  const firstTurnLive = run === 1 && busy;
  const thread: ConversationRow[] = [
    ...rows.slice(0, history.length),
    {type: 'assistant', id: 'a2', content: <AgentTurn state={firstTurnLive ? 'live' : tools.stopped ? 'stopped' : 'done'} time="14:02"><ToolCallList calls={tools.calls} live={firstTurnLive}/></AgentTurn>},
    ...rows.slice(history.length),
  ];
  const conversation: ConversationStatus = busy ? 'streaming' : rows.at(-1)?.type === 'divider' ? 'stopped' : 'idle';

  return <section aria-label="Agent session" className="flex h-140 w-full max-w-2xl flex-col gap-4">
    <ConversationProvider status={conversation}>
      <Conversation className="min-h-0 flex-1">
        <ConversationViewport aria-label={`Session with ${agent}`}>
          <ConversationContent className="pb-2">
            <ConversationTimeline rows={thread}/>
            <ConversationTail>
              {conversation === 'idle' && <CopyButton value={rows.some(row => row.id.startsWith('a') && row.id !== 'a1') ? lastAnswer : firstAnswer.replaceAll('**', '')} label="answer" size="icon-sm"/>}
            </ConversationTail>
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump/>
      </Conversation>
      <Composer busy={busy} queue={queue} setQueue={setQueue} onSend={send} status={status} run={run} onStop={stop}/>
    </ConversationProvider>
  </section>;
}

'use client';

import {useEffect, useState} from 'react';
import {Icon, Checkmark, CircleDash, Close, Pause} from '../icon';
import {cn} from '../lib/utils';
import {formatDuration} from '../ai/tool-call';
import {Avatar} from '../ui/avatar';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {Card, CardHeader, CardMeta, CardTitle} from '../ui/card';
import {Item, ItemContent, ItemDescription, ItemTitle} from '../ui/item';
import {LogViewer, type LogLine} from '../ui/log-viewer';
import {Panel, PanelBody, PanelFooter, PanelHeader, PanelMeta, PanelTitle} from '../ui/panel';
import {Progress} from '../ui/progress';
import {Status, StatusArc, type StatusValue} from '../ui/status';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../ui/table';
import {Timeline, type TimelineSpan} from '../ui/timeline';

const logLines: LogLine[] = [
  {id: 1, time: '14:02:11', level: 'info', source: 'draft', message: 'Saved triage prompt v14'},
  {id: 2, time: '14:02:19', level: 'info', source: 'canary', message: '10% of conversations on v14'},
  {id: 3, time: '14:02:20', level: 'warn', source: 'eval', message: 'Reply time 1.9s of 2s'},
  {id: 4, time: '14:02:24', level: 'fail', source: 'eval', message: 'refund-policy 37 of 40'},
  {id: 5, time: '14:02:24', level: 'info', source: 'rollout', message: 'Rollout paused at 10%'},
];

export function DeployLog({height = 180, className}: {height?: number; className?: string}) {
  return <LogViewer label="Release log for triage prompt v14" kind="deploy" lines={logLines} toolbar={false} follow={false} wrap={false} height={height} className={className ?? 'w-full max-w-lg'}/>;
}

type Decision = 'paused' | 'resuming' | 'rolled-back';

type Step = {id: string; name: string; meta?: string; status: StatusValue; word?: string; ms?: number; detail: string};

function stepsFor(decision: Decision): Step[] {
  return [
    {id: 'draft', name: 'Draft', status: 'ok', ms: 21_000, detail: 'Saved v14, shorter refund replies'},
    {
      id: 'canary', name: 'Canary', meta: '10%', ms: 142_000,
      status: decision === 'paused' ? 'waiting' : decision === 'resuming' ? 'running' : 'idle',
      word: decision === 'paused' ? 'Paused' : decision === 'resuming' ? 'Resuming' : 'Rolled back',
      detail: decision === 'rolled-back' ? 'Conversations went back to v13' : '10% of conversations since 14:02',
    },
    {id: 'evals', name: 'Evals', meta: '2 of 3', status: 'fail', ms: 83_000, detail: 'refund-policy scored 37 of 40'},
    {
      id: 'full', name: 'Everyone', status: decision === 'rolled-back' ? 'idle' : 'queued', word: decision === 'rolled-back' ? 'Skipped' : undefined,
      detail: decision === 'rolled-back' ? 'v13 stays live' : 'Starts when the canary resumes',
    },
  ];
}

function StepMark({status}: {status: StatusValue}) {
  const icon = status === 'ok' ? Checkmark : status === 'warn' || status === 'waiting' ? Pause : status === 'fail' ? Close : CircleDash;
  return <span aria-hidden className="relative flex size-4 shrink-0 items-center justify-center bg-page text-text-3">
    {status === 'running' ? <StatusArc/>
      : <Icon icon={icon} size={12} className={cn(status === 'ok' && 'text-text-2', status === 'warn' && 'text-warn-text', status === 'fail' && 'text-fail-text')}/>}
  </span>;
}

function RolloutStep({step}: {step: Step}) {
  return (
    <li className="group/step relative flex min-h-(--row-lg) items-center gap-3 px-3 py-2">
      <span aria-hidden className="absolute start-5 top-0 -translate-x-1/2 rtl:translate-x-1/2 bottom-0 w-px bg-(--line-control) group-first/step:top-1/2 group-last/step:bottom-1/2"/>
      <StepMark status={step.status}/>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-label">{step.name}{step.meta && <span className="ms-1.5 text-text-3 data">{step.meta}</span>}</span>
        <span className="truncate type-body-sm text-text-3">{step.detail}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <Status status={step.status === 'running' ? 'ok' : step.status}>{step.word}</Status>
        {step.ms !== undefined && <span className="type-body-sm text-text-3 data">{formatDuration(step.ms)}</span>}
      </span>
    </li>
  );
}

const RELEASE_MS = 163_000;
const WINDOW = 30 * 60;
const START = WINDOW - 7;

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export function DeployLook({className}: {className?: string}) {
  const [decision, setDecision] = useState<Decision>('paused');
  const [left, setLeft] = useState(START);
  const waiting = decision === 'paused';

  useEffect(() => {
    if (!waiting) return;
    if (left <= 0) { setDecision('rolled-back'); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [waiting, left]);

  return (
    <section aria-label="Release triage prompt v14" className={cn('@container/deploy flex flex-col gap-3 text-text-1', className ?? 'w-full max-w-md')}>
      <Panel aria-label="Release">
        <PanelHeader><PanelTitle className="flex items-center gap-2">Triage prompt<Badge kind="deploy" label="v14"/></PanelTitle></PanelHeader>
        <PanelBody>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-3 type-body-sm text-text-2">
            <span className="min-w-0 truncate text-text-1">Shorter refund replies</span>
            <span className="flex flex-wrap gap-x-3 text-text-3 data">
              <span className="whitespace-nowrap">14:02</span>
              <span className="whitespace-nowrap">{formatDuration(RELEASE_MS)}</span>
            </span>
          </div>
          <p className="px-3 pb-3 type-body text-text-2" aria-live="polite">
            {decision === 'paused' && <>Paused at 10% of conversations after the <span className="text-text-1">refund-policy</span> eval scored 37 of 40.</>}
            {decision === 'resuming' && <>Resuming from 10% of conversations. <span className="text-text-1">refund-policy</span> still scores 37 of 40.</>}
            {decision === 'rolled-back' && <>Rolled back to <span className="text-text-1 type-tag">v13</span>. Conversations are back on the previous release.</>}
          </p>
        </PanelBody>
        <PanelFooter className="@max-xs/deploy:flex-col-reverse @max-xs/deploy:items-stretch">
          <Button variant="secondary" disabled={!waiting} onClick={() => setDecision('rolled-back')}>Roll back</Button>
          <Button disabled={!waiting} onClick={() => setDecision('resuming')}>{decision === 'resuming' ? 'Resuming' : 'Resume rollout'}</Button>
        </PanelFooter>
      </Panel>
      <Panel aria-label="Rollout">
        <PanelHeader><PanelTitle>Rollout</PanelTitle><PanelMeta>{decision === 'rolled-back' ? '0%' : '10%'}</PanelMeta></PanelHeader>
        <PanelBody>
          <ol aria-label="Rollout steps">
            {stepsFor(decision).map(step => <RolloutStep key={step.id} step={step}/>)}
          </ol>
        </PanelBody>
      </Panel>
      <Panel aria-label="Automatic roll back">
        <PanelHeader>
          <PanelTitle>Automatic roll back</PanelTitle>
          <PanelMeta>{waiting ? 'at 14:32' : 'Stopped'}</PanelMeta>
        </PanelHeader>
        <PanelBody>
          <div className="flex flex-col gap-2.5 p-4">
            <p className="flex items-baseline gap-1.5 type-label">
              <span role="timer" className="tabular-nums data">{waiting ? clock(left) : '0:00'}</span>
              <span className="text-text-3">{waiting ? 'left' : 'Timer stopped'}</span>
            </p>
            <div data-status="warn"><Progress aria-label="Time left to roll back automatically" value={waiting ? left : 0} max={WINDOW}/></div>
            <p className="type-body-sm text-text-2">
              {waiting
                ? <>If nobody decides, the 10% of conversations on <span className="text-text-1">v14</span> go back to <span className="text-text-1">v13</span>.</>
                : decision === 'rolled-back' ? <>Conversations are back on <span className="text-text-1">v13</span>.</> : 'The rollout resumes from 10%.'}
            </p>
          </div>
        </PanelBody>
        <PanelFooter>
          <Button variant="secondary" disabled={!waiting} onClick={() => setDecision('rolled-back')}>Roll back now</Button>
        </PanelFooter>
      </Panel>
    </section>
  );
}

const rollout: TimelineSpan[] = [
  {id: 'draft', label: 'draft', start: 0, end: 21_000, kind: 'deploy'},
  {id: 'canary', label: 'rollout 10%', start: 21_000, end: 80_000, kind: 'deploy'},
  {id: 'checks', label: 'evals', start: 80_000, end: 163_000, kind: 'deploy', status: 'warn', meta: '2 of 3'},
  {id: 'paused', label: 'everyone', start: 163_000, status: 'waiting', waitingLabel: 'Paused'},
];

const evals = [
  {name: 'refund-policy', status: 'fail', score: '37 of 40'},
  {name: 'tone-check', status: 'ok', score: '40 of 40'},
  {name: 'escalation', status: 'ok', score: '39 of 40'},
] as const;

export function Evals({className}: {className?: string}) {
  return (
    <Table title="Evals" count={<Status status="fail">1 failed</Status>} size="sm" frameClassName={className ?? 'w-full max-w-md'}>
      <TableHeader><TableRow><TableHead>Eval</TableHead><TableHead className="text-end">Score</TableHead><TableHead className="w-(--status-column) text-end">Status</TableHead></TableRow></TableHeader>
      <TableBody>
        {evals.map(e => <TableRow key={e.name} status={e.status === 'fail' ? 'fail' : undefined}>
          <TableCell className="type-tag">{e.name}</TableCell>
          <TableCell className="text-end data">{e.score}</TableCell>
          <TableCell className="text-end"><Status status={e.status}/></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  );
}

const deploys = [
  {id: 'v14', date: 'Sep 30', time: '14:02', title: 'Shorter refund replies', body: 'Refund replies drop to three sentences; the policy link stays in the last one.', version: 'v14', by: 'Ana Marsh', state: 'paused'},
  {id: 'v13', date: 'Sep 28', time: '09:41', title: 'Friendlier tone', body: 'Softened the opening line. tone-check dropped to 31 of 40, so it went back.', version: 'v13', by: 'Maya Chen', state: 'rolled-back'},
  {id: 'v12', date: 'Sep 25', time: '17:15', title: 'Escalations go to the on-call queue', body: 'Escalations page the on-call queue instead of the shared inbox.', version: 'v12', by: 'Ana Marsh', state: 'done'},
] as const;

export function DeployHistory({className}: {className?: string}) {
  return (
    <Card data-kind="deploy" aria-labelledby="release-history-title" className={cn('w-full max-w-2xl', className)}>
      <CardHeader><CardTitle id="release-history-title">Releases</CardTitle><CardMeta>{deploys.length}</CardMeta></CardHeader>
      <ol>
        {deploys.map(d => (
          <Item key={d.id} render={<li/>}>
            <ItemContent>
              <ItemTitle><span>{d.title}</span><span className="type-tag text-text-1">{d.version}</span></ItemTitle>
              <ItemDescription>{d.body}</ItemDescription>
              <ItemDescription className="flex items-center gap-2"><Avatar size="xs" name={d.by} decorative/>{d.by}<span className="text-text-3 data">{d.date}, {d.time}</span></ItemDescription>
            </ItemContent>
            <Status status={d.state === 'paused' ? 'waiting' : d.state === 'rolled-back' ? 'fail' : 'idle'}>
              {d.state === 'paused' ? 'Paused' : d.state === 'rolled-back' ? 'Rolled back' : 'Replaced'}
            </Status>
          </Item>
        ))}
      </ol>
    </Card>
  );
}

export function DeployDetail() {
  return (
    <section aria-label="Prompt release" className="@container/page flex w-full max-w-5xl flex-col gap-6 text-text-1">
      <div className="grid grid-cols-1 gap-6 @3xl/page:grid-cols-2">
        <DeployLook className="w-full self-start"/>
        <Evals className="w-full self-start"/>
      </div>
      <Timeline label="Rollout of triage prompt v14" kind="deploy" spans={rollout} now={204_000}/>
      <DeployLog height={160} className="w-full"/>
      <DeployHistory className="max-w-none"/>
    </section>
  );
}

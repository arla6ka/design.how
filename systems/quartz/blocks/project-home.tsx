'use client';

import {useState} from 'react';
import {cn} from '../lib/utils';
import {Badge} from '../ui/badge';
import {Button} from '../ui/button';
import {Chart} from '../ui/chart';
import {FilterBar, FilterBarSearch, FilterToggle} from '../ui/filter-bar';
import {Item, ItemActions, ItemContent, ItemDescription, ItemTitle} from '../ui/item';
import {Panel, PanelAction, PanelBody, PanelHeader, PanelMeta, PanelTitle} from '../ui/panel';
import {SegmentedControl, SegmentedControlItem} from '../ui/segmented-control';
import {Stat, StatDelta, StatGroup, StatLabel, StatUnit, StatValue, type Trend} from '../ui/stat';
import {InkSlot, Status} from '../ui/status';
import {DataTable, type ColumnDef} from '../ui/table';

type Range = '24h' | '7d';

const traffic: Record<Range, {at: string; ok: number; failed: number}[]> = {
  '24h': [22, 18, 14, 12, 11, 15, 24, 41, 63, 78, 86, 91, 88, 84, 79, 82, 90, 87, 72, 58, 44, 36, 30, 26].map((n, i) => ({at: `${String(i).padStart(2, '0')}:00`, ok: n, failed: [9, 10, 17].includes(i) ? 3 : i === 12 ? 6 : 0})),
  '7d': [612, 980, 640, 1010, 590, 1104, 702, 1220, 660, 1180, 410, 520, 680, 1284].map((n, i) => ({at: `${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Math.floor(i / 2)]} ${i % 2 ? 'pm' : 'am'}`, ok: n, failed: i === 7 ? 41 : Math.round(n * 0.012)})),
};
const series = {ok: {label: 'Resolved', kind: 'run' as const}, failed: {label: 'Escalated', status: 'fail' as const}};

type Metric = {label: string; value: string; unit?: string; change: string; trend: Trend};

const metrics: Record<Range, Metric[]> = {
  '24h': [
    {label: 'Conversations', value: '1,284', change: '+4%', trend: 'up'},
    {label: 'Resolved', value: '98.2', unit: '%', change: '+0.4%', trend: 'up'},
    {label: 'Reply time', value: '1.9', unit: 's', change: '+12%', trend: 'up'},
    {label: 'Cost', value: '$12.40', change: '+4%', trend: 'up'},
  ],
  '7d': [
    {label: 'Conversations', value: '11,358', change: '+9%', trend: 'up'},
    {label: 'Resolved', value: '97.9', unit: '%', change: '−0.2%', trend: 'down'},
    {label: 'Reply time', value: '1.7', unit: 's', change: '−3%', trend: 'down'},
    {label: 'Cost', value: '$96.10', change: '+7%', trend: 'up'},
  ],
};

function MetricStrip({range}: {range: Range}) {
  return <StatGroup variant="plain" role="group" aria-label="Summary" className="rule-row">
    {metrics[range].map(m => <Stat key={m.label}>
      <StatLabel>{m.label}</StatLabel>
      <StatValue>{m.value}{m.unit && <StatUnit>{m.unit}</StatUnit>}</StatValue>
      <StatDelta trend={m.trend}>{m.change}</StatDelta>
    </Stat>)}
  </StatGroup>;
}

export function RunsFrame({range, onRangeChange, height = 120, metrics: showMetrics = true, className}: {range: Range; onRangeChange: (range: Range) => void; height?: number; metrics?: boolean; className?: string}) {
  const day = range === '24h';
  const control = <SegmentedControl size="xs" aria-label="Range" value={range} onValueChange={v => onRangeChange(v as Range)}>
    <SegmentedControlItem value="24h">24h</SegmentedControlItem>
    <SegmentedControlItem value="7d">7d</SegmentedControlItem>
  </SegmentedControl>;
  return (
    <Panel aria-label="Conversations" className={className}>
      <PanelHeader><PanelTitle>Conversations</PanelTitle><PanelMeta>{day ? 'Last 24 hours' : 'Last 7 days'}</PanelMeta><PanelAction>{control}</PanelAction></PanelHeader>
      <PanelBody>
        {showMetrics && <MetricStrip range={range}/>}
        <div className="px-3 py-3">
          <Chart type="bar" frame="none" label={day ? 'Conversations per hour, last 24 hours' : 'Conversations per half day, last 7 days'} data={traffic[range]} xKey="at" config={series} title="" stacked legend={false} height={height} unit="count"/>
        </div>
      </PanelBody>
    </Panel>
  );
}

function NeedsLook() {
  return <Panel aria-label="Needs a look">
    <PanelHeader><PanelTitle>Needs a look</PanelTitle><PanelMeta>3</PanelMeta></PanelHeader>
    <PanelBody>
      <div role="list" aria-label="Needs a look">
        <Item role="listitem">
          <ItemContent><ItemTitle><span>Refund over $500</span><Badge kind="agent" label="Approval" size="sm"/></ItemTitle><ItemDescription>Waiting on Ana</ItemDescription></ItemContent>
          <Status status="waiting"/>
        </Item>
        <Item role="listitem">
          <ItemContent><ItemTitle><span>Weekly eval</span><Badge kind="run" label="Eval" size="sm"/></ItemTitle><ItemDescription>312 of 400 cases</ItemDescription></ItemContent>
          <Status status="running"/>
        </Item>
        <Item role="listitem">
          <ItemContent><ItemTitle><span>triage agent</span><Badge kind="model" size="sm"/></ItemTitle><ItemDescription>Replies 1.9 s slower than usual</ItemDescription></ItemContent>
          <Status status="warn">Slow</Status>
        </Item>
      </div>
    </PanelBody>
  </Panel>;
}

function Overview({height, metrics}: {height?: number; metrics?: boolean}) {
  const [range, setRange] = useState<Range>('24h');
  return <RunsFrame range={range} onRangeChange={setRange} height={height} metrics={metrics}/>;
}

function TitleRow() {
  return <div className="flex items-center justify-between gap-4">
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className="truncate type-heading-sm">Helpdesk</h1>
      <p className="truncate type-body-sm text-text-3">3 agents working</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="secondary" className="@max-xl/home:hidden">Inbox</Button>
      <Button>New agent</Button>
    </div>
  </div>;
}

export function HomeScreen({className}: {className?: string}) {
  return (
    <section aria-label="Workspace home" className={cn('@container/home flex w-full max-w-md flex-col gap-4 text-text-1', className)}>
      <TitleRow/>
      <Overview height={120} metrics={false}/>
      <NeedsLook/>
    </section>
  );
}

type Run = {id: string; agent: string; status: 'running' | 'ok' | 'warn' | 'fail' | 'waiting'; detail: string; ms: number; at: string};

const runs: Run[] = [
  {id: 'conv_8f2a91', agent: 'triage-agent', status: 'running', detail: 'Drafting the reply', ms: 12_400, at: '14:02'},
  {id: 'conv_77c0e4', agent: 'support-agent', status: 'waiting', detail: 'Refund of $640', ms: 3_100, at: '14:03'},
  {id: 'conv_5b31d0', agent: 'refund-agent', status: 'fail', detail: 'Order lookup timed out', ms: 12_600, at: '13:58'},
  {id: 'conv_4e9a27', agent: 'triage-agent', status: 'ok', detail: '412 tickets routed', ms: 8_200, at: '13:51'},
  {id: 'conv_3c18f5', agent: 'eval-runner', status: 'warn', detail: 'refund-policy 37 of 40', ms: 41_000, at: '13:40'},
  {id: 'conv_2a07b6', agent: 'refund-agent', status: 'ok', detail: '18 refunds sent', ms: 4_900, at: '13:32'},
  {id: 'conv_19d4c2', agent: 'triage-agent', status: 'ok', detail: '96 tickets routed', ms: 2_300, at: '13:20'},
  {id: 'conv_0f6e81', agent: 'support-agent', status: 'ok', detail: 'Closed 9 tickets', ms: 1_100, at: '13:05'},
];

const runColumns: ColumnDef<Run, any>[] = [
  {accessorKey: 'id', header: 'Conversation', size: 120, cell: ({getValue}) => <span className="type-tag">{getValue<string>()}</span>},
  {accessorKey: 'agent', header: 'Agent', size: 160, meta: {hideBelow: 440}, cell: ({getValue}) => <span className="truncate">{getValue<string>()}</span>},
  {accessorKey: 'detail', header: 'Last step', size: 220, meta: {hideBelow: 720}, cell: ({getValue}) => <span className="text-text-2">{getValue<string>()}</span>},
  {accessorKey: 'ms', header: 'Took', size: 88, meta: {unit: 'duration', hideBelow: 560}},
  {accessorKey: 'status', header: 'Status', size: 144, meta: {severity: true}, cell: ({getValue}) => <Status status={getValue<Run['status']>()}/>},
];

function WaitingFrame() {
  return <Panel aria-label="Waiting on you" className="w-full">
    <PanelHeader><PanelTitle>Waiting on you</PanelTitle><PanelAction><InkSlot>2</InkSlot></PanelAction></PanelHeader>
    <PanelBody>
      <div role="list" aria-label="Waiting on you">
        <Item role="listitem">
          <ItemContent><ItemTitle><span>Refund of $640</span></ItemTitle><ItemDescription>support-agent for Maya Chen</ItemDescription></ItemContent>
          <ItemActions><Button size="sm" variant="secondary">Review</Button></ItemActions>
        </Item>
        <Item role="listitem">
          <ItemContent><ItemTitle><span>Triage prompt v14</span></ItemTitle><ItemDescription>Rollout paused at 10%</ItemDescription></ItemContent>
          <ItemActions><Button size="sm" variant="secondary">Decide</Button></ItemActions>
        </Item>
      </div>
    </PanelBody>
  </Panel>;
}

const releases = [
  {version: 'v14', title: 'Shorter refund replies', at: '14:02', state: 'waiting', word: 'Paused'},
  {version: 'v13', title: 'Friendlier tone', at: 'Sep 28', state: 'fail', word: 'Rolled back'},
  {version: 'v12', title: 'Escalations go to the on-call queue', at: 'Sep 25', state: 'idle', word: 'Replaced'},
] as const;

function ReleasesFrame() {
  return <Panel aria-label="Prompt releases" className="w-full">
    <PanelHeader><PanelTitle>Prompt releases</PanelTitle><PanelMeta>14</PanelMeta></PanelHeader>
    <PanelBody>
      <ol aria-label="Last prompt releases">
        {releases.map(d => <Item key={d.version} render={<li/>}>
          <ItemContent><ItemTitle><span className="type-tag">{d.version}</span></ItemTitle><ItemDescription>{d.title}</ItemDescription></ItemContent>
          <Status status={d.state}>{d.word}</Status>
        </Item>)}
      </ol>
    </PanelBody>
  </Panel>;
}

export function ProjectHome() {
  const [query, setQuery] = useState('');
  const [trouble, setTrouble] = useState(false);
  const shown = runs.filter(r => (!trouble || r.status === 'fail' || r.status === 'warn' || r.status === 'waiting') && (r.id + r.agent).includes(query.trim()));
  return (
    <section aria-label="Workspace home" className="@container/home flex w-full max-w-5xl flex-col gap-6 text-text-1">
      <TitleRow/>
      <Overview height={160}/>
      <div className="grid grid-cols-1 gap-6 @3xl/home:grid-cols-[2fr_1fr]">
        <DataTable
          aria-label="Conversations"
          title="Recent conversations"
          kind="run"
          columns={runColumns}
          data={shown}
          getRowId={r => r.id}
          rowStatus={r => (r.status === 'fail' || r.status === 'warn' ? r.status : undefined)}
          defaultSorting={[{id: 'status', desc: true}]}
          enableRowSelection={false}
          enableColumnResizing={false}
          size="sm"
          toolbar={() => <FilterBar>
            <FilterBarSearch aria-label="Search conversations" placeholder="Search conversations" value={query} onValueChange={setQuery}/>
            <FilterToggle pressed={trouble} onPressedChange={setTrouble}>Needs a look</FilterToggle>
          </FilterBar>}
          className="min-w-0"
        />
        <div className="flex min-w-0 flex-col gap-3">
          <WaitingFrame/>
          <ReleasesFrame/>
        </div>
      </div>
    </section>
  );
}

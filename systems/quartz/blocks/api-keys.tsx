'use client';

import {useEffect, useRef, useState} from 'react';
import {cn} from '../lib/utils';
import {Add, Icon} from '../icon';
import {EMPTY_VALUE} from '../lib/format';
import {Badge, CodeTag} from '../ui/badge';
import {MaskedKey} from '../ui/code-block';
import {Button} from '../ui/button';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '../ui/collapsible';
import {CopyButton} from '../ui/copy-button';
import {Dialog, DialogAction, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '../ui/dialog';
import {Field, FieldLabel} from '../ui/field';
import {Input} from '../ui/input';
import {Panel, PanelAction, PanelBody, PanelHeader, PanelMeta, PanelTitle} from '../ui/panel';
import {PageHeader, PageHeaderActions, PageHeaderContent, PageHeaderDescription, PageHeaderRow, PageHeaderTitle} from '../ui/page-header';
import {Status} from '../ui/status';
import {Tooltip, TooltipContent, TooltipTrigger} from '../ui/tooltip';
import {DataTable, TableRowActionsItem, TableRowActionsMenu, TableRowActionsSeparator, type ColumnDef} from '../ui/table';

const PREFIX = 'sk_demo_';

export function EnvironmentCard({name = 'Production', workspaceId = 'ws_demo_8f2a41', className}: {name?: string; workspaceId?: string; className?: string}) {
  return (
    <Panel data-kind="key" className={className ?? 'w-full max-w-md'}>
      <PanelHeader><PanelTitle>{name}</PanelTitle><PanelMeta>Environment</PanelMeta></PanelHeader>
      <PanelBody>
      <div className="flex min-h-(--row) items-center justify-between gap-3 ps-3 pe-2">
        <span className="type-label">Workspace ID</span>
        <span className="flex min-w-0 items-center gap-1">
          <CodeTag className="min-w-0"><span className="truncate">{workspaceId}</span></CodeTag>
          <Tooltip>
            <TooltipTrigger render={<CopyButton value={workspaceId} label="workspace ID"/>}/>
            <TooltipContent>Copy workspace ID</TooltipContent>
          </Tooltip>
        </span>
      </div>
      </PanelBody>
    </Panel>
  );
}

export function NewKey({name = 'support-widget', value = 'sk_demo_0000aaaa1111bbbbi0p0', className}: {name?: string; value?: string; className?: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <Panel data-kind="key" className={className ?? 'w-full max-w-md'}>
      <PanelHeader><PanelTitle>New key</PanelTitle><PanelMeta>{name}</PanelMeta></PanelHeader>
      <PanelBody>
        <div className="flex flex-col gap-2 p-4">
          <Input mode="secret" readOnly noun="key" aria-label={`Key ${name}`} value={value} onCopy={() => setCopied(true)} className="w-full"/>
          <p className="type-body-sm text-text-3">{copied ? 'Copied. Set it as SUPPORT_API_KEY.' : 'Store it before you leave. It will not be shown again.'}</p>
        </div>
      </PanelBody>
    </Panel>
  );
}

type Key = {id: string; name: string; tail: string; created: string; used: string; status: 'ok' | 'idle'; revoked?: string; access?: string};

const sample: Key[] = [
  {id: 'key_1', name: 'support-widget', tail: 'i0p0', created: 'Sep 2', used: '4 min ago', status: 'ok', access: 'Send only'},
  {id: 'key_2', name: 'eval-runner', tail: 'bbbb', created: 'Aug 19', used: '2 h ago', status: 'ok', access: 'Read only'},
  {id: 'key_3', name: 'helpdesk-sync', tail: 'cccc', created: 'Jul 30', used: '12 days ago', status: 'ok', access: 'Full access'},
  {id: 'key_4', name: 'old-widget', tail: 'dddd', created: 'Mar 3', used: 'Never', status: 'idle', revoked: 'Mar 20'},
];

const nextNames = ['support-staging', 'macro-writer', 'weekly-evals', 'load-test'];

function useCopiedId() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = (id: string) => {
    void navigator.clipboard?.writeText(id)?.then(() => {
      setCopied(id);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1600);
    }, () => {});
  };
  return {copied, copy};
}

const usedLine = (used: string) => (used === 'Never' ? 'Never used' : `Used ${used}`);

function KeyTag({tail, revoked}: {tail: string; revoked?: boolean}) {
  return <CodeTag className="min-w-0"><MaskedKey prefix={PREFIX} tail={tail} length={20} className={revoked ? 'text-text-3' : undefined}/></CodeTag>;
}

function RevokeDialog({revoking, onClose, onRevoke}: {revoking: Key | null; onClose: () => void; onRevoke: () => void}) {
  return (
    <Dialog role="alertdialog" open={revoking !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Revoke {revoking?.name}?</DialogTitle>
          <DialogDescription>Requests with this key fail from now on. {revoking?.used === 'Never' ? 'It was never used.' : `It was last used ${revoking?.used}.`}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary"/>}>Keep key</DialogClose>
          <DialogAction variant="destructive" onAction={onRevoke} pendingLabel="Revoking">Revoke key</DialogAction>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type KeyRowProps = {
  k: Key;
  value?: string;
  onRevoke?: () => void;
  copied?: boolean;
  onCopyId?: () => void;
};

function KeyRow({k, value, onRevoke, copied, onCopyId}: KeyRowProps) {
  const revoked = k.status === 'idle';
  if (value) {
    return (
      <li className="flex min-h-(--row-lg) items-center gap-3 py-2 ps-3 pe-2 rule-row">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate type-label">{k.name}</span>
          <span className="truncate type-body-sm text-text-3">New, shown once</span>
        </span>
        <span className="flex min-w-0 shrink items-center gap-1">
          <CodeTag className="min-w-0"><span className="truncate type-tag">{value}</span></CodeTag>
          <Tooltip>
            <TooltipTrigger render={<CopyButton value={value} label={`${k.name} key`}/>}/>
            <TooltipContent>Copy key</TooltipContent>
          </Tooltip>
        </span>
      </li>
    );
  }
  return (
    <li className={cn('flex min-h-(--row-lg) items-center gap-3 py-2 ps-3 pe-2 rule-row', revoked && 'text-text-3')}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-2"><span className="truncate type-label">{k.name}</span>{k.access && !revoked && <Badge kind="key" label={k.access} size="sm"/>}</span>
        <span aria-live="polite" className="truncate type-body-sm text-text-3">{revoked ? `Revoked ${k.revoked}` : copied ? 'ID copied' : usedLine(k.used)}</span>
      </span>
      <span className="flex min-w-0 shrink items-center @max-xs/keys:hidden"><KeyTag tail={k.tail} revoked={revoked}/></span>
      {!revoked && <TableRowActionsMenu label={`More actions for ${k.name}`}>
        <TableRowActionsItem onClick={onCopyId}>Copy ID</TableRowActionsItem>
        <TableRowActionsSeparator/>
        <TableRowActionsItem variant="destructive" onClick={onRevoke}>Revoke key</TableRowActionsItem>
      </TableRowActionsMenu>}
    </li>
  );
}

export function KeysLook({className}: {className?: string}) {
  const [keys, setKeys] = useState(sample);
  const [fresh, setFresh] = useState<{id: string; value: string} | null>({id: 'key_1', value: 'sk_demo_0000aaaa1111bbbbi0p0'});
  const [count, setCount] = useState(0);
  const [revoking, setRevoking] = useState<Key | null>(null);
  const {copied, copy} = useCopiedId();
  const active = keys.filter(k => k.status === 'ok');
  const revoked = keys.filter(k => k.status === 'idle');
  const create = () => {
    const name = nextNames[count % nextNames.length];
    const value = `${PREFIX}${String(count + 1).padStart(4, '0')}eeee1111ffff${count + 1}x9z`;
    const id = `key_new_${count}`;
    setKeys(r => [{id, name, tail: value.slice(-4), created: 'Today', used: 'Never', status: 'ok'}, ...r]);
    setFresh({id, value});
    setCount(c => c + 1);
  };
  const revoke = () => {
    if (!revoking) return;
    setKeys(r => r.map(k => (k.id === revoking.id ? {...k, status: 'idle', revoked: 'Today'} : k)));
    if (fresh?.id === revoking.id) setFresh(null);
  };
  return (
    <section aria-label="API keys" className={cn('@container/keys flex flex-col gap-3 text-text-1', className ?? 'w-full max-w-180')}>
      <Panel>
        <PanelHeader>
          <PanelTitle>API keys</PanelTitle><PanelMeta>Production</PanelMeta>
          <PanelAction><Button onClick={create}><Icon icon={Add} size={16}/>Create key</Button></PanelAction>
        </PanelHeader>
        <PanelBody>
          <ul aria-label="API keys">
            {active.map(k => <KeyRow key={k.id} k={k} value={fresh?.id === k.id ? fresh.value : undefined} onRevoke={() => setRevoking(k)} copied={copied === k.id} onCopyId={() => copy(k.id)}/>)}
            {revoked.length > 0 && <li className="rule-row">
              <Collapsible>
                <CollapsibleTrigger size="row">{revoked.length === 1 ? '1 revoked key' : `${revoked.length} revoked keys`}</CollapsibleTrigger>
                <CollapsibleContent>
                  <ul>{revoked.map(k => <KeyRow key={k.id} k={k}/>)}</ul>
                </CollapsibleContent>
              </Collapsible>
            </li>}
          </ul>
        </PanelBody>
      </Panel>
      <RevokeDialog revoking={revoking} onClose={() => setRevoking(null)} onRevoke={revoke}/>
    </section>
  );
}

export function ApiKeys() {
  const [keys, setKeys] = useState(sample);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<{name: string; value: string} | null>({name: 'support-widget', value: 'sk_demo_0000aaaa1111bbbbi0p0'});
  const [revoking, setRevoking] = useState<Key | null>(null);
  const {copied, copy} = useCopiedId();

  const create = async () => {
    const value = `${PREFIX}${String(keys.length).padStart(4, '0')}eeee1111ffff${keys.length}x9z`;
    setKeys(k => [{id: `key_${Date.now()}`, name: name.trim(), tail: value.slice(-4), created: 'Today', used: 'Never', status: 'ok'}, ...k]);
    setCreated({name: name.trim(), value});
    setName('');
  };
  const revoke = async () => {
    if (revoking) setKeys(k => k.map(key => (key.id === revoking.id ? {...key, status: 'idle'} : key)));
  };

  const columns: ColumnDef<Key, any>[] = [
    {accessorKey: 'name', header: 'Name', size: 160, cell: ({row, getValue}) => <span className={row.original.status === 'idle' ? 'text-text-3' : undefined}>{getValue<string>()}{copied === row.original.id && <span aria-live="polite" className="ms-2 text-text-3">ID copied</span>}</span>},
    {accessorKey: 'tail', header: 'Key', size: 200, enableSorting: false, cell: ({row, getValue}) => <KeyTag tail={getValue<string>()} revoked={row.original.status === 'idle'}/>},
    {accessorKey: 'created', header: 'Created', size: 110, meta: {hideBelow: 640}, cell: ({getValue}) => <span className="text-text-2 data">{getValue<string>()}</span>},
    {accessorKey: 'used', header: 'Last used', size: 120, meta: {hideBelow: 520}, cell: ({getValue}) => <span className="text-text-2 data">{getValue<string>() === 'Never' ? EMPTY_VALUE : getValue<string>()}</span>},
    {accessorKey: 'status', header: 'Status', size: 110, meta: {severity: true}, cell: ({getValue}) => <Status status={getValue<Key['status']>()}>{getValue<Key['status']>() === 'idle' ? 'Revoked' : undefined}</Status>},
  ];

  return (
    <section aria-label="API keys" className="flex w-full max-w-4xl flex-col gap-6">
      <PageHeader kind="key" size="sm">
        <PageHeaderRow>
          <PageHeaderContent>
            <PageHeaderTitle>API keys</PageHeaderTitle>
            <PageHeaderDescription>Keys let your widget and scripts start conversations in this workspace.</PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <Button onClick={() => setCreating(true)}><Icon icon={Add} size={16}/>Create key</Button>
          </PageHeaderActions>
        </PageHeaderRow>
      </PageHeader>
      <EnvironmentCard className="w-full max-w-xl"/>
      {created && <NewKey key={created.value} name={created.name} value={created.value} className="w-full max-w-xl"/>}
      <DataTable
        aria-label="API keys"
        title="Keys"
        columns={columns}
        data={keys}
        getRowId={k => k.id}
        kind="key"
        enableRowSelection={false}
        empty={<>No keys yet. Create one to let your widget start conversations.</>}
        rowActions={key => key.status === 'ok' && <TableRowActionsMenu label={`More actions for ${key.name}`}>
          <TableRowActionsItem onClick={() => copy(key.id)}>Copy key ID</TableRowActionsItem>
          <TableRowActionsSeparator/>
          <TableRowActionsItem variant="destructive" onClick={() => setRevoking(key)}>Revoke key</TableRowActionsItem>
        </TableRowActionsMenu>}
      />
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Create key</DialogTitle>
            <DialogDescription>It can start conversations and read their results in this workspace.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="support-widget" autoComplete="off" spellCheck={false}/>
          </Field>
          <DialogFooter defaultAction="primary">
            <DialogClose render={<Button variant="secondary"/>}>Cancel</DialogClose>
            <DialogAction disabled={!name.trim()} onAction={create} pendingLabel="Creating">Create key</DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RevokeDialog revoking={revoking} onClose={() => setRevoking(null)} onRevoke={revoke}/>
    </section>
  );
}

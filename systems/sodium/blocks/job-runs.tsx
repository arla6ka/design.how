'use client';

import {Icon, Play, Renew, Search} from '../icon';
import {cn} from '../lib/utils';
import {Button} from '../ui/button';
import {Status, type StatusValue} from '../ui/status';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../ui/table';

type Run = {id: string; pipeline: string; status: StatusValue; rows: string};

const runs: Run[] = [
  {id: 'run_8f2a91', pipeline: 'ingest-events', status: 'running', rows: '812K'},
  {id: 'run_8f2a90', pipeline: 'orders-daily', status: 'fail', rows: '48.2K'},
  {id: 'run_8f2a8e', pipeline: 'sessions-rollup', status: 'ok', rows: '1.2M'},
  {id: 'run_8f2a8c', pipeline: 'ingest-events', status: 'ok', rows: '790K'},
  {id: 'run_8f2a8b', pipeline: 'billing-export', status: 'warn', rows: '6.9K'},
  {id: 'run_8f2a8a', pipeline: 'orders-daily', status: 'queued', rows: '0'},
];

export function JobRuns({className}: {className?: string}) {
  return (
    <Table
      frameClassName={cn('@container/runs', className ?? 'w-full')}
      size="sm"
      title="Runs"
      count={runs.length}
      actions={<>
        <Button variant="ghost" size="icon-sm" aria-label="Search runs"><Icon icon={Search}/></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Refresh"><Icon icon={Renew}/></Button>
        <Button variant="ghost" size="icon-sm" aria-label="Run now"><Icon icon={Play}/></Button>
      </>}
    >
      <TableHeader>
        <TableRow>
          <TableHead>Run</TableHead>
          <TableHead className="hidden @lg/runs:table-cell">Pipeline</TableHead>
          <TableHead>Status</TableHead>
          <TableHead numeric className="hidden @xs/runs:table-cell">Rows</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map(run => <TableRow key={run.id} open={run.id === 'run_8f2a90'}>
          <TableCell mono>{run.id}</TableCell>
          <TableCell mono className="hidden @lg/runs:table-cell">{run.pipeline}</TableCell>
          <TableCell><Status status={run.status} size="sm"/></TableCell>
          <TableCell numeric className="hidden @xs/runs:table-cell">{run.rows}</TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  );
}

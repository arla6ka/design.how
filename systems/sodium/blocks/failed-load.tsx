'use client';

import {Alert, AlertAction, AlertDescription, AlertTitle} from '../ui/alert';
import {Button} from '../ui/button';
import {CodeWindow} from '../ui/code-window';
import {LogViewer, type LogLine} from '../ui/log-viewer';

const sql = `-- one row per order, by region
insert into wh.orders_daily
select
  order_id,
  customer_id,
  region,
  sum(amount) as amount,
  count(*) as items
from raw.orders
where loaded_at >= '2026-10-18'
group by order_id, customer_id, region`;

const lines: LogLine[] = [
  {id: 1, time: '02:14:07', level: 'info', source: 'read', message: 'scanned raw.orders, 48,210 rows'},
  {id: 2, time: '02:14:09', level: 'info', source: 'plan', message: 'insert into wh.orders_daily, 1 partition'},
  {id: 3, time: '02:14:11', level: 'warn', source: 'plan', message: 'column region is nullable in the source'},
  {id: 4, time: '02:14:12', level: 'fail', source: 'write', message: 'column "region" does not exist in raw.orders'},
  {id: 5, time: '02:14:12', level: 'info', source: 'write', message: 'rolled back partition 2026-10-18'},
];

export function FailedLoad({className}: {className?: string}) {
  return (
    <div className={className ?? 'flex w-full flex-col gap-5'}>
      <Alert status="fail">
        <AlertTitle>Load failed at line 6</AlertTitle>
        <AlertDescription>The source dropped column region on Oct 18.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="secondary">Retry load</Button>
        </AlertAction>
      </Alert>
      <CodeWindow code={sql} language="sql" filename="models/orders_daily.sql" fail={[6]} copyLabel="query"/>
      <LogViewer lines={lines} name="run_8f2a90" height={124} wrap={false} follow={false}/>
    </div>
  );
}

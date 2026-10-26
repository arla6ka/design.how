'use client';

import {Button} from '../ui/button';
import {Frame, FrameBody, FrameDescription, FrameHeader, FrameStatus, FrameTitle, FrameValue} from '../ui/frame';
import {Status} from '../ui/status';
import {StatusStrip, StatusStripCell, StatusStripLabel, StatusStripValue} from '../ui/status-strip';

const facts = [
  {label: 'Pipeline', value: 'orders-daily'},
  {label: 'Step', value: 'write_partitions'},
  {label: 'Partition', value: '2026-10-18'},
  {label: 'Attempts', value: '3 of 3'},
];

export function OnCall({className}: {className?: string}) {
  return (
    <Frame aria-label="Failed job" className={className ?? 'w-full max-w-sm'}>
      <FrameHeader>
        <FrameTitle>orders-daily</FrameTitle>
        <FrameStatus><Status status="fail" size="sm">Job failed</Status></FrameStatus>
        <FrameValue meta>02:14 UTC</FrameValue>
      </FrameHeader>
      <FrameBody>
        <FrameDescription>The source dropped a column, so the next run at 03:00 will fail the same way.</FrameDescription>
      </FrameBody>
      <FrameBody padding="none">
        <StatusStrip variant="plain" label="Failed job">
          {facts.map(f => <StatusStripCell key={f.label}>
            <StatusStripLabel>{f.label}</StatusStripLabel>
            <StatusStripValue>{f.value}</StatusStripValue>
          </StatusStripCell>)}
        </StatusStrip>
      </FrameBody>
      <FrameBody>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary">Acknowledge</Button>
          <Button>Retry step</Button>
        </div>
      </FrameBody>
    </Frame>
  );
}

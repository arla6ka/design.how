'use client';

import {ToolCallRow, ToolCallStack, formatElapsed} from '../ai/tool-call-row';
import {Button} from '../ui/button';
import {Frame, FrameBody, FrameFooter, FrameHeader, FrameMeta, FrameStatus, FrameTitle, FrameValue} from '../ui/frame';
import {Progress, ProgressLabel, ProgressValue} from '../ui/progress';
import {Status} from '../ui/status';
import {StatusStrip, StatusStripCell, StatusStripLabel, StatusStripUnit, StatusStripValue} from '../ui/status-strip';

const steps = [
  {label: 'Read source', detail: 'raw.sessions', state: 'done', duration: 4100},
  {label: 'Dedupe rows', detail: '1.2M rows', state: 'done', duration: 38_000},
  {label: 'Write partitions', detail: 'wh.sessions_daily', state: 'running', tab: 'Writing partitions'},
  {label: 'Compact files', state: 'queued'},
] as const;

export function RunProgress({className, clock}: {className?: string; clock?: number}) {
  return (
    <div className={className ?? 'flex w-full max-w-sm flex-col gap-4'}>
      <Frame aria-label="Backfill run_91c0d4">
        <FrameHeader>
          <FrameTitle>sessions-rollup</FrameTitle>
          <FrameStatus><Status status="running" size="sm"/></FrameStatus>
          <FrameValue meta>{formatElapsed(372_000)}</FrameValue>
        </FrameHeader>
        <FrameBody>
          <Progress value={812} max={1240}>
            <ProgressLabel>Partitions</ProgressLabel>
            <ProgressValue>{(_, v) => `${v} / 1,240`}</ProgressValue>
          </Progress>
        </FrameBody>
        <FrameBody padding="none">
          <StatusStrip variant="plain" label="Run status">
            <StatusStripCell>
              <StatusStripLabel>Rows</StatusStripLabel>
              <StatusStripValue>48.2M</StatusStripValue>
            </StatusStripCell>
            <StatusStripCell>
              <StatusStripLabel>Workers</StatusStripLabel>
              <StatusStripValue>12<StatusStripUnit>/ 16</StatusStripUnit></StatusStripValue>
            </StatusStripCell>
            <StatusStripCell>
              <StatusStripLabel>Failed</StatusStripLabel>
              <StatusStripValue>0</StatusStripValue>
            </StatusStripCell>
            <StatusStripCell>
              <StatusStripLabel>Left</StatusStripLabel>
              <StatusStripValue>about 4m</StatusStripValue>
            </StatusStripCell>
          </StatusStrip>
        </FrameBody>
        <FrameFooter>
          <FrameMeta>run_91c0d4</FrameMeta>
          <Button size="sm">Pause run</Button>
        </FrameFooter>
      </Frame>
      <ToolCallStack size="sm" aria-label="Steps of run_91c0d4" clock={clock}>
        {steps.map(step => <ToolCallRow key={step.label} {...step}/>)}
      </ToolCallStack>
    </div>
  );
}

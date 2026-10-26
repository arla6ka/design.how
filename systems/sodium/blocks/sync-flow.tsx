'use client';

import {BarBlocks, type BarBlock} from '../ui/bar-blocks';
import {Button} from '../ui/button';
import {Frame, FrameBody, FrameFooter, FrameHeader, FrameMeta, FrameTitle, FrameValue} from '../ui/frame';
import {Swimlanes, type Swimlane, type SwimlaneStep} from '../ui/swimlanes';

const lanes: Swimlane[] = [{id: 'source', label: 'Sources'}, {id: 'warehouse', label: 'Warehouse'}, {id: 'dashboard', label: 'Dashboard'}];
const steps: SwimlaneStep[] = [
  {label: 'Extract', from: 'source'},
  {label: 'Load', from: 'source', to: 'warehouse', meta: '48,210 rows'},
  {label: 'Transform', from: 'warehouse', tone: 'accent'},
  {label: 'Test', from: 'warehouse', meta: 'OK'},
  {label: 'Publish', from: 'dashboard'},
];
const sources: BarBlock[] = [
  {label: 'Orders', value: 1_240_000},
  {label: 'Events', value: 612_000},
  {label: 'Files', value: 287_000},
];

export function SyncFlow({className}: {className?: string}) {
  return (
    <Frame aria-label="Nightly sync" className={className ?? 'w-full'}>
      <FrameHeader>
        <FrameTitle>nightly-sync</FrameTitle>
        <FrameValue meta>02:00 UTC</FrameValue>
      </FrameHeader>
      <FrameBody>
        <Swimlanes label="Nightly sync, sources to dashboard" lanes={lanes} steps={steps}/>
      </FrameBody>
      <FrameBody>
        <BarBlocks label="Rows by source, last sync" data={sources} unit="count" size="sm"/>
      </FrameBody>
      <FrameFooter>
        <FrameMeta>Last run 6h ago</FrameMeta>
        <Button size="sm">Run sync</Button>
      </FrameFooter>
    </Frame>
  );
}

'use client';

import {Button} from '../ui/button';
import {Chart} from '../ui/chart';
import type {ChartConfig} from '../ui/chart-parts';
import {Frame, FrameBody, FrameFooter, FrameHeader, FrameMeta, FrameTitle, FrameValue} from '../ui/frame';
import {Meter, MeterLabel, MeterStack, MeterValue} from '../ui/meter';

const hours = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
const queries = [310, 220, 480, 1240, 1610, 1520, 980, 640];
const data = hours.map((hour, i) => ({hour, queries: queries[i]}));
const config: ChartConfig = {hour: {label: 'Hour'}, queries: {label: 'Queries'}};

const schemas = [
  {label: 'events', value: 38.4, display: '38.4 TB'},
  {label: 'orders', value: 12.1, display: '12.1 TB'},
  {label: 'sessions', value: 7.6, display: '7.6 TB'},
  {label: 'staging', value: 2.9, display: '2.9 TB'},
];

export function WarehouseCapacity({className}: {className?: string}) {
  return (
    <Frame aria-label="Warehouse wh-analytics" className={className ?? 'w-full'}>
      <FrameHeader>
        <FrameTitle>wh-analytics</FrameTitle>
        <FrameValue meta>size L</FrameValue>
      </FrameHeader>
      <FrameBody className="gap-5">
        <Meter value={442} max={500}>
          <MeterLabel>Credits</MeterLabel>
          <MeterValue>{(_, v) => `${v} / 500`}</MeterValue>
        </Meter>
        <Meter value={61} max={120}>
          <MeterLabel>Storage</MeterLabel>
          <MeterValue>{(_, v) => `${v} / 120 TB`}</MeterValue>
        </Meter>
        <Meter value={24} max={40}>
          <MeterLabel>Concurrency</MeterLabel>
          <MeterValue>{(_, v) => `${v} / 40`}</MeterValue>
        </Meter>
        <MeterStack label="Storage by schema" parts={schemas} max={120}/>
      </FrameBody>
      <FrameBody>
        <Chart frame="plain" type="area" label="Queries by hour, today" data={data} xKey="hour" config={config} height={160}/>
      </FrameBody>
      <FrameFooter>
        <FrameMeta>Updated 2m ago</FrameMeta>
        <Button size="sm" variant="secondary">View queries</Button>
        <Button size="sm">Resize warehouse</Button>
      </FrameFooter>
    </Frame>
  );
}

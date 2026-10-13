'use client';

import {useState} from 'react';
import {AutonomyRule} from '../ai/autonomy-rule';
import {List, ListItem} from '../ui/list';
import {Switch} from '../ui/switch';

export function PaydayRule() {
  const [save, setSave] = useState('200');
  const [onPayday, setOnPayday] = useState(true);
  const [roundUps, setRoundUps] = useState(false);
  const [billsFirst, setBillsFirst] = useState(true);
  return (
    <List aria-label="Payday rules" className="w-full max-w-sm">
      <ListItem title="Save when paid" description={<AutonomyRule size="inline" before="Move" after="to savings" value={save} onValueChange={setSave} disabled={!onPayday}/>}
        trailing={<Switch checked={onPayday} onCheckedChange={setOnPayday} aria-label="Save when paid"/>}/>
      <ListItem title="Bills first" description="Hold what's due before anything moves" trailing={<Switch checked={billsFirst} onCheckedChange={setBillsFirst} aria-label="Bills first"/>}/>
      <ListItem title="Round ups" description="Spare change goes to savings" trailing={<Switch checked={roundUps} onCheckedChange={setRoundUps} aria-label="Round ups"/>}/>
    </List>
  );
}

export function AssistantLimits() {
  const [limit, setLimit] = useState('50');
  const [days, setDays] = useState('3');
  const [tellAfter, setTellAfter] = useState(true);
  return (
    <List aria-label="Assistant limits" className="w-full max-w-sm">
      <ListItem title="Ask before paying" description={<AutonomyRule size="inline" before="Anything over" value={limit} onValueChange={setLimit}/>}/>
      <ListItem title="Pay bills early" description={<AutonomyRule size="inline" kind="number" after="days before they're due" value={days} onValueChange={setDays}/>}/>
      <ListItem title="Tell me after it acts" trailing={<Switch checked={tellAfter} onCheckedChange={setTellAfter} aria-label="Tell me after it acts"/>}/>
    </List>
  );
}

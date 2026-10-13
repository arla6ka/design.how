'use client';

import {useState} from 'react';
import {Message} from '../ai/message';
import {Icon, Locked, Play, ShoppingBag} from '../icon';
import {useFocusWhenReplaced} from '../lib/use-focus-when-replaced';
import {Amount, formatAmount} from '../ui/amount';
import {Button} from '../ui/button';
import {List, ListIcon, ListItem} from '../ui/list';
import {Status} from '../ui/status';

export function UnusualCharge() {
  return (
    <section aria-label="Unusual charge" className="flex w-full max-w-sm flex-col gap-4">
      <Message name="Lime">This one doesn't look like you. Was it?</Message>
      <List className="-mx-4">
        <ListItem leading={<ListIcon icon={ShoppingBag} tone="danger"/>} title="Kestrel Shop" description="Lisbon, 2:14 am" trailing={<Amount value={-129} tone="danger"/>}/>
      </List>
      <div className="flex gap-2">
        <Button variant="solid" className="flex-1" icon={<Icon icon={Locked} size={16}/>}>Freeze card</Button>
        <Button variant="secondary" className="flex-1">It was me</Button>
      </div>
    </section>
  );
}

export function CancelSubscription() {
  const [state, setState] = useState<'open' | 'pending' | 'canceled' | 'kept'>('open');
  const {region, target: outcome} = useFocusWhenReplaced(state === 'canceled' || state === 'kept');
  const cancel = () => {
    setState('pending');
    setTimeout(() => setState('canceled'), 900);
  };
  return (
    <section aria-label="Subscription" className="flex w-full max-w-sm flex-col gap-4">
      <Message name="Lime">You haven't opened Streamly since July.</Message>
      <List className="-mx-4">
        <ListItem leading={<ListIcon icon={Play}/>} title="Streamly" description="Renews Oct 12" trailing={formatAmount(-15.99)}/>
      </List>
      <div ref={region} aria-live="polite" className="flex min-h-(--control-md) items-center gap-2">
        {state === 'canceled' ? <Status ref={outcome} focusable status="canceled" label="Canceled. No more charges"/>
          : state === 'kept' ? <Status ref={outcome} focusable status="done" label="Kept"/>
          : <>
            <Button className="flex-1" pending={state === 'pending'} onClick={cancel}>Cancel it</Button>
            <Button variant="ghost" disabled={state === 'pending'} onClick={() => setState('kept')}>Keep</Button>
          </>}
      </div>
    </section>
  );
}

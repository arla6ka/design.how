'use client';

import {useState} from 'react';
import {ApprovalRequest, type ApprovalRequestState} from '../ai/approval-request';
import {Message} from '../ai/message';

const balance = 2481.2;

export function PayingABill() {
  const [state, setState] = useState<ApprovalRequestState>('waiting');
  const [pending, setPending] = useState(false);
  const approve = () => {
    setPending(true);
    setTimeout(() => { setPending(false); setState('approved'); }, 900);
  };
  return (
    <section aria-label="Assistant" className="flex w-full max-w-sm flex-col gap-4">
      <Message from="user">Pay my phone bill</Message>
      <Message name="Lime">It matches last month. Want me to pay it?</Message>
      <ApprovalRequest title="Pay phone bill" amount={-45} available={balance} reason="Due Thursday, from Checking" state={state} pending={pending} onApprove={approve} onDecline={() => setState('declined')}/>
    </section>
  );
}

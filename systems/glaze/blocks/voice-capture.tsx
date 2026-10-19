'use client';

import {Button} from '../ui/button';
import {Status} from '../ui/status';

const heard = 'Remind me to call about the kitchen leak on Monday, and find a plumber';
const forming = 'who can come this week';

export function VoiceCapture({className}: {className?: string}) {
  return (
    <section aria-label="Voice note" className={className ?? 'flex w-full max-w-sm flex-col gap-4'}>
      <div className="flex items-baseline gap-2">
        <Status status="running" live className="me-auto">Listening</Status>
        <span className="data type-label text-text-2">0:14</span>
      </div>
      <p aria-live="polite" className="type-heading">
        {heard} <span className="text-text-3">{forming}</span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1">Cancel</Button>
        <Button className="flex-1">Send it</Button>
      </div>
    </section>
  );
}

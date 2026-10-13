import {Amount, formatAmount} from '../ui/amount';
import {Avatar} from '../ui/avatar';
import {Button} from '../ui/button';
import {List, ListItem} from '../ui/list';

export function SplitDinner() {
  const people = [
    {name: 'Maya Chen', value: 34.5},
    {name: 'Sam Ortiz', value: 28},
  ];
  const owed = people.reduce((sum, p) => sum + p.value, 0);
  return (
    <section aria-label="Split the dinner" className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium">Olive Room</p>
        <p className="text-sm text-fg-3 tabular-nums">You paid {formatAmount(96)}</p>
      </div>
      <List className="-mx-4">
        {people.map(p => (
          <ListItem key={p.name} leading={<Avatar name={p.name}/>} title={p.name} trailing={formatAmount(p.value)}/>
        ))}
      </List>
      <div className="flex items-center gap-3">
        <Button className="flex-1">Request payment</Button>
        <Amount value={owed} size="lg"/>
      </div>
    </section>
  );
}

import {Add, ArrowDown, ArrowUp, Icon} from '../icon';
import {Avatar} from '../ui/avatar';
import {Button} from '../ui/button';
import {formatAmount} from '../ui/amount';
import {Progress} from '../ui/progress';

const balance = 2481.2;
const goal = {name: 'Vacation fund', saved: 290, target: 480};

export function HomeScreen() {
  const actions = [
    {label: 'Add', icon: Add, primary: true},
    {label: 'Send', icon: ArrowUp},
    {label: 'Request', icon: ArrowDown},
  ];
  return (
    <section aria-label="Home" className="flex w-full max-w-xs flex-col gap-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-3">Good morning, Arlan</p>
        <Avatar name="Arlan Marat" size="sm"/>
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-fg-3">Available</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatAmount(balance)}</p>
      </div>
      <div className="flex justify-center gap-8">
        {actions.map(action => (
          <div key={action.label} className="flex flex-col items-center gap-2">
            <Button size="icon-lg" variant={action.primary ? 'primary' : 'secondary'} aria-label={action.label}><Icon icon={action.icon} size={20}/></Button>
            <span className="text-xs text-fg-2">{action.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium">{goal.name}</p>
          <p className="text-sm text-fg-3 tabular-nums">{formatAmount(goal.saved, {compact: true})} of {formatAmount(goal.target, {compact: true})}</p>
        </div>
        <Progress value={goal.saved} max={goal.target} label={`Saved toward ${goal.name}`} valueText={`${formatAmount(goal.saved)} of ${formatAmount(goal.target)}`}/>
      </div>
    </section>
  );
}

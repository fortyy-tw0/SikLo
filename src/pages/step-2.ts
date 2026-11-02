// Step 2: how would you describe your cycles?
import { byId } from '../lib/dom';
import { goTo } from '../lib/nav';
import { draft, update } from '../lib/store';
import type { CycleType } from '../lib/types';

/** The page's option values -> the backend contract's cycle_type values. */
const TO_API = { regular: 'regular', irregular: 'irregular', unsure: 'not_sure' } as const satisfies Record<string, CycleType>;
type Option = keyof typeof TO_API;
const FROM_API: Record<CycleType, Option> = { regular: 'regular', irregular: 'irregular', not_sure: 'unsure' };

const opts = byId('opts');
const next = byId<HTMLButtonElement>('next');
let choice: Option | null = null;

function pick(o: HTMLElement): void {
  opts.querySelectorAll('.opt').forEach((x) => x.setAttribute('aria-checked', String(x === o)));
  choice = o.dataset.v as Option;
  next.disabled = false;
}

// Restore an earlier answer
const savedType = draft().cycle_type;
const savedOpt = savedType ? opts.querySelector<HTMLElement>(`[data-v="${FROM_API[savedType]}"]`) : null;
if (savedOpt) pick(savedOpt);

opts.addEventListener('click', (e) => {
  const o = (e.target as Element).closest<HTMLElement>('.opt');
  if (o) pick(o);
});

next.addEventListener('click', () => {
  if (!choice) return;
  update({ cycle_type: TO_API[choice] });
  goTo('step-3.html', 'forward');
});
byId('backBtn').addEventListener('click', () => goTo('step-1.html', 'back'));
byId('skipBtn').addEventListener('click', () => {
  update({ cycle_type: null });
  goTo('step-3.html', 'forward');
});

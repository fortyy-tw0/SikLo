// Setup step 1: preferred name or nickname (optional). Today greets the person with it.
import { byId } from '@lib/dom';
import { goTo } from '@lib/nav';
import { cleanName, draft, MAX_NAME_LENGTH, update } from '@lib/store';

/** Called by the router each time this screen is shown. */
export default function mount(_signal: AbortSignal): void {
  const input = byId<HTMLInputElement>('nameInput');
  const next = byId<HTMLButtonElement>('next');
  const count = byId('count');

  const refresh = () => {
    const name = cleanName(input.value);
    count.textContent = `${input.value.length}/${MAX_NAME_LENGTH}`;
    next.disabled = !name;
  };

  // Restore a name already entered in this session (or saved earlier)
  input.value = draft().name;
  refresh();
  input.addEventListener('input', refresh);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !next.disabled) next.click();
  });

  next.addEventListener('click', () => {
    update({ name: cleanName(input.value) });
    goTo('birthday', 'forward');
  });
  byId('skipBtn').addEventListener('click', () => {
    update({ name: '' });
    goTo('birthday', 'forward');
  });
  byId('backBtn').addEventListener('click', () => {
    update({ name: cleanName(input.value) });
    goTo('index', 'back');
  });
}

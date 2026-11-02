// Step 1: birthday
import { byId } from '@lib/dom';
import { goTo } from '@lib/nav';
import { draft, update as updateDraft } from '@lib/store';

/** Called by the router each time this screen is shown. */
export default function mount(_signal: AbortSignal): void {
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MIN_AGE = 8;
  const MAX_AGE = 100;

  const mm = byId<HTMLSelectElement>('mm');
  const dd = byId<HTMLSelectElement>('dd');
  const yy = byId<HTMLSelectElement>('yy');
  const statusEl = byId('status');
  const next = byId<HTMLButtonElement>('next');

  const okIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>';
  const errIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/></svg>';

  type BirthdayCheck =
    | { ok: true; age: number; label: string }
    | { ok: false; error: string; field: HTMLSelectElement }
    | null; // still incomplete

  function checkBirthday(mStr: string, dStr: string, yStr: string, today: Date): BirthdayCheck {
    if (!mStr || !dStr || yStr.length < 4) return null;
    const m = Number(mStr), d = Number(dStr), y = Number(yStr);
    if (m < 1 || m > 12) return { ok: false, error: 'Month should be from 1 to 12.', field: mm };
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1 || d > daysInMonth) return { ok: false, error: `${MONTHS[m - 1]} ${y} has ${daysInMonth} days.`, field: dd };
    if (new Date(y, m - 1, d) > today) return { ok: false, error: 'That date is in the future.', field: yy };
    let age = today.getFullYear() - y;
    if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) age -= 1;
    if (age < MIN_AGE || age > MAX_AGE) return { ok: false, error: 'Please check the year.', field: yy };
    return { ok: true, age, label: `${MONTHS[m - 1]} ${d}, ${y}` };
  }

  function refresh(): void {
    [mm, dd, yy].forEach((el) => el.removeAttribute('aria-invalid'));
    const r = checkBirthday(mm.value, dd.value, yy.value, new Date());
    statusEl.classList.toggle('err', r !== null && !r.ok);
    if (!r) {
      statusEl.innerHTML = '';
      next.disabled = true;
      return;
    }
    if (!r.ok) {
      r.field.setAttribute('aria-invalid', 'true');
      statusEl.innerHTML = errIcon + r.error;
      next.disabled = true;
      return;
    }
    statusEl.innerHTML = okIcon + `${r.label} · you are ${r.age}`;
    next.disabled = false;
    const pad = (n: string) => n.padStart(2, '0');
    updateDraft({ dob: `${yy.value}-${pad(mm.value)}-${pad(dd.value)}` });
  }

  function addOption(sel: HTMLSelectElement, value: string, text: string): void {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = text;
    sel.appendChild(o);
  }

  // Fill the dropdowns. Years run from the youngest plausible age back 100 years.
  MONTHS.forEach((name, i) => addOption(mm, String(i + 1), name));
  const thisYear = new Date().getFullYear();
  for (let y = thisYear - MIN_AGE; y >= thisYear - MAX_AGE; y--) addOption(yy, String(y), String(y));

  // The day list only offers days that exist in the chosen month and year.
  function fillDays(): void {
    const keep = dd.value;
    const m = Number(mm.value) || 1, y = Number(yy.value) || 2000; // before a choice: 31 days, or 29 in Feb of a leap year
    const count = mm.value ? new Date(y, m, 0).getDate() : 31;
    dd.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
    for (let d = 1; d <= count; d++) addOption(dd, String(d), String(d));
    if (keep) dd.value = String(Math.min(Number(keep), count)); // Mar 31 -> Feb keeps the last valid day
  }

  fillDays();
  mm.addEventListener('change', () => { fillDays(); refresh(); });
  yy.addEventListener('change', () => { fillDays(); refresh(); });
  dd.addEventListener('change', refresh);

  // Restore a birthday already entered in this session (or saved earlier)
  const saved = draft().dob;
  if (saved) {
    const [y, m, d] = saved.split('-');
    mm.value = String(Number(m));
    yy.value = y;
    fillDays();
    dd.value = String(Number(d));
    refresh();
  }

  byId('backBtn').addEventListener('click', () => goTo('index', 'back'));
  next.addEventListener('click', () => goTo('step-2', 'forward'));
}

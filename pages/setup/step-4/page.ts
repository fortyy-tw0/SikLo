// Step 4: period dates. Kept in the session draft until Save.
import { predict, startsNeeded } from '@lib/cycle';
import { byId, todayIso } from '@lib/dom';
import { goTo } from '@lib/nav';
import { commit, draft, update } from '@lib/store';
import type { Period } from '@lib/types';

/** Called by the router each time this screen is shown. */
export default function mount(_signal: AbortSignal): void {
  interface Row {
    start_date: string; // '' while not filled in
    end_date: string;
  }

  const list = byId('periods');
  const saveBtn = byId<HTMLButtonElement>('next');
  const today = todayIso();
  const dob = draft().dob;

  let rows: Row[] = draft().periods.map((p) => ({ start_date: p.start_date, end_date: p.end_date ?? '' }));
  if (!rows.length) rows = [{ start_date: '', end_date: '' }];

  /** Same rules the backend enforces: no future dates, end after start, no overlapping periods. */
  function problems(rows: readonly Row[], today: string, dob: string | null): string[] {
    const errs = rows.map(() => '');
    rows.forEach((r, i) => {
      if (!r.start_date) {
        if (r.end_date) errs[i] = 'Add a start date.';
        return;
      }
      if (r.start_date > today) errs[i] = 'The start date is in the future.';
      else if (dob && r.start_date < dob) errs[i] = 'The start date is before your birthday.';
      else if (r.end_date && r.end_date < r.start_date) errs[i] = 'The end date is before the start date.';
      else if (r.end_date && r.end_date > today) errs[i] = 'The end date is in the future.';
    });
    rows.forEach((a, i) =>
      rows.forEach((b, j) => {
        if (j <= i || errs[i] || errs[j] || !a.start_date || !b.start_date) return;
        const aEnd = a.end_date || a.start_date;
        const bEnd = b.end_date || b.start_date;
        if (a.start_date === b.start_date) errs[j] = 'This start date is already listed.';
        else if (!(aEnd < b.start_date || bEnd < a.start_date)) errs[j] = 'These dates overlap another period.';
      }),
    );
    return errs;
  }

  function filled(): Period[] {
    return rows
      .filter((r) => r.start_date)
      .map((r): Period => ({
        start_date: r.start_date,
        end_date: r.end_date || null,
        kind: 'period',
        end_state: r.end_date ? 'ended' : 'unknown',
        flow_level: null,
      }))
      .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  }

  function refresh(): void {
    const errs = problems(rows, today, dob);
    list.querySelectorAll('.period').forEach((el, i) => {
      el.querySelector('.perr')!.textContent = errs[i];
      el.querySelectorAll('input').forEach((inp) => {
        if (errs[i]) inp.setAttribute('aria-invalid', 'true');
        else inp.removeAttribute('aria-invalid');
      });
    });
    const ok = errs.every((e) => !e);
    saveBtn.disabled = !ok;
    if (ok) update({ periods: filled() });

    const periods = filled();
    const r = predict(periods);
    const title = byId('progTitle');
    const text = byId('progText');
    if (r.status === 'ok') {
      title.textContent = 'Enough to estimate your next period';
      text.textContent = `Based on ${r.cycles_used} complete cycle${r.cycles_used > 1 ? 's' : ''}. You will see it after you save.`;
    } else {
      const need = startsNeeded(periods, r);
      title.textContent = periods.length
        ? `${need} more start date${need > 1 ? 's' : ''} for an estimate`
        : `An estimate needs ${need} start dates`;
      text.textContent = 'SikLo only estimates after 3 complete cycles. You can still save and log with fewer.';
    }
  }

  function render(): void {
    list.innerHTML = '';
    rows.forEach((r, i) => {
      const el = document.createElement('div');
      el.className = 'period';
      el.innerHTML = `
        <div class="row"><b>Period ${i + 1}</b>${rows.length > 1 ? '<button class="rm" type="button">Remove</button>' : ''}</div>
        <div class="pair">
          <div><label for="s${i}">Started</label><input id="s${i}" type="date" max="${today}" ${dob ? `min="${dob}"` : ''} value="${r.start_date}"></div>
          <div><label for="e${i}">Ended <span>· optional</span></label><input id="e${i}" type="date" max="${today}" value="${r.end_date}"></div>
        </div>
        <p class="perr" aria-live="polite"></p>`;
      el.querySelector<HTMLInputElement>(`#s${i}`)!.addEventListener('change', (e) => {
        r.start_date = (e.target as HTMLInputElement).value;
        refresh();
      });
      el.querySelector<HTMLInputElement>(`#e${i}`)!.addEventListener('change', (e) => {
        r.end_date = (e.target as HTMLInputElement).value;
        refresh();
      });
      el.querySelector('.rm')?.addEventListener('click', () => {
        rows.splice(i, 1);
        render();
      });
      list.appendChild(el);
    });
    refresh();
  }

  byId('addBtn').addEventListener('click', () => {
    rows.push({ start_date: '', end_date: '' });
    render();
    const inputs = list.querySelectorAll<HTMLInputElement>('input[type=date]');
    inputs[inputs.length - 2]?.focus();
  });

  saveBtn.addEventListener('click', () => {
    if (saveBtn.disabled) return;
    update({ periods: filled() });
    if (!commit()) {
      alert('This browser blocked saving. Check that site storage is allowed.');
      return;
    }
    goTo('home', 'forward');
  });

  render();
  byId('backBtn').addEventListener('click', () => goTo('step-3', 'back'));
}

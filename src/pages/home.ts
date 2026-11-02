// Home: next-period estimate, history, delete my data
import { diffDays, flagMessages, parseDate, predict, startsNeeded } from '../lib/cycle';
import { byId, esc, todayIso } from '../lib/dom';
import { goTo } from '../lib/nav';
import { load, wipe } from '../lib/store';
import type { SavedProfile } from '../lib/types';

const RECENT_CYCLES = 6; // matches the backend engine
const infoIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>';

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  parseDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
const short = (iso: string) => fmt(iso, { month: 'short', day: 'numeric' });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function renderPrediction(saved: SavedProfile): void {
  const r = predict(saved.periods);
  const pred = byId('pred');

  if (r.status === 'ok' && r.estimate && r.window && r.confidence && r.cycle_range) {
    const days = diffDays(parseDate(todayIso()), parseDate(r.estimate));
    const when =
      days > 1 ? `in ${days} days`
      : days === 1 ? 'tomorrow'
      : days === 0 ? 'today'
      : `${plural(-days, 'day')} ago. If it has started, add the date`;
    const chips = [
      `${r.confidence[0].toUpperCase()}${r.confidence.slice(1)} confidence`,
      `Cycles ${r.cycle_range[0]}–${r.cycle_range[1]} days`,
    ];
    if (r.expected_duration) chips.push(`Usually lasts ${r.expected_duration} days`);
    pred.innerHTML = `
      <p class="k">Next period, estimated</p>
      <p class="big">${fmt(r.estimate, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
      <p class="sub">${when}. Likely between ${short(r.window[0])} and ${short(r.window[1])}.</p>
      <div class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join('')}</div>`;
    byId('how').textContent =
      `How this is worked out: the middle value of your last ${Math.min(r.cycles_used, RECENT_CYCLES)} cycle lengths, ` +
      'counted from one period start to the next. The range runs from your shortest to your longest recent cycle. ' +
      'It is an estimate, not a guarantee.';
  } else {
    pred.classList.add('none');
    const need = startsNeeded(saved.periods, r);
    pred.innerHTML = `
      <p class="k">Next period</p>
      <p class="big">Not enough information yet</p>
      <p class="sub">SikLo estimates only after 3 complete cycles, so it never guesses. Add ${need} more start date${need > 1 ? 's' : ''} to see an estimate.</p>`;
  }

  byId('flags').innerHTML = flagMessages(r.flags)
    .map((f) => `<div class="flag">${infoIcon}<span>${esc(f.message)}</span></div>`)
    .join('');
}

function renderHistory(saved: SavedProfile): void {
  const hist = [...saved.periods].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  byId('hist').innerHTML = hist.length
    ? hist
        .map((p) => {
          const len = p.end_date ? diffDays(parseDate(p.start_date), parseDate(p.end_date)) + 1 : null;
          return `<li>${fmt(p.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}<span>${len ? plural(len, 'day') : 'End not recorded'}</span></li>`;
        })
        .join('')
    : '<li class="empty">No dates yet.</li>';
}

const saved = load();
if (!saved) {
  location.replace('index.html'); // nothing saved yet: start setup
} else {
  renderPrediction(saved);
  renderHistory(saved);
  byId('saved').textContent =
    `Saved in this browser on ${new Date(saved.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Nothing was sent anywhere.`;

  byId('editDates').addEventListener('click', () => goTo('setup/step-4.html', 'forward'));
  byId('editSetup').addEventListener('click', () => goTo('setup/step-1.html', 'forward'));
  byId('wipeBtn').addEventListener('click', () => {
    if (!confirm('Delete your SikLo profile and dates from this browser? This cannot be undone.')) return;
    wipe();
    goTo('index.html', 'back');
  });
}

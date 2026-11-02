// Profile: saved periods, edit dates or setup answers, delete everything from this device.
import { diffDays, parseDate } from '@lib/cycle';
import { byId } from '@lib/dom';
import { goTo } from '@lib/nav';
import { load, wipe } from '@lib/store';
import { mountTabbar } from '@lib/tabbar';

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  parseDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const saved = load();
if (!saved) {
  location.replace('index.html'); // nothing saved yet: start setup
} else {
  mountTabbar(byId('tabbar'));

  const hist = [...saved.periods].sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  byId('hist').innerHTML = hist.length
    ? hist
        .map((p) => {
          const len = p.end_date ? diffDays(parseDate(p.start_date), parseDate(p.end_date)) + 1 : null;
          return `<li>${fmt(p.start_date, { month: 'short', day: 'numeric', year: 'numeric' })}<span>${len ? plural(len, 'day') : 'End not recorded'}</span></li>`;
        })
        .join('')
    : '<li class="empty">No dates yet.</li>';

  byId('saved').textContent =
    `Setup saved in this browser on ${new Date(saved.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Nothing was sent anywhere.`;

  byId('editDates').addEventListener('click', () => goTo('setup/step-4.html', 'forward'));
  byId('editSetup').addEventListener('click', () => goTo('setup/step-1.html', 'forward'));
  byId('wipeBtn').addEventListener('click', () => {
    if (!confirm('Delete your SikLo profile, dates and logs from this browser? This cannot be undone.')) return;
    wipe();
    goTo('index.html', 'back');
  });
}

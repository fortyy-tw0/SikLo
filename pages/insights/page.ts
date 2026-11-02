// Insights: what the logs suggest, grouped by what it is for. Never a diagnosis.
import { estimateUnsuitable } from '@lib/context';
import { buildCycleView } from '@lib/cycleView';
import { byId, esc, todayIso } from '@lib/dom';
import { buildInsights, NOT_A_DIAGNOSIS, type Insight } from '@lib/insights';
import { load } from '@lib/store';
import { mountTabbar } from '@lib/tabbar';
import { loadTracking } from '@lib/tracking';

const GROUPS: { tone: Insight['tone']; heading: string }[] = [
  { tone: 'expect', heading: 'What to expect' },
  { tone: 'pattern', heading: 'What your log shows' },
  { tone: 'raise', heading: 'Worth mentioning to a professional' },
];

const WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>';

export default function mount(_signal: AbortSignal): void {
  const saved = load();
  if (!saved) { location.reload(); return; }
  mountTabbar(byId('tabbar'));
  byId('disclaimerText').textContent = NOT_A_DIAGNOSIS;

  const today = todayIso();
  const tracking = loadTracking();
  const view = buildCycleView(saved.periods, today, tracking.ovulation, {
    estimate: !estimateUnsuitable(saved.profile.life_stage),
  });
  const insights = buildInsights({ view, entries: tracking.entries, intimacy: tracking.intimacy, today });

  if (!insights.length) {
    byId('sections').innerHTML = `
      <div class="empty">
        <p class="t">Nothing to show yet</p>
        <p>Add the start date of a recent period and SikLo can begin describing your cycle. Estimates follow once three complete cycles are recorded.</p>
      </div>`;
    return;
  }

  byId('sections').innerHTML = GROUPS.map(({ tone, heading }) => {
    const group = insights.filter((i) => i.tone === tone);
    if (!group.length) return '';
    const count = tone === 'raise' ? `<span class="count">${group.length}</span>` : '';
    return `<h2>${heading}${count}</h2>` + group.map((i) => `
      <article class="card ${tone}">
        <p class="t">${tone === 'raise' ? WARN : ''}<span>${esc(i.title)}</span></p>
        <p>${esc(i.body)}</p>
      </article>`).join('');
  }).join('');
}

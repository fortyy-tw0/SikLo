// Calendar: a month at a time, showing what was recorded and what is estimated,
// and letting the person log a period day or intercourse from any date.
import { cycleDayOn, monthGrid, monthRange, type DayCell } from '@lib/calendar';
import { estimateUnsuitable } from '@lib/context';
import { parseDate } from '@lib/cycle';
import { buildCycleView, type CycleView } from '@lib/cycleView';
import { byId, esc, todayIso } from '@lib/dom';
import { load, savePeriods } from '@lib/store';
import { mountTabbar } from '@lib/tabbar';
import { toast } from '@lib/toast';
import {
  loadTracking, OBSERVATION_OPTIONS, PROTECTION_OPTIONS, saveTracking,
  type IntimacyEntry, type IntimacyObservation, type Protection,
} from '@lib/tracking';
import type { Period } from '@lib/types';

export default function mount(signal: AbortSignal): void {
  const saved = load();
  if (!saved) { location.reload(); return; }
  mountTabbar(byId('tabbar'));

  const today = todayIso();
  let periods: Period[] = [...saved.periods];
  const fmtLong = (iso: string) => parseDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });

  const state = () => {
    const t = loadTracking();
    const view: CycleView | null = buildCycleView(periods, today, t.ovulation, { estimate: !estimateUnsuitable(saved.profile.life_stage) });
    return { tracking: t, view, input: { periods, view, logs: t.logs, intimacy: t.intimacy, today } };
  };

  let shown: [number, number] = (() => {
    const d = parseDate(today);
    return [d.getUTCFullYear(), d.getUTCMonth()];
  })();

  // ---------- Grid ----------
  function render(): void {
    const { input, view } = state();
    const grid = monthGrid(shown[0], shown[1], input);
    byId('monthLabel').textContent = grid.label;

    byId('grid').innerHTML = grid.cells.map((c) => {
      if (!c.inMonth) return '<div class="cell blank" aria-hidden="true"></div>';
      const classes = ['cell'];
      if (c.periodStart) classes.push('period-start');
      else if (c.period) classes.push('period');
      if (c.spotting) classes.push('spotting');
      if (c.predictedPeriod) classes.push('predicted');
      if (c.fertile) classes.push('fertile');
      if (c.ovulation) classes.push('ovulation');
      if (c.isToday) classes.push('today');
      if (c.future) classes.push('future');
      const dots = [
        ...(c.logs.length ? ['<i></i>'] : []),
        ...(c.intimacy ? ['<i class="heart"></i>'] : []),
      ].join('');
      return `<button class="${classes.join(' ')}" type="button" data-date="${c.date}" aria-label="${esc(label(c))}">
        <span class="n">${c.dayOfMonth}</span><span class="dots">${dots}</span></button>`;
    }).join('');

    const r = monthRange(input);
    const index = shown[0] * 12 + shown[1];
    byId<HTMLButtonElement>('prevBtn').disabled = index <= r.first[0] * 12 + r.first[1];
    byId<HTMLButtonElement>('nextBtn').disabled = index >= r.last[0] * 12 + r.last[1];

    byId('estimateNote').textContent = view?.estimateOff
      ? 'Estimates are turned off for the life stage you recorded, so only what you logged is shown.'
      : grid.hasEstimates
        ? 'Estimated days come from your recent cycles and can shift. They are not a method of birth control.'
        : 'Estimates appear once you have three complete cycles recorded.';
  }

  function label(c: DayCell): string {
    const bits: string[] = [c.dayOfMonth.toString()];
    if (c.periodStart) bits.push('period started');
    else if (c.period) bits.push('period day');
    if (c.spotting) bits.push('spotting');
    if (c.predictedPeriod) bits.push('period expected');
    if (c.ovulation) bits.push('ovulation estimated');
    else if (c.fertile) bits.push('fertile window');
    if (c.logs.length) bits.push('logged');
    if (c.intimacy) bits.push('intercourse logged');
    if (c.isToday) bits.push('today');
    return bits.join(', ');
  }

  const step = (by: number) => {
    const m = shown[1] + by;
    shown = [shown[0] + Math.floor(m / 12), ((m % 12) + 12) % 12];
    render();
  };
  byId('prevBtn').addEventListener('click', () => step(-1));
  byId('nextBtn').addEventListener('click', () => step(1));

  // ---------- Day sheet ----------
  const sheet = byId('sheet');
  const scrim = byId('scrim');
  let openDate: string | null = null;

  const closeSheet = () => {
    sheet.classList.remove('show');
    scrim.classList.remove('show');
    openDate = null;
  };
  scrim.addEventListener('click', closeSheet);
  byId('closeSheet').addEventListener('click', closeSheet);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openDate) closeSheet(); }, { signal });

  byId('grid').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-date]');
    if (b?.dataset.date) openDay(b.dataset.date);
  });

  /** The period a date falls inside, if any. */
  const periodOn = (date: string) =>
    periods.find((p) => date >= p.start_date && date <= (p.end_date ?? p.start_date));
  /** A period that has been started but not ended, on or before this date. */
  const openPeriodBefore = (date: string) =>
    periods.filter((p) => !p.end_date && p.start_date < date).sort((a, b) => (a.start_date < b.start_date ? 1 : -1))[0];

  function openDay(date: string): void {
    openDate = date;
    const { view, input } = state();
    const grid = monthGrid(shown[0], shown[1], input);
    const cell = grid.cells.find((c) => c.date === date)!;

    byId('sheetDate').textContent = fmtLong(date);
    const day = cycleDayOn(view, date);
    byId('sheetWhen').textContent = [
      date === today ? 'Today' : date > today ? 'Not yet' : '',
      day && day > 0 ? `Cycle day ${day}` : '',
    ].filter(Boolean).join(' · ');

    const marks: string[] = [];
    if (cell.periodStart) marks.push('Period started');
    else if (cell.period) marks.push('Period day');
    if (cell.spotting) marks.push('Spotting');
    if (cell.predictedPeriod) marks.push('Period expected');
    if (cell.ovulation) marks.push(cell.ovulationConfirmed ? 'Ovulation confirmed' : 'Ovulation estimated');
    else if (cell.fertile) marks.push('Fertile window');
    if (cell.logs.length) marks.push(`Logged: ${cell.logs.join(', ')}`);
    byId('sheetMarks').innerHTML = marks.map((m) => `<span>${esc(m)}</span>`).join('');

    renderActions(date, cell);
    byId('sheetPanel').innerHTML = '';
    scrim.classList.add('show');
    sheet.classList.add('show');
  }

  const ICON = {
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
    heart: '<path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  };

  function renderActions(date: string, cell: DayCell): void {
    const future = date > today;
    const inPeriod = periodOn(date);
    const openBefore = openPeriodBefore(date);
    const acts: string[] = [];

    if (future) {
      acts.push(`<button class="act" disabled><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON.drop}</svg></span>You can log this once the day arrives</button>`);
    } else if (cell.periodStart) {
      acts.push(act('remove', 'Remove this period', ICON.trash, true));
    } else if (inPeriod) {
      acts.push(act('end-here', 'End the period on this day', ICON.stop));
    } else {
      acts.push(act('start', 'Period started this day', ICON.drop));
      if (openBefore) acts.push(act('end', `End the period that started ${parseDate(openBefore.start_date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}`, ICON.stop));
    }
    if (!future) acts.push(act('intimacy', cell.intimacy ? 'Edit intercourse log' : 'Log intercourse', ICON.heart));
    byId('sheetActs').innerHTML = acts.join('');
  }

  const act = (id: string, text: string, icon: string, danger = false) =>
    `<button class="act${danger ? ' danger' : ''}" type="button" data-act="${id}">
       <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span>${esc(text)}</button>`;

  byId('sheetActs').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-act]');
    if (!b || !openDate) return;
    const date = openDate;
    switch (b.dataset.act) {
      case 'start': {
        periods = [...periods, { start_date: date, end_date: null, kind: 'period', end_state: 'unknown', flow_level: null }];
        commit(`Period start saved for ${parseDate(date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}`);
        break;
      }
      case 'end': {
        const open = openPeriodBefore(date);
        if (open) {
          periods = periods.map((p) => (p === open ? { ...p, end_date: date, end_state: 'ended' as const } : p));
          commit('Period end saved');
        }
        break;
      }
      case 'end-here': {
        const p = periodOn(date);
        if (p) {
          periods = periods.map((x) => (x === p ? { ...x, end_date: date, end_state: 'ended' as const } : x));
          commit('Period end saved');
        }
        break;
      }
      case 'remove': {
        const p = periodOn(date);
        if (p && confirm('Remove this period from your records?')) {
          periods = periods.filter((x) => x !== p);
          commit('Period removed');
        }
        break;
      }
      case 'intimacy':
        renderIntimacy(date);
        break;
    }
  });

  function commit(message: string): void {
    if (!savePeriods(periods)) { toast('This browser blocked saving'); return; }
    render();
    closeSheet();
    toast(message);
  }

  // ---------- Intercourse ----------
  function renderIntimacy(date: string): void {
    const existing: IntimacyEntry = loadTracking().intimacy[date] ?? { protection: null, observations: [], note: '' };
    byId('sheetPanel').innerHTML = `
      <div class="panel">
        <h3>Intercourse on this day</h3>
        <p>Only what helps you and a clinician read your cycle. Every part is optional.</p>
        <label>Protection used <span>· optional</span></label>
        <div class="opts" role="radiogroup" aria-label="Protection used" id="protOpts">
          ${PROTECTION_OPTIONS.map((o) => `<button class="opt" type="button" role="radio" aria-checked="${existing.protection === o.value}" data-v="${o.value}">${esc(o.label)}</button>`).join('')}
        </div>
        <label>Anything you noticed <span>· optional</span></label>
        <div class="opts" id="obsOpts">
          ${OBSERVATION_OPTIONS.map((o) => `<button class="opt" type="button" aria-pressed="${existing.observations.includes(o.value)}" data-v="${o.value}">${esc(o.label)}</button>`).join('')}
        </div>
        <label for="intNote">Note <span>· optional</span></label>
        <textarea id="intNote" maxlength="200" placeholder="Anything you want to remember">${esc(existing.note)}</textarea>
        <p class="note" id="intHint"></p>
        <button class="cta" type="button" id="saveInt">Save</button>
        ${loadTracking().intimacy[date] ? '<button class="link" type="button" id="removeInt">Remove this entry</button>' : ''}
      </div>`;

    let protection: Protection | null = existing.protection;
    let observations: IntimacyObservation[] = [...existing.observations];
    const hint = byId('intHint');

    const refreshHint = () => {
      const { view } = state();
      const bits: string[] = [];
      if (observations.includes('bleeding_after')) {
        bits.push('Bleeding after sex is one of the things worth having checked by a healthcare professional, even if it is light.');
      }
      if (protection === 'none' || protection === 'unsure') {
        const fertile = view?.fertile && cycleDayOn(view, date);
        const inWindow = fertile && cycleDayOn(view, date)! >= view!.fertile![0] && cycleDayOn(view, date)! <= view!.fertile![1];
        bits.push(inWindow
          ? 'This falls in your estimated fertile window. Pregnancy is possible, and a test is the only way to know.'
          : 'Pregnancy is possible on any day of a cycle; estimates cannot rule it out.');
      }
      hint.textContent = bits.join(' ');
    };
    refreshHint();

    byId('protOpts').addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('.opt');
      if (!b) return;
      protection = protection === b.dataset.v ? null : (b.dataset.v as Protection);
      byId('protOpts').querySelectorAll('.opt').forEach((o) => o.setAttribute('aria-checked', String((o as HTMLElement).dataset.v === protection)));
      refreshHint();
    });
    byId('obsOpts').addEventListener('click', (e) => {
      const b = (e.target as Element).closest<HTMLElement>('.opt');
      if (!b) return;
      const v = b.dataset.v as IntimacyObservation;
      observations = observations.includes(v) ? observations.filter((o) => o !== v) : [...observations, v];
      b.setAttribute('aria-pressed', String(observations.includes(v)));
      refreshHint();
    });
    byId('saveInt').addEventListener('click', () => {
      const note = byId<HTMLTextAreaElement>('intNote').value.trim();
      saveTracking((t) => { t.intimacy[date] = { protection, observations, note }; });
      render();
      closeSheet();
      toast('Saved on this device');
    });
    document.getElementById('removeInt')?.addEventListener('click', () => {
      saveTracking((t) => { delete t.intimacy[date]; });
      render();
      closeSheet();
      toast('Entry removed');
    });
    byId('sheetPanel').scrollIntoView({ block: 'nearest' });
  }

  render();
}

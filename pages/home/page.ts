// Today: cycle ring, key dates, confidence, daily log, phase + confirm ovulation, health flags, trends.
import { diffDays, parseDate, startsNeeded } from '@lib/cycle';
import {
  averageCycle, averagePeriod, buildCycleView, dateOfDay, ringFor, TYPICAL_CYCLE, variation,
  type CycleView, type Phase,
} from '@lib/cycleView';
import { byId, esc, todayIso } from '@lib/dom';
import { estimateUnsuitable } from '@lib/context';
import { greetingForThisVisit, withName } from '@lib/greeting';
import { load, savedName } from '@lib/store';
import { mountTabbar } from '@lib/tabbar';
import { toast } from '@lib/toast';
import {
  describeEntry, emptyEntry, FLOW_OPTIONS, LOG_KINDS, loadTracking, loggedKinds, MOOD_OPTIONS,
  saveTracking, SYMPTOM_OPTIONS, type LogKind, type OvulationSign,
} from '@lib/tracking';
import { redirect } from '@lib/router';

/** Called by the router each time this screen is shown. */
export default function mount(signal: AbortSignal): void {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const today = todayIso();

  // ---------- Formatting ----------
  const fmt = (iso: string) => parseDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
  const fmtRange = (a: string, b: string) => {
    if (a === b) return fmt(a);
    return a.slice(0, 7) === b.slice(0, 7) ? `${fmt(a)}–${Number(b.slice(8))}` : `${fmt(a)} – ${fmt(b)}`;
  };
  const inDays = (n: number) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 0 ? `${-n} days ago` : `in ${n} days`);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // ---------- Static content ----------
  const LOG_ITEMS: Record<LogKind, { label: string; icon: string }> = {
    flow: { label: 'Flow', icon: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>' },
    mood: { label: 'Mood', icon: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.6"/>' },
    symptoms: { label: 'Symptoms', icon: '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 9h6M9 13h6M9 17h3"/>' },
    temp: { label: 'Temp', icon: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>' },
  };

  /** What each Log today chip opens. */
const LOG_SHEET: Record<LogKind, { title: string; hint: string }> = {
  flow: { title: 'Flow today', hint: 'How heavy is the bleeding?' },
  mood: { title: 'Mood today', hint: 'Pick any that fit. More than one is fine.' },
  symptoms: { title: 'Symptoms today', hint: 'Pick anything you have noticed today.' },
  temp: { title: 'Temperature today', hint: 'Your morning reading, if you take one.' },
};

const SIGNS: { key: OvulationSign; title: string; detail: string }[] = [
    { key: 'lh', title: 'Positive ovulation test', detail: 'LH strip turned positive' },
    { key: 'bbt', title: 'Temperature rise', detail: 'Morning temp up ~0.2–0.5°C for 3 days' },
    { key: 'cm', title: 'Egg-white mucus', detail: 'Clear, stretchy discharge' },
    { key: 'pain', title: 'Ovulation pain', detail: 'One-sided pelvic twinge' },
  ];

  const PHASE_LABEL: Record<Phase, string> = {
    Period: 'Period phase',
    Follicular: 'Follicular phase',
    'Fertile window': 'Fertile window',
    Luteal: 'Luteal phase',
    Late: 'Period expected',
    Tracking: 'Keep logging',
  };

  function phaseCopy(v: CycleView): { title: string; text: string } {
    const [f0, f1] = v.fertile ?? [0, 0];
    switch (v.phase) {
      case 'Period':
        return { title: `Period · days 1–${v.periodDays}`,
          text: 'Hormones are at their lowest. Rest, iron-rich food and gentle movement can help with fatigue and cramps.' };
      case 'Follicular':
        return { title: `Follicular · days ${v.periodDays + 1}–${f0 - 1}`,
          text: 'Estrogen is rising, so energy and focus often pick up. Logging your morning temperature now helps confirm when ovulation happens.' };
      case 'Fertile window':
        return { title: `Fertile window · days ${f0}–${f1}`,
          text: 'Pregnancy is most likely now. Watch for egg-white mucus or a positive ovulation test, then confirm below.' };
      case 'Luteal':
        return { title: `Luteal · days ${v.ovulationDay! + 1}–${v.length}`,
          text: 'Progesterone rises after ovulation. Bloating, breast tenderness or mood dips before your period are common.' };
      case 'Late':
        return { title: `Period expected · day ${v.cycleDay}`,
          text: `Your period was expected around ${fmt(v.next!.likely)}. Cycles shift for many reasons, like stress, travel or illness. If it has started, add the date. If it hasn't and you could be pregnant, a test can tell you.` };
      case 'Tracking':
        if (v.estimateOff) {
          return { title: `Day ${v.cycleDay}`,
            text: 'Date-based estimates are off for your current life stage. You can still log bleeding and symptoms, and change this in your setup answers anytime.' };
        }
        return { title: `Day ${v.cycleDay}`,
          text: 'SikLo shows phases once it can estimate your next period, after 3 complete cycles. Until then, keep adding period start dates. If you notice ovulation signs, you can confirm them below.' };
    }
  }

  // ---------- Rendering ----------
  function renderHeader(): void {
    const name = savedName();
    byId('greeting').textContent = withName(greetingForThisVisit(), name);
    if (name) {
      const avatar = byId('avatar');
      avatar.textContent = [...name][0].toUpperCase(); // first character, emoji-safe
      avatar.setAttribute('aria-label', `Your profile (${name})`);
    }
    byId('todayLabel').textContent = parseDate(today).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' });
  }

  const motion = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let firstDraw = true;

  /** Counts the big cycle-day number up from 1. */
  function countUp(el: HTMLElement, to: number): void {
    if (!motion() || to <= 1) { el.textContent = String(to); return; }
    const start = performance.now(), ms = Math.min(700, 250 + to * 20);
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      el.textContent = String(Math.max(1, Math.round(1 + (to - 1) * (1 - (1 - k) ** 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function drawRing(v: CycleView): void {
    const svg = byId('ring') as unknown as SVGSVGElement;
    svg.innerHTML = '';
    const animate = firstDraw && motion();
    firstDraw = false;
    let order = 0; // arcs draw one after another
    const ring = ringFor(v);
    const C = 125, R = 108, W = 14, L = ring.days;
    const set = (el: Element, attrs: Record<string, string | number>) => Object.entries(attrs).forEach(([k, val]) => el.setAttribute(k, String(val)));

    const arc = (from: number, to: number, color: string) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      const gap = 0.18;
      set(c, { cx: C, cy: C, r: R, fill: 'none', stroke: color, 'stroke-width': W, pathLength: L,
        'stroke-dasharray': `${to - from + 1 - gap} ${L}`, 'stroke-dashoffset': -(from - 1) - gap / 2,
        transform: `rotate(-90 ${C} ${C})` });
      svg.appendChild(c);
      if (animate) {
        // Grow each arc from its start around the ring
        c.animate([{ strokeDasharray: `0 ${L}` }, { strokeDasharray: `${to - from + 1 - gap} ${L}` }],
          { duration: 700, delay: order++ * 140, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'backwards' });
      }
    };
    const point = (day: number) => {
      const a = ((day - 0.5) / L) * 2 * Math.PI - Math.PI / 2;
      return [C + R * Math.cos(a), C + R * Math.sin(a)];
    };
    const dot = (day: number, r: number, fill: string, stroke = 'none', sw = 0) => {
      const [x, y] = point(day);
      const c = document.createElementNS(SVG_NS, 'circle');
      set(c, { cx: x, cy: y, r, fill, stroke, 'stroke-width': sw });
      c.style.transformBox = 'fill-box';
      c.style.transformOrigin = 'center';
      svg.appendChild(c);
      if (animate) {
        c.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.25)', opacity: 1, offset: .7 }, { transform: 'scale(1)', opacity: 1 }],
          { duration: 420, delay: 520 + order * 60, easing: 'ease-out', fill: 'backwards' });
      }
    };

    arc(1, L, cssVar('--purple-100'));
    arc(1, ring.periodDays, cssVar('--purple-300'));
    if (ring.fertile) arc(ring.fertile[0], ring.fertile[1], cssVar('--purple-700'));
    if (ring.ovulationDay) dot(ring.ovulationDay, 3, cssVar('--white'));
    dot(ring.todayDay, 10, cssVar('--white'), cssVar('--purple-900'), 3.5);

    // Before an estimate exists the ring is only a guide; say so
    const note = byId('ringNote');
    note.hidden = ring.scale === 'estimate';
    note.textContent = v.estimateOff
      ? 'Estimates are off for your current life stage, so the ring is only a guide.'
      : ring.scale === 'average'
      ? `The ring shows your average ${ring.days}-day cycle until SikLo can estimate your next period.`
      : `The ring shows a typical ${ring.days}-day cycle until SikLo learns yours.`;

    if (animate) countUp(byId('dayNum'), v.cycleDay);
    else byId('dayNum').textContent = String(v.cycleDay);
    byId('phaseName').textContent = PHASE_LABEL[v.phase];
    byId('ring').setAttribute('aria-label', `Cycle day ${v.cycleDay}, ${PHASE_LABEL[v.phase]}`);
    byId('legendFertile').hidden = !v.fertile;
  }

  function renderDates(v: CycleView, periods: Parameters<typeof startsNeeded>[0]): void {
    const set = (id: string, value: string, sub: string, na = false) => {
      const el = byId(id);
      el.textContent = value;
      el.classList.toggle('na', na);
      byId(`${id}S`).textContent = sub;
    };

    if (v.next) {
      const overdue = today > v.next.likely;
      set('dPeriod', fmtRange(v.next.from, v.next.to), overdue ? `was due ${fmt(v.next.likely)}` : `likely ${fmt(v.next.likely)}`);
    } else if (v.estimateOff) {
      set('dPeriod', 'Off', 'for your life stage', true);
    } else {
      const need = startsNeeded(periods, v.prediction);
      set('dPeriod', 'Not enough data', `${plural(need, 'more date')}`, true);
    }

    if (v.fertile) {
      const a = dateOfDay(v.cycleStart, v.fertile[0]);
      const b = dateOfDay(v.cycleStart, v.fertile[1]);
      set('dFertile', fmtRange(a, b), today > b ? 'ended' : today >= a ? 'happening now' : inDays(diffDays(parseDate(today), parseDate(a))));
      const ov = dateOfDay(v.cycleStart, v.ovulationDay!);
      set('dOv', `${v.confirmed ? '' : '~'}${fmt(ov)}`, v.confirmed ? 'confirmed by you' : 'estimated');
    } else {
      const why = v.estimateOff ? 'off' : 'needs an estimate';
      set('dFertile', '–', why, true);
      set('dOv', '–', why, true);
    }
  }

  function renderConfidence(v: CycleView): void {
    const labels = ['', 'Low', 'Medium', 'High'];
    [...byId('meter').children].forEach((el, i) => el.classList.toggle('on', v.confidence !== null && i < v.confidence));
    const txt = byId('confTxt');
    const why = byId('why');
    const notBirthControl = '<li>Fertile window and ovulation are estimates. They are not a method of birth control.</li>';

    if (v.confirmed) {
      const n = v.confirmed.signs.length;
      txt.innerHTML = `<b>${labels[v.confidence!]} confidence</b> · updated from the signs you logged`;
      why.innerHTML = `<ul>
        <li>You confirmed ovulation on cycle day ${v.confirmed.day} (${plural(n, 'sign')}).</li>
        <li>The time from ovulation to your period is usually steady (about 14 days), so the window is now narrower.</li>
        ${notBirthControl}</ul>`;
    } else if (v.next && v.prediction.cycle_range) {
      const [lo, hi] = v.prediction.cycle_range;
      const used = Math.min(v.prediction.cycles_used, 6);
      txt.innerHTML = `<b>${labels[v.confidence!]} confidence</b> · your recent cycles ranged ${lo}–${hi} days`;
      why.innerHTML = `<ul>
        <li>Based on your last ${plural(used, 'cycle')} (typical length ${v.prediction.median_cycle_len} days).</li>
        <li>Lengths ranged ${lo}–${hi} days, so SikLo shows a range, not one date.</li>
        <li>Confirming ovulation this cycle makes the period estimate much tighter.</li>
        ${notBirthControl}</ul>`;
    } else if (v.estimateOff) {
      txt.innerHTML = '<b>Estimates off</b> · for your current life stage';
      why.innerHTML = `<ul><li>${esc(estimateUnsuitable(saved?.profile.life_stage) ?? '')}</li>
        <li>You can change this anytime from Profile, under Change setup answers.</li></ul>`;
    } else {
      txt.innerHTML = '<b>No estimate yet</b> · SikLo needs 3 complete cycles';
      why.innerHTML = `<ul>
        <li>SikLo estimates your next period only after 3 complete cycles, so it never guesses.</li>
        <li>You have ${plural(v.prediction.cycles_used, 'complete cycle')} recorded. Add earlier start dates from your Profile.</li>
        <li>Confirming ovulation this cycle gives an estimate sooner.</li></ul>`;
    }
  }

  function renderLog(): void {
    const entry = loadTracking().entries[today];
    const done = new Set(loggedKinds(entry));
    byId('log').innerHTML = LOG_KINDS.map((k) => `
      <button class="chip" type="button" data-kind="${k}" aria-pressed="${done.has(k)}">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LOG_ITEMS[k].icon}</svg></div>${LOG_ITEMS[k].label}
      </button>`).join('');
    const summary = entry ? describeEntry(entry) : '';
    byId('logCount').textContent = done.size ? `${done.size} of ${LOG_KINDS.length} logged` : 'Nothing logged yet';
    byId('logSummary').textContent = summary;
    byId('logSummary').hidden = !summary;
  }

  /** Set below, once the screen is built; the log sheet calls it after saving. */
  let refreshAll: () => void = () => {};

  // ---------- Logging a category, with a Save ----------
  const logSheet = byId('logSheet');
  const logScrim = byId('logScrim');
  let openKind: LogKind | null = null;

  const closeLog = () => {
    logSheet.classList.remove('show');
    logScrim.classList.remove('show');
    openKind = null;
  };
  logScrim.addEventListener('click', closeLog);
  byId('cancelLog').addEventListener('click', closeLog);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && openKind) closeLog(); }, { signal });

  const chipRow = (options: readonly string[], chosen: readonly string[], multi: boolean) =>
    options.map((o) => `<button class="logopt" type="button" data-v="${esc(o)}"
      ${multi ? `aria-pressed="${chosen.includes(o)}"` : `role="radio" aria-checked="${chosen.includes(o)}"`}>${esc(o)}</button>`).join('');

  function openLog(kind: LogKind): void {
    openKind = kind;
    const entry = { ...emptyEntry(), ...loadTracking().entries[today] };
    byId('logTitle').textContent = LOG_SHEET[kind].title;
    byId('logHint').textContent = LOG_SHEET[kind].hint;

    const fields = byId('logFields');
    if (kind === 'flow') {
      fields.innerHTML = `<div class="logopts" role="radiogroup" aria-label="Flow" id="flowOpts">
        ${chipRow(FLOW_OPTIONS.map((f) => f.label), entry.flow ? [FLOW_OPTIONS.find((f) => f.value === entry.flow)!.label] : [], false)}</div>`;
    } else if (kind === 'mood') {
      fields.innerHTML = `<div class="logopts" id="moodOpts">${chipRow(MOOD_OPTIONS, entry.moods, true)}</div>`;
    } else if (kind === 'symptoms') {
      fields.innerHTML = `<div class="logopts" id="sympOpts">${chipRow(SYMPTOM_OPTIONS, entry.symptoms, true)}</div>`;
    } else {
      fields.innerHTML = `<label class="tlabel" for="tempInput">Temperature in °C</label>
        <input class="tinput" id="tempInput" type="number" inputmode="decimal" step="0.1" min="33" max="43"
          placeholder="36.6" value="${entry.tempC ?? ''}">
        <p class="thint">Taken at the same time each morning before getting up is the most useful.</p>`;
    }

    const note = byId<HTMLTextAreaElement>('logNote');
    note.value = entry.note;
    byId('clearLog').hidden = !loggedKinds(loadTracking().entries[today]).includes(kind);
    logScrim.classList.add('show');
    logSheet.classList.add('show');
    fields.querySelector<HTMLElement>('.logopt, .tinput')?.focus({ preventScroll: true });
  }

  byId('logFields').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('.logopt');
    if (!b) return;
    const multi = b.hasAttribute('aria-pressed');
    if (multi) b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
    else {
      const on = b.getAttribute('aria-checked') !== 'true';
      b.parentElement!.querySelectorAll('.logopt').forEach((o) => o.setAttribute('aria-checked', 'false'));
      b.setAttribute('aria-checked', String(on)); // tapping the chosen one again clears it
    }
  });

  const chosenIn = (id: string) =>
    [...byId(id).querySelectorAll<HTMLElement>('.logopt')]
      .filter((o) => o.getAttribute('aria-pressed') === 'true' || o.getAttribute('aria-checked') === 'true')
      .map((o) => o.dataset.v!);

  byId('saveLog').addEventListener('click', () => {
    if (!openKind) return;
    const kind = openKind;
    const note = byId<HTMLTextAreaElement>('logNote').value.trim();
    saveTracking((t) => {
      const entry = { ...emptyEntry(), ...t.entries[today] };
      if (kind === 'flow') {
        const label = chosenIn('flowOpts')[0];
        entry.flow = FLOW_OPTIONS.find((f) => f.label === label)?.value;
      } else if (kind === 'mood') entry.moods = chosenIn('moodOpts');
      else if (kind === 'symptoms') entry.symptoms = chosenIn('sympOpts');
      else {
        const value = Number(byId<HTMLInputElement>('tempInput').value);
        entry.tempC = Number.isFinite(value) && value >= 33 && value <= 43 ? value : undefined;
      }
      entry.note = note;
      t.entries[today] = entry;
    });
    closeLog();
    refreshAll();
    byId('log').querySelector(`[data-kind="${kind}"]`)?.classList.add('pop');
    toast('Saved on this device');
  });

  byId('clearLog').addEventListener('click', () => {
    if (!openKind) return;
    const kind = openKind;
    saveTracking((t) => {
      const entry = t.entries[today];
      if (!entry) return;
      if (kind === 'flow') delete entry.flow;
      else if (kind === 'mood') entry.moods = [];
      else if (kind === 'symptoms') entry.symptoms = [];
      else delete entry.tempC;
    });
    closeLog();
    refreshAll();
    toast('Cleared');
  });

  function renderPhase(v: CycleView): void {
    const { title, text } = phaseCopy(v);
    byId('phaseTitle').textContent = title;
    byId('phaseCopy').textContent = text;

    const wrap = byId('phaseBarWrap');
    const bar = byId('phaseBar');
    bar.innerHTML = '';
    wrap.hidden = !(v.length && v.ovulationDay);
    if (v.length && v.ovulationDay) {
      const L = v.length;
      const parts: [number, string][] = [
        [v.periodDays, '--purple-300'],
        [Math.max(0, v.ovulationDay - v.periodDays - 1), '--purple-500'],
        [1, '--purple-700'],
        [Math.max(0, L - v.ovulationDay), '--purple-100'],
      ];
      for (const [days, color] of parts) {
        const b = document.createElement('b');
        b.style.width = `${(days / L) * 100}%`;
        b.style.background = cssVar(color);
        bar.appendChild(b);
      }
      const mark = document.createElement('b');
      mark.className = 'mark';
      mark.style.left = `calc(${((Math.min(v.cycleDay, L) - 0.5) / L) * 100}% - 1.5px)`;
      bar.appendChild(mark);
    }

    byId('openSheet').hidden = !!v.confirmed || v.estimateOff || v.cycleDay <= v.periodDays;
    byId('confirmedNote').hidden = !v.confirmed;
    byId('confirmedTxt').textContent = v.confirmed ? `Ovulation confirmed on day ${v.confirmed.day}` : '';
  }

  const infoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5M12 16.5h.01"/><circle cx="12" cy="12" r="9"/></svg>';

  function renderFlags(v: CycleView): void {
    const t = loadTracking();
    const flags = v.flags.filter((f) => !t.dismissed.includes(f.key));
    const el = byId('flags');
    if (!flags.length) {
      el.innerHTML = v.cycles.length
        ? '<div class="flag-ok">Nothing unusual in your recent cycles. 🌸</div>'
        : '<div class="flag-ok">SikLo looks for patterns once you have at least one complete cycle.</div>';
      return;
    }
    el.innerHTML = flags.map((f) => {
      const reported = t.reported.includes(f.key);
      return `
      <div class="flag" data-key="${esc(f.key)}">
        <div class="row"><div class="dot">${infoIcon}</div><div><div class="t">${esc(f.title)}</div><p>${esc(f.text)}</p></div></div>
        <div class="acts">
          <button class="pill solid" type="button" data-act="report"${reported ? ' disabled' : ''}>${reported ? 'Added ✓' : 'Add to doctor report'}</button>
          <button class="pill" type="button" data-act="dismiss">Dismiss</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderTrends(v: CycleView): void {
    const n = v.cycles.length;
    byId('trendLabel').textContent = n ? `Last ${plural(n, 'cycle')}` : 'No complete cycles yet';
    const stat = (id: string, value: number | null, prefix = '') => {
      byId(id).innerHTML = value === null ? '–' : `${prefix}${value}<small>days</small>`;
    };
    stat('sAvg', averageCycle(v));
    stat('sPer', averagePeriod(v));
    stat('sVar', variation(v), '±');
    byId('rangeTxt').textContent = n ? `Range ${Math.min(...v.cycles)}–${Math.max(...v.cycles)} days` : '';
    byId('bandTxt').textContent = `Shaded band = typical range (${TYPICAL_CYCLE[0]}–${TYPICAL_CYCLE[1]} days)`;

    const bars = byId('bars');
    bars.innerHTML = '';
    if (!n) {
      bars.innerHTML = '<p class="empty">Your cycle lengths appear here once you have one complete cycle.</p>';
      return;
    }
    const lo = 18, hi = 42, H = 70; // chart scale: days -> px
    const y = (d: number) => ((Math.min(Math.max(d, lo), hi) - lo) / (hi - lo)) * H;
    const band = document.createElement('div');
    band.className = 'normal-band';
    band.style.bottom = `${y(TYPICAL_CYCLE[0])}px`;
    band.style.height = `${y(TYPICAL_CYCLE[1]) - y(TYPICAL_CYCLE[0])}px`;
    bars.appendChild(band);
    v.cycles.forEach((d, i) => {
      const col = document.createElement('div');
      const out = d > TYPICAL_CYCLE[1] || d < TYPICAL_CYCLE[0];
      col.className = 'col' + (out ? ' out' : i === n - 1 ? ' cur' : '');
      col.innerHTML = `<span>${d}</span><i style="height:${y(d)}px"></i>`;
      col.setAttribute('aria-label', `${d} days${out ? ', outside the typical range' : ''}`);
      bars.appendChild(col);
    });
  }

  // ---------- Page ----------
  const saved = load();
  if (!saved) {
    redirect('index'); // nothing saved yet: start setup
  } else {
    mountTabbar(byId('tabbar'));
    renderHeader();
    let view: CycleView | null = null;

    const render = () => {
      view = buildCycleView(saved.periods, today, loadTracking().ovulation, { estimate: !estimateUnsuitable(saved.profile.life_stage) });
      byId('empty').hidden = !!view;
      byId('cycleContent').hidden = !view;
      if (!view) return;
      drawRing(view);
      renderDates(view, saved.periods);
      renderConfidence(view);
      renderLog();
      renderPhase(view);
      renderFlags(view);
      renderTrends(view);
    };
    refreshAll = render;
    render();

    // Confidence explainer
    const confBtn = byId('confBtn');
    confBtn.addEventListener('click', () => {
      const open = confBtn.getAttribute('aria-expanded') !== 'true';
      confBtn.setAttribute('aria-expanded', String(open));
      const why = byId('why');
      why.hidden = !open;
      if (open && motion()) why.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
    });

    // Log today: each chip opens its own detail, saved on Save
    byId('log').addEventListener('click', (e) => {
      const chip = (e.target as Element).closest<HTMLElement>('.chip');
      if (chip) openLog(chip.dataset.kind as LogKind);
    });

    // Health flags
    byId('flags').addEventListener('click', (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-act]');
      const key = btn?.closest<HTMLElement>('.flag')?.dataset.key;
      if (!btn || !key || !view) return;
      if (btn.dataset.act === 'report') {
        saveTracking((t) => { if (!t.reported.includes(key)) t.reported.push(key); });
        toast('Added to your doctor report');
      } else {
        saveTracking((t) => { if (!t.dismissed.includes(key)) t.dismissed.push(key); });
      }
      renderFlags(view);
    });

    // Confirm ovulation sheet
    const sheet = byId('sheet');
    const scrim = byId('scrim');
    const opts = byId('opts');
    const minus = byId<HTMLButtonElement>('dMinus');
    const plus = byId<HTMLButtonElement>('dPlus');
    const saveOv = byId<HTMLButtonElement>('saveOv');
    let pickDay = 1;

    opts.innerHTML = SIGNS.map((s) => `
      <button class="opt" type="button" role="checkbox" aria-checked="false" data-k="${s.key}">
        <span class="box"></span><span><b>${s.title}</b><small>${s.detail}</small></span>
      </button>`).join('');

    const bounds = () => [view!.periodDays + 1, view!.cycleDay] as const; // after the period, never in the future
    const updatePick = () => {
      const [min, max] = bounds();
      byId('dVal').textContent = `Day ${pickDay} · ${fmt(dateOfDay(view!.cycleStart, pickDay))}`;
      minus.disabled = pickDay <= min;
      plus.disabled = pickDay >= max;
      saveOv.disabled = !opts.querySelector('[aria-checked="true"]');
    };
    const openSheet = () => {
      if (!view) return;
      const [min, max] = bounds();
      const estimate = view.ovulationDay ?? max;
      pickDay = Math.min(max, Math.max(min, estimate));
      opts.querySelectorAll('.opt').forEach((o) => o.setAttribute('aria-checked', 'false'));
      updatePick();
      scrim.classList.add('show');
      sheet.classList.add('show');
      opts.querySelector<HTMLElement>('.opt')?.focus();
    };
    const closeSheet = () => {
      scrim.classList.remove('show');
      sheet.classList.remove('show');
      byId('openSheet').focus();
    };

    byId('openSheet').addEventListener('click', openSheet);
    scrim.addEventListener('click', closeSheet);
    byId('cancelOv').addEventListener('click', closeSheet);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('show')) closeSheet(); }, { signal });
    opts.addEventListener('click', (e) => {
      const o = (e.target as Element).closest<HTMLElement>('.opt');
      if (!o) return;
      o.setAttribute('aria-checked', String(o.getAttribute('aria-checked') !== 'true'));
      updatePick();
    });
    minus.addEventListener('click', () => { pickDay = Math.max(bounds()[0], pickDay - 1); updatePick(); });
    plus.addEventListener('click', () => { pickDay = Math.min(bounds()[1], pickDay + 1); updatePick(); });
    saveOv.addEventListener('click', () => {
      if (!view) return;
      const signs = [...opts.querySelectorAll<HTMLElement>('[aria-checked="true"]')].map((o) => o.dataset.k as OvulationSign);
      const cycleStart = view.cycleStart;
      saveTracking((t) => { t.ovulation = { cycle_start: cycleStart, day: pickDay, signs }; });
      closeSheet();
      render();
      toast('Predictions updated');
    });
    byId('undoOv').addEventListener('click', () => {
      saveTracking((t) => { t.ovulation = null; });
      render();
      toast('Back to the estimate');
    });
  }
}

// Today: cycle ring, key dates, confidence, daily log, phase + confirm ovulation, health flags, trends.
import { diffDays, parseDate, startsNeeded } from '@lib/cycle';
import {
  averageCycle, averagePeriod, buildCycleView, dateOfDay, TYPICAL_CYCLE, variation,
  type CycleView, type Phase,
} from '@lib/cycleView';
import { byId, esc, todayIso } from '@lib/dom';
import { load } from '@lib/store';
import { mountTabbar } from '@lib/tabbar';
import { toast } from '@lib/toast';
import { LOG_KINDS, loadTracking, saveTracking, type LogKind, type OvulationSign } from '@lib/tracking';
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
        return { title: `Day ${v.cycleDay}`,
          text: 'SikLo shows phases once it can estimate your next period, after 3 complete cycles. Until then, keep adding period start dates. If you notice ovulation signs, you can confirm them below.' };
    }
  }

  // ---------- Rendering ----------
  function renderHeader(): void {
    byId('todayLabel').textContent = parseDate(today).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' });
  }

  /** Length of the ring: the predicted cycle, else the typical recorded cycle, else today. */
  const ringLength = (v: CycleView) => Math.max(v.length ?? averageCycle(v) ?? v.cycleDay, v.periodDays);

  function drawRing(v: CycleView): void {
    const svg = byId('ring') as unknown as SVGSVGElement;
    svg.innerHTML = '';
    const C = 125, R = 108, W = 14, L = ringLength(v);
    const set = (el: Element, attrs: Record<string, string | number>) => Object.entries(attrs).forEach(([k, val]) => el.setAttribute(k, String(val)));

    const arc = (from: number, to: number, color: string) => {
      const c = document.createElementNS(SVG_NS, 'circle');
      const gap = 0.18;
      set(c, { cx: C, cy: C, r: R, fill: 'none', stroke: color, 'stroke-width': W, pathLength: L,
        'stroke-dasharray': `${to - from + 1 - gap} ${L}`, 'stroke-dashoffset': -(from - 1) - gap / 2,
        transform: `rotate(-90 ${C} ${C})` });
      svg.appendChild(c);
    };
    const point = (day: number) => {
      const a = ((day - 0.5) / L) * 2 * Math.PI - Math.PI / 2;
      return [C + R * Math.cos(a), C + R * Math.sin(a)];
    };
    const dot = (day: number, r: number, fill: string, stroke = 'none', sw = 0) => {
      const [x, y] = point(day);
      const c = document.createElementNS(SVG_NS, 'circle');
      set(c, { cx: x, cy: y, r, fill, stroke, 'stroke-width': sw });
      svg.appendChild(c);
    };

    arc(1, L, cssVar('--purple-100'));
    arc(1, Math.min(v.periodDays, L), cssVar('--purple-300'));
    if (v.fertile) arc(v.fertile[0], Math.min(v.fertile[1], L), cssVar('--purple-700'));
    if (v.ovulationDay) dot(v.ovulationDay, 3, cssVar('--white'));
    dot(Math.min(v.cycleDay, L), 10, cssVar('--white'), cssVar('--purple-900'), 3.5);

    byId('dayNum').textContent = String(v.cycleDay);
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
      set('dFertile', '–', 'needs an estimate', true);
      set('dOv', '–', 'needs an estimate', true);
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
    } else {
      txt.innerHTML = '<b>No estimate yet</b> · SikLo needs 3 complete cycles';
      why.innerHTML = `<ul>
        <li>SikLo estimates your next period only after 3 complete cycles, so it never guesses.</li>
        <li>You have ${plural(v.prediction.cycles_used, 'complete cycle')} recorded. Add earlier start dates from your Profile.</li>
        <li>Confirming ovulation this cycle gives an estimate sooner.</li></ul>`;
    }
  }

  function renderLog(): void {
    const done = new Set(loadTracking().logs[today] ?? []);
    byId('log').innerHTML = LOG_KINDS.map((k) => `
      <button class="chip" type="button" data-kind="${k}" aria-pressed="${done.has(k)}">
        <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LOG_ITEMS[k].icon}</svg></div>${LOG_ITEMS[k].label}
      </button>`).join('');
    byId('logCount').textContent = `${done.size} of ${LOG_KINDS.length} logged`;
  }

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

    byId('openSheet').hidden = !!v.confirmed || v.cycleDay <= v.periodDays;
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
      view = buildCycleView(saved.periods, today, loadTracking().ovulation);
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
    render();

    // Confidence explainer
    const confBtn = byId('confBtn');
    confBtn.addEventListener('click', () => {
      const open = confBtn.getAttribute('aria-expanded') !== 'true';
      confBtn.setAttribute('aria-expanded', String(open));
      byId('why').hidden = !open;
    });

    // Log today: saved immediately on this device
    byId('log').addEventListener('click', (e) => {
      const chip = (e.target as Element).closest<HTMLElement>('.chip');
      if (!chip) return;
      const kind = chip.dataset.kind as LogKind;
      saveTracking((t) => {
        const set = new Set(t.logs[today] ?? []);
        if (set.has(kind)) set.delete(kind);
        else set.add(kind);
        t.logs[today] = LOG_KINDS.filter((k) => set.has(k));
      });
      renderLog();
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

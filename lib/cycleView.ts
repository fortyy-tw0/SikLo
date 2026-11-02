/**
 * Everything the Today screen shows, worked out from the saved periods.
 * Pure (no DOM, no storage), so it is checked in cycleView.test.ts.
 *
 * Rules:
 * - The next-period estimate and its range come from the backend engine
 *   (predict()), so no estimate appears before 3 complete cycles.
 * - Ovulation is placed LUTEAL_DAYS before the next period; the fertile
 *   window is the 5 days before ovulation plus ovulation day. These are
 *   estimates for awareness, never "safe days".
 * - When the user confirms ovulation for the current cycle, the next period
 *   becomes ovulation day + LUTEAL_DAYS, with a ±1 day range.
 * - Health flags are patterns, not diagnoses.
 */
import { addDays, diffDays, flagMessages, parseDate, predict, toISO, type Prediction } from './cycle';
import type { ConfirmedOvulation } from './tracking';
import type { Period } from './types';

export const LUTEAL_DAYS = 14;
export const FERTILE_DAYS_BEFORE = 5;
export const TYPICAL_CYCLE: readonly [number, number] = [21, 35];
export const MAX_TYPICAL_PERIOD = 7;
export const VARIATION_LIMIT = 7;
export const TREND_CYCLES = 6;
/** Ring scale before SikLo can estimate a cycle; a visual guide only, never used for dates. */
export const GUIDE_CYCLE_DAYS = 28;
const VALID_CYCLE: readonly [number, number] = [15, 90]; // same bounds as the backend engine

export type Phase = 'Period' | 'Follicular' | 'Fertile window' | 'Luteal' | 'Late' | 'Tracking';
export type Confidence = 1 | 2 | 3;

export interface HealthFlag {
  key: string; // stable per cycle, used for dismiss / doctor report
  title: string;
  text: string;
}

export interface CycleView {
  today: string;
  cycleStart: string;
  cycleDay: number;
  /** Length of the current period, for the ring and phase. */
  periodDays: number;
  /** Predicted cycle length (start to next start), or null before an estimate exists. */
  length: number | null;
  next: { likely: string; from: string; to: string } | null;
  ovulationDay: number | null;
  fertile: readonly [number, number] | null; // cycle days
  confirmed: ConfirmedOvulation | null;
  /** True when date-based estimates are turned off (e.g. pregnancy, postpartum). */
  estimateOff: boolean;
  confidence: Confidence | null;
  phase: Phase;
  prediction: Prediction;
  /** Last TREND_CYCLES complete cycle lengths, oldest first. */
  cycles: number[];
  /** Recorded period lengths, oldest first (last TREND_CYCLES). */
  periodLengths: number[];
  flags: HealthFlag[];
}

const mean = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
export const stdDev = (xs: readonly number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

/** Cycle day of a date, 1 = cycle start. */
export const cycleDayOf = (start: string, date: string) => diffDays(parseDate(start), parseDate(date)) + 1;
/** Date of a cycle day. */
export const dateOfDay = (start: string, day: number) => toISO(addDays(parseDate(start), day - 1));

/** Returns null when there is no period on or before today to anchor a cycle. */
export function buildCycleView(
  allPeriods: readonly Period[],
  today: string,
  ovulation: ConfirmedOvulation | null,
  options: { estimate?: boolean } = {},
): CycleView | null {
  const estimateOff = options.estimate === false;
  const periods = allPeriods
    .filter((p) => p.kind !== 'spotting' && p.start_date <= today)
    .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
  const current = periods.at(-1);
  if (!current) return null;

  const prediction = predict(periods);
  const cycleStart = current.start_date;
  const cycleDay = cycleDayOf(cycleStart, today);
  // Current period length: as recorded, else the usual length, else (no end date yet)
  // the days so far, up to the typical maximum.
  const recorded = current.end_date ? cycleDayOf(cycleStart, current.end_date) : null;
  const periodDays = recorded ?? prediction.expected_duration ?? Math.min(cycleDay, MAX_TYPICAL_PERIOD);

  // Complete cycles and recorded period lengths, for trends and flags
  const starts = periods.map((p) => p.start_date);
  const allCycles = starts.slice(1).map((s, i) => cycleDayOf(starts[i], s) - 1);
  const cycles = allCycles.filter((d) => d >= VALID_CYCLE[0] && d <= VALID_CYCLE[1]).slice(-TREND_CYCLES);
  const periodLengths = periods
    .filter((p) => p.end_date)
    .map((p) => cycleDayOf(p.start_date, p.end_date!))
    .slice(-TREND_CYCLES);

  // Next period: confirmed ovulation beats the statistical estimate
  const confirmed = !estimateOff && ovulation && ovulation.cycle_start === cycleStart ? ovulation : null;
  let length: number | null = null;
  let next: CycleView['next'] = null;
  let confidence: Confidence | null = null;
  if (confirmed) {
    length = confirmed.day + LUTEAL_DAYS;
    next = { likely: dateOfDay(cycleStart, length + 1), from: dateOfDay(cycleStart, length), to: dateOfDay(cycleStart, length + 2) };
    confidence = confirmed.signs.length >= 2 ? 3 : 2;
  } else if (!estimateOff && prediction.status === 'ok' && prediction.estimate && prediction.window && prediction.median_cycle_len) {
    length = prediction.median_cycle_len;
    next = { likely: prediction.estimate, from: prediction.window[0], to: prediction.window[1] };
    confidence = prediction.confidence === 'high' ? 3 : prediction.confidence === 'medium' ? 2 : 1;
  }

  const ovulationDay = confirmed ? confirmed.day : length !== null ? Math.max(periodDays + 1, length - LUTEAL_DAYS) : null;
  const fertile = ovulationDay !== null ? ([Math.max(periodDays + 1, ovulationDay - FERTILE_DAYS_BEFORE), ovulationDay] as const) : null;

  let phase: Phase;
  if (cycleDay <= periodDays) phase = 'Period';
  else if (length === null || !fertile) phase = 'Tracking';
  else if (cycleDay < fertile[0]) phase = 'Follicular';
  else if (cycleDay <= fertile[1]) phase = 'Fertile window';
  else if (cycleDay <= length) phase = 'Luteal';
  else phase = 'Late';

  return {
    today, cycleStart, cycleDay, periodDays, length, next, ovulationDay, fertile, confirmed, estimateOff, confidence, phase,
    prediction, cycles, periodLengths,
    flags: healthFlags(cycles, periodLengths, prediction, cycleStart),
  };
}

/**
 * Pattern flags, never diagnoses. Thresholds follow common guidance for adults:
 * typical cycle 21–35 days, period up to 7 days, cycle-to-cycle variation
 * under about 7–9 days. Plus the backend engine's own data flags.
 */
export function healthFlags(cycles: readonly number[], periodLengths: readonly number[], prediction: Prediction, cycleStart: string): HealthFlag[] {
  const flags: HealthFlag[] = [];
  const key = (id: string) => `${id}@${cycleStart}`;
  const n = cycles.length;
  const long = cycles.filter((d) => d > TYPICAL_CYCLE[1]).length;
  const short = cycles.filter((d) => d < TYPICAL_CYCLE[0]).length;

  if (long) {
    flags.push({
      key: key('long'),
      title: `${long} of your last ${n} cycle${n === 1 ? ' was' : 's were'} over ${TYPICAL_CYCLE[1]} days`,
      text: 'Long cycles now and then are common. If they keep happening, it can be linked to things like PCOS, thyroid changes or stress, and is worth mentioning to a doctor.',
    });
  }
  if (short) {
    flags.push({
      key: key('short'),
      title: `${short} cycle${short > 1 ? 's were' : ' was'} shorter than ${TYPICAL_CYCLE[0]} days`,
      text: 'Frequent short cycles are worth checking with a doctor.',
    });
  }
  if (n >= 2) {
    const range = Math.max(...cycles) - Math.min(...cycles);
    if (range > VARIATION_LIMIT) {
      flags.push({
        key: key('variation'),
        title: `Your cycle length varies by ${range} days`,
        text: 'A difference of more than 7–9 days between cycles is considered irregular. Keep logging so your doctor has the full picture.',
      });
    }
  }
  if (periodLengths.some((d) => d > MAX_TYPICAL_PERIOD)) {
    flags.push({
      key: key('long_period'),
      title: `A period lasted more than ${MAX_TYPICAL_PERIOD} days`,
      text: 'Long or very heavy periods are worth discussing with a doctor.',
    });
  }
  // The backend engine's data flags (its variability flag is covered above)
  const titles: Record<string, string> = {
    missing_data: 'Some period dates may be missing',
    change_detected: 'Your latest cycle was different',
  };
  for (const f of flagMessages(prediction.flags)) {
    if (titles[f.key]) flags.push({ key: key(f.key), title: titles[f.key], text: f.message });
  }
  return flags;
}

export interface Ring {
  /** Days the full circle stands for. */
  days: number;
  /** Where the scale comes from: the estimate, the person's average cycle, or a typical guide. */
  scale: 'estimate' | 'average' | 'typical';
  periodDays: number;
  fertile: readonly [number, number] | null;
  ovulationDay: number | null;
  /** Position of the "today" marker (stays at the end of the ring when a period is late). */
  todayDay: number;
}

/**
 * How to draw the cycle ring. With an estimate the circle is the predicted cycle.
 * Before that it is the person's average cycle or a typical 28 days (stretched if
 * today is further along), so the period and today markers sit where they belong.
 */
export function ringFor(v: CycleView): Ring {
  const average = averageCycle(v);
  const scale: Ring['scale'] = v.length !== null ? 'estimate' : average !== null ? 'average' : 'typical';
  const base = v.length ?? Math.max(average ?? GUIDE_CYCLE_DAYS, v.cycleDay);
  const days = Math.max(base, v.periodDays);
  return {
    days,
    scale,
    periodDays: Math.min(v.periodDays, days),
    fertile: v.fertile ? [v.fertile[0], Math.min(v.fertile[1], days)] : null,
    ovulationDay: v.ovulationDay,
    todayDay: Math.min(v.cycleDay, days),
  };
}

/** Mean of the trend cycles, rounded; null with no complete cycles. */
export const averageCycle = (v: CycleView) => (v.cycles.length ? Math.round(mean(v.cycles)) : null);
export const averagePeriod = (v: CycleView) => (v.periodLengths.length ? Math.round(mean(v.periodLengths)) : null);
export const variation = (v: CycleView) => (v.cycles.length >= 2 ? Math.max(1, Math.round(stdDev(v.cycles))) : null);

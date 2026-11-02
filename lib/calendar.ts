/**
 * The month grid behind the Calendar screen.
 *
 * Marks what was actually recorded (period days, logged symptoms, intercourse)
 * separately from what is only estimated (the expected period window, the
 * follicular stretch, the fertile window and ovulation), so the screen can show
 * the difference rather than presenting projections as facts.
 *
 * Pure: no DOM, no storage. Checked in calendar.test.ts.
 */
import { addDays, diffDays, parseDate, toISO } from './cycle';
import { FERTILE_DAYS_BEFORE, LUTEAL_DAYS, type CycleView } from './cycleView';
import type { IntimacyEntry, LogKind } from './tracking';
import type { Period } from './types';

export interface DayCell {
  /** YYYY-MM-DD, or null for the blanks that pad the first week. */
  date: string | null;
  dayOfMonth: number;
  inMonth: boolean;
  isToday: boolean;
  future: boolean;
  /** A period day that was actually recorded. */
  period: boolean;
  periodStart: boolean;
  /** Recorded as spotting rather than a period. */
  spotting: boolean;
  /** Inside the predicted window for the next period. */
  predictedPeriod: boolean;
  /** Estimated follicular stretch, between the period and the fertile window. */
  follicular: boolean;
  /** Estimated fertile window. */
  fertile: boolean;
  /** Estimated (or confirmed) ovulation day. */
  ovulation: boolean;
  ovulationConfirmed: boolean;
  logs: LogKind[];
  intimacy: IntimacyEntry | null;
}

export interface MonthGrid {
  year: number;
  /** 0-11. */
  month: number;
  label: string;
  cells: DayCell[];
  /** Whether any estimate is being shown at all. */
  hasEstimates: boolean;
}

export interface CalendarInput {
  periods: readonly Period[];
  view: CycleView | null;
  logs: Record<string, LogKind[]>;
  intimacy: Record<string, IntimacyEntry>;
  today: string;
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Every date a recorded period covers, start to end (a start with no end counts as one day). */
export function recordedPeriodDays(periods: readonly Period[]): Map<string, { start: boolean; spotting: boolean }> {
  const days = new Map<string, { start: boolean; spotting: boolean }>();
  for (const p of periods) {
    const spotting = p.kind === 'spotting';
    const last = p.end_date && p.end_date >= p.start_date ? p.end_date : p.start_date;
    let d = parseDate(p.start_date);
    const end = parseDate(last);
    let guard = 0;
    while (toISO(d) <= toISO(end) && guard++ < 60) {
      const date = toISO(d);
      days.set(date, { start: date === p.start_date, spotting });
      d = addDays(d, 1);
    }
  }
  return days;
}

/**
 * Estimated dates for the cycle that is running now. Returns empty sets when
 * SikLo has no estimate, so nothing is invented.
 */
export function estimatedDays(view: CycleView | null): {
  predicted: Set<string>; fertile: Set<string>; follicular: Set<string>; ovulation: string | null;
} {
  const empty = { predicted: new Set<string>(), fertile: new Set<string>(), follicular: new Set<string>(), ovulation: null };
  if (!view || view.estimateOff) return empty;

  const predicted = new Set<string>();
  if (view.next) {
    // The whole window the period could start in, plus its likely length
    const span = view.prediction.expected_duration ?? view.periodDays;
    let d = parseDate(view.next.from);
    const last = addDays(parseDate(view.next.to), Math.max(0, span - 1));
    let guard = 0;
    while (toISO(d) <= toISO(last) && guard++ < 60) { predicted.add(toISO(d)); d = addDays(d, 1); }
  }

  const fertile = new Set<string>();
  const follicular = new Set<string>();
  let ovulation: string | null = null;
  if (view.fertile && view.ovulationDay) {
    const start = parseDate(view.cycleStart);
    const dayDate = (day: number) => toISO(addDays(start, day - 1));
    for (let day = view.fertile[0]; day <= view.fertile[1]; day++) fertile.add(dayDate(day));
    for (let day = view.periodDays + 1; day < view.fertile[0]; day++) follicular.add(dayDate(day));
    ovulation = dayDate(view.ovulationDay);
  }
  return { predicted, fertile, follicular, ovulation };
}

/** Build one month, padded to whole weeks starting on Sunday. */
export function monthGrid(year: number, month: number, input: CalendarInput): MonthGrid {
  const recorded = recordedPeriodDays(input.periods);
  const est = estimatedDays(input.view);
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const lead = first.getUTCDay();

  const cells: DayCell[] = [];
  for (let i = 0; i < lead; i++) {
    cells.push({
      date: null, dayOfMonth: 0, inMonth: false, isToday: false, future: false,
      period: false, periodStart: false, spotting: false, predictedPeriod: false,
      follicular: false, fertile: false, ovulation: false, ovulationConfirmed: false,
      logs: [], intimacy: null,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = iso(year, month, d);
    const rec = recorded.get(date);
    const isPeriod = !!rec && !rec.spotting;
    cells.push({
      date,
      dayOfMonth: d,
      inMonth: true,
      isToday: date === input.today,
      future: date > input.today,
      period: isPeriod,
      periodStart: !!rec?.start && isPeriod,
      spotting: !!rec?.spotting,
      // An estimate never covers a day a real period was recorded on
      predictedPeriod: !rec && est.predicted.has(date),
      follicular: !rec && est.follicular.has(date),
      fertile: !rec && est.fertile.has(date),
      ovulation: !rec && est.ovulation === date,
      ovulationConfirmed: est.ovulation === date && !!input.view?.confirmed,
      logs: input.logs[date] ?? [],
      intimacy: input.intimacy[date] ?? null,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({
      date: null, dayOfMonth: 0, inMonth: false, isToday: false, future: false,
      period: false, periodStart: false, spotting: false, predictedPeriod: false,
      follicular: false, fertile: false, ovulation: false, ovulationConfirmed: false,
      logs: [], intimacy: null,
    });
  }

  return {
    year, month,
    label: first.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }),
    cells,
    hasEstimates: est.predicted.size > 0 || est.fertile.size > 0,
  };
}

/** Months the person can look at: back to their first record, forward one cycle past any estimate. */
export function monthRange(input: CalendarInput): { first: [number, number]; last: [number, number] } {
  const dates = input.periods.map((p) => p.start_date).concat(Object.keys(input.logs), Object.keys(input.intimacy));
  const earliest = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : input.today;
  const est = estimatedDays(input.view);
  const furthest = [...est.predicted].reduce((a, b) => (a > b ? a : b), input.today);
  const forward = toISO(addDays(parseDate(furthest), LUTEAL_DAYS + FERTILE_DAYS_BEFORE));
  const f = parseDate(earliest), l = parseDate(forward);
  return {
    first: [f.getUTCFullYear(), f.getUTCMonth()],
    last: [l.getUTCFullYear(), l.getUTCMonth()],
  };
}

/** How many days from the person's last recorded period start, for the day sheet. */
export const cycleDayOn = (view: CycleView | null, date: string): number | null =>
  view && date >= view.cycleStart ? diffDays(parseDate(view.cycleStart), parseDate(date)) + 1 : null;

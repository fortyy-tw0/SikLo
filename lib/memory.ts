/**
 * What SikLo has worked out about this person.
 *
 * Every time she logs something, this is recomputed from her whole history, so
 * the assistant's answers get more specific the longer she uses it. Nothing is
 * trained and nothing is uploaded: these are patterns derived from her own
 * records, on her own device, and they disappear when she deletes her data.
 *
 * Mirrors the learned_pattern table in backend/schema.sql.
 *
 * Pure: no DOM, no storage. Checked in memory.test.ts.
 */
import { diffDays, parseDate } from './cycle';
import { averageCycle, averagePeriod, cycleDayOf, variation, type CycleView } from './cycleView';
import type { DayEntry, IntimacyEntry } from './tracking';
import type { Period } from './types';

export type Confidence = 'low' | 'medium' | 'high';

export interface Pattern {
  key: string;
  /** One sentence, written as something observed rather than concluded. */
  summary: string;
  confidence: Confidence;
  /** How many of her own records this rests on. */
  basedOn: number;
}

export interface MemoryInput {
  periods: readonly Period[];
  entries: Record<string, DayEntry>;
  intimacy: Record<string, IntimacyEntry>;
  view: CycleView | null;
  today: string;
}

export interface Memory {
  patterns: Pattern[];
  /** Days with anything logged. */
  daysLogged: number;
  /** How much of her cycle history SikLo can see, in complete cycles. */
  cyclesKnown: number;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** More observations means more confidence, never certainty. */
const confidenceFor = (n: number): Confidence => (n >= 6 ? 'high' : n >= 3 ? 'medium' : 'low');

/** Which part of a cycle a date falls in, for grouping symptoms. */
export type Window = 'period' | 'after-period' | 'mid-cycle' | 'before-period';

export function windowFor(view: CycleView, date: string): Window | null {
  const day = cycleDayOf(view.cycleStart, date);
  if (day < 1) return null;
  if (day <= view.periodDays) return 'period';
  const length = view.length ?? averageCycle(view) ?? 28;
  if (day > length + 5) return null; // too far past the cycle to place
  const toNext = length - day;
  if (toNext <= 5) return 'before-period';
  if (view.fertile && day >= view.fertile[0] && day <= view.fertile[1]) return 'mid-cycle';
  return 'after-period';
}

const WINDOW_WORDS: Record<Window, string> = {
  period: 'during your period',
  'after-period': 'in the days after your period',
  'mid-cycle': 'around the middle of your cycle',
  'before-period': 'in the days before your period',
};

/** Which cycle a date belongs to, by its period start, for counting per cycle. */
function cycleOf(periods: readonly Period[], date: string): string | null {
  const starts = periods.filter((p) => p.kind !== 'spotting').map((p) => p.start_date).sort();
  let found: string | null = null;
  for (const start of starts) if (start <= date) found = start;
  return found;
}

export function buildMemory(input: MemoryInput): Memory {
  const { view, entries, periods } = input;
  const dates = Object.keys(entries).sort();
  const patterns: Pattern[] = [];

  // ---------- Rhythm ----------
  if (view) {
    const avg = averageCycle(view);
    if (avg !== null && view.cycles.length >= 2) {
      const spread = variation(view);
      patterns.push({
        key: 'cycle_rhythm',
        summary: `Your cycles have averaged ${plural(avg, 'day')} across ${plural(view.cycles.length, 'cycle')}` +
          `, ranging ${Math.min(...view.cycles)} to ${Math.max(...view.cycles)}${spread ? ` and varying by about ${plural(spread, 'day')}` : ''}.`,
        confidence: confidenceFor(view.cycles.length),
        basedOn: view.cycles.length,
      });
    }
    const periodDays = averagePeriod(view);
    if (periodDays !== null && view.periodLengths.length >= 2) {
      patterns.push({
        key: 'period_length',
        summary: `Your periods have lasted about ${plural(periodDays, 'day')} across ${plural(view.periodLengths.length, 'period')}.`,
        confidence: confidenceFor(view.periodLengths.length),
        basedOn: view.periodLengths.length,
      });
    }
  }

  // ---------- Symptoms, and where in the cycle they land ----------
  const bySymptom = new Map<string, { total: number; windows: Map<Window, number>; cycles: Set<string> }>();
  for (const date of dates) {
    const entry = entries[date];
    const window = view ? windowFor(view, date) : null;
    const cycle = cycleOf(periods, date);
    for (const symptom of entry.symptoms) {
      const seen = bySymptom.get(symptom) ?? { total: 0, windows: new Map(), cycles: new Set() };
      seen.total += 1;
      if (window) seen.windows.set(window, (seen.windows.get(window) ?? 0) + 1);
      if (cycle) seen.cycles.add(cycle);
      bySymptom.set(symptom, seen);
    }
  }
  for (const [symptom, seen] of [...bySymptom.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 3)) {
    if (seen.total < 2) continue;
    const top = [...seen.windows.entries()].sort((a, b) => b[1] - a[1])[0];
    const where = top && top[1] >= 2 ? ` Most often ${WINDOW_WORDS[top[0]]}.` : '';
    patterns.push({
      key: `symptom_${symptom.toLowerCase().replace(/\s+/g, '_')}`,
      summary: `You have logged ${symptom.toLowerCase()} on ${plural(seen.total, 'day')}` +
        `${seen.cycles.size > 1 ? `, across ${plural(seen.cycles.size, 'cycle')}` : ''}.${where}`,
      confidence: confidenceFor(seen.total),
      basedOn: seen.total,
    });
  }

  // ---------- Mood ----------
  const lowMoods = new Set(['Low', 'Irritable', 'Anxious', 'Tearful']);
  const moodDays = dates.filter((d) => entries[d].moods.some((m) => lowMoods.has(m)));
  if (moodDays.length >= 2 && view) {
    const before = moodDays.filter((d) => windowFor(view, d) === 'before-period').length;
    if (before >= 2) {
      patterns.push({
        key: 'mood_before_period',
        summary: `You have logged a lower mood on ${plural(before, 'day')} in the stretch before a period.`,
        confidence: confidenceFor(before),
        basedOn: before,
      });
    }
  }

  // ---------- Flow ----------
  const heavy = dates.filter((d) => entries[d].flow === 'heavy');
  if (heavy.length >= 2) {
    patterns.push({
      key: 'heavy_days',
      summary: `You have recorded heavy flow on ${plural(heavy.length, 'day')}.`,
      confidence: confidenceFor(heavy.length),
      basedOn: heavy.length,
    });
  }

  // ---------- How consistently she logs ----------
  if (dates.length >= 3) {
    const span = diffDays(parseDate(dates[0]), parseDate(input.today)) + 1;
    patterns.push({
      key: 'logging',
      summary: `You have logged on ${plural(dates.length, 'day')} over the past ${plural(Math.max(span, dates.length), 'day')}.`,
      confidence: confidenceFor(dates.length),
      basedOn: dates.length,
    });
  }

  return {
    patterns,
    daysLogged: dates.length,
    cyclesKnown: view?.cycles.length ?? 0,
  };
}

/**
 * The patterns worth adding to an answer about this topic, best first.
 * Matching is deliberately simple: a pattern is relevant when the question
 * mentions what the pattern is about.
 */
export function relevantPatterns(memory: Memory, question: string, limit = 2): Pattern[] {
  const q = question.toLowerCase();
  const scored = memory.patterns.map((p) => {
    const subject = p.key.replace(/^symptom_/, '').replace(/_/g, ' ');
    let score = 0;
    if (subject && q.includes(subject.split(' ')[0])) score += 3;
    if (/cycle|length|long|regular|irregular/.test(q) && p.key === 'cycle_rhythm') score += 3;
    if (/period|bleed|flow/.test(q) && (p.key === 'period_length' || p.key === 'heavy_days')) score += 2;
    if (/mood|sad|low|irritable|anxious|emotional|cry/.test(q) && p.key === 'mood_before_period') score += 3;
    if (/cramp|pain|hurt|sakit/.test(q) && p.key.startsWith('symptom_cramp')) score += 3;
    return { pattern: p, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.pattern);
}

/** A compact line of her own numbers, for the language model to work from. */
export function memoryFacts(memory: Memory, view: CycleView | null): string | undefined {
  const bits: string[] = [];
  if (view) {
    bits.push(`cycle day ${view.cycleDay}`, `phase ${view.phase}`);
    const avg = averageCycle(view);
    if (avg) bits.push(`average cycle ${avg} days`);
    if (view.next) bits.push(`next period estimated ${view.next.likely}`);
  }
  for (const p of memory.patterns.slice(0, 4)) bits.push(p.summary);
  return bits.length ? bits.join('. ') : undefined;
}

/**
 * What the Insights screen says.
 *
 * Everything here is an observation about what the person recorded, or a
 * projection from it. None of it is a diagnosis, and the screen repeats that.
 * Where a pattern is one clinicians ask about, the wording says what to raise
 * rather than what it means.
 *
 * Pure: no DOM, no storage. Checked in insights.test.ts.
 */
import { diffDays, parseDate } from './cycle';
import { averageCycle, averagePeriod, TYPICAL_CYCLE, variation, type CycleView, type Phase } from './cycleView';
import { loggedKinds, type DayEntry, type IntimacyEntry, type LogKind } from './tracking';

export interface Insight {
  id: string;
  title: string;
  body: string;
  /** 'expect' = what is coming, 'pattern' = what the log shows, 'raise' = worth a conversation. */
  tone: 'expect' | 'pattern' | 'raise';
}

export interface InsightsInput {
  view: CycleView | null;
  entries: Record<string, DayEntry>;
  intimacy: Record<string, IntimacyEntry>;
  today: string;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const fmt = (iso: string) => parseDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' });

/** What this phase commonly brings. Common, not certain, and never individual. */
const PHASE_NOTES: Record<Phase, string> = {
  Period: 'Cramps, tiredness and lower energy are common in these days, and they usually ease as the period ends.',
  Follicular: 'Energy and mood often lift through this stretch as estrogen rises. Many people find this the easiest part of their cycle.',
  'Fertile window': 'Clearer, stretchy discharge and a mild one-sided twinge are common around now. Pregnancy is most likely in these days if you are having sex without contraception.',
  Luteal: 'Bloating, breast tenderness, appetite changes and mood dips are common in the days before a period, and usually settle once bleeding starts.',
  Late: 'Your period has not arrived when expected. Cycles shift for many reasons, and estimates can be off. If pregnancy is possible, a test is the only way to know.',
  Tracking: 'Once three complete cycles are recorded, SikLo can tell you what to expect at each point in your cycle.',
};

/** How each phase is introduced, so none of them reads awkwardly. */
const PHASE_TITLES: Record<Phase, (day: number) => string> = {
  Period: (d) => `You are on day ${d} of your period`,
  Follicular: () => 'You are in your follicular phase',
  'Fertile window': () => 'You are in your estimated fertile window',
  Luteal: () => 'You are in your luteal phase',
  Late: (d) => `Your period is later than estimated, on day ${d}`,
  Tracking: (d) => `Day ${d} of your cycle`,
};

export function buildInsights(input: InsightsInput): Insight[] {
  const { view } = input;
  const out: Insight[] = [];
  if (!view) return out;

  // ---------- What to expect ----------
  if (view.next && !view.estimateOff) {
    const days = diffDays(parseDate(view.today), parseDate(view.next.likely));
    const when = days > 1 ? `in about ${plural(days, 'day')}` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : `${plural(-days, 'day')} ago`;
    out.push({
      id: 'next-period',
      tone: 'expect',
      title: days < 0 ? `Your period was expected ${when}` : `Your next period is estimated ${when}`,
      body: `Most likely between ${fmt(view.next.from)} and ${fmt(view.next.to)}, around ${fmt(view.next.likely)}. ` +
        'This comes from the middle of your recent cycle lengths, so it moves as you log more.',
    });
  } else if (view.estimateOff) {
    out.push({
      id: 'estimates-off',
      tone: 'expect',
      title: 'Date estimates are turned off',
      body: 'You recorded a life stage where date-based estimates are not suitable. Logging, history and patterns still work, and you can change this in your setup answers.',
    });
  } else {
    out.push({
      id: 'need-cycles',
      tone: 'expect',
      title: 'Not enough cycles for an estimate yet',
      body: `SikLo waits for three complete cycles before estimating anything, so it never guesses. You have ${plural(view.prediction.cycles_used, 'complete cycle')} recorded.`,
    });
  }

  out.push({
    id: 'phase',
    tone: 'expect',
    title: PHASE_TITLES[view.phase](view.cycleDay),
    body: PHASE_NOTES[view.phase],
  });

  // ---------- What the log shows ----------
  const avg = averageCycle(view);
  if (avg !== null && view.cycles.length >= 2) {
    const spread = variation(view);
    const steady = Math.max(...view.cycles) - Math.min(...view.cycles) <= 4;
    out.push({
      id: 'rhythm',
      tone: 'pattern',
      title: steady ? 'Your cycles have been steady' : 'Your cycle length moves around',
      body: `Across ${plural(view.cycles.length, 'cycle')} your average is ${plural(avg, 'day')}, ranging ${Math.min(...view.cycles)} to ${Math.max(...view.cycles)}` +
        `${spread ? `, varying by about ${plural(spread, 'day')}` : ''}. For most adults ${TYPICAL_CYCLE[0]} to ${TYPICAL_CYCLE[1]} days is considered typical, ` +
        'though your own usual range matters more than the average.',
    });
  }

  const period = averagePeriod(view);
  if (period !== null) {
    out.push({
      id: 'period-length',
      tone: 'pattern',
      title: `Your periods last about ${plural(period, 'day')}`,
      body: period > 7
        ? 'Periods lasting more than seven days are worth mentioning at a check-up.'
        : 'Two to seven days is the usual range. Bring any change in this to a check-up.',
    });
  }

  const symptoms = symptomPatterns(input);
  if (symptoms) out.push(symptoms);

  // ---------- Worth raising ----------
  for (const flag of view.flags) {
    out.push({ id: `flag-${flag.key}`, tone: 'raise', title: flag.title, body: flag.text });
  }

  const bleeding = Object.entries(input.intimacy)
    .filter(([, e]) => e.observations.includes('bleeding_after'))
    .map(([date]) => date)
    .sort();
  if (bleeding.length) {
    out.push({
      id: 'bleeding-after-sex',
      tone: 'raise',
      title: bleeding.length === 1 ? 'You logged bleeding after sex once' : `You logged bleeding after sex on ${bleeding.length} days`,
      body: `Most recently on ${fmt(bleeding[bleeding.length - 1])}. Bleeding after sex is one of the things a healthcare professional asks to be told about, even when it is light, so it is worth raising at your next visit.`,
    });
  }

  const pain = Object.values(input.intimacy).filter((e) => e.observations.includes('pain')).length;
  if (pain >= 2) {
    out.push({
      id: 'pain-with-sex',
      tone: 'raise',
      title: `You logged pain with sex ${plural(pain, 'time')}`,
      body: 'Pain during sex that keeps happening is worth discussing with a healthcare professional. It is common and there are things that help, so it is not something to put up with.',
    });
  }

  return out;
}

/** Which symptoms were logged most often in the first days of recent cycles. */
function symptomPatterns(input: InsightsInput): Insight | null {
  const dates = Object.keys(input.entries).filter((d) => loggedKinds(input.entries[d]).length);
  if (dates.length < 3) return null;
  const counts = new Map<LogKind, number>();
  for (const d of dates) for (const k of loggedKinds(input.entries[d])) counts.set(k, (counts.get(k) ?? 0) + 1);
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return null;
  const names: Record<LogKind, string> = { flow: 'flow', mood: 'mood', symptoms: 'symptoms', temp: 'temperature' };
  return {
    id: 'logged-most',
    tone: 'pattern',
    title: `You log ${names[ranked[0][0]]} most often`,
    body: `Across ${plural(dates.length, 'day')} of logging: ${ranked.map(([k, n]) => `${names[k]} ${n}×`).join(', ')}. ` +
      'A few cycles of consistent logging is what makes patterns readable, for you and for a clinician.',
  };
}

export const NOT_A_DIAGNOSIS =
  'These are observations about what you recorded, not a diagnosis. Patterns can have many causes, and only a ' +
  'qualified healthcare professional can tell you what yours mean. Bring this with you to a check-up rather than acting on it alone.';

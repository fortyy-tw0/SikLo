/**
 * The SikLo assistant's answer engine. Runs entirely in the page: no network,
 * no account, works offline.
 *
 * An answer is built in this order:
 *   1. safety check   - crisis, emergency, and things SikLo must not answer
 *   2. your own data  - questions about your cycle, answered from your log
 *   3. the library    - the closest topics in lib/library/articles.ts
 * Every answer carries the reminder that SikLo is not a healthcare professional.
 *
 * `answerQuestion` is pure and has no DOM or storage access, so it is checked
 * in assistant.test.ts.
 */
import { diffDays, parseDate } from './cycle';
import { averageCycle, averagePeriod, variation, type CycleView } from './cycleView';
import { ARTICLES, SOURCE_NOTE, type Article } from './library/articles';
import { FIXED_REPLIES, isCrisis, safetyCheck, type SafetyKind } from './safety';

export const MEDICAL_NOTE =
  'SikLo is not a healthcare professional and cannot diagnose anything. For your own body, please see a qualified ' +
  'doctor, midwife or nurse.';

export interface AnswerContext {
  /** The person's cycle as the Today screen sees it, when they have saved dates. */
  view?: CycleView | null;
  name?: string;
}

export interface Answer {
  /** Where the reply came from, for the interface and for checks. */
  kind: 'safety' | 'cycle' | 'library' | 'unknown';
  text: string;
  /** Titles of the library topics used, if any. */
  sources: string[];
  /** Crisis replies are shown alone, with no follow-up suggestions. */
  crisis: boolean;
  /** False only for crisis replies, where a disclaimer would be out of place. */
  showMedicalNote: boolean;
}

// ---------- Retrieval ----------
const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'am', 'do', 'does', 'did', 'i', 'my', 'me', 'you', 'it', 'to',
  'of', 'in', 'on', 'for', 'and', 'or', 'be', 'can', 'what', 'why', 'how', 'when', 'where', 'should', 'would', 'if',
  'this', 'that', 'have', 'has', 'get', 'got', 'so', 'but', 'about', 'with', 'was', 'were', 'ba', 'ang', 'ng', 'sa',
  'ako', 'ko', 'na', 'po', 'yung', 'mga', 'bakit', 'ano', 'kailan', 'paano']);

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

/** Drops a plural "s" so "cramps" matches "cramp". */
const stem = (w: string) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

interface Scored { article: Article; score: number }

/** Library topics closest to the question, best first. */
export function retrieve(question: string, limit = 3): Scored[] {
  const asked = words(question).filter((w) => !STOP.has(w)).map(stem);
  if (!asked.length) return [];
  const scored = ARTICLES.map((article) => {
    const keys = new Set(words(article.keywords).map(stem));
    const title = new Set(words(article.title).map(stem));
    const body = new Set(words(article.text).map(stem));
    let score = 0;
    for (const w of asked) {
      if (keys.has(w)) score += 3;
      if (title.has(w)) score += 2;
      else if (body.has(w)) score += 0.5;
    }
    // Prefer topics that match more of the question, not just one word often
    const matched = asked.filter((w) => keys.has(w) || title.has(w) || body.has(w)).length;
    return { article, score: score * (1 + matched / asked.length) };
  });
  return scored.filter((s) => s.score >= 3).sort((a, b) => b.score - a.score).slice(0, limit);
}

// ---------- Questions about the person's own cycle ----------
type CycleIntent = 'next_period' | 'cycle_day' | 'late' | 'cycle_length' | 'last_period' | 'fertile' | 'period_length';

// Order matters: the more specific question wins, so "last period" is
// checked before "next period", which would otherwise swallow it.
const CYCLE_INTENTS: { intent: CycleIntent; patterns: RegExp[] }[] = [
  { intent: 'late', patterns: [/\b(am i|is my period) (late|delayed)\b/, /\bhow late\b/, /\boverdue\b/, /\bna delay\b/] },
  { intent: 'last_period', patterns: [/\blast period\b/, /\bwhen did .*(start|begin)\b/, /\bprevious period\b/] },
  { intent: 'next_period', patterns: [/\bnext period\b/, /\bwhen .*(period|regla|mens|dalaw)\b/, /\bperiod .*(due|coming|start)\b/, /\bkailan .*(period|regla|mens|dalaw)\b/] },
  { intent: 'cycle_day', patterns: [/\b(what|which) (cycle )?day\b/, /\bcycle day\b/, /\bday am i on\b/, /\bilang araw na\b/] },
  { intent: 'cycle_length', patterns: [/\b(how long|length) .*cycles?\b/, /\bmy cycle length\b/, /\baverage cycle\b/, /\bcycles? (usually )?(last|run)\b/] },
  { intent: 'period_length', patterns: [/\bhow long .*(periods?|bleed)\b/, /\bperiod (usually )?last\b/] },
  { intent: 'fertile', patterns: [/\bfertile\b/, /\bovulat/, /\begg\b/, /\bmost fertile\b/] },
];

function cycleIntent(question: string): CycleIntent | null {
  const q = question.toLowerCase();
  for (const { intent, patterns } of CYCLE_INTENTS) {
    if (patterns.some((re) => re.test(q))) return intent;
  }
  return null;
}

const fmt = (iso: string) => parseDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric' });
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/** An answer from the person's own log, or null when their log cannot answer it. */
function answerFromCycle(intent: CycleIntent, v: CycleView): string | null {
  switch (intent) {
    case 'cycle_day':
      return `You are on day ${v.cycleDay} of your cycle, counting from ${fmt(v.cycleStart)}.`;
    case 'last_period':
      return `Your most recent period started on ${fmt(v.cycleStart)}, which was ${plural(v.cycleDay - 1, 'day')} ago.`;
    case 'next_period': {
      if (v.estimateOff) return 'Date-based estimates are turned off for the life stage you recorded in setup, so I am not estimating a date. You can still log your periods, and change that in your setup answers.';
      if (!v.next) return `I cannot estimate yet. SikLo waits for three complete cycles so it never guesses, and you have ${plural(v.prediction.cycles_used, 'complete cycle')} recorded so far. Adding earlier start dates in Profile would help.`;
      const days = diffDays(parseDate(v.today), parseDate(v.next.likely));
      const when = days > 1 ? `in about ${plural(days, 'day')}` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : `${plural(-days, 'day')} ago`;
      return `Your next period is estimated around ${fmt(v.next.likely)}, ${when}, most likely between ${fmt(v.next.from)} and ${fmt(v.next.to)}. That is a projection from your recent cycles, so it can move.`;
    }
    case 'late': {
      if (!v.next) return 'I cannot tell whether you are late, because there is not enough history yet for an estimate. A test is the only way to rule out pregnancy if that is a possibility.';
      const days = diffDays(parseDate(v.next.likely), parseDate(v.today));
      if (days <= 0) return `You are not late by SikLo's estimate. Your period is expected around ${fmt(v.next.likely)}.`;
      return `Your period was estimated around ${fmt(v.next.likely)}, so it is about ${plural(days, 'day')} later than that estimate. Cycles shift for many reasons, including stress, illness and travel, and the estimate itself can be off. A test is the only way to rule out pregnancy, and periods that stop for three months or more are worth a check-up.`;
    }
    case 'cycle_length': {
      const avg = averageCycle(v);
      if (avg === null) return 'I do not have a complete cycle recorded yet, so I cannot tell you your usual length. Two period start dates in a row is enough to work out the first one.';
      const spread = variation(v);
      const range = v.cycles.length ? ` Your recent cycles ran ${Math.min(...v.cycles)} to ${Math.max(...v.cycles)} days.` : '';
      return `Your cycles have averaged about ${plural(avg, 'day')} across the ${plural(v.cycles.length, 'cycle')} you have logged${spread ? `, varying by roughly ${spread} day${spread === 1 ? '' : 's'}` : ''}.${range}`;
    }
    case 'period_length': {
      const avg = averagePeriod(v);
      if (avg === null) return 'None of your logged periods has an end date yet, so I cannot tell you a usual length. Adding end dates in Profile would let me.';
      return `Your periods have lasted about ${plural(avg, 'day')} on average, across the ones you have logged with an end date.`;
    }
    case 'fertile': {
      if (v.estimateOff) return 'Estimates are turned off for the life stage you recorded, so I am not showing a fertile window.';
      if (!v.fertile || !v.ovulationDay) return 'I cannot estimate a fertile window yet; that needs three complete cycles. Signs such as clearer, stretchy discharge are worth noticing in the meantime.';
      const from = parseDate(v.cycleStart);
      const date = (day: number) => fmt(new Date(from.getTime() + (day - 1) * 86_400_000).toISOString().slice(0, 10));
      return `Based on your recent cycles, your fertile window is estimated around ${date(v.fertile[0])} to ${date(v.fertile[1])}, with ovulation near ${date(v.ovulationDay)}. These are estimates from dates alone, they shift between cycles, and they are not a method of birth control.`;
    }
  }
}

// ---------- Putting an answer together ----------
export function answerQuestion(question: string, ctx: AnswerContext = {}): Answer {
  const asked = question.trim();
  if (!asked) {
    return { kind: 'unknown', text: 'Ask me anything about cycles, symptoms, or what you have logged.', sources: [], crisis: false, showMedicalNote: false };
  }

  const flag: SafetyKind | null = safetyCheck(asked);
  if (flag) {
    return { kind: 'safety', text: FIXED_REPLIES[flag], sources: [], crisis: isCrisis(flag), showMedicalNote: !isCrisis(flag) };
  }

  const intent = cycleIntent(asked);
  if (intent) {
    if (!ctx.view) {
      return {
        kind: 'cycle',
        text: 'I do not have any period dates saved on this device yet, so I cannot answer that about you. You can add them from Profile, under “Add or edit dates”.',
        sources: [], crisis: false, showMedicalNote: true,
      };
    }
    const text = answerFromCycle(intent, ctx.view);
    if (text) {
      // Her own numbers are the answer; background reading is one follow-up away,
      // and appending it here made short answers long and vague.
      return { kind: 'cycle', text, sources: [], crisis: false, showMedicalNote: true };
    }
  }

  const hits = retrieve(asked);
  if (!hits.length) {
    return {
      kind: 'unknown',
      text:
        'I am not sure about that one. I can explain how cycles work, common symptoms such as cramps, discharge or mood ' +
        'changes, contraception in general terms, and what you have logged. For anything about your own body, a ' +
        'healthcare professional is the right place to ask.',
      sources: [], crisis: false, showMedicalNote: true,
    };
  }
  const main = hits[0].article;
  const also = hits.slice(1);
  const text = also.length
    ? `${main.text}\n\n${also.map((s) => `${s.article.title}: ${s.article.text}`).join('\n\n')}`
    : main.text;
  return { kind: 'library', text, sources: hits.map((s) => s.article.title), crisis: false, showMedicalNote: true };
}

export { SOURCE_NOTE };

/** Starter questions offered on the assistant screen. */
export const SUGGESTIONS: readonly string[] = [
  'When is my next period?',
  'Why do I get cramps?',
  'What day of my cycle am I on?',
  'What is ovulation?',
  'Are my cycles irregular?',
  'When should I see a doctor?',
];

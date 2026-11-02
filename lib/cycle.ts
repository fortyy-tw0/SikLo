/**
 * The web prototype's view of the backend prediction engine.
 *
 * src/backend/prediction.ts and dates.ts are copied unchanged from
 * siklo-backend-ts, so the website and the phone app give the same answer for
 * the same dates. Update them by copying the backend files again.
 */
import { compute, flagMessages, MIN_CYCLES_FOR_PREDICTION, type Prediction } from './backend/prediction';
import type { Period } from './types';

export { flagMessages, MIN_CYCLES_FOR_PREDICTION, type Prediction };
export { addDays, diffDays, parseDate, toISO } from './backend/dates';

/** Spotting never feeds predictions; the backend applies the same filter in SQL (kind='period'). */
// A missing kind counts as a period, matching the backend's default.
const isPeriod = (p: Period) => p.kind !== 'spotting';

export function predict(periods: readonly Period[]): Prediction {
  return compute(periods.filter(isPeriod));
}

/** How many more period start dates are needed before an estimate can appear. */
export function startsNeeded(periods: readonly Period[], p: Prediction): number {
  const starts = periods.filter(isPeriod).length;
  // Each new start adds one cycle; with no dates at all, the first one adds none.
  return starts ? MIN_CYCLES_FOR_PREDICTION - p.cycles_used : MIN_CYCLES_FOR_PREDICTION + 1;
}

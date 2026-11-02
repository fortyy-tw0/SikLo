/**
 * Things the user records on the Today screen, saved straight to this
 * browser (no Save step): daily log chips, confirmed ovulation, and which
 * health flags were added to the doctor report or dismissed.
 *
 * Kept apart from the setup profile in store.ts; wipe() there clears both.
 */
export type LogKind = 'flow' | 'mood' | 'symptoms' | 'temp';
export const LOG_KINDS: readonly LogKind[] = ['flow', 'mood', 'symptoms', 'temp'];

export type OvulationSign = 'lh' | 'bbt' | 'cm' | 'pain';

/**
 * Intercourse logged on a date. Kept deliberately narrow: whether protection
 * was used, and anything worth telling a clinician about. SikLo does not ask
 * for sexual history beyond that, and nothing here is required.
 */
export type Protection = 'none' | 'condom' | 'other_method' | 'unsure' | 'prefer_not_to_say';
export type IntimacyObservation = 'bleeding_after' | 'pain' | 'discomfort' | 'nothing_unusual';

export interface IntimacyEntry {
  protection: Protection | null;
  observations: IntimacyObservation[];
  note: string;
}

export const PROTECTION_OPTIONS: { value: Protection; label: string }[] = [
  { value: 'condom', label: 'Condom' },
  { value: 'other_method', label: 'Other contraception' },
  { value: 'none', label: 'No protection' },
  { value: 'unsure', label: 'Not sure' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const OBSERVATION_OPTIONS: { value: IntimacyObservation; label: string }[] = [
  { value: 'nothing_unusual', label: 'Nothing unusual' },
  { value: 'pain', label: 'Pain' },
  { value: 'discomfort', label: 'Discomfort' },
  { value: 'bleeding_after', label: 'Bleeding afterwards' },
];

export interface ConfirmedOvulation {
  cycle_start: string; // start date of the cycle it belongs to
  day: number; // cycle day, 1 = first day of the period
  signs: OvulationSign[];
}

export interface Tracking {
  logs: Record<string, LogKind[]>; // YYYY-MM-DD -> logged kinds
  /** YYYY-MM-DD -> what was logged for that date. */
  intimacy: Record<string, IntimacyEntry>;
  ovulation: ConfirmedOvulation | null;
  reported: string[]; // flag keys added to the doctor report
  dismissed: string[]; // flag keys the user dismissed
}

export const TRACKING_KEY = 'siklo-tracking';

const empty = (): Tracking => ({ logs: {}, intimacy: {}, ovulation: null, reported: [], dismissed: [] });

function local(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadTracking(): Tracking {
  try {
    const raw = JSON.parse(local()?.getItem(TRACKING_KEY) ?? 'null') as Partial<Tracking> | null;
    if (!raw || typeof raw !== 'object') return empty();
    return {
      logs: raw.logs && typeof raw.logs === 'object' ? raw.logs : {},
      intimacy: raw.intimacy && typeof raw.intimacy === 'object' ? raw.intimacy : {},
      ovulation: raw.ovulation ?? null,
      reported: Array.isArray(raw.reported) ? raw.reported : [],
      dismissed: Array.isArray(raw.dismissed) ? raw.dismissed : [],
    };
  } catch {
    return empty();
  }
}

/** Apply a change and save it. Returns the new state. */
export function saveTracking(change: (t: Tracking) => void): Tracking {
  const t = loadTracking();
  change(t);
  try {
    local()?.setItem(TRACKING_KEY, JSON.stringify(t));
  } catch {
    /* storage blocked: the change still shows for this visit */
  }
  return t;
}

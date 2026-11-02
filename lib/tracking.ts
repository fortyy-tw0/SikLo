/**
 * Everything the person records day to day, kept on this device.
 *
 * Stored separately from the setup profile in store.ts, but wiped with it.
 * The shape mirrors the daily_log and intimacy_log tables in backend/schema.sql
 * so the web app, the phone app and the Python service read one model.
 */

// ---------- What a day can hold ----------
export type LogKind = 'flow' | 'mood' | 'symptoms' | 'temp';
export const LOG_KINDS: readonly LogKind[] = ['flow', 'mood', 'symptoms', 'temp'];

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';
export const FLOW_OPTIONS: { value: FlowLevel; label: string }[] = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
];

export const MOOD_OPTIONS = ['Calm', 'Happy', 'Energetic', 'Irritable', 'Anxious', 'Low', 'Tearful', 'Foggy'] as const;
export const SYMPTOM_OPTIONS = [
  'Cramps', 'Headache', 'Backache', 'Bloating', 'Tender breasts', 'Nausea',
  'Fatigue', 'Acne', 'Diarrhoea', 'Constipation', 'Dizziness', 'Food cravings',
] as const;

/** One day of logging. Every field is optional; an empty entry is not kept. */
export interface DayEntry {
  flow?: FlowLevel;
  moods: string[];
  symptoms: string[];
  /** Body temperature in °C, as read. */
  tempC?: number;
  note: string;
}

export const emptyEntry = (): DayEntry => ({ moods: [], symptoms: [], note: '' });

/** Which chips should show as filled for this day. */
export function loggedKinds(entry: DayEntry | undefined): LogKind[] {
  if (!entry) return [];
  const kinds: LogKind[] = [];
  if (entry.flow) kinds.push('flow');
  if (entry.moods.length) kinds.push('mood');
  if (entry.symptoms.length) kinds.push('symptoms');
  if (entry.tempC !== undefined) kinds.push('temp');
  return kinds;
}

export const entryIsEmpty = (entry: DayEntry) =>
  !entry.flow && !entry.moods.length && !entry.symptoms.length && entry.tempC === undefined && !entry.note.trim();

/** A short readable summary, for the calendar day sheet and the assistant. */
export function describeEntry(entry: DayEntry): string {
  const bits: string[] = [];
  if (entry.flow) bits.push(`${entry.flow} flow`);
  if (entry.symptoms.length) bits.push(entry.symptoms.join(', ').toLowerCase());
  if (entry.moods.length) bits.push(entry.moods.join(', ').toLowerCase());
  if (entry.tempC !== undefined) bits.push(`${entry.tempC.toFixed(1)}°C`);
  return bits.join(' · ');
}

// ---------- Ovulation and intercourse ----------
export type OvulationSign = 'lh' | 'bbt' | 'cm' | 'pain';

export interface ConfirmedOvulation {
  cycle_start: string;
  day: number;
  signs: OvulationSign[];
}

/**
 * Intercourse logged on a date. Deliberately narrow: whether protection was
 * used, and anything worth telling a clinician. SikLo does not ask for sexual
 * history beyond that, and nothing here is required.
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

// ---------- Storage ----------
export interface Tracking {
  /** YYYY-MM-DD -> what was logged that day. */
  entries: Record<string, DayEntry>;
  /** YYYY-MM-DD -> intercourse logged that day. */
  intimacy: Record<string, IntimacyEntry>;
  ovulation: ConfirmedOvulation | null;
  reported: string[];
  dismissed: string[];
}

export const TRACKING_KEY = 'siklo-tracking';

const empty = (): Tracking => ({ entries: {}, intimacy: {}, ovulation: null, reported: [], dismissed: [] });

function local(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Earlier versions stored only which chips were tapped; keep those days. */
function migrate(raw: Record<string, unknown>): Record<string, DayEntry> {
  const out: Record<string, DayEntry> = {};
  const legacy = raw as Record<string, LogKind[]>;
  for (const [date, kinds] of Object.entries(legacy)) {
    if (!Array.isArray(kinds)) continue;
    const entry = emptyEntry();
    // The old format recorded the category only, so the detail is unknown
    if (kinds.includes('flow')) entry.flow = 'medium';
    if (kinds.includes('mood')) entry.moods = ['Logged earlier'];
    if (kinds.includes('symptoms')) entry.symptoms = ['Logged earlier'];
    out[date] = entry;
  }
  return out;
}

function readEntries(raw: Partial<Tracking> & { logs?: unknown }): Record<string, DayEntry> {
  if (raw.entries && typeof raw.entries === 'object') {
    const out: Record<string, DayEntry> = {};
    for (const [date, value] of Object.entries(raw.entries)) {
      const e = value as Partial<DayEntry>;
      out[date] = {
        flow: e?.flow,
        moods: Array.isArray(e?.moods) ? e.moods : [],
        symptoms: Array.isArray(e?.symptoms) ? e.symptoms : [],
        tempC: typeof e?.tempC === 'number' ? e.tempC : undefined,
        note: typeof e?.note === 'string' ? e.note : '',
      };
    }
    return out;
  }
  if (raw.logs && typeof raw.logs === 'object') return migrate(raw.logs as Record<string, unknown>);
  return {};
}

export function loadTracking(): Tracking {
  try {
    const raw = JSON.parse(local()?.getItem(TRACKING_KEY) ?? 'null') as (Partial<Tracking> & { logs?: unknown }) | null;
    if (!raw || typeof raw !== 'object') return empty();
    return {
      entries: readEntries(raw),
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
  // Days whose detail was all cleared should not linger
  for (const [date, entry] of Object.entries(t.entries)) {
    if (entryIsEmpty(entry)) delete t.entries[date];
  }
  try {
    local()?.setItem(TRACKING_KEY, JSON.stringify(t));
  } catch {
    /* storage blocked: the change still shows for this visit */
  }
  return t;
}

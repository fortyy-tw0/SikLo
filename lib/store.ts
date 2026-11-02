/**
 * On-device storage for the web prototype.
 *
 *   draft -> sessionStorage. Answers while moving through setup; gone when the tab closes.
 *   saved -> localStorage. Written only by commit(), when the user taps Save on Step 4.
 *
 * Nothing here makes a network request. Unlike the phone app, browser storage
 * is not encrypted at rest.
 */
import { TRACKING_KEY } from './tracking';
import type { Draft, OnboardingPayload, Period, Profile, SavedProfile } from './types';

const DRAFT_KEY = 'siklo-draft';
const SAVED_KEY = 'siklo-profile';
const VERSION = 1;

function storage(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null; // blocked (private mode, site data disabled)
  }
}

function readJson(s: Storage | null, key: string): unknown {
  if (!s) return null;
  try {
    return JSON.parse(s.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function writeJson(s: Storage | null, key: string, value: unknown): boolean {
  if (!s) return false;
  try {
    s.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function emptyDraft(): Draft {
  return {
    name: '',
    dob: null,
    cycle_type: null,
    diagnosed: null,
    concern_note: '',
    contraception_context: false,
    life_stage_context: false,
    periods: [],
  };
}

function isSaved(value: unknown): value is SavedProfile {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<SavedProfile>;
  return v.version === VERSION && typeof v.saved_at === 'string' && typeof v.profile === 'object' && Array.isArray(v.periods);
}

/** The saved profile, or null if the user has never tapped Save. */
export function load(): SavedProfile | null {
  const p = readJson(storage('local'), SAVED_KEY);
  return isSaved(p) ? p : null;
}

/** Current draft; starts from the saved profile if there is one. */
export function draft(): Draft {
  const d = readJson(storage('session'), DRAFT_KEY);
  if (d && typeof d === 'object') return { ...emptyDraft(), ...(d as Partial<Draft>) };
  const saved = load();
  return saved ? { ...emptyDraft(), ...saved.profile, periods: saved.periods } : emptyDraft();
}

/** Merge fields into the draft (session only). */
export function update(fields: Partial<Draft>): Draft {
  const d = { ...draft(), ...fields };
  writeJson(storage('session'), DRAFT_KEY, d);
  return d;
}

/** Save: copy the draft into this browser's persistent storage. */
export function commit(): SavedProfile | null {
  const { periods, ...profile }: { periods: Period[] } & Profile = draft();
  const record: SavedProfile = { version: VERSION, saved_at: new Date().toISOString(), profile, periods };
  if (!writeJson(storage('local'), SAVED_KEY, record)) return null;
  storage('session')?.removeItem(DRAFT_KEY);
  return record;
}

/** Delete everything SikLo stored in this browser: setup, dates, logs and ovulation. */
export function wipe(): void {
  storage('local')?.removeItem(SAVED_KEY);
  storage('local')?.removeItem(TRACKING_KEY);
  storage('session')?.removeItem(DRAFT_KEY);
}

export const MAX_NAME_LENGTH = 30;

/** Tidy a typed name: trim, single spaces, at most MAX_NAME_LENGTH characters. */
export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim();
}

/** The saved name, or '' (older saved profiles have none). */
export function savedName(): string {
  const p = load()?.profile as Partial<Profile> | undefined;
  return typeof p?.name === 'string' ? cleanName(p.name) : '';
}

/** Map a profile to the backend's POST /onboarding body. */
export function onboardingPayload(p: Profile = draft()): OnboardingPayload {
  const health: OnboardingPayload['health_context'] = [];
  if (p.diagnosed === 'yes') health.push({ kind: 'condition', condition_name: null, status: 'diagnosed_user_reported' });
  if (p.diagnosed === 'private') health.push({ kind: 'condition', condition_name: null, status: 'prefer_not_to_say' });
  return { language: 'en', cycle_type: p.cycle_type, health_context: health, enabled_categories: [] };
}

// Handy for checking saved data from the browser console.
declare global {
  interface Window {
    SikloStore?: {
      load: typeof load;
      draft: typeof draft;
      onboardingPayload: (from?: Profile | SavedProfile | null) => OnboardingPayload;
    };
  }
}
window.SikloStore = {
  load,
  draft,
  onboardingPayload: (from) => onboardingPayload(from && 'profile' in from ? from.profile : from ?? draft()),
};

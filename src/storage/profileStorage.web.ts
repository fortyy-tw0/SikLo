/**
 * Browser version of profileStorage.ts, used only by the web build (Metro
 * picks *.web.ts automatically). expo-secure-store has no browser support, so
 * the profile goes to this browser's localStorage instead.
 *
 * Same exports, same validation, same key. Nothing leaves the device, but
 * unlike the iOS Keychain / Android Keystore, browser storage is not encrypted
 * at rest: anyone with access to this browser can read it. Use the web build
 * for testing the screens, not for real health records.
 */
import { isValidCalendarDate } from '../lib/calendarDate';
import {
  CHAT_RETENTIONS,
  CONTRACEPTION_CONTEXTS,
  CYCLE_PATTERNS,
  DIAGNOSIS_ANSWERS,
  LANGUAGES,
  LIFE_STAGE_CONTEXTS,
  TONES,
} from '../types/profile';
import type { LocalProfile, PeriodAnswer } from '../types/profile';

const PROFILE_KEY = 'siklo.profile.v1';

const storage = (): Storage | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null; // storage blocked (private mode, site data disabled)
  }
};

const isOneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T =>
  typeof value === 'string' && allowed.some((option) => option === value);

const isPeriodAnswer = (value: unknown): value is PeriodAnswer => {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return false;
  switch (value.kind) {
    case 'dont_remember':
    case 'not_recorded':
    case 'skipped':
      return true;
    case 'known':
      return (
        'start' in value &&
        'end' in value &&
        'ongoing' in value &&
        isValidCalendarDate(value.start) &&
        (value.end === null || isValidCalendarDate(value.end)) &&
        typeof value.ongoing === 'boolean'
      );
    default:
      return false;
  }
};

const field = (obj: object, key: keyof LocalProfile): unknown =>
  Object.getOwnPropertyDescriptor(obj, key)?.value;

const isLocalProfile = (value: unknown): value is LocalProfile => {
  if (typeof value !== 'object' || value === null) return false;
  const concernNote = field(value, 'concernNote');
  return (
    field(value, 'schemaVersion') === 1 &&
    typeof field(value, 'savedAt') === 'string' &&
    isOneOf(field(value, 'cyclePattern'), CYCLE_PATTERNS) &&
    isOneOf(field(value, 'diagnosis'), DIAGNOSIS_ANSWERS) &&
    (concernNote === null || typeof concernNote === 'string') &&
    isOneOf(field(value, 'contraception'), CONTRACEPTION_CONTEXTS) &&
    isOneOf(field(value, 'lifeStage'), LIFE_STAGE_CONTEXTS) &&
    isPeriodAnswer(field(value, 'period')) &&
    isOneOf(field(value, 'language'), LANGUAGES) &&
    isOneOf(field(value, 'tone'), TONES) &&
    isOneOf(field(value, 'chatRetention'), CHAT_RETENTIONS)
  );
};

export class ProfileReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileReadError';
  }
}

/** Returns the saved profile, `null` if none exists, or throws if stored data is unreadable. */
export const loadProfile = async (): Promise<LocalProfile | null> => {
  const raw = storage()?.getItem(PROFILE_KEY) ?? null;
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ProfileReadError('Saved profile could not be read.');
  }
  if (!isLocalProfile(parsed)) {
    throw new ProfileReadError('Saved profile is in an unexpected format.');
  }
  return parsed;
};

export const saveProfile = async (profile: LocalProfile): Promise<void> => {
  const s = storage();
  if (!s) throw new Error('This browser is blocking site storage, so the profile cannot be saved.');
  s.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const deleteProfile = async (): Promise<void> => {
  storage()?.removeItem(PROFILE_KEY);
};

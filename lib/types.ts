/**
 * Shapes saved by the web prototype. Value sets follow the siklo-backend API
 * contract (POST /onboarding, POST /periods) so the data can be handed to
 * siklo-backend-ts in the phone app.
 */

import type { ContraceptionContext, LifeStageContext } from './context';

export type CycleType = 'regular' | 'irregular' | 'not_sure';
export type DiagnosisAnswer = 'yes' | 'no' | 'unsure' | 'private';
export type EndState = 'ended' | 'ongoing' | 'unknown';

export interface Period {
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  kind: 'period' | 'spotting';
  end_state: EndState;
  flow_level: number | null;
}

export interface Profile {
  name: string; // preferred name or nickname, '' if skipped
  dob: string | null; // YYYY-MM-DD
  cycle_type: CycleType | null;
  diagnosed: DiagnosisAnswer | null;
  concern_note: string; // stays a note, never a diagnosis
  contraception: ContraceptionContext | null;
  contraception_note: string; // own words, for 'Other context'
  life_stage: LifeStageContext | null;
  life_stage_note: string; // own words, for 'Other / I'm not sure'
}

/** Setup answers in progress (session only). */
export interface Draft extends Profile {
  periods: Period[];
}

/** What Save writes to this browser. */
export interface SavedProfile {
  version: 1;
  saved_at: string; // ISO datetime
  profile: Profile;
  periods: Period[];
}

/** Body for the backend's POST /onboarding. */
export interface OnboardingPayload {
  language: 'en' | 'fil';
  cycle_type: CycleType | null;
  health_context: {
    kind: 'condition';
    condition_name: string | null;
    status: 'diagnosed_user_reported' | 'suspected_not_diagnosed' | 'prefer_not_to_say';
  }[];
  enabled_categories: string[];
}

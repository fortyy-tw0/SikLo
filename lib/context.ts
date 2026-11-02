/**
 * Optional "other context" from setup: contraception and life stage.
 * Values and labels match the React Native app (src/types/profile.ts and
 * app/onboarding/context.tsx on the `app` branch).
 */
export const CONTRACEPTION_OPTIONS = [
  { value: 'hormonal_related_bleeding', label: 'Hormonal contraception / related bleeding' },
  { value: 'recent_change', label: 'Recent contraception change' },
  { value: 'other', label: 'Other context' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export const LIFE_STAGE_OPTIONS = [
  { value: 'postpartum', label: 'Postpartum recovery' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'menopause_transition', label: 'Menopause / transition context' },
  { value: 'other_unsure', label: "Other / I'm not sure" },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export type ContraceptionContext = (typeof CONTRACEPTION_OPTIONS)[number]['value'];
export type LifeStageContext = (typeof LIFE_STAGE_OPTIONS)[number]['value'];

/** Choices that open a box to describe things in your own words. */
export const WRITE_IN: readonly string[] = ['other', 'other_unsure'];
export const MAX_CONTEXT_NOTE = 120;

/** Short note shown under a choice, from the app's design. */
export function contraceptionHelper(value: ContraceptionContext | null): string | null {
  return value === 'hormonal_related_bleeding'
    ? 'Hormone-related bleeding may mean an estimate is not shown. Logging stays available.'
    : null;
}

const ESTIMATE_UNSUITABLE: Partial<Record<LifeStageContext, string>> = {
  postpartum:
    "Postpartum recovery makes the ordinary date-based method unsuitable. You can still log bleeding and symptoms; postpartum bleeding won't be treated as a period forecast.",
  pregnancy: 'Pregnancy makes the ordinary date-based method unsuitable. You can still log bleeding and symptoms.',
};

/** Why date-based estimates are off for this life stage, or null if they are fine. */
export function estimateUnsuitable(value: LifeStageContext | null | undefined): string | null {
  return (value && ESTIMATE_UNSUITABLE[value]) ?? null;
}

export const isContraception = (v: unknown): v is ContraceptionContext =>
  CONTRACEPTION_OPTIONS.some((o) => o.value === v);
export const isLifeStage = (v: unknown): v is LifeStageContext => LIFE_STAGE_OPTIONS.some((o) => o.value === v);

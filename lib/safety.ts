/**
 * Safety checks that run before anything else the assistant says.
 *
 * Ported from siklo-backend/app/companion/safety.py on the `backend` branch:
 * keyword rules in English, Filipino and Taglish, biased toward escalating,
 * because a false alarm is acceptable and a miss is not. A native speaker
 * should review these lists before launch.
 *
 * Hotlines verified against a Department of Health report published in
 * January 2026. Re-check them periodically; a dead crisis line is worse than
 * none. The backend's Hopeline entry is left out until it can be confirmed.
 */
export const HOTLINES = [
  { name: 'NCMH Crisis Hotline', numbers: ['1553', '0919-057-1553', '0917-899-8727'], note: 'free, 24 hours' },
  { name: 'Emergency', numbers: ['911'], note: 'police, fire, ambulance' },
];

export type SafetyKind = 'self_harm' | 'emergency' | 'pregnancy' | 'missed_pill' | 'out_of_scope';

const RULES: { kind: SafetyKind; patterns: RegExp[] }[] = [
  {
    kind: 'self_harm',
    patterns: [
      /\bkill (my ?self|myself)\b/, /\bsuicid/, /\bwant to die\b/, /\bend (it all|my life)\b/,
      /\bself[- ]?harm/, /\bhurt(ing)? my ?self\b/, /\bno reason to live\b/, /\bbetter off dead\b/,
      /\bcut(ting)? my ?self\b/,
      /\bmagpakamatay\b/, /\bpatayin (ko )?(ang )?sarili\b/, /\bgusto ko (nang )?mamatay\b/,
      /\bayoko na(ng)? mabuhay\b/, /\bsaktan (ko )?(ang )?sarili\b/, /\bwala na(ng)? saysay\b/,
      /\bsana mamatay na\b/, /\bmamatay na lang\b/,
    ],
  },
  {
    kind: 'emergency',
    patterns: [
      /\bfaint(ed|ing)?\b/, /\bpassed out\b/, /\bcan'?t breathe\b/, /\bsoak(ing|ed)? .*every hour\b/,
      /\bsevere (bleeding|pain)\b/, /\bnahimatay\b/, /\bsobrang (sakit|dugo)\b/,
    ],
  },
  {
    kind: 'pregnancy',
    patterns: [
      /\bam i pregnant\b/, /\bcould i be pregnant\b/, /\bchance(s)? (of|that) .*pregnan/,
      /\bbuntis ba ako\b/, /\bbaka buntis\b/, /\bpregnant ba\b/,
    ],
  },
  {
    kind: 'missed_pill',
    patterns: [/\bmissed (my |a )?pill/, /\bforgot (to take )?(my |the )?pill/, /\bnakalimutan.*pill/],
  },
  {
    kind: 'out_of_scope',
    patterns: [
      /\bsafe days?\b/, /\bdo i have pcos\b/, /\bdiagnos/,
      /\bhow (much|many) (mg|milligrams|tablets|pills) should\b/,
      /\bdosage\b/, /\bwhat dose\b/, /\bmay pcos ba ako\b/,
    ],
  },
];

const hotlineText = HOTLINES.map((h) => `${h.name}: ${h.numbers.join(' or ')} (${h.note})`).join('\n');

export const FIXED_REPLIES: Record<SafetyKind, string> = {
  self_harm:
    "I'm really glad you told me, and I'm sorry you're carrying this right now. You deserve support from a real person. " +
    'Please reach out to someone you trust, or to one of these free, confidential lines:\n' +
    `${hotlineText}\n` +
    "If you're in immediate danger, call 911. I'm still here if you want to keep talking.",
  emergency:
    'That sounds serious. Please get medical help now: go to the nearest clinic or emergency room, or call 911. ' +
    'If you can, ask someone nearby to stay with you.',
  pregnancy:
    "I can't tell whether you're pregnant, and cycle tracking can't confirm or rule it out. A pregnancy test, best " +
    'taken from the first day of a missed period, or a visit to a healthcare professional can give you a real answer.',
  missed_pill:
    'What to do after a missed pill depends on your specific pill. Please check the leaflet that came with your pack, ' +
    'or ask a pharmacist or doctor. They can tell you exactly what to do.',
  out_of_scope:
    "I can't diagnose conditions, recommend medicine doses, or tell you which days are “safe”. A healthcare " +
    'professional can help with that. I can explain how cycles work, or help you notice patterns in what you have logged.',
};

/** The first rule the question trips, or null. Order matters: crisis rules come first. */
export function safetyCheck(question: string): SafetyKind | null {
  const q = question.toLowerCase();
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(q))) return rule.kind;
  }
  return null;
}

/** True when a reply must not be followed by anything else, including suggestions. */
export const isCrisis = (kind: SafetyKind | null) => kind === 'self_harm' || kind === 'emergency';

/**
 * The greeting at the top of Today. A new one is picked each time the app is
 * opened (not on every screen change), never the same one twice in a row, and
 * time-of-day greetings only appear at the right time.
 */

interface Greeting {
  text: string;
  /** Hours (0-23, local time) when this greeting fits; always if omitted. */
  hours?: readonly [from: number, to: number];
}

export const GREETINGS: readonly Greeting[] = [
  { text: 'Hi there' },
  { text: 'Hello' },
  { text: 'Hey' },
  { text: 'Welcome back' },
  { text: 'Good to see you' },
  { text: 'Kumusta' },
  { text: 'Mabuhay' },
  { text: 'Good morning', hours: [5, 11] },
  { text: 'Magandang umaga', hours: [5, 11] },
  { text: 'Good afternoon', hours: [12, 17] },
  { text: 'Magandang hapon', hours: [12, 17] },
  { text: 'Good evening', hours: [18, 23] },
  { text: 'Magandang gabi', hours: [18, 23] },
];

/** Greetings that fit this hour. */
export function greetingsFor(hour: number): Greeting[] {
  return GREETINGS.filter((g) => !g.hours || (hour >= g.hours[0] && hour <= g.hours[1]));
}

/**
 * Pick a greeting: `random` is 0..1 (Math.random in the app, fixed in checks),
 * `last` is the previous greeting so it isn't repeated.
 */
export function pickGreeting(hour: number, random: number, last: string | null): string {
  const options = greetingsFor(hour).filter((g) => g.text !== last);
  return options[Math.min(options.length - 1, Math.floor(random * options.length))].text;
}

/** "Hello, Maya" or just "Hello". */
export const withName = (greeting: string, name: string) => (name ? `${greeting}, ${name}` : greeting);

// ---------- In the app ----------
const LAST_KEY = 'siklo-last-greeting';
let thisVisit: string | null = null; // chosen once per app open

/** Today's greeting for this visit. */
export function greetingForThisVisit(): string {
  if (thisVisit) return thisVisit;
  let last: string | null = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch {
    /* storage blocked: repeats are possible, nothing else changes */
  }
  thisVisit = pickGreeting(new Date().getHours(), Math.random(), last);
  try {
    localStorage.setItem(LAST_KEY, thisVisit);
  } catch {
    /* ignore */
  }
  return thisVisit;
}

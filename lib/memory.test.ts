import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMemory, memoryFacts, relevantPatterns, windowFor, type MemoryInput } from './memory';
import { buildCycleView } from './cycleView';
import type { DayEntry } from './tracking';
import type { Period } from './types';

const p = (start: string, days = 5): Period => ({
  start_date: start,
  end_date: new Date(new Date(start + 'T00:00:00Z').getTime() + (days - 1) * 86_400_000).toISOString().slice(0, 10),
  kind: 'period', end_state: 'ended', flow_level: null,
});
const REGULAR = ['2026-07-02', '2026-07-30', '2026-08-28', '2026-09-25', '2026-10-23'].map((s) => p(s));
const entry = (over: Partial<DayEntry> = {}): DayEntry => ({ moods: [], symptoms: [], note: '', ...over });
const input = (over: Partial<MemoryInput> = {}): MemoryInput => ({
  periods: REGULAR,
  view: buildCycleView(REGULAR, '2026-11-02', null, {}),
  entries: {}, intimacy: {}, today: '2026-11-02', ...over,
});
const keys = (i: MemoryInput) => buildMemory(i).patterns.map((x) => x.key);
const find = (i: MemoryInput, key: string) => buildMemory(i).patterns.find((x) => x.key === key);

test('with nothing logged it still knows her rhythm from her dates', () => {
  const m = buildMemory(input());
  assert.equal(m.daysLogged, 0);
  assert.equal(m.cyclesKnown, 4);
  assert.ok(keys(input()).includes('cycle_rhythm'));
  assert.match(find(input(), 'cycle_rhythm')!.summary, /averaged 28 days/);
});

test('confidence grows with the number of records', () => {
  const two = buildCycleView(['2026-09-01', '2026-09-29', '2026-10-27'].map((s) => p(s)), '2026-11-02', null, {});
  assert.equal(find(input({ view: two }), 'cycle_rhythm')!.confidence, 'low');
  assert.equal(find(input(), 'cycle_rhythm')!.confidence, 'medium');
  const many = ['2026-01-05', '2026-02-02', '2026-03-02', '2026-03-30', '2026-04-27', '2026-05-25', '2026-06-22'].map((s) => p(s));
  const seven = buildCycleView(many, '2026-07-01', null, {});
  assert.equal(find(input({ view: seven, periods: many }), 'cycle_rhythm')!.confidence, 'high');
});

test('it learns which symptoms she gets and where in the cycle', () => {
  const entries = {
    '2026-10-23': entry({ symptoms: ['Cramps'] }),   // day 1, period
    '2026-10-24': entry({ symptoms: ['Cramps'] }),   // day 2, period
    '2026-09-25': entry({ symptoms: ['Cramps'] }),   // previous cycle
  };
  const found = find(input({ entries }), 'symptom_cramps')!;
  assert.match(found.summary, /logged cramps on 3 days/);
  assert.match(found.summary, /during your period/);
  assert.equal(found.basedOn, 3);
});

test('a symptom logged once is not yet a pattern', () => {
  assert.ok(!keys(input({ entries: { '2026-10-23': entry({ symptoms: ['Nausea'] }) } })).includes('symptom_nausea'));
});

test('low mood before a period is noticed', () => {
  // Cycle starts 23 Oct, averages 28 days, so the days before the next period are ~16-20 Nov
  const entries = {
    '2026-11-18': entry({ moods: ['Low'] }),
    '2026-11-19': entry({ moods: ['Irritable'] }),
  };
  const found = find(input({ entries, today: '2026-11-20' }), 'mood_before_period');
  assert.ok(found, `expected the pattern, got ${keys(input({ entries, today: '2026-11-20' })).join(', ')}`);
  assert.match(found!.summary, /lower mood on 2 days/);
});

test('heavy flow days are counted', () => {
  const entries = { '2026-10-23': entry({ flow: 'heavy' }), '2026-10-24': entry({ flow: 'heavy' }) };
  assert.match(find(input({ entries }), 'heavy_days')!.summary, /heavy flow on 2 days/);
});

test('windows place a date inside the cycle', () => {
  const view = buildCycleView(REGULAR, '2026-11-02', null, {})!;
  assert.equal(windowFor(view, '2026-10-24'), 'period');       // day 2
  assert.equal(windowFor(view, '2026-11-02'), 'mid-cycle');    // day 11, fertile
  assert.equal(windowFor(view, '2026-11-18'), 'before-period');// day 27 of 28
  assert.equal(windowFor(view, '2026-10-01'), null);           // before this cycle
});

test('it tracks how consistently she logs', () => {
  const entries = {
    '2026-10-23': entry({ flow: 'medium' }),
    '2026-10-24': entry({ flow: 'light' }),
    '2026-10-25': entry({ symptoms: ['Fatigue'] }),
  };
  const m = buildMemory(input({ entries }));
  assert.equal(m.daysLogged, 3);
  assert.match(m.patterns.find((x) => x.key === 'logging')!.summary, /logged on 3 days/);
});

test('only patterns about the question are offered', () => {
  const entries = {
    '2026-10-23': entry({ symptoms: ['Cramps'], flow: 'heavy' }),
    '2026-10-24': entry({ symptoms: ['Cramps'], flow: 'heavy' }),
  };
  const memory = buildMemory(input({ entries }));
  assert.ok(relevantPatterns(memory, 'why do i get cramps').some((x) => x.key === 'symptom_cramps'));
  assert.ok(relevantPatterns(memory, 'how long are my cycles').some((x) => x.key === 'cycle_rhythm'));
  assert.deepEqual(relevantPatterns(memory, 'what is a menstrual cup'), []);
});

test('facts for the model carry her numbers and her patterns', () => {
  const entries = { '2026-10-23': entry({ symptoms: ['Cramps'] }), '2026-10-24': entry({ symptoms: ['Cramps'] }) };
  const i = input({ entries });
  const facts = memoryFacts(buildMemory(i), i.view)!;
  assert.match(facts, /cycle day 11/);
  assert.match(facts, /average cycle 28 days/);
  assert.match(facts, /cramps/);
});

test('nothing at all yields no patterns and no facts', () => {
  const blank = buildMemory(input({ view: null, periods: [] }));
  assert.deepEqual(blank.patterns, []);
  assert.equal(memoryFacts(blank, null), undefined);
});

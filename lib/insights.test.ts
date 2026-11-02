import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInsights, NOT_A_DIAGNOSIS, type InsightsInput } from './insights';
import { buildCycleView } from './cycleView';
import type { IntimacyEntry, LogKind } from './tracking';
import type { Period } from './types';

const p = (start: string, days = 5): Period => ({
  start_date: start,
  end_date: new Date(new Date(start + 'T00:00:00Z').getTime() + (days - 1) * 86_400_000).toISOString().slice(0, 10),
  kind: 'period', end_state: 'ended', flow_level: null,
});
const REGULAR = ['2026-07-02', '2026-07-30', '2026-08-28', '2026-09-25', '2026-10-23'].map((s) => p(s));
const input = (over: Partial<InsightsInput> = {}): InsightsInput => ({
  view: buildCycleView(REGULAR, '2026-11-02', null, {}),
  logs: {}, intimacy: {}, today: '2026-11-02', ...over,
});
const ids = (i: InsightsInput) => buildInsights(i).map((x) => x.id);
const find = (i: InsightsInput, id: string) => buildInsights(i).find((x) => x.id === id);

test('nothing is claimed without a cycle', () => {
  assert.deepEqual(buildInsights(input({ view: null })), []);
});

test('what to expect comes first, with the estimate and the phase', () => {
  const list = buildInsights(input());
  assert.equal(list[0].id, 'next-period');
  assert.equal(list[0].tone, 'expect');
  assert.match(list[0].title, /in about 18 days/);
  assert.match(list[0].body, /November 20/);
  assert.equal(list[1].id, 'phase');
  assert.match(list[1].title, /fertile window/i);
});

test('the fertile-window note does not imply protection from pregnancy', () => {
  const phase = find(input(), 'phase')!;
  assert.match(phase.body, /Pregnancy is most likely/);
  assert.ok(!/safe/i.test(phase.body));
});

test('before three cycles it explains the wait instead of estimating', () => {
  const few = input({ view: buildCycleView([p('2026-10-23')], '2026-11-02', null, {}) });
  assert.ok(ids(few).includes('need-cycles'));
  assert.ok(!ids(few).includes('next-period'));
  assert.match(find(few, 'need-cycles')!.body, /never guesses/);
});

test('estimates turned off are explained, not silently missing', () => {
  const off = input({ view: buildCycleView(REGULAR, '2026-11-02', null, { estimate: false }) });
  assert.ok(ids(off).includes('estimates-off'));
  assert.ok(!ids(off).includes('next-period'));
});

test('steady and variable rhythms are described differently', () => {
  assert.match(find(input(), 'rhythm')!.title, /steady/);
  const wobbly = input({
    view: buildCycleView(['2026-01-01', '2026-02-01', '2026-03-09', '2026-04-07', '2026-05-15'].map((s) => p(s)), '2026-05-20', null, {}),
  });
  assert.match(find(wobbly, 'rhythm')!.title, /moves around/);
});

test('pattern flags are carried through as things to raise', () => {
  const starts = ['2026-01-01', '2026-02-01', '2026-03-09', '2026-04-07', '2026-05-15', '2026-06-17', '2026-07-21'];
  const irregular = input({ view: buildCycleView(starts.map((s, i) => p(s, i === 2 ? 9 : 5)), '2026-07-25', null, {}) });
  const raised = buildInsights(irregular).filter((x) => x.tone === 'raise');
  assert.ok(raised.length >= 2);
  assert.ok(raised.some((x) => /over 35 days/.test(x.title)));
  assert.ok(raised.every((x) => x.body.length > 40));
});

test('bleeding after sex is surfaced as something to tell a clinician', () => {
  const entry: IntimacyEntry = { protection: 'none', observations: ['bleeding_after'], note: '' };
  const i = input({ intimacy: { '2026-10-20': entry, '2026-10-28': entry } });
  const found = find(i, 'bleeding-after-sex')!;
  assert.equal(found.tone, 'raise');
  assert.match(found.title, /2 days/);
  assert.match(found.body, /October 28/);
  assert.match(found.body, /healthcare professional/);
});

test('repeated pain with sex is raised, a single instance is not', () => {
  const pain: IntimacyEntry = { protection: 'condom', observations: ['pain'], note: '' };
  assert.ok(!ids(input({ intimacy: { '2026-10-20': pain } })).includes('pain-with-sex'));
  assert.ok(ids(input({ intimacy: { '2026-10-20': pain, '2026-10-25': pain } })).includes('pain-with-sex'));
});

test('ordinary intercourse logs raise nothing', () => {
  const fine: IntimacyEntry = { protection: 'condom', observations: ['nothing_unusual'], note: '' };
  const raised = buildInsights(input({ intimacy: { '2026-10-20': fine } })).filter((x) => x.tone === 'raise');
  assert.deepEqual(raised, []);
});

test('symptom patterns need a few days of logging first', () => {
  const logs: Record<string, LogKind[]> = { '2026-11-01': ['flow'], '2026-11-02': ['flow', 'mood'] };
  assert.ok(!ids(input({ logs })).includes('logged-most'));
  logs['2026-10-30'] = ['flow'];
  const found = find(input({ logs }), 'logged-most')!;
  assert.match(found.title, /flow most often/);
  assert.match(found.body, /flow 3/);
});

test('no insight reads as a diagnosis or names a medicine', () => {
  const starts = ['2026-01-01', '2026-02-01', '2026-03-09', '2026-04-07', '2026-05-15', '2026-06-17', '2026-07-21'];
  const everything = input({
    view: buildCycleView(starts.map((s, i) => p(s, i === 2 ? 9 : 5)), '2026-07-25', null, {}),
    logs: { '2026-07-21': ['flow'], '2026-07-22': ['flow', 'mood'], '2026-07-23': ['symptoms'] },
    intimacy: { '2026-07-10': { protection: 'none', observations: ['bleeding_after', 'pain'], note: '' }, '2026-07-12': { protection: 'none', observations: ['pain'], note: '' } },
  });
  for (const i of buildInsights(everything)) {
    assert.ok(!/\byou have\b.*\b(pcos|endometriosis|fibroid)/i.test(i.body), i.id);
    assert.ok(!/\b\d+\s?(mg|milligrams|tablets)\b/i.test(i.body), i.id);
  }
  assert.match(NOT_A_DIAGNOSIS, /not a diagnosis/);
  assert.match(NOT_A_DIAGNOSIS, /qualified healthcare professional/);
});

test('every phase gets a readable title', () => {
  const cases: [string, RegExp][] = [
    ['2026-10-25', /day 3 of your period/i],
    ['2026-10-30', /follicular phase/i],
    ['2026-11-02', /fertile window/i],
    ['2026-11-10', /luteal phase/i],
    ['2026-11-30', /later than estimated/i],
  ];
  for (const [today, expected] of cases) {
    const phase = buildInsights(input({ view: buildCycleView(REGULAR, today, null, {}), today }))
      .find((i) => i.id === 'phase')!;
    assert.match(phase.title, expected, `${today} gave "${phase.title}"`);
  }
});

test('an overdue period is phrased as past, not upcoming', () => {
  const late = buildInsights(input({ view: buildCycleView(REGULAR, '2026-11-30', null, {}), today: '2026-11-30' }))
    .find((i) => i.id === 'next-period')!;
  assert.match(late.title, /was expected/);
  assert.ok(!/is estimated in/.test(late.title));
});

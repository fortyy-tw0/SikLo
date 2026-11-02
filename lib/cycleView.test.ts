import { test } from 'node:test';
import assert from 'node:assert/strict';
import { averageCycle, averagePeriod, buildCycleView, variation } from './cycleView';
import type { Period } from './types';

const p = (start: string, days = 5): Period => {
  const end = new Date(new Date(start + 'T00:00:00Z').getTime() + (days - 1) * 86_400_000).toISOString().slice(0, 10);
  return { start_date: start, end_date: end, kind: 'period', end_state: 'ended', flow_level: null };
};
// Starts 28, 29, 28, 28 days apart -> median 28, window 28–29
const REGULAR = ['2026-07-02', '2026-07-30', '2026-08-28', '2026-09-25', '2026-10-23'].map((s) => p(s));

test('no periods -> no view', () => {
  assert.equal(buildCycleView([], '2026-11-02', null), null);
});

test('not enough cycles -> tracking, no dates claimed', () => {
  const v = buildCycleView([p('2026-10-01')], '2026-10-10', null)!;
  assert.equal(v.cycleDay, 10);
  assert.equal(v.phase, 'Tracking');
  assert.equal(v.next, null);
  assert.equal(v.fertile, null);
  assert.equal(v.confidence, null);
});

test('during the period', () => {
  const v = buildCycleView(REGULAR, '2026-10-25', null)!;
  assert.equal(v.cycleDay, 3);
  assert.equal(v.phase, 'Period');
});

test('regular cycles: estimate from the backend engine, fertile window before ovulation', () => {
  const v = buildCycleView(REGULAR, '2026-11-02', null)!;
  assert.equal(v.cycleDay, 11);
  assert.equal(v.length, 28);
  assert.deepEqual(v.next, { likely: '2026-11-20', from: '2026-11-20', to: '2026-11-21' });
  assert.equal(v.ovulationDay, 14);
  assert.deepEqual(v.fertile, [9, 14]);
  assert.equal(v.phase, 'Fertile window');
  assert.equal(v.confidence, 3);
});

test('phases across the cycle', () => {
  assert.equal(buildCycleView(REGULAR, '2026-10-30', null)!.phase, 'Follicular'); // day 8
  assert.equal(buildCycleView(REGULAR, '2026-11-10', null)!.phase, 'Luteal'); // day 19
  assert.equal(buildCycleView(REGULAR, '2026-11-22', null)!.phase, 'Late'); // day 31 > 28
});

test('confirmed ovulation tightens the next period to ±1 day', () => {
  const ov = { cycle_start: '2026-10-23', day: 16, signs: ['lh', 'bbt'] as const };
  const v = buildCycleView(REGULAR, '2026-11-08', { ...ov, signs: [...ov.signs] })!;
  assert.equal(v.length, 30);
  assert.deepEqual(v.next, { likely: '2026-11-22', from: '2026-11-21', to: '2026-11-23' });
  assert.equal(v.ovulationDay, 16);
  assert.equal(v.confidence, 3);
  // one sign -> medium
  assert.equal(buildCycleView(REGULAR, '2026-11-08', { cycle_start: '2026-10-23', day: 16, signs: ['cm'] })!.confidence, 2);
});

test('ovulation confirmed for an earlier cycle is ignored', () => {
  const v = buildCycleView(REGULAR, '2026-11-02', { cycle_start: '2026-09-25', day: 14, signs: ['lh'] })!;
  assert.equal(v.confirmed, null);
  assert.equal(v.next?.likely, '2026-11-20');
});

test('confirming ovulation works before 3 cycles exist', () => {
  const v = buildCycleView([p('2026-10-01')], '2026-10-20', { cycle_start: '2026-10-01', day: 15, signs: ['lh'] })!;
  assert.equal(v.next?.likely, '2026-10-30');
  assert.equal(v.phase, 'Luteal');
});

test('health flags: long cycles, variation, long period; none for regular cycles', () => {
  assert.deepEqual(buildCycleView(REGULAR, '2026-11-02', null)!.flags, []);
  const starts = ['2026-01-01', '2026-02-01', '2026-03-09', '2026-04-07', '2026-05-15', '2026-06-17', '2026-07-21'];
  const irregular = starts.map((s, i) => p(s, i === 2 ? 9 : 5));
  const v = buildCycleView(irregular, '2026-07-25', null)!;
  const titles = v.flags.map((f) => f.title);
  assert.deepEqual(v.cycles, [31, 36, 29, 38, 33, 34]);
  assert.ok(titles.includes('2 of your last 6 cycles were over 35 days'));
  assert.ok(titles.includes('Your cycle length varies by 9 days'));
  assert.ok(titles.includes('A period lasted more than 7 days'));
  assert.ok(v.flags.every((f) => f.key.endsWith('@2026-07-21')));
});

test('a long gap is excluded from trends and flagged as missing data', () => {
  const v = buildCycleView(['2026-01-01', '2026-01-29', '2026-06-06', '2026-07-04', '2026-08-01'].map((s) => p(s)), '2026-08-05', null)!;
  assert.deepEqual(v.cycles, [28, 28, 28]);
  assert.ok(v.flags.some((f) => f.title === 'Some period dates may be missing'));
});

test('trend numbers', () => {
  const v = buildCycleView(REGULAR, '2026-11-02', null)!;
  assert.equal(averageCycle(v), 28);
  assert.equal(averagePeriod(v), 5);
  assert.equal(variation(v), 1);
});

test('spotting and future-dated periods do not move the current cycle', () => {
  const extra: Period[] = [{ ...p('2026-10-28', 1), kind: 'spotting' }, p('2026-12-01')];
  const v = buildCycleView([...REGULAR, ...extra], '2026-11-02', null)!;
  assert.equal(v.cycleStart, '2026-10-23');
});

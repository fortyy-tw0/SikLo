// Same cases as siklo-backend-ts/tests/prediction.test.ts, run through the
// web prototype's predict() wrapper.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flagMessages, predict, startsNeeded } from './cycle';
import type { Period } from './types';

const SPEC = ['2025-04-24', '2025-05-21', '2025-06-21', '2025-07-27', '2025-08-25', '2025-09-28'];

function periods(starts: string[], duration = 5, ongoingLast = false): Period[] {
  return starts.map((s, i) => {
    const end = ongoingLast && i === starts.length - 1
      ? null
      : new Date(new Date(s + 'T00:00:00Z').getTime() + (duration - 1) * 86_400_000).toISOString().slice(0, 10);
    return { start_date: s, end_date: end, kind: 'period', end_state: end ? 'ended' : 'ongoing', flow_level: null };
  });
}

test('spec example: window Oct 25 – Nov 3, low confidence', () => {
  const r = predict(periods(SPEC));
  assert.equal(r.status, 'ok');
  assert.equal(r.median_cycle_len, 31);
  assert.deepEqual(r.window, ['2025-10-25', '2025-11-03']);
  assert.equal(r.estimate, '2025-10-29');
  assert.equal(r.confidence, 'low');
  assert.ok(r.flags.includes('high_variability'));
  assert.equal(r.expected_duration, 5);
});

test('1 interval → not enough information, no fabricated estimate', () => {
  const r = predict(periods(['2025-01-01', '2025-01-29']));
  assert.equal(r.status, 'not_enough_information');
  assert.equal(r.estimate, null);
  assert.equal(r.window, null);
  assert.equal(r.confidence, null);
});

test('2 intervals → still not enough information', () => {
  assert.equal(predict(periods(['2025-01-01', '2025-01-29', '2025-02-26'])).estimate, null);
});

test('no periods → not enough information', () => {
  assert.equal(predict([]).status, 'not_enough_information');
});

test('exactly 3 valid intervals → prediction appears', () => {
  const r = predict(periods(['2025-01-01', '2025-01-29', '2025-02-26', '2025-03-26']));
  assert.equal(r.status, 'ok');
  assert.equal(r.estimate, '2025-04-23');
  assert.equal(r.confidence, 'high');
});

test('regular cycles → high confidence, no flags', () => {
  const r = predict(periods(['2025-01-01', '2025-01-29', '2025-02-26', '2025-03-26', '2025-04-23']));
  assert.equal(r.confidence, 'high');
  assert.deepEqual(r.flags, []);
});

test('128-day gap excluded + missing_data flag', () => {
  const r = predict(periods(['2025-01-01', '2025-01-29', '2025-06-06', '2025-07-04', '2025-08-01']));
  assert.equal(r.status, 'ok');
  assert.ok(r.flags.includes('missing_data'));
  assert.equal(r.median_cycle_len, 28);
});

test('sudden change flagged', () => {
  const r = predict(periods(['2025-01-01', '2025-01-29', '2025-02-26', '2025-03-26', '2025-04-23', '2025-06-07']));
  assert.ok(r.flags.includes('change_detected'));
});

test('ongoing period excluded from duration', () => {
  const r = predict(periods(SPEC, 5, true));
  assert.equal(r.expected_duration, 5);
  assert.equal(r.estimate, '2025-10-29');
});

test('flag messages never diagnose', () => {
  const text = flagMessages(['high_variability', 'change_detected', 'missing_data']).map((m) => m.message).join(' ');
  assert.ok(text.includes('cannot determine'));
  assert.ok(!text.includes('%'));
});

test('spotting never feeds predictions', () => {
  const p = periods(['2025-01-01', '2025-01-29', '2025-02-26', '2025-03-26']);
  p.push({ start_date: '2025-02-10', end_date: '2025-02-10', kind: 'spotting', end_state: 'ended', flow_level: null });
  assert.equal(predict(p).estimate, '2025-04-23');
});

test('start dates needed for an estimate', () => {
  assert.equal(startsNeeded([], predict([])), 4);
  const one = periods(['2025-01-01']);
  assert.equal(startsNeeded(one, predict(one)), 3);
  const three = periods(['2025-01-01', '2025-01-29', '2025-02-26']);
  assert.equal(startsNeeded(three, predict(three)), 1);
});

test('a period saved without a kind still counts', () => {
  const p = periods(['2025-01-01']).map(({ kind: _kind, ...rest }) => rest) as unknown as Period[];
  assert.equal(startsNeeded(p, predict(p)), 3);
});

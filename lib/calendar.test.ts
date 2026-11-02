import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimatedDays, monthGrid, monthRange, recordedPeriodDays, type CalendarInput } from './calendar';
import { buildCycleView } from './cycleView';
import type { Period } from './types';

const p = (start: string, days = 5): Period => ({
  start_date: start,
  end_date: new Date(new Date(start + 'T00:00:00Z').getTime() + (days - 1) * 86_400_000).toISOString().slice(0, 10),
  kind: 'period', end_state: 'ended', flow_level: null,
});
const REGULAR = ['2026-07-02', '2026-07-30', '2026-08-28', '2026-09-25', '2026-10-23'].map((s) => p(s));
const input = (over: Partial<CalendarInput> = {}): CalendarInput => ({
  periods: REGULAR,
  view: buildCycleView(REGULAR, '2026-11-02', null, {}),
  logs: {}, intimacy: {}, today: '2026-11-02', ...over,
});

test('a recorded period fills every day from start to end', () => {
  const days = recordedPeriodDays([p('2026-10-23')]);
  assert.deepEqual([...days.keys()], ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
  assert.equal(days.get('2026-10-23')!.start, true);
  assert.equal(days.get('2026-10-25')!.start, false);
});

test('a period with no end date counts as one day, and spotting is kept separate', () => {
  const open: Period = { start_date: '2026-10-23', end_date: null, kind: 'period', end_state: 'ongoing', flow_level: null };
  assert.equal(recordedPeriodDays([open]).size, 1);
  const spot: Period = { ...open, kind: 'spotting' };
  assert.equal(recordedPeriodDays([spot]).get('2026-10-23')!.spotting, true);
});

test('estimates cover the predicted period, fertile window and ovulation', () => {
  const est = estimatedDays(input().view);
  assert.ok(est.predicted.has('2026-11-20'));
  assert.ok(est.predicted.has('2026-11-21'));
  assert.equal(est.ovulation, '2026-11-05');
  assert.ok(est.fertile.has('2026-11-05') && est.fertile.has('2026-10-31'));
  assert.ok(est.follicular.has('2026-10-29'));
  assert.ok(!est.follicular.has('2026-11-05'), 'fertile days are not also follicular');
});

test('nothing is estimated before three cycles, or when estimates are off', () => {
  const few = buildCycleView([p('2026-10-23')], '2026-11-02', null, {});
  const none = estimatedDays(few);
  assert.equal(none.predicted.size, 0);
  assert.equal(none.fertile.size, 0);
  assert.equal(none.ovulation, null);

  const off = buildCycleView(REGULAR, '2026-11-02', null, { estimate: false });
  assert.equal(estimatedDays(off).predicted.size, 0);
  assert.equal(estimatedDays(null).fertile.size, 0);
});

test('the grid is whole weeks starting on Sunday, with the right day count', () => {
  const g = monthGrid(2026, 10, input()); // November 2026
  assert.equal(g.label, 'November 2026');
  assert.equal(g.cells.length % 7, 0);
  assert.equal(g.cells.filter((c) => c.inMonth).length, 30);
  assert.equal(g.cells[0].date, '2026-11-01'); // 1 Nov 2026 is a Sunday, so no padding
  const dec = monthGrid(2026, 11, input());
  assert.equal(dec.cells.filter((c) => !c.inMonth && dec.cells.indexOf(c) < 7).length, 2); // 1 Dec is a Tuesday
});

test('recorded days and estimated days never overlap on the same date', () => {
  const g = monthGrid(2026, 9, input()); // October, holds a real period
  const start = g.cells.find((c) => c.date === '2026-10-23')!;
  assert.equal(start.period, true);
  assert.equal(start.periodStart, true);
  assert.equal(start.predictedPeriod, false);
  for (const c of g.cells) {
    assert.ok(!(c.period && (c.predictedPeriod || c.fertile || c.follicular)), `${c.date} is both recorded and estimated`);
  }
});

test('today, and days that have not happened yet, are marked', () => {
  const g = monthGrid(2026, 10, input());
  assert.equal(g.cells.find((c) => c.date === '2026-11-02')!.isToday, true);
  assert.equal(g.cells.find((c) => c.date === '2026-11-02')!.future, false);
  assert.equal(g.cells.find((c) => c.date === '2026-11-03')!.future, true);
});

test('logs and intercourse entries land on their dates', () => {
  const g = monthGrid(2026, 10, input({
    logs: { '2026-11-02': ['flow', 'mood'] },
    intimacy: { '2026-11-01': { protection: 'condom', observations: ['nothing_unusual'], note: '' } },
  }));
  assert.deepEqual(g.cells.find((c) => c.date === '2026-11-02')!.logs, ['flow', 'mood']);
  assert.equal(g.cells.find((c) => c.date === '2026-11-01')!.intimacy!.protection, 'condom');
  assert.equal(g.cells.find((c) => c.date === '2026-11-03')!.intimacy, null);
});

test('the browsable range covers the first record through the estimate', () => {
  const r = monthRange(input());
  assert.deepEqual(r.first, [2026, 6]); // July 2026
  assert.ok(r.last[0] === 2026 && r.last[1] >= 10);
});

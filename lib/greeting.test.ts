import { test } from 'node:test';
import assert from 'node:assert/strict';
import { greetingsFor, pickGreeting, withName } from './greeting';

test('time-of-day greetings only at the right time', () => {
  const morning = greetingsFor(8).map((g) => g.text);
  assert.ok(morning.includes('Good morning') && morning.includes('Magandang umaga'));
  assert.ok(!morning.includes('Good evening') && !morning.includes('Good afternoon'));
  const night = greetingsFor(21).map((g) => g.text);
  assert.ok(night.includes('Good evening') && !night.includes('Good morning'));
  const lateNight = greetingsFor(2).map((g) => g.text);
  assert.ok(!lateNight.some((t) => t.startsWith('Good ') && t !== 'Good to see you'));
});

test('every greeting can come up', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 100; i++) seen.add(pickGreeting(9, i / 100, null));
  assert.deepEqual([...seen].sort(), greetingsFor(9).map((g) => g.text).sort());
});

test('never the same greeting twice in a row', () => {
  for (let i = 0; i < 100; i++) {
    const r = i / 100;
    const first = pickGreeting(14, r, null);
    assert.notEqual(pickGreeting(14, r, first), first);
  }
});

test('random value of exactly 1 still gives a greeting', () => {
  assert.ok(pickGreeting(14, 1, null));
});

test('with and without a name', () => {
  assert.equal(withName('Kumusta', 'Agatha'), 'Kumusta, Agatha');
  assert.equal(withName('Hello', ''), 'Hello');
});

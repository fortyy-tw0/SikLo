import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchWake } from './voice';

test('the wake phrase is recognised with the question attached', () => {
  assert.equal(matchWake('Hey SikLo, when is my next period?'), 'when is my next period');
  assert.equal(matchWake('hey siklo why do i get cramps'), 'why do i get cramps');
  assert.equal(matchWake('Hi SikLo. What is ovulation?'), 'what is ovulation');
});

test('the wake phrase on its own returns an empty question, not null', () => {
  assert.equal(matchWake('Hey SikLo'), '');
  assert.equal(matchWake('hey siklo.'), '');
});

test('common mishearings still wake it', () => {
  for (const heard of ['hey sik lo', 'hey cycle', 'hey seek low', 'ok siklo', 'hoy siklo']) {
    assert.notEqual(matchWake(heard), null, heard);
  }
});

test('ordinary speech does not wake it', () => {
  for (const heard of ['what is the weather', 'i was telling her about siklo yesterday', 'my cycle is irregular']) {
    assert.equal(matchWake(heard), null, heard);
  }
});

test('the phrase must start the sentence, not appear buried in it', () => {
  assert.equal(matchWake('so anyway as I was saying hey siklo'), null);
  assert.notEqual(matchWake('um, hey siklo'), null);
});

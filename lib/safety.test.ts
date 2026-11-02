import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIXED_REPLIES, HOTLINES, isCrisis, safetyCheck } from './safety';

test('self-harm wording in English and Filipino is caught first', () => {
  for (const q of ['i want to die', 'thinking about suicide', 'gusto ko nang mamatay', 'ayoko nang mabuhay', 'I keep hurting myself']) {
    assert.equal(safetyCheck(q), 'self_harm', q);
  }
  assert.ok(isCrisis('self_harm'));
});

test('emergencies are caught', () => {
  for (const q of ['i fainted this morning', 'soaking a pad every hour', 'sobrang dugo', 'severe pain']) {
    assert.equal(safetyCheck(q), 'emergency', q);
  }
});

test('pregnancy, missed pill and out-of-scope questions get fixed replies', () => {
  assert.equal(safetyCheck('am i pregnant'), 'pregnancy');
  assert.equal(safetyCheck('buntis ba ako'), 'pregnancy');
  assert.equal(safetyCheck('i missed my pill yesterday'), 'missed_pill');
  assert.equal(safetyCheck('which are my safe days'), 'out_of_scope');
  assert.equal(safetyCheck('do i have pcos'), 'out_of_scope');
  assert.equal(safetyCheck('how many mg should i take'), 'out_of_scope');
});

test('ordinary questions pass through', () => {
  for (const q of ['why do i get cramps', 'when is my next period', 'what is ovulation', 'kailan ang next period ko']) {
    assert.equal(safetyCheck(q), null, q);
  }
});

test('no reply claims to diagnose or gives a dose', () => {
  for (const reply of Object.values(FIXED_REPLIES)) {
    assert.ok(!/\b\d+\s?(mg|milligrams|tablets)\b/i.test(reply), reply);
  }
  assert.ok(FIXED_REPLIES.out_of_scope.includes('healthcare'));
});

test('crisis replies carry a working-format hotline and 911', () => {
  assert.ok(FIXED_REPLIES.self_harm.includes('1553'));
  assert.ok(FIXED_REPLIES.emergency.includes('911'));
  assert.ok(HOTLINES.every((h) => h.numbers.length > 0 && h.note));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answerQuestion, MEDICAL_NOTE, retrieve, SUGGESTIONS } from './assistant';
import { buildCycleView } from './cycleView';
import { ARTICLES } from './library/articles';
import type { Period } from './types';

const p = (start: string, days = 5): Period => ({
  start_date: start,
  end_date: new Date(new Date(start + 'T00:00:00Z').getTime() + (days - 1) * 86_400_000).toISOString().slice(0, 10),
  kind: 'period', end_state: 'ended', flow_level: null,
});
const REGULAR = ['2026-07-02', '2026-07-30', '2026-08-28', '2026-09-25', '2026-10-23'].map((s) => p(s));
const view = (today = '2026-11-02', periods = REGULAR, opts = {}) => buildCycleView(periods, today, null, opts)!;

test('library is well formed and review-flagged', () => {
  assert.ok(ARTICLES.length >= 80, `only ${ARTICLES.length} topics`);
  const ids = ARTICLES.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate topic ids');
  for (const a of ARTICLES) {
    assert.ok(a.title && a.keywords.trim() && a.text.length > 80, a.id);
    assert.ok(!/\b\d+\s?(mg|milligrams|tablets|capsules)\b/i.test(a.text), `${a.id} mentions a dose`);
    assert.ok(!/\bsafe days?\b/i.test(a.text) || /not a safe period|not a reliable|cannot/i.test(a.text), `${a.id} may imply safe days`);
  }
});

test('retrieval finds the right topic from everyday wording', () => {
  const cases: [string, string][] = [
    ['why do i get cramps', 'cramps'],
    ['what is ovulation', 'ovulation'],
    ['my discharge is stretchy and clear', 'cervical-mucus'],
    ['i have been bleeding for 9 days', 'heavy-bleeding'],
    ['masakit ang puson ko', 'cramps'],
    ['when should i see a doctor', 'when-to-see-doctor'],
    ['can i swim on my period', 'swimming-sports'],
    ['what is pcos', 'pcos'],
    ['is it normal to feel sad before my period', 'mood-changes'],
    ['how do i prepare for a check up', 'doctor-visit-prep'],
  ];
  for (const [q, expected] of cases) {
    const ids = retrieve(q, 3).map((s) => s.article.id);
    assert.ok(ids.includes(expected), `"${q}" gave ${JSON.stringify(ids)}, wanted ${expected}`);
  }
});

test('safety comes before everything else', () => {
  const a = answerQuestion('i want to die', { view: view() });
  assert.equal(a.kind, 'safety');
  assert.equal(a.crisis, true);
  assert.equal(a.showMedicalNote, false); // a disclaimer would be wrong here
  assert.ok(a.text.includes('1553'));

  const scope = answerQuestion('what are my safe days', { view: view() });
  assert.equal(scope.kind, 'safety');
  assert.equal(scope.crisis, false);
});

test('questions about her own cycle are answered from her log', () => {
  const next = answerQuestion('when is my next period?', { view: view() });
  assert.equal(next.kind, 'cycle');
  assert.ok(next.text.includes('November 20'), next.text);

  assert.ok(answerQuestion('what cycle day am i on', { view: view() }).text.includes('day 11'));
  assert.ok(answerQuestion('how long are my cycles', { view: view() }).text.includes('28 days'));
  assert.ok(answerQuestion('when did my last period start', { view: view() }).text.includes('October 23'));
  assert.ok(answerQuestion('how long do my periods last', { view: view() }).text.includes('5 days'));
});

test('fertile window answers say plainly that it is not birth control', () => {
  const a = answerQuestion('when am i most fertile', { view: view() });
  assert.equal(a.kind, 'cycle');
  assert.match(a.text, /not a method of birth control/);
});

test('late question compares against the estimate, and keeps pregnancy honest', () => {
  const onTime = answerQuestion('am i late', { view: view() });
  assert.match(onTime.text, /not late/);
  const late = answerQuestion('am i late', { view: view('2026-11-30') });
  assert.match(late.text, /later than that estimate/);
  assert.match(late.text, /test is the only way/);
});

test('without saved dates it says so instead of guessing', () => {
  const a = answerQuestion('when is my next period?');
  assert.equal(a.kind, 'cycle');
  assert.match(a.text, /do not have any period dates/);
});

test('before three cycles it explains the wait rather than estimating', () => {
  const a = answerQuestion('when is my next period?', { view: view('2026-10-28', [p('2026-10-23')]) });
  assert.match(a.text, /three complete cycles/);
  assert.ok(!/November/.test(a.text));
});

test('estimates turned off are respected', () => {
  const off = view('2026-11-02', REGULAR, { estimate: false });
  assert.match(answerQuestion('when is my next period?', { view: off }).text, /turned off/);
  assert.match(answerQuestion('when am i fertile?', { view: off }).text, /turned off/);
});

test('an unknown question admits it', () => {
  const a = answerQuestion('what is the capital of france', { view: view() });
  assert.equal(a.kind, 'unknown');
  assert.match(a.text, /not sure/);
});

test('every non-crisis answer carries the medical reminder', () => {
  const questions = ['why do i get cramps', 'when is my next period', 'what is the capital of france', 'am i pregnant', 'what are my safe days'];
  for (const q of questions) {
    assert.equal(answerQuestion(q, { view: view() }).showMedicalNote, true, q);
  }
  assert.match(MEDICAL_NOTE, /not a healthcare professional/);
});

test('suggested questions all produce a real answer', () => {
  for (const q of SUGGESTIONS) {
    const a = answerQuestion(q, { view: view() });
    assert.notEqual(a.kind, 'unknown', q);
    assert.ok(a.text.length > 40, q);
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chooseModel, deviceCanRunModel, downloadWithoutAsking, FULL_AI, generate, loadModel,
  modelStatus, sizeInB, usableRewrite, wholeSentences,
} from './localModel';

test('picks the smallest small instruction model available', () => {
  const list = [
    { model_id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC', vram_required_MB: 5000 },
    { model_id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', vram_required_MB: 1600 },
    { model_id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', vram_required_MB: 900 },
    { model_id: 'snowflake-arctic-embed-m-q0f32-MLC-b4', vram_required_MB: 300 },
  ];
  assert.equal(chooseModel(list), 'Llama-3.2-1B-Instruct-q4f16_1-MLC');
});

test('large models are never chosen even when listed alone first', () => {
  const picked = chooseModel([
    { model_id: 'Llama-3.1-70B-Instruct-q4f16_1-MLC', vram_required_MB: 40000 },
    { model_id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', vram_required_MB: 1600 },
  ]);
  assert.equal(picked, 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC');
});

test('models too small to follow an instruction are not used at all', () => {
  // They repeat the instruction back instead of answering; the library is better
  const picked = chooseModel([
    { model_id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', vram_required_MB: 500 },
    { model_id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', vram_required_MB: 376 },
  ]);
  assert.equal(picked, null);
});

test('the size in a model name is read correctly', () => {
  assert.equal(sizeInB('Llama-3.2-1B-Instruct-q4f16_1-MLC'), 1);
  assert.equal(sizeInB('Qwen2.5-1.5B-Instruct-q4f16_1-MLC'), 1.5);
  assert.equal(sizeInB('Qwen2.5-0.5B-Instruct-q4f16_1-MLC'), 0.5);
  assert.equal(sizeInB('SmolLM2-360M-Instruct-q4f16_1-MLC'), 0.36);
  assert.equal(sizeInB('gemma-2-2b-it-q4f16_1-MLC'), 2);
});

test('a rewrite that talks about the task instead of doing it is dropped', () => {
  const draft = 'Cramps are a dull pain in the lower belly, often starting just before a period and easing after a day or two.';
  // What a model too small for the job actually produced
  assert.equal(usableRewrite('You are correct that you are not sure and suggest seeing a healthcare professional.', draft), false);
  assert.equal(usableRewrite('Here is the rewritten answer: cramps are common and usually ease within a day or two of the period starting.', draft), false);
  assert.equal(usableRewrite('The draft says cramps are normal.', draft), false);
  assert.equal(usableRewrite('Short.', draft), false);
  assert.equal(usableRewrite(undefined, draft), false);
});

test('a rewrite is dropped when it breaks the rules the library is held to', () => {
  const draft = 'Cramps are a dull pain in the lower belly, often starting just before a period and easing after a day or two.';
  assert.equal(usableRewrite('Cramps are common. Taking 400 mg of an anti-inflammatory helps many people feel better within an hour.', draft), false);
  assert.equal(usableRewrite('Pain like this means you probably have endometriosis, which is worth having looked at by a doctor soon.', draft), false);
  assert.equal(usableRewrite('These are your safe days, so pregnancy is not possible for about a week after the period ends.', draft), false);
});

test('a reply cut off mid-sentence keeps only what finished', () => {
  assert.equal(
    wholeSentences('Cramps are common and usually ease within a day or two. Heat often helps, and gentle mo'),
    'Cramps are common and usually ease within a day or two.');
  assert.equal(wholeSentences('Cramps are common and usually ease within a day or two.'),
    'Cramps are common and usually ease within a day or two.');
  assert.equal(wholeSentences('No finished sentence here'), undefined);
  assert.equal(wholeSentences(undefined), undefined);
});

test('a plain, faithful rewrite is kept', () => {
  const draft = 'Cramps are a dull pain in the lower belly, often starting just before a period and easing after a day or two.';
  const good = 'Cramps are that dull ache low in your belly. They often turn up just before your period and settle again after a day or two.';
  assert.equal(usableRewrite(good, draft), true);
});

test('an empty list is handled rather than throwing', () => {
  assert.equal(chooseModel([]), null);
});

test('the model starts out not loaded, so the article engine answers', () => {
  assert.equal(modelStatus(), 'not-loaded');
});

test('the full AI is off, so nothing tries to download or generate', async () => {
  assert.equal(FULL_AI, false);
  assert.equal(deviceCanRunModel(), false);
  assert.equal(await loadModel(), false);
  assert.equal(await generate('why do I get cramps', 'Cramps are common.', []), null);
});

test('a large download is never started unasked on metered or slow connections', () => {
  // No WebGPU in this environment, so every case must be false anyway
  assert.equal(downloadWithoutAsking({ saveData: true, effectiveType: '4g' }), false);
  assert.equal(downloadWithoutAsking({ type: 'cellular', effectiveType: '4g' }), false);
  assert.equal(downloadWithoutAsking({ effectiveType: '2g' }), false);
  assert.equal(downloadWithoutAsking({ effectiveType: '3g' }), false);
  assert.equal(downloadWithoutAsking(undefined), false);
});

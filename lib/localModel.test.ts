import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseModel, downloadWithoutAsking, modelStatus } from './localModel';

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
    { model_id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', vram_required_MB: 500 },
  ]);
  assert.equal(picked, 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC');
});

test('an empty list is handled rather than throwing', () => {
  assert.equal(chooseModel([]), null);
});

test('the model starts out not loaded, so the article engine answers', () => {
  assert.equal(modelStatus(), 'not-loaded');
});

test('a large download is never started unasked on metered or slow connections', () => {
  // No WebGPU in this environment, so every case must be false anyway
  assert.equal(downloadWithoutAsking({ saveData: true, effectiveType: '4g' }), false);
  assert.equal(downloadWithoutAsking({ type: 'cellular', effectiveType: '4g' }), false);
  assert.equal(downloadWithoutAsking({ effectiveType: '2g' }), false);
  assert.equal(downloadWithoutAsking({ effectiveType: '3g' }), false);
  assert.equal(downloadWithoutAsking(undefined), false);
});

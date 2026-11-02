import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zoomFor } from '../src/lib/zoom';

test('phones fill the width', () => {
  assert.equal(zoomFor(390, 844), 1);
  assert.equal(Number(zoomFor(360, 780).toFixed(3)), 0.923);
  assert.equal(Number(zoomFor(430, 932).toFixed(3)), 1.103);
});

test('desktops fill the height, never below 1:1 or above 1.6', () => {
  assert.equal(Number(zoomFor(1911, 938).toFixed(3)), 1.111);
  assert.equal(zoomFor(1366, 657), 1);
  assert.equal(zoomFor(2560, 1600), 1.6);
});

test('phone in landscape is not shrunk', () => {
  assert.equal(zoomFor(844, 390), 1);
});

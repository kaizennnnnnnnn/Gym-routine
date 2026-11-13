import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTime, secondsUntil } from './timer';

test('countdown rounds upward until the full second has elapsed', () => {
  assert.equal(secondsUntil(90_000, 0), 90);
  assert.equal(secondsUntil(90_000, 89_001), 1);
  assert.equal(secondsUntil(90_000, 89_999), 1);
  assert.equal(secondsUntil(90_000, 90_000), 0);
});

test('a delayed background tick catches up to the wall clock', () => {
  const deadline = 1_000 + 90_000;
  assert.equal(secondsUntil(deadline, 46_000), 45);
  assert.equal(secondsUntil(deadline, 121_000), 0);
});

test('time formatting pads minutes and seconds and clamps bad values', () => {
  assert.equal(formatTime(90), '01:30');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(0.1), '00:01');
  assert.equal(formatTime(3600), '60:00');
  assert.equal(formatTime(-10), '00:00');
  assert.equal(formatTime(Number.NaN), '00:00');
  assert.equal(formatTime(Number.POSITIVE_INFINITY), '00:00');
});

test('invalid deadlines never produce a corrupt countdown', () => {
  assert.equal(secondsUntil(Number.NaN, 0), 0);
  assert.equal(secondsUntil(10, Number.POSITIVE_INFINITY), 0);
});

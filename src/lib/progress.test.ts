import assert from 'node:assert/strict';
import test from 'node:test';
import { weekPlan } from '../data/routine';
import { countCompletedSets, countTotalSets, getStorageKey, getWeekKey, sanitizeProgress, toggleSet } from './progress';

test('week keys use local calendar weeks across Sunday, year boundaries and leap days', () => {
  assert.equal(getWeekKey(new Date(2026, 10, 9, 0, 1)), '2026-11-09');
  assert.equal(getWeekKey(new Date(2026, 10, 15, 23, 59)), '2026-11-09');
  assert.equal(getWeekKey(new Date(2026, 10, 16, 0, 1)), '2026-11-16');
  assert.equal(getWeekKey(new Date(2027, 0, 1)), '2026-12-28');
  assert.equal(getWeekKey(new Date(2024, 1, 29)), '2024-02-26');
  assert.equal(getStorageKey(new Date(2026, 10, 13)), 'gym-routine:progress:v1:2026-11-09');
  assert.throws(() => getWeekKey(new Date('invalid')), RangeError);
});

test('bad persisted data becomes an empty completion state', () => {
  for (const input of [null, undefined, 'broken JSON', [], 1, true, { monday: null }, { monday: [] }]) {
    const progress = sanitizeProgress(input, weekPlan);
    assert.equal(weekPlan.reduce((count, day) => count + countCompletedSets(day, progress), 0), 0);
    assert.equal(Object.keys(progress).length, 4);
  }
});

test('sanitizing removes stale exercises, rest days, extra sets and truthy non-booleans', () => {
  const progress = sanitizeProgress({
    monday: { 'bench-press': [true, 1, 'true', true], removed: [true] },
    wednesday: { 'bench-press': [true] },
    removedDay: { removed: [true] },
  }, weekPlan);
  assert.deepEqual(progress.monday['bench-press'], [true, false, false]);
  assert.equal(Object.hasOwn(progress.monday, 'removed'), false);
  assert.equal(Object.hasOwn(progress, 'wednesday'), false);
  assert.equal(Object.hasOwn(progress, 'removedDay'), false);
  assert.equal(countCompletedSets(weekPlan[0], progress), 1);
});

test('inherited completion properties are never accepted from storage', () => {
  const inherited = Object.create({ monday: { 'bench-press': [true, true, true] } });
  assert.equal(countCompletedSets(weekPlan[0], sanitizeProgress(inherited, weekPlan)), 0);
});

test('reused exercises retain independent progress for each day and toggles are immutable', () => {
  const tuesday = weekPlan[1];
  const friday = weekPlan[4];
  const original = sanitizeProgress({}, weekPlan);
  const first = toggleSet(original, tuesday, 'romanian-deadlift', 0);
  assert.equal(countCompletedSets(tuesday, original), 0);
  assert.equal(countCompletedSets(tuesday, first), 1);
  assert.equal(countCompletedSets(friday, first), 0);
  const second = toggleSet(first, friday, 'romanian-deadlift', 1);
  assert.equal(countCompletedSets(tuesday, second), 1);
  assert.equal(countCompletedSets(friday, second), 1);
  assert.equal(countTotalSets(tuesday), 12);
  assert.equal(countTotalSets(weekPlan[2]), 0);
  assert.equal(countCompletedSets(tuesday, toggleSet(second, tuesday, 'romanian-deadlift', 0)), 0);
});

test('invalid set positions, exercises and rest days leave state intact', () => {
  const progress = sanitizeProgress({}, weekPlan);
  for (const index of [-1, 3, 0.5, NaN]) {
    assert.equal(toggleSet(progress, weekPlan[0], 'bench-press', index), progress);
  }
  assert.equal(toggleSet(progress, weekPlan[0], 'removed', 0), progress);
  assert.equal(toggleSet(progress, weekPlan[2], 'bench-press', 0), progress);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { routineMeta } from '../data/routine';
import type { DayPlan, Exercise } from '../data/routine';
import { countCompletedSets, countTotalSets, getStorageKey, getWeekKey, sanitizeProgress, toggleSet } from './progress';

// Exercise content changes independently of the behavior these helpers guarantee.
const sharedExercise: Exercise = {
  id: 'shared-exercise', name: 'Shared exercise', muscleGroup: 'Example', equipment: 'Machine',
  sets: 2, reps: '8–10', restSeconds: 60, notes: '',
};
const extraExercise: Exercise = { ...sharedExercise, id: 'extra-exercise', name: 'Extra exercise', sets: 3 };
const fixtureDays: DayPlan[] = [
  { id: 'monday', label: 'Monday', shortLabel: 'Mon', shortTitle: 'Example', type: 'workout', title: 'Example workout', focus: 'Example', durationMinutes: null, exercises: [sharedExercise, extraExercise], notes: [] },
  { id: 'wednesday', label: 'Wednesday', shortLabel: 'Wed', shortTitle: 'Rest', type: 'rest', title: 'Rest day', focus: 'Rest', durationMinutes: 0, exercises: [], notes: [] },
  { id: 'friday', label: 'Friday', shortLabel: 'Fri', shortTitle: 'Example', type: 'workout', title: 'Example workout', focus: 'Example', durationMinutes: null, exercises: [sharedExercise], notes: [] },
];
const [monday, restDay, friday] = fixtureDays;

test('week keys use local calendar weeks across Sunday, year boundaries and leap days', () => {
  assert.equal(getWeekKey(new Date(2026, 10, 9, 0, 1)), '2026-11-09');
  assert.equal(getWeekKey(new Date(2026, 10, 15, 23, 59)), '2026-11-09');
  assert.equal(getWeekKey(new Date(2026, 10, 16, 0, 1)), '2026-11-16');
  assert.equal(getWeekKey(new Date(2027, 0, 1)), '2026-12-28');
  assert.equal(getWeekKey(new Date(2024, 1, 29)), '2024-02-26');
  assert.equal(getStorageKey(new Date(2026, 10, 13)), `gym-routine:progress:${routineMeta.progressVersion}:2026-11-09`);
  assert.throws(() => getWeekKey(new Date('invalid')), RangeError);
});

test('bad persisted data becomes an empty completion state', () => {
  for (const input of [null, undefined, 'broken JSON', [], 1, true, { monday: null }, { monday: [] }]) {
    const progress = sanitizeProgress(input, fixtureDays);
    assert.equal(fixtureDays.reduce((count, day) => count + countCompletedSets(day, progress), 0), 0);
    assert.deepEqual(Object.keys(progress), ['monday', 'friday']);
  }
});

test('sanitizing removes stale exercises, rest days, extra sets and truthy non-booleans', () => {
  const progress = sanitizeProgress({
    monday: { 'shared-exercise': [true, 1, 'true', true], removed: [true] },
    wednesday: { 'shared-exercise': [true] },
    removedDay: { removed: [true] },
  }, fixtureDays);
  assert.deepEqual(progress.monday['shared-exercise'], [true, false]);
  assert.equal(Object.hasOwn(progress.monday, 'removed'), false);
  assert.equal(Object.hasOwn(progress, 'wednesday'), false);
  assert.equal(Object.hasOwn(progress, 'removedDay'), false);
  assert.equal(countCompletedSets(monday, progress), 1);
});

test('inherited completion properties are never accepted from storage', () => {
  const inheritedDay = Object.create({ monday: { 'shared-exercise': [true, true] } });
  const inheritedExercise = { monday: Object.create({ 'shared-exercise': [true, true] }) };
  assert.equal(countCompletedSets(monday, sanitizeProgress(inheritedDay, fixtureDays)), 0);
  assert.equal(countCompletedSets(monday, sanitizeProgress(inheritedExercise, fixtureDays)), 0);
});

test('reused exercises retain independent progress for each day and toggles are immutable', () => {
  const original = sanitizeProgress({}, fixtureDays);
  const first = toggleSet(original, monday, sharedExercise.id, 0);
  assert.equal(countCompletedSets(monday, original), 0);
  assert.equal(countCompletedSets(monday, first), 1);
  assert.equal(countCompletedSets(friday, first), 0);
  const second = toggleSet(first, friday, sharedExercise.id, 1);
  assert.equal(countCompletedSets(monday, second), 1);
  assert.equal(countCompletedSets(friday, second), 1);
  assert.equal(countCompletedSets(friday, first), 0);
  assert.equal(countTotalSets(monday), 5);
  assert.equal(countTotalSets(friday), 2);
  assert.equal(countTotalSets(restDay), 0);
  assert.equal(countCompletedSets(monday, toggleSet(second, monday, sharedExercise.id, 0)), 0);
});

test('invalid set positions, exercises and rest days leave state intact', () => {
  const progress = sanitizeProgress({}, fixtureDays);
  for (const index of [-1, sharedExercise.sets, 0.5, NaN, Infinity]) {
    assert.equal(toggleSet(progress, monday, sharedExercise.id, index), progress);
  }
  assert.equal(toggleSet(progress, monday, 'removed', 0), progress);
  assert.equal(toggleSet(progress, restDay, sharedExercise.id, 0), progress);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { exerciseLibrary, routineMeta, weekPlan } from './routine';
import type { Exercise } from './routine';
import { countTotalSets } from '../lib/progress';

test('the weekly split follows the confirmed five-workout, two-rest-day schedule', () => {
  assert.deepEqual(weekPlan.map(({ id, type, title }) => ({ id, type, title })), [
    { id: 'monday', type: 'workout', title: 'Chest & triceps' },
    { id: 'tuesday', type: 'workout', title: 'Back & biceps' },
    { id: 'wednesday', type: 'rest', title: 'Rest day' },
    { id: 'thursday', type: 'workout', title: 'Shoulders & forearms' },
    { id: 'friday', type: 'workout', title: 'Biceps & triceps' },
    { id: 'saturday', type: 'workout', title: 'Legs & calves' },
    { id: 'sunday', type: 'rest', title: 'Rest day' },
  ]);
  assert.equal(weekPlan.filter(day => day.type === 'workout').length, 5);
  for (const day of weekPlan.filter(day => day.type === 'rest')) {
    assert.deepEqual(day.exercises, []);
    assert.equal(countTotalSets(day), 0);
  }
  assert.equal(routineMeta.isSample, false);
  assert.equal(routineMeta.hasPlaceholderExercises, true);
});

test('every upper-body day gives each named muscle three exercises and six working sets', () => {
  const expectedMuscles: Record<string, string[]> = {
    monday: ['Chest', 'Triceps'],
    tuesday: ['Back', 'Biceps'],
    thursday: ['Shoulders', 'Forearms'],
    friday: ['Biceps', 'Triceps'],
  };
  for (const [dayId, muscleGroups] of Object.entries(expectedMuscles)) {
    const day = weekPlan.find(item => item.id === dayId);
    assert.ok(day, dayId + ' exists');
    assert.equal(day.exercises.length, 6, dayId + ' has six exercises');
    assert.equal(countTotalSets(day), 12, dayId + ' has twelve working sets');
    assert.ok(day.exercises.every(exercise => exercise.sets === 2), dayId + ' uses two sets per exercise');
    assert.deepEqual([...new Set(day.exercises.map(exercise => exercise.muscleGroup))].sort(), [...muscleGroups].sort());
    for (const muscleGroup of muscleGroups) {
      const exercises: Exercise[] = day.exercises.filter(exercise => exercise.muscleGroup === muscleGroup);
      assert.equal(exercises.length, 3, dayId + ' has three ' + muscleGroup + ' exercises');
      assert.equal(exercises.reduce((sets, exercise) => sets + exercise.sets, 0), 6, dayId + ' gives ' + muscleGroup + ' six sets');
    }
  }
});

test('leg day has five exercises including calves and two working sets each', () => {
  const day = weekPlan.find(item => item.id === 'saturday');
  assert.ok(day);
  assert.equal(day.exercises.length, 5);
  assert.ok(day.exercises.some(exercise => exercise.muscleGroup === 'Calves'));
  assert.ok(day.exercises.every(exercise => exercise.sets === 2));
  assert.equal(countTotalSets(day), 10);
});

test('exercise IDs are unique and every scheduled exercise resolves to the library', () => {
  const ids = exerciseLibrary.map(exercise => exercise.id);
  assert.equal(new Set(ids).size, ids.length);
  const knownIds = new Set(ids);
  for (const day of weekPlan) {
    assert.equal(new Set(day.exercises.map(exercise => exercise?.id)).size, day.exercises.length, day.id + ' has no repeated exercises');
    for (const exercise of day.exercises) {
      assert.ok(exercise, day.id + ' has no unresolved exercise references');
      assert.ok(knownIds.has(exercise.id), exercise.id + ' resolves to a library entry');
    }
  }
});

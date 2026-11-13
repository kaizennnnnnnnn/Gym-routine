import type { DayPlan } from '../data/routine';

export type Progress = Record<string, Record<string, boolean[]>>;

/** Monday's calendar date in the visitor's timezone. Local noon avoids DST edges. */
export function getWeekKey(date = new Date()): string {
  if (!Number.isFinite(date.getTime())) throw new RangeError('A valid date is required.');
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

export function getStorageKey(date = new Date()): string {
  return `gym-routine:progress:v1:${getWeekKey(date)}`;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function ownValue(value: Record<string, unknown>, key: string): unknown {
  return Object.hasOwn(value, key) ? value[key] : undefined;
}

/** Retains only the current routine's sets and literal boolean completion values. */
export function sanitizeProgress(value: unknown, days: DayPlan[]): Progress {
  const source = record(value);
  return Object.fromEntries(days.filter((day) => day.type === 'workout').map((day) => {
    const savedDay = record(ownValue(source, day.id));
    const dayProgress = Object.fromEntries(day.exercises.map((exercise) => {
      const savedSets = ownValue(savedDay, exercise.id);
      const sets = Array.from({ length: exercise.sets }, (_, index) =>
        Array.isArray(savedSets) && savedSets[index] === true,
      );
      return [exercise.id, sets];
    }));
    return [day.id, dayProgress];
  }));
}

export function countTotalSets(day: DayPlan): number {
  return day.exercises.reduce((total, exercise) => total + exercise.sets, 0);
}

export function countCompletedSets(day: DayPlan, progress: Progress): number {
  return day.exercises.reduce((total, exercise) => {
    const sets = progress[day.id]?.[exercise.id];
    return total + Array.from({ length: exercise.sets }, (_, index) =>
      Array.isArray(sets) && sets[index] === true ? 1 : 0,
    ).reduce((sum: number, complete) => sum + complete, 0);
  }, 0);
}

/** Returns a new state while retaining all other days, including reused exercises. */
export function toggleSet(progress: Progress, day: DayPlan, exerciseId: string, setIndex: number): Progress {
  const exercise = day.exercises.find((item) => item.id === exerciseId);
  if (day.type !== 'workout' || !exercise || !Number.isInteger(setIndex) || setIndex < 0 || setIndex >= exercise.sets) {
    return progress;
  }
  const current = progress[day.id]?.[exercise.id];
  const sets = Array.from({ length: exercise.sets }, (_, index) => {
    const complete = Array.isArray(current) && current[index] === true;
    return index === setIndex ? !complete : complete;
  });
  return {
    ...progress,
    [day.id]: { ...progress[day.id], [exercise.id]: sets },
  };
}

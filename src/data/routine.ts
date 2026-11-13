export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  media?: { kind: 'video' | 'image' | 'youtube'; src: string; alt?: string; caption?: string };
};

export type DayPlan = {
  id: string;
  label: string;
  shortLabel: string;
  shortTitle: string;
  type: 'workout' | 'rest';
  title: string;
  focus: string;
  durationMinutes: number | null;
  groupExercisesByMuscle?: boolean;
  exercises: Exercise[];
  notes: string[];
};

export const routineMeta = {
  title: 'The weekly routine',
  description: 'Your weekly split and set counts are confirmed. Exercise choices, rep ranges and rest times are provisional.',
  isSample: false,
  hasPlaceholderExercises: true,
  progressVersion: 'v2',
};

// The owner supplied the schedule and two working sets per exercise.
// Exercise names, reps and rest times below are replaceable placeholders.
// muscleGroup is the primary target used for the six-set count; secondary
// involvement in compound exercises is not counted again.
const placeholderNotes = 'Provisional exercise choice. Rep range and rest time are editable placeholders until the routine owner confirms them.';
const stillCaption = 'Bacon Hair still-image concept. Animation is not added yet.';

function exercise(
  id: string, name: string, muscleGroup: string, equipment: string,
  reps = '8–12', restSeconds = 90, media?: Exercise['media'],
): Exercise {
  return { id, name, muscleGroup, equipment, sets: 2, reps, restSeconds, notes: placeholderNotes, ...(media ? { media } : {}) };
}

export const exerciseLibrary: Exercise[] = [
  exercise('bench-press', 'Bench press', 'Chest', 'Barbell', '8–12', 90, { kind: 'image', src: '/demos/bacon-bench-press.png', alt: 'Roblox Bacon Hair avatar lying on a flat bench holding a barbell above the chest.', caption: stillCaption }),
  exercise('incline-press', 'Incline dumbbell press', 'Chest', 'Dumbbells'),
  exercise('cable-fly', 'Cable chest fly', 'Chest', 'Cable machine', '10–15', 60),

  exercise('triceps-pushdown', 'Triceps pushdown', 'Triceps', 'Cable machine', '10–15', 60, { kind: 'image', src: '/demos/bacon-triceps-pushdown.png', alt: 'Roblox Bacon Hair avatar standing at a high cable machine with the handle lowered toward the thighs.', caption: stillCaption }),
  exercise('overhead-triceps-extension', 'Overhead cable triceps extension', 'Triceps', 'Cable machine', '10–15', 60),
  exercise('lying-triceps-extension', 'Lying dumbbell triceps extension', 'Triceps', 'Dumbbells', '10–15', 60),

  exercise('lat-pulldown', 'Lat pulldown', 'Back', 'Cable machine'),
  exercise('seated-row', 'Seated cable row', 'Back', 'Cable machine', '8–12', 90, { kind: 'image', src: '/demos/bacon-seated-cable-row.png', alt: 'Roblox Bacon Hair avatar seated at a low cable row with both hands holding a close-grip handle near the torso.', caption: stillCaption }),
  exercise('single-arm-row', 'Single-arm dumbbell row', 'Back', 'Dumbbell'),

  exercise('biceps-curl', 'Dumbbell curl', 'Biceps', 'Dumbbells', '8–12', 60),
  exercise('incline-curl', 'Incline dumbbell curl', 'Biceps', 'Dumbbells', '8–12', 60),
  exercise('cable-curl', 'Cable curl', 'Biceps', 'Cable machine', '10–15', 60),

  exercise('shoulder-press', 'Shoulder press', 'Shoulders', 'Dumbbells', '8–12', 90, { kind: 'image', src: '/demos/bacon-shoulder-press.png', alt: 'Roblox Bacon Hair avatar seated upright with a dumbbell raised above each shoulder.', caption: stillCaption }),
  exercise('lateral-raise', 'Lateral raise', 'Shoulders', 'Dumbbells', '10–15', 60),
  exercise('rear-delt-fly', 'Rear delt fly', 'Shoulders', 'Machine', '10–15', 60),

  exercise('wrist-curl', 'Seated wrist curl', 'Forearms', 'Dumbbells', '12–15', 60),
  exercise('reverse-wrist-curl', 'Reverse wrist curl', 'Forearms', 'Dumbbells', '12–15', 60),
  exercise('reverse-curl', 'Reverse barbell curl', 'Forearms', 'Barbell', '10–15', 60),

  exercise('leg-press', 'Leg press', 'Quads', 'Machine', '8–12', 120),
  exercise('romanian-deadlift', 'Romanian deadlift', 'Hamstrings', 'Dumbbells', '8–12', 120),
  exercise('leg-extension', 'Leg extension', 'Quads', 'Machine', '10–15', 60),
  exercise('leg-curl', 'Seated leg curl', 'Hamstrings', 'Machine', '10–15', 60),
  exercise('calf-raise', 'Standing calf raise', 'Calves', 'Machine', '12–15', 60),
];

const byId = new Map(exerciseLibrary.map((item) => [item.id, item]));
function exercises(...ids: string[]): Exercise[] {
  return ids.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error('Unknown exercise ID: ' + id);
    return item;
  });
}

const chest = ['bench-press', 'incline-press', 'cable-fly'];
const triceps = ['triceps-pushdown', 'overhead-triceps-extension', 'lying-triceps-extension'];
const back = ['lat-pulldown', 'seated-row', 'single-arm-row'];
const biceps = ['biceps-curl', 'incline-curl', 'cable-curl'];
const shoulders = ['shoulder-press', 'lateral-raise', 'rear-delt-fly'];
const forearms = ['wrist-curl', 'reverse-wrist-curl', 'reverse-curl'];
const upperNotes = ['Three exercises per muscle group, two working sets each: six sets per muscle group in this session. Exercise choices, reps and rest times are provisional.'];
const recoveryNotes = ['A scheduled rest day in your confirmed weekly split.'];

export const weekPlan: DayPlan[] = [
  { id: 'monday', label: 'Monday', shortLabel: 'Mon', shortTitle: 'Chest / Tri', type: 'workout', title: 'Chest & triceps', focus: '6 chest sets + 6 triceps sets', durationMinutes: null, exercises: exercises(...chest, ...triceps), notes: upperNotes },
  { id: 'tuesday', label: 'Tuesday', shortLabel: 'Tue', shortTitle: 'Back / Bi', type: 'workout', title: 'Back & biceps', focus: '6 back sets + 6 biceps sets', durationMinutes: null, exercises: exercises(...back, ...biceps), notes: upperNotes },
  { id: 'wednesday', label: 'Wednesday', shortLabel: 'Wed', shortTitle: 'Rest', type: 'rest', title: 'Rest day', focus: 'Time to recharge', durationMinutes: 0, exercises: [], notes: recoveryNotes },
  { id: 'thursday', label: 'Thursday', shortLabel: 'Thu', shortTitle: 'Shldr / FA', type: 'workout', title: 'Shoulders & forearms', focus: '6 shoulder sets + 6 forearm sets', durationMinutes: null, exercises: exercises(...shoulders, ...forearms), notes: upperNotes },
  { id: 'friday', label: 'Friday', shortLabel: 'Fri', shortTitle: 'Bi / Tri', type: 'workout', title: 'Biceps & triceps', focus: '6 biceps sets + 6 triceps sets', durationMinutes: null, exercises: exercises(...biceps, ...triceps), notes: upperNotes },
  { id: 'saturday', label: 'Saturday', shortLabel: 'Sat', shortTitle: 'Legs / Calves', type: 'workout', title: 'Legs & calves', focus: '5 exercises, 2 sets each, calves included', durationMinutes: null, groupExercisesByMuscle: false, exercises: exercises('leg-press', 'romanian-deadlift', 'leg-extension', 'leg-curl', 'calf-raise'), notes: ['Five exercises including one calf exercise, two working sets each: ten sets for the session. Exercise choices, reps and rest times are provisional.'] },
  { id: 'sunday', label: 'Sunday', shortLabel: 'Sun', shortTitle: 'Rest', type: 'rest', title: 'Rest day', focus: 'A fresh week is next', durationMinutes: 0, exercises: [], notes: recoveryNotes },
];

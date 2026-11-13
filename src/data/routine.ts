export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  media?: {
    kind: 'video' | 'image' | 'youtube';
    src: string;
    alt?: string;
  };
};

export type DayPlan = {
  id: string;
  label: string;
  shortLabel: string;
  type: 'workout' | 'rest';
  title: string;
  focus: string;
  durationMinutes: number;
  exercises: Exercise[];
  notes: string[];
};

export const routineMeta = {
  title: 'The weekly routine',
  description: 'An example week. Your exercises, schedule, and demonstrations will replace this sample.',
  isSample: true,
};

// Illustrative content for the interface, not the owner's training program.
// Add a media object to any exercise when its demonstration is available.
export const exerciseLibrary: Exercise[] = [
  { id: 'bench-press', name: 'Bench press', muscleGroup: 'Chest', equipment: 'Barbell', sets: 3, reps: '8–10', restSeconds: 90, notes: 'Your bench press cues will appear here.' },
  { id: 'seated-row', name: 'Seated cable row', muscleGroup: 'Back', equipment: 'Cable machine', sets: 3, reps: '10–12', restSeconds: 90, notes: 'Your row cues will appear here.' },
  { id: 'shoulder-press', name: 'Shoulder press', muscleGroup: 'Shoulders', equipment: 'Dumbbells', sets: 3, reps: '8–10', restSeconds: 90, notes: 'Your shoulder press cues will appear here.' },
  { id: 'triceps-pushdown', name: 'Triceps pushdown', muscleGroup: 'Arms', equipment: 'Cable machine', sets: 3, reps: '10–12', restSeconds: 60, notes: 'Your triceps cues will appear here.' },
  { id: 'squat', name: 'Back squat', muscleGroup: 'Quads', equipment: 'Barbell', sets: 3, reps: '8–10', restSeconds: 120, notes: 'Your squat cues will appear here.' },
  { id: 'romanian-deadlift', name: 'Romanian deadlift', muscleGroup: 'Hamstrings', equipment: 'Dumbbells', sets: 3, reps: '8–10', restSeconds: 90, notes: 'Your deadlift cues will appear here.' },
  { id: 'leg-curl', name: 'Seated leg curl', muscleGroup: 'Hamstrings', equipment: 'Machine', sets: 3, reps: '10–12', restSeconds: 60, notes: 'Your leg curl cues will appear here.' },
  { id: 'calf-raise', name: 'Standing calf raise', muscleGroup: 'Calves', equipment: 'Machine', sets: 3, reps: '12–15', restSeconds: 60, notes: 'Your calf raise cues will appear here.' },
  { id: 'incline-press', name: 'Incline dumbbell press', muscleGroup: 'Chest', equipment: 'Dumbbells', sets: 3, reps: '8–10', restSeconds: 90, notes: 'Your incline press cues will appear here.' },
  { id: 'lat-pulldown', name: 'Lat pulldown', muscleGroup: 'Back', equipment: 'Cable machine', sets: 3, reps: '10–12', restSeconds: 90, notes: 'Your pulldown cues will appear here.' },
  { id: 'lateral-raise', name: 'Lateral raise', muscleGroup: 'Shoulders', equipment: 'Dumbbells', sets: 3, reps: '12–15', restSeconds: 60, notes: 'Your lateral raise cues will appear here.' },
  { id: 'biceps-curl', name: 'Dumbbell curl', muscleGroup: 'Arms', equipment: 'Dumbbells', sets: 3, reps: '10–12', restSeconds: 60, notes: 'Your curl cues will appear here.' },
  { id: 'leg-press', name: 'Leg press', muscleGroup: 'Quads', equipment: 'Machine', sets: 3, reps: '10–12', restSeconds: 120, notes: 'Your leg press cues will appear here.' },
];

const byId = Object.fromEntries(exerciseLibrary.map((exercise) => [exercise.id, exercise]));
const exercises = (...ids: string[]): Exercise[] => ids.map((id) => byId[id]);
const sampleNote = 'Sample session. Your exact exercises and training notes are coming soon.';
const recoveryNotes = ['A scheduled day off in this sample week.', 'Your own recovery notes will appear here.'];

export const weekPlan: DayPlan[] = [
  { id: 'monday', label: 'Monday', shortLabel: 'Mon', type: 'workout', title: 'Upper body', focus: 'Chest, back & arms', durationMinutes: 45, exercises: exercises('bench-press', 'seated-row', 'shoulder-press', 'triceps-pushdown'), notes: [sampleNote] },
  { id: 'tuesday', label: 'Tuesday', shortLabel: 'Tue', type: 'workout', title: 'Lower body', focus: 'Quads, hamstrings & calves', durationMinutes: 45, exercises: exercises('squat', 'romanian-deadlift', 'leg-curl', 'calf-raise'), notes: [sampleNote] },
  { id: 'wednesday', label: 'Wednesday', shortLabel: 'Wed', type: 'rest', title: 'Rest day', focus: 'Time to recharge', durationMinutes: 0, exercises: [], notes: recoveryNotes },
  { id: 'thursday', label: 'Thursday', shortLabel: 'Thu', type: 'workout', title: 'Upper body', focus: 'Chest, back & shoulders', durationMinutes: 45, exercises: exercises('incline-press', 'lat-pulldown', 'lateral-raise', 'biceps-curl'), notes: [sampleNote] },
  { id: 'friday', label: 'Friday', shortLabel: 'Fri', type: 'workout', title: 'Lower body', focus: 'Quads, hamstrings & calves', durationMinutes: 45, exercises: exercises('leg-press', 'romanian-deadlift', 'leg-curl', 'calf-raise'), notes: [sampleNote] },
  { id: 'saturday', label: 'Saturday', shortLabel: 'Sat', type: 'rest', title: 'Rest day', focus: 'Take the day off', durationMinutes: 0, exercises: [], notes: recoveryNotes },
  { id: 'sunday', label: 'Sunday', shortLabel: 'Sun', type: 'rest', title: 'Rest day', focus: 'A fresh week is next', durationMinutes: 0, exercises: [], notes: recoveryNotes },
];

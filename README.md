# SET — Gym routine

A small, mobile-friendly place to share a gym routine. Built with React, TypeScript, and Vite, ready to import into Vercel.

The site uses the selected **Training Club** design: warm ivory, forest green, terracotta details, self-hosted DM Serif Display and DM Sans, an open weekly timetable, and a large inline exercise viewer beside the timer. The header's empty Roblox-style gym is generated artwork. Select an exercise thumbnail or name to change the viewer, and open Exercise notes for its full guide. Still images are labeled explicitly; missing demonstrations have a visible pending state. The timetable becomes a compact day selector on phones.

**The weekly split and set counts come from the routine owner.** Exercise choices, rep ranges, and rest times are provisional and can be corrected later. Four exercises have generated Bacon Hair still-image previews; animations and the remaining demonstrations are pending.

## Current weekly split

| Day | Session | Working sets |
| --- | --- | --- |
| Monday | Chest and triceps | 3 exercises × 2 sets per muscle: 12 total |
| Tuesday | Back and biceps | 3 exercises × 2 sets per muscle: 12 total |
| Wednesday | Rest | 0 |
| Thursday | Shoulders and forearms | 3 exercises × 2 sets per muscle: 12 total |
| Friday | Biceps and triceps | 3 exercises × 2 sets per muscle: 12 total |
| Saturday | Legs and calves | 5 exercises including calves × 2 sets: 10 total |
| Sunday | Rest | 0 |

Counts use each exercise's primary target muscle. Secondary involvement in compound movements is not counted twice. Workout durations are not supplied and are omitted until confirmed.

The provisional exercise list uses familiar movements from the [ACE exercise library](https://www.acefitness.org/resources/everyone/exercise-library/). The owner's split and set counts are distinct from these provisional choices.

## Run locally

Requires Node.js 22.12+ (Node 24 LTS recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal.

```sh
npm run build   # TypeScript check and production build
npm test        # Progress isolation and wall-clock timer tests
npm run preview
```

## Add the real routine

Edit `src/data/routine.ts`. The exercise library stores exercise details. The weekly plan assigns them to days, with `type: 'rest'` for days off. Keep exercise IDs and day IDs stable so saved progress stays attached to the right exercise and day. Increase `routineMeta.progressVersion` when replacing the whole routine and wanting a clean start. This split uses `v2`, separate from the original sample plan's saved progress.

Each exercise has a name, muscle group, equipment, sets, reps, rest in seconds, notes, and optional media:

```ts
{
  id: 'your-exercise',
  name: 'Exercise name',
  muscleGroup: 'Muscle group',
  equipment: 'Equipment',
  sets: 2,
  reps: '8–10',
  restSeconds: 90,
  notes: 'Your technique cues and training notes.',
  media: { kind: 'video', src: '/demos/your-exercise.mp4' },
}
```

The numbers above are examples of the data format. For a GIF or image, use `kind: 'image'`, a `src`, and descriptive `alt` text. For YouTube, use `kind: 'youtube'` with a video URL or video ID. YouTube embeds load only after the viewer presses **Load video**. Put local media in `public/demos/`; only use demonstrations you have permission to share. Add captions to videos with speech.

When the exercise choices, reps, and rest times are confirmed, set `routineMeta.hasPlaceholderExercises` to `false`, update its description, and replace provisional notes. The draft banner and provisional labels will disappear automatically. `shortTitle` supplies a compact day label; set `durationMinutes` to `null` when duration is unconfirmed. Media can include an optional caption, used for the current still-image concepts.

## Behavior

- Select any day to view its workout or rest day.
- Check off individual sets. Completing a set starts that exercise's rest timer.
- The timer supports 60/90/120-second presets, pause, resume, and reset. It uses a wall-clock deadline, so returning from a background tab shows the correct remaining time.
- Progress saves in browser storage, separately for each calendar week, day, and exercise. It stays on that browser/device and is not synced between friends. Clearing browser data clears it. If browser storage is blocked, the routine still works with temporary progress.
- Week navigation repeats the configured schedule. Rest days link to the next workout, including the following week.
- Exercise guides support videos, images/GIFs, and YouTube, with visible missing/broken media states.
- The exercise library supports search and muscle-group filters.
- Share copies the current site URL, with a manual-copy fallback. Deploy the app before sharing a localhost link with a friend.
- Reset day asks before clearing that day's completed sets.

## Deploy to Vercel

Import this GitHub repository in Vercel. Use the **Vite** framework preset, `npm run build` as the build command, and `dist` as the output directory. The repository root is the project root. No backend, account setup, API keys, or environment variables are required. Deployment is left to the repository owner.

## Project structure

```text
src/App.tsx                       Weekly routine and exercise library
src/data/routine.ts               Schedule, exercises, and demo media
src/components/ExerciseDialog.tsx Exercise guide and media viewer
src/components/ExerciseViewer.tsx Large inline selected-exercise viewer
src/components/RestTimer.tsx      Rest timer controls
src/lib/progress.ts               Week keys and saved set progress
src/lib/timer.ts                  Countdown helpers
src/styles.css                   Responsive styling
public/                          Favicon, Bacon Hair stills, and gym hero image
```

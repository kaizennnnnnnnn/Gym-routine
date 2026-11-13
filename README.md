# SET — Gym routine

A small, mobile-friendly place to share a gym routine. Built with React, TypeScript, and Vite, ready to import into Vercel.

**The current schedule and exercises are sample content.** Replace them with the actual routine before sharing it as a training plan. Demonstrations are clearly marked as pending until media is attached.

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

Edit `src/data/routine.ts`. The exercise library stores exercise details. The weekly plan assigns them to days, with `type: 'rest'` for days off. Keep exercise IDs and day IDs stable so saved progress stays attached to the right exercise and day. Increase the progress storage version in `src/lib/progress.ts` if replacing the whole routine and wanting a clean start.

Each exercise has a name, muscle group, equipment, sets, reps, rest in seconds, notes, and optional media:

```ts
{
  id: 'your-exercise',
  name: 'Exercise name',
  muscleGroup: 'Muscle group',
  equipment: 'Equipment',
  sets: 3,
  reps: '8–10',
  restSeconds: 90,
  notes: 'Your technique cues and training notes.',
  media: { kind: 'video', src: '/demos/your-exercise.mp4' },
}
```

The numbers above are examples of the data format. For a GIF or image, use `kind: 'image'`, a `src`, and descriptive `alt` text. For YouTube, use `kind: 'youtube'` with a video URL or video ID. YouTube embeds load only after the viewer presses **Load video**. Put local media in `public/demos/`; only use demonstrations you have permission to share. Add captions to videos with speech.

When the real routine is ready, set `routineMeta.isSample` to `false`, update its description, and replace sample notes and durations. The preview banner and sample labels will disappear automatically.

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
src/components/RestTimer.tsx      Rest timer controls
src/lib/progress.ts               Week keys and saved set progress
src/lib/timer.ts                  Countdown helpers
src/styles.css                   Responsive styling
public/                          Favicon and future local media
```

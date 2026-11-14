import { useEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, BarbellIcon, CheckIcon, CheckCircleIcon, CoffeeIcon, CopyIcon, InfoIcon, MagnifyingGlassIcon, ShareNetworkIcon, TimerIcon } from '@phosphor-icons/react';
import { exerciseLibrary, routineMeta, weekPlan } from './data/routine';
import type { DayPlan, Exercise } from './data/routine';
import { countCompletedSets, countTotalSets, getStorageKey, getWeekKey, sanitizeProgress, toggleSet } from './lib/progress';
import type { Progress } from './lib/progress';
import { assetUrl } from './lib/assets';
import ExerciseDialog from './components/ExerciseDialog';
import ExerciseViewer from './components/ExerciseViewer';
import RestTimer from './components/RestTimer';

const dateLabel = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const longDateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' });

function weekDate(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function dayDate(start: Date, index: number) {
  const date = new Date(start);
  date.setDate(date.getDate() + index);
  return date;
}

function firstPreview(day: DayPlan) {
  return day.exercises.find((item) => item.media)?.id ?? day.exercises[0]?.id ?? null;
}

function readProgress(date: Date): { progress: Progress; available: boolean } {
  try {
    const saved = localStorage.getItem(getStorageKey(date));
    let parsed: unknown = null;
    try { parsed = saved ? JSON.parse(saved) : null; } catch { /* Invalid saved data starts fresh. */ }
    return { progress: sanitizeProgress(parsed, weekPlan), available: true };
  } catch {
    return { progress: sanitizeProgress(null, weekPlan), available: false };
  }
}

function ExerciseRow({ exercise, index, completed, active, onToggle, onSelect, onOpen, onRest }: {
  exercise: Exercise; index: number; completed: boolean[]; active: boolean;
  onToggle: (set: number) => void; onSelect: () => void; onOpen: () => void; onRest: () => void;
}) {
  return <article className="exercise-row" data-active={active}>
    <span className="row-number" aria-hidden="true">{index + 1}</span>
    <button className="row-preview" onClick={onSelect} aria-label={`Show ${exercise.name} preview`} aria-pressed={active}>
      {exercise.media?.kind === 'image' ? <img src={assetUrl(exercise.media.src)} alt="" loading="lazy" /> : <BarbellIcon size={29} weight="light" aria-hidden="true" />}
    </button>
    <div className="row-copy">
      <h4><button onClick={onSelect}>{exercise.name}</button></h4>
      <div className="row-detail"><span>{exercise.equipment}</span><button className="rest-link" onClick={onRest} aria-label={`Start ${exercise.restSeconds} second rest timer`}><TimerIcon size={13} aria-hidden="true" />{exercise.restSeconds}s rest</button></div>
    </div>
    <div className="row-prescription"><strong>{exercise.sets} × {exercise.reps}</strong><span>sets × reps</span></div>
    <div className="set-tracker" aria-label={`${exercise.name} sets`}>
      {completed.map((done, set) => <button key={set} className={`set-button ${done ? 'done' : ''}`} aria-pressed={done} aria-label={`${exercise.name}, set ${set + 1}, ${done ? 'complete' : 'incomplete'}`} onClick={() => onToggle(set)}>{done ? <CheckIcon size={18} weight="bold" aria-hidden="true" /> : <span>{set + 1}</span>}</button>)}
    </div>
    <button className="row-guide icon-button" onClick={onOpen} aria-label={`Open ${exercise.name} guide`}><ArrowUpRightIcon size={18} aria-hidden="true" /></button>
  </article>;
}

function WeekView({ start, initialIndex, onWeekChange, onOpen }: { start: Date; initialIndex?: number; onWeekChange: (offset: number, dayIndex?: number) => void; onOpen: (exercise: Exercise) => void }) {
  const isCurrentWeek = getWeekKey(start) === getWeekKey();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const initialDayIndex = initialIndex ?? (isCurrentWeek ? todayIndex : 0);
  const [selectedIndex, setSelectedIndex] = useState(initialDayIndex);
  const [previewId, setPreviewId] = useState(() => firstPreview(weekPlan[initialDayIndex]));
  const [saved] = useState(() => readProgress(start));
  const [progress, setProgress] = useState(saved.progress);
  const [storageAvailable, setStorageAvailable] = useState(saved.available);
  const [timerRequest, setTimerRequest] = useState<{ seconds: number; token: number } | null>(null);
  const [resetRequested, setResetRequested] = useState(false);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const exerciseList = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const storageKey = getStorageKey(start);
  const day = weekPlan[selectedIndex];
  const selectedExercise = day.exercises.find((item) => item.id === previewId) ?? day.exercises[0];
  const totalSets = countTotalSets(day);
  const completedSets = countCompletedSets(day, progress);
  const complete = totalSets > 0 && completedSets === totalSets;
  const workouts = weekPlan.filter((item) => item.type === 'workout');
  const completedDays = workouts.filter((item) => countCompletedSets(item, progress) === countTotalSets(item)).length;
  const nextDay = Array.from({ length: 7 }, (_, i) => weekPlan[(selectedIndex + i + 1) % 7]).find((item) => item.type === 'workout');
  const exerciseGroups = day.groupExercisesByMuscle === false
    ? [{ name: day.title, exercises: day.exercises }]
    : [...new Set(day.exercises.map((item) => item.muscleGroup))].map((name) => ({ name, exercises: day.exercises.filter((item) => item.muscleGroup === name) }));

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { setStorageAvailable(false); }
  }, [progress, storageKey]);

  useEffect(() => {
    if (resetRequested) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [resetRequested]);

  function startRest(seconds: number) {
    setTimerRequest((previous) => ({ seconds, token: (previous?.token ?? 0) + 1 }));
  }

  function toggle(exercise: Exercise, set: number) {
    const wasComplete = progress[day.id]?.[exercise.id]?.[set] === true;
    setProgress((previous) => toggleSet(previous, day, exercise.id, set));
    if (!wasComplete) startRest(exercise.restSeconds);
  }

  function selectDay(index: number) {
    setSelectedIndex(index);
    setPreviewId(firstPreview(weekPlan[index]));
  }

  function selectExercise(exercise: Exercise) {
    setPreviewId(exercise.id);
    if (matchMedia('(max-width: 767px)').matches) {
      viewerRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }
  }

  return <div className="training-layout">
    <aside className="week-sidebar" aria-labelledby="week-heading">
      <div className="week-heading"><h2 id="week-heading">Your week</h2><div className="week-navigation"><button className="icon-button" aria-label="Previous week" onClick={() => onWeekChange(-1)}><ArrowLeftIcon size={16} aria-hidden="true" /></button><button className="icon-button" aria-label="Next week" onClick={() => onWeekChange(1)}><ArrowRightIcon size={16} aria-hidden="true" /></button></div></div>
      <div className="week-date"><span>{dateLabel.format(start)} – {dateLabel.format(dayDate(start, 6))}</span>{!isCurrentWeek && <button className="text-button" onClick={() => onWeekChange(0)}>Today</button>}</div>
      <div className="week-days" role="group" aria-label="Choose a day">
        {weekPlan.map((item, index) => {
          const done = item.type === 'workout' && countCompletedSets(item, progress) === countTotalSets(item);
          return <button key={item.id} className={`day-button ${index === selectedIndex ? 'selected' : ''} ${item.type === 'rest' ? 'rest-day' : ''}`} aria-pressed={index === selectedIndex} aria-label={`${item.label}, ${item.title}${isCurrentWeek && index === todayIndex ? ', today' : ''}`} onClick={() => selectDay(index)}>
            <span className="day-name">{item.shortLabel}</span><span className="day-session">{item.title}</span><span className="day-number">{dayDate(start, index).getDate()}</span><span className="day-indicator">{done ? <CheckCircleIcon size={15} weight="fill" aria-label="Workout completed" /> : item.type === 'rest' ? <CoffeeIcon size={15} aria-hidden="true" /> : isCurrentWeek && index === todayIndex ? <span className="today-dot" aria-label="Today" /> : null}</span>
          </button>;
        })}
      </div>
      <div className="week-overview"><span>{workouts.length} training days · {weekPlan.length - workouts.length} rest days</span><strong>{completedDays} of {workouts.length} workouts complete</strong></div>
      <p className="week-device-note">Your progress stays on this device, one week at a time.</p>
    </aside>

    <section className="workout-workspace" aria-labelledby="workout-heading">
      <header className="workout-heading"><h2 id="workout-heading"><span>{day.label}<span className="heading-slash"> / </span></span>{day.title}</h2><span className={`session-count ${complete ? 'complete' : ''}`}>{complete && <CheckCircleIcon size={18} aria-hidden="true" />}{completedSets} of {totalSets} sets</span></header>
      <div className="workout-meta"><p className="workout-focus">{day.focus}</p><span className="selected-date">{longDateLabel.format(dayDate(start, selectedIndex))}</span></div>
      {day.type === 'workout' && selectedExercise ? <>
        <div className="session-tools" ref={viewerRef}><ExerciseViewer exercise={selectedExercise} onOpenGuide={() => onOpen(selectedExercise)} /><RestTimer request={timerRequest} /></div>
        <div className="exercise-list" ref={exerciseList}>
          {exerciseGroups.map(({ name, exercises: groupExercises }) => <section className="exercise-group" key={name} aria-label={`${name} exercises`}>
            <div className="exercise-group-heading"><h3>{name}</h3><span>{groupExercises.reduce((total, item) => total + item.sets, 0)} working sets</span></div>
            {groupExercises.map((exercise) => <ExerciseRow key={`${day.id}:${exercise.id}`} exercise={exercise} index={day.exercises.indexOf(exercise)} completed={progress[day.id]?.[exercise.id] ?? Array(exercise.sets).fill(false)} active={selectedExercise.id === exercise.id} onToggle={(set) => toggle(exercise, set)} onSelect={() => selectExercise(exercise)} onOpen={() => onOpen(exercise)} onRest={() => startRest(exercise.restSeconds)} />)}
          </section>)}
        </div>
        {complete && <p className="completion-note" role="status"><CheckCircleIcon size={18} aria-hidden="true" />All sets complete. That’s your session for today.</p>}
        <div className="workout-footer"><span><CheckCircleIcon size={15} aria-hidden="true" />{storageAvailable ? 'Progress saved on this device' : 'Browser storage is unavailable. Progress is temporary.'}</span><button className="text-button" onClick={() => setResetRequested(true)} disabled={completedSets === 0}>Reset day</button></div>
        <p className="routine-note">{day.notes[0]}</p>
      </> : <div className="recovery-panel"><CoffeeIcon size={58} weight="light" aria-hidden="true" /><h3>A little room to recharge.</h3><p>No exercises scheduled for {day.label}. Rest is part of the routine.</p>{nextDay && <button className="button button-dark" onClick={() => { const nextIndex = weekPlan.indexOf(nextDay); if (nextIndex <= selectedIndex) onWeekChange(1, nextIndex); else selectDay(nextIndex); }}>View next workout<ArrowRightIcon size={17} aria-hidden="true" /></button>}<p className="recovery-footnote">{day.notes[0]}</p></div>}
    </section>
    <dialog ref={resetDialog} className="confirm-dialog" aria-labelledby="reset-title" onCancel={() => setResetRequested(false)}><h2 id="reset-title">Reset {day.label}?</h2><p>This clears completed sets for this day in this week.</p><div className="confirm-actions"><button className="button button-quiet" onClick={() => setResetRequested(false)} autoFocus>Keep progress</button><button className="button button-dark" onClick={() => { setProgress((previous) => ({ ...previous, [day.id]: sanitizeProgress(null, [day])[day.id] })); setResetRequested(false); }}>Reset day</button></div></dialog>
  </div>;
}

function ExerciseLibrary({ onOpen }: { onOpen: (exercise: Exercise) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const groups = ['All', ...new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup))];
  const filtered = exerciseLibrary.filter((exercise) => (filter === 'All' || exercise.muscleGroup === filter) && `${exercise.name} ${exercise.equipment} ${exercise.muscleGroup}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <section className="library" aria-labelledby="library-title">
    <div className="library-heading"><div><h2 id="library-title">The exercise library.</h2><p>{routineMeta.hasPlaceholderExercises ? 'Your movements, collected here. Exercise choices are still provisional.' : 'A guide for every movement in your routine.'}</p></div><label className="search-field"><MagnifyingGlassIcon size={19} aria-hidden="true" /><input type="search" aria-label="Search exercises" placeholder="Find an exercise…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <div className="library-filters" aria-label="Filter by muscle group">{groups.map((group) => <button key={group} aria-pressed={group === filter} className={group === filter ? 'active' : ''} onClick={() => setFilter(group)}>{group}</button>)}</div>
    <p className="library-count" role="status">{filtered.length} {routineMeta.hasPlaceholderExercises ? 'provisional ' : ''}{filtered.length === 1 ? 'exercise' : 'exercises'}</p>
    <div className="library-grid">{filtered.map((exercise) => <button key={exercise.id} className="library-card" onClick={() => onOpen(exercise)}><div className="library-art">{exercise.media?.kind === 'image' ? <img src={assetUrl(exercise.media.src)} alt="" loading="lazy" /> : <BarbellIcon size={52} weight="light" aria-hidden="true" />}</div><div className="library-card-content"><span>{exercise.muscleGroup}<span className="library-demo">{exercise.media?.kind === 'image' ? 'Image preview' : exercise.media ? 'Demonstration' : 'Demo pending'}</span></span><h3>{exercise.name}</h3><p>{exercise.equipment}<ArrowUpRightIcon size={18} aria-hidden="true" /></p></div></button>)}</div>
    {filtered.length === 0 && <div className="empty-state"><MagnifyingGlassIcon size={35} weight="light" aria-hidden="true" /><h3>No exercises found</h3><p>Try another name, muscle group, or piece of equipment.</p><button className="button button-dark" onClick={() => { setQuery(''); setFilter('All'); }}>Clear filters</button></div>}
  </section>;
}

export default function App() {
  const [page, setPage] = useState<'week' | 'library'>('week');
  const [currentWeek, setCurrentWeek] = useState(getWeekKey());
  const [preferredDay, setPreferredDay] = useState<number | undefined>(undefined);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const shareDialog = useRef<HTMLDialogElement>(null);
  const shareInput = useRef<HTMLInputElement>(null);
  const start = weekDate(currentWeek);

  useEffect(() => {
    if (!shareStatus) return;
    const timeout = window.setTimeout(() => setShareStatus(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [shareStatus]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('Link copied');
    } catch {
      setShareStatus('Copy the link below');
      shareDialog.current?.showModal();
      shareInput.current?.select();
    }
  }

  function changeWeek(offset: number, dayIndex?: number) {
    setPreferredDay(dayIndex);
    setCurrentWeek(offset === 0 ? getWeekKey() : getWeekKey(dayDate(start, offset * 7)));
  }

  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to routine</a>
    <header className="site-header"><button className="wordmark" onClick={() => setPage('week')} aria-label="SET home">SET.</button><nav aria-label="Main navigation"><button className={page === 'week' ? 'active' : ''} aria-current={page === 'week' ? 'page' : undefined} onClick={() => setPage('week')}>My week</button><button className={page === 'library' ? 'active' : ''} aria-label="Exercise library" aria-current={page === 'library' ? 'page' : undefined} onClick={() => setPage('library')}><span className="nav-long">Exercise library</span><span className="nav-short">Library</span></button></nav><button className="share-button" onClick={share} aria-label="Share routine"><ShareNetworkIcon size={17} aria-hidden="true" /><span>Share routine</span></button></header>
    <main id="main">
      <section className="club-intro" aria-labelledby="page-title"><div className="hero-copy"><span className="hero-eyebrow">YOUR WEEKLY ROUTINE</span><h1 id="page-title">The daily practice.</h1><p>A little structure. A stronger week.</p></div><img className="hero-image" src={assetUrl('/images/training-club-gym.png')} width="2172" height="724" alt="An empty Roblox-style weight room with warm window light, a green bench, and neatly arranged dumbbells." fetchPriority="high" /></section>
      {routineMeta.hasPlaceholderExercises && <div className="draft-notice"><InfoIcon size={15} aria-hidden="true" /><p><strong>Schedule confirmed.</strong> Exercise choices, reps and rest times are still provisional.</p></div>}
      {page === 'week' ? <WeekView key={currentWeek} start={start} initialIndex={preferredDay} onWeekChange={changeWeek} onOpen={setExercise} /> : <ExerciseLibrary onOpen={setExercise} />}
    </main>
    <footer className="site-footer"><span className="footer-brand">SET.</span><span>A routine worth repeating.</span><span>Your routine. Your pace.</span></footer>
    <div className="share-status" role="status">{shareStatus && <><CopyIcon size={15} aria-hidden="true" />{shareStatus}</>}</div>
    <ExerciseDialog exercise={exercise} onClose={() => setExercise(null)} />
    <dialog className="confirm-dialog share-dialog" ref={shareDialog} aria-labelledby="share-title"><h2 id="share-title">Share this routine</h2><p>Copy this link for your training partner. Progress stays on each person’s device.</p><input ref={shareInput} aria-label="Routine link" readOnly value={window.location.href} onFocus={(event) => event.target.select()} /><button className="button button-dark" onClick={() => shareDialog.current?.close()}>Done</button></dialog>
  </div>;
}

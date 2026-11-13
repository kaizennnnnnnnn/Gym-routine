import { useEffect, useRef, useState } from 'react';
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, BarbellIcon, BookOpenIcon, CalendarBlankIcon, CheckIcon, CheckCircleIcon, ClockIcon, CoffeeIcon, CopyIcon, InfoIcon, MagnifyingGlassIcon, PlayIcon, ShareNetworkIcon, SparkleIcon, TimerIcon } from '@phosphor-icons/react';
import { exerciseLibrary, routineMeta, weekPlan } from './data/routine';
import type { Exercise } from './data/routine';
import { countCompletedSets, countTotalSets, getStorageKey, getWeekKey, sanitizeProgress, toggleSet } from './lib/progress';
import type { Progress } from './lib/progress';
import ExerciseDialog from './components/ExerciseDialog';
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

function readProgress(date: Date): { progress: Progress; available: boolean } {
  try {
    const saved = localStorage.getItem(getStorageKey(date));
    let parsed: unknown = null;
    try { parsed = saved ? JSON.parse(saved) : null; } catch { /* Invalid data starts fresh. */ }
    return { progress: sanitizeProgress(parsed, weekPlan), available: true };
  } catch {
    return { progress: sanitizeProgress(null, weekPlan), available: false };
  }
}

function ExerciseCard({ exercise, index, completed, onToggle, onOpen, onRest }: {
  exercise: Exercise; index: number; completed: boolean[];
  onToggle: (set: number) => void; onOpen: () => void; onRest: () => void;
}) {
  const allDone = completed.every(Boolean);
  return (
    <article className={`exercise-card ${allDone ? 'is-complete' : ''}`}>
      <div className="exercise-card-top">
        <button className="exercise-visual" onClick={onOpen} aria-label={`View ${exercise.name} details`}>
          <BarbellIcon size={38} weight="light" aria-hidden="true" />
          <span className="mini-play"><PlayIcon size={10} weight="fill" aria-hidden="true" /></span>
        </button>
        <div className="exercise-name">
          <span className="exercise-number">EXERCISE {String(index + 1).padStart(2, '0')}</span>
          <h3><button onClick={onOpen}>{exercise.name}</button></h3>
          <p>{exercise.muscleGroup}<span aria-hidden="true"> / </span>{exercise.equipment}</p>
        </div>
        <button className="icon-button exercise-open" onClick={onOpen} aria-label={`Open ${exercise.name} guide`}>
          <ArrowUpRightIcon size={21} aria-hidden="true" />
        </button>
      </div>
      <div className="exercise-card-bottom">
        <div className="exercise-prescription"><strong>{exercise.sets} <span>sets</span></strong><span className="times">×</span><strong>{exercise.reps} <span>reps</span></strong></div>
        <div className="set-tracker" aria-label={`${exercise.name} sets`}>
          {completed.map((done, set) => <button key={set} className={`set-button ${done ? 'done' : ''}`} aria-pressed={done} aria-label={`${exercise.name}, set ${set + 1}, ${done ? 'complete' : 'incomplete'}`} onClick={() => onToggle(set)}>{done ? <CheckIcon size={15} weight="bold" aria-hidden="true" /> : set + 1}</button>)}
        </div>
        <button className="rest-link" onClick={onRest} aria-label={`Start ${exercise.restSeconds} second rest timer`}><TimerIcon size={16} aria-hidden="true" />{exercise.restSeconds}s rest</button>
      </div>
    </article>
  );
}

function WeekView({ start, initialIndex, onWeekChange, onOpen }: { start: Date; initialIndex?: number; onWeekChange: (offset: number, dayIndex?: number) => void; onOpen: (exercise: Exercise) => void }) {
  const isCurrentWeek = getWeekKey(start) === getWeekKey();
  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex ?? (isCurrentWeek ? todayIndex : 0));
  const [saved] = useState(() => readProgress(start));
  const [progress, setProgress] = useState(saved.progress);
  const [storageAvailable, setStorageAvailable] = useState(saved.available);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [timerRequest, setTimerRequest] = useState<{ seconds: number; token: number } | null>(null);
  const [resetRequested, setResetRequested] = useState(false);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const exerciseList = useRef<HTMLDivElement>(null);
  const storageKey = getStorageKey(start);
  const day = weekPlan[selectedIndex];
  const totalSets = countTotalSets(day);
  const completedSets = countCompletedSets(day, progress);
  const complete = totalSets > 0 && completedSets === totalSets;
  const workouts = weekPlan.filter((item) => item.type === 'workout');
  const completedDays = workouts.filter((item) => countCompletedSets(item, progress) === countTotalSets(item)).length;
  const nextDay = Array.from({ length: 7 }, (_, i) => weekPlan[(selectedIndex + i + 1) % 7]).find((item) => item.type === 'workout');

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
    setSessionStarted(false);
  }

  function startSession() {
    setSessionStarted(true);
    exerciseList.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    const firstIncomplete = exerciseList.current?.querySelector<HTMLButtonElement>('.set-button[aria-pressed="false"]');
    firstIncomplete?.focus({ preventScroll: true });
  }

  return (
    <>
      <section className="week-section" aria-labelledby="week-heading">
        <div className="section-title-row">
          <div className="week-title"><h2 id="week-heading">{isCurrentWeek ? 'This week' : 'Your week'}</h2><span>{dateLabel.format(start)} – {dateLabel.format(dayDate(start, 6))}</span></div>
          <div className="week-navigation">
            {!isCurrentWeek && <button className="text-button" onClick={() => onWeekChange(0)}>Today</button>}
            <button className="icon-button" aria-label="Previous week" onClick={() => onWeekChange(-1)}><ArrowLeftIcon size={17} aria-hidden="true" /></button>
            <button className="icon-button" aria-label="Next week" onClick={() => onWeekChange(1)}><ArrowRightIcon size={17} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="week-grid" role="group" aria-label="Choose a day">
          {weekPlan.map((item, index) => {
            const done = item.type === 'workout' && countCompletedSets(item, progress) === countTotalSets(item);
            return <button key={item.id} className={`day-button ${index === selectedIndex ? 'selected' : ''} ${item.type === 'rest' ? 'rest-day' : ''}`} aria-pressed={index === selectedIndex} aria-label={`${item.label}, ${item.title}${isCurrentWeek && index === todayIndex ? ', today' : ''}`} onClick={() => selectDay(index)}>
              <div className="day-top"><span>{item.shortLabel}</span>{isCurrentWeek && index === todayIndex ? <span className="today-dot" aria-label="Today" /> : null}{done ? <CheckCircleIcon size={14} weight="fill" aria-label="Workout completed" /> : null}</div>
              <span className="day-date">{dayDate(start, index).getDate()}</span>
              <div className="day-bottom">{item.type === 'rest' ? <CoffeeIcon size={15} aria-hidden="true" /> : <BarbellIcon size={15} aria-hidden="true" />}<span>{item.type === 'rest' ? 'Rest' : item.title}</span></div>
            </button>;
          })}
        </div>
      </section>

      <div className="workout-layout">
        <section className="workout-main" aria-labelledby="workout-heading">
          <div className="workout-heading">
            <div><p className="selected-date">{longDateLabel.format(dayDate(start, selectedIndex))}</p><h2 id="workout-heading">{day.title}<span className="heading-period">.</span></h2><p className="workout-focus">{day.focus}</p></div>
            {day.type === 'workout' && <button className={`button button-dark start-button ${complete ? 'session-complete' : ''}`} onClick={startSession} disabled={complete}>{complete ? <CheckCircleIcon size={18} weight="fill" aria-hidden="true" /> : sessionStarted ? <CheckIcon size={18} aria-hidden="true" /> : <PlayIcon size={15} weight="fill" aria-hidden="true" />}{complete ? 'Session complete' : sessionStarted ? 'In progress' : 'Start session'}</button>}
          </div>

          {day.type === 'workout' ? <>
            <div className="workout-meta"><span><BarbellIcon size={16} aria-hidden="true" />{day.exercises.length} exercises</span><span><ClockIcon size={16} aria-hidden="true" />~{day.durationMinutes} min</span><span className={complete ? 'completion-text' : ''}><CheckCircleIcon size={16} aria-hidden="true" />{completedSets}/{totalSets} sets</span></div>
            <div className="exercise-list" ref={exerciseList}>
              {day.exercises.map((exercise, index) => <ExerciseCard key={`${day.id}:${exercise.id}`} exercise={exercise} index={index} completed={progress[day.id]?.[exercise.id] ?? Array(exercise.sets).fill(false)} onToggle={(set) => toggle(exercise, set)} onOpen={() => onOpen(exercise)} onRest={() => startRest(exercise.restSeconds)} />)}
            </div>
            <div className="workout-footer"><span><CheckCircleIcon size={15} aria-hidden="true" />{storageAvailable ? 'Progress saved on this device' : 'Progress is temporary. Browser storage is unavailable.'}</span><button className="text-button" onClick={() => setResetRequested(true)} disabled={completedSets === 0}>Reset day</button></div>
          </> : <div className="recovery-panel">
            <div className="recovery-icon"><CoffeeIcon size={64} weight="light" aria-hidden="true" /></div>
            <span className="recovery-label">REST IS PART OF THE ROUTINE</span>
            <h3>A little room to recharge.</h3>
            <p>No exercises scheduled for {day.label}. Your next session will be here when you’re ready.</p>
            {nextDay && <button className="button button-dark" onClick={() => {
              const nextIndex = weekPlan.indexOf(nextDay);
              if (nextIndex <= selectedIndex) onWeekChange(1, nextIndex);
              else selectDay(nextIndex);
            }}>View next workout<ArrowRightIcon size={17} aria-hidden="true" /></button>}
            {routineMeta.isSample && <div className="recovery-note"><InfoIcon size={16} aria-hidden="true" /><span>Sample rest day. Your schedule is still to come.</span></div>}
          </div>}
        </section>

        <aside className="workout-sidebar" aria-label="Training tools">
          <RestTimer request={timerRequest} />
          <section className="week-progress panel">
            <div className="panel-label"><CalendarBlankIcon size={17} aria-hidden="true" />Your week so far</div>
            <div className="progress-number">{completedDays}<span>/ {workouts.length}</span></div>
            <p>workouts completed</p>
            <div className="week-progress-marks" aria-label={`${completedDays} of ${workouts.length} workouts completed`}>{workouts.map((item) => <div key={item.id} className={countCompletedSets(item, progress) === countTotalSets(item) ? 'filled' : ''}>{countCompletedSets(item, progress) === countTotalSets(item) ? <CheckIcon size={17} weight="bold" aria-hidden="true" /> : <span />}</div>)}</div>
          </section>
          <section className="routine-note"><span className="note-mark"><BookOpenIcon size={21} weight="light" aria-hidden="true" /></span><h3>A note on this routine</h3><p>{day.notes[0]}</p><div><SparkleIcon size={14} aria-hidden="true" />Made to share. Built to repeat.</div></section>
        </aside>
      </div>

      <dialog ref={resetDialog} className="confirm-dialog" aria-labelledby="reset-title" onCancel={() => setResetRequested(false)}><h2 id="reset-title">Reset {day.label}?</h2><p>This clears the completed sets for this day in this week.</p><div className="confirm-actions"><button className="button button-quiet" onClick={() => setResetRequested(false)} autoFocus>Keep progress</button><button className="button button-dark" onClick={() => { setProgress((previous) => ({ ...previous, [day.id]: sanitizeProgress(null, [day])[day.id] })); setSessionStarted(false); setResetRequested(false); }}>Reset day</button></div></dialog>
    </>
  );
}

function ExerciseLibrary({ onOpen }: { onOpen: (exercise: Exercise) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const groups = ['All', ...new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup))];
  const filtered = exerciseLibrary.filter((exercise) => (filter === 'All' || exercise.muscleGroup === filter) && `${exercise.name} ${exercise.equipment} ${exercise.muscleGroup}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <section className="library" aria-labelledby="library-title">
    <div className="library-heading"><div><h2 id="library-title">The exercise library<span className="heading-period">.</span></h2><p>{routineMeta.isSample ? 'Every movement, in one place. Demonstrations are coming with your routine.' : 'A guide for every movement in your routine.'}</p></div><label className="search-field"><MagnifyingGlassIcon size={19} aria-hidden="true" /><input type="search" aria-label="Search exercises" placeholder="Find an exercise…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <div className="library-filters" aria-label="Filter by muscle group">{groups.map((group) => <button key={group} aria-pressed={group === filter} className={group === filter ? 'active' : ''} onClick={() => setFilter(group)}>{group}</button>)}</div>
    <p className="library-count" role="status">{filtered.length} {routineMeta.isSample ? 'sample ' : ''}{filtered.length === 1 ? 'exercise' : 'exercises'}</p>
    <div className="library-grid">{filtered.map((exercise) => <button key={exercise.id} className="library-card" onClick={() => onOpen(exercise)}><div className="library-art"><BarbellIcon size={64} weight="light" aria-hidden="true" /><span className="library-demo"><PlayIcon size={12} weight="fill" aria-hidden="true" />{exercise.media ? 'View demonstration' : 'Demo pending'}</span></div><div className="library-card-content"><span>{exercise.muscleGroup}</span><h3>{exercise.name}</h3><p>{exercise.equipment}<ArrowUpRightIcon size={19} aria-hidden="true" /></p></div></button>)}</div>
    {filtered.length === 0 && <div className="empty-state"><MagnifyingGlassIcon size={35} weight="light" aria-hidden="true" /><h3>No exercises found</h3><p>Try a different name, muscle group, or piece of equipment.</p><button className="button button-dark" onClick={() => { setQuery(''); setFilter('All'); }}>Clear filters</button></div>}
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

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to routine</a>
      <header className="site-header">
        <button className="wordmark" onClick={() => setPage('week')} aria-label="SET home"><span className="brand-icon"><BarbellIcon size={23} weight="bold" aria-hidden="true" /></span>SET<span className="brand-period">.</span></button>
        <nav aria-label="Main navigation"><button className={page === 'week' ? 'active' : ''} aria-current={page === 'week' ? 'page' : undefined} onClick={() => setPage('week')}><CalendarBlankIcon size={17} aria-hidden="true" />My week</button><button className={page === 'library' ? 'active' : ''} aria-current={page === 'library' ? 'page' : undefined} onClick={() => setPage('library')}><BarbellIcon size={18} aria-hidden="true" />Exercises</button></nav>
        <button className="share-button" onClick={share} aria-label="Share routine"><ShareNetworkIcon size={17} aria-hidden="true" /><span>Share routine</span></button>
      </header>

      <main id="main">
        <div className="page-intro"><div><div className="intro-kicker">A GOOD WEEK STARTS WITH A PLAN</div><h1>Your training,<br /><span>laid out.</span></h1><p>A little structure. A lot less guessing. One set at a time.</p></div><div className="intro-aside"><span className="intro-stamp"><BarbellIcon size={44} weight="light" aria-hidden="true" /></span><p>Your routine.<br />Your pace.<br /><strong>Let’s get to it.<ArrowDownIcon size={16} aria-hidden="true" /></strong></p></div></div>
        {routineMeta.isSample && <div className="sample-banner"><InfoIcon size={18} aria-hidden="true" /><p><strong>A preview of what’s to come.</strong> You’re viewing a sample routine. Your exercises, schedule, and demos are coming soon.</p><span>Sample plan</span></div>}
        {page === 'week' ? <WeekView key={currentWeek} start={start} initialIndex={preferredDay} onWeekChange={changeWeek} onOpen={setExercise} /> : <ExerciseLibrary onOpen={setExercise} />}
      </main>

      <footer className="site-footer"><span className="footer-brand">SET.</span><span>A routine worth repeating.</span><span>No account. Just show up.</span></footer>
      <div className="share-status" role="status">{shareStatus && <><CopyIcon size={15} aria-hidden="true" />{shareStatus}</>}</div>
      <ExerciseDialog exercise={exercise} onClose={() => setExercise(null)} />
      <dialog className="confirm-dialog share-dialog" ref={shareDialog} aria-labelledby="share-title"><h2 id="share-title">Share this routine</h2><p>Copy this link and send it to your training partner. Progress stays on each person’s device.</p><input ref={shareInput} aria-label="Routine link" readOnly value={window.location.href} onFocus={(event) => event.target.select()} /><button className="button button-dark" onClick={() => shareDialog.current?.close()}>Done</button></dialog>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowCounterClockwise, Pause, Play, Timer } from '@phosphor-icons/react';
import { formatTime, secondsUntil } from '../lib/timer';

type TimerState = {
  duration: number;
  remainingMs: number;
  deadline: number | null;
  status: 'idle' | 'running' | 'paused' | 'complete';
};

export type RestTimerProps = {
  request: { seconds: number; token: number } | null;
};

const presets = [60, 90, 120];

function makeTimer(seconds: number, start = false): TimerState {
  const duration = Number.isFinite(seconds) && seconds > 0
    ? Math.min(3600, Math.ceil(seconds))
    : 90;

  return {
    duration,
    remainingMs: duration * 1000,
    deadline: start ? Date.now() + duration * 1000 : null,
    status: start ? 'running' : 'idle',
  };
}

export function RestTimer({ request }: RestTimerProps) {
  const [timer, setTimer] = useState<TimerState>(() => makeTimer(90));

  useEffect(() => {
    if (request) setTimer(makeTimer(request.seconds, true));
  }, [request]);

  useEffect(() => {
    if (timer.deadline === null) return;

    const update = () => {
      setTimer(current => {
        if (current.deadline === null) return current;
        const now = Date.now();
        const remainingMs = Math.max(0, current.deadline - now);
        if (secondsUntil(current.deadline, now) === 0) {
          return { ...current, remainingMs: 0, deadline: null, status: 'complete' };
        }
        return { ...current, remainingMs };
      });
    };

    const interval = window.setInterval(update, 200);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pageshow', update);
    update();

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('pageshow', update);
    };
  }, [timer.deadline]);

  function toggleTimer() {
    setTimer(current => {
      if (current.deadline !== null) {
        const remainingMs = Math.max(0, current.deadline - Date.now());
        return {
          ...current,
          remainingMs,
          deadline: null,
          status: remainingMs > 0 ? 'paused' : 'complete',
        };
      }

      const remainingMs = current.remainingMs > 0
        ? current.remainingMs
        : current.duration * 1000;
      return { ...current, remainingMs, deadline: Date.now() + remainingMs, status: 'running' };
    });
  }

  const running = timer.status === 'running';
  const buttonLabel = running ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start timer';
  const status = timer.status === 'complete'
    ? 'Rest complete. Ready for your next set.'
    : timer.status === 'paused'
      ? 'Timer paused.'
      : running ? 'Take a breath. Your next set is coming.' : 'A little recovery between sets.';

  return (
    <section className="timer-panel panel" aria-labelledby="rest-timer-title">
      <h3 className="panel-label" id="rest-timer-title"><Timer size={19} aria-hidden="true" /> Rest timer</h3>
      <div className="timer-display" role="timer" aria-live="off" aria-label="Rest time remaining">
        {formatTime(timer.remainingMs / 1000)}
      </div>
      <div className="timer-presets" aria-label="Rest duration">
        {presets.map(seconds => (
          <button
            type="button"
            key={seconds}
            aria-pressed={timer.duration === seconds}
            onClick={() => setTimer(makeTimer(seconds))}
          >
            {seconds}s
          </button>
        ))}
      </div>
      <div className="timer-actions">
        <button type="button" className="button button-dark" onClick={toggleTimer}>
          {running ? <Pause size={18} weight="fill" aria-hidden="true" /> : <Play size={18} weight="fill" aria-hidden="true" />}
          {buttonLabel}
        </button>
        <button
          type="button"
          className="icon-button button-quiet"
          onClick={() => setTimer(makeTimer(timer.duration))}
          aria-label="Reset rest timer"
          title="Reset timer"
        >
          <ArrowCounterClockwise size={19} aria-hidden="true" />
        </button>
      </div>
      <p className="timer-status" role="status">{status}</p>
    </section>
  );
}

export default RestTimer;

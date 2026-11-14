import { useEffect, useRef, useState } from 'react';
import { BarbellIcon, PlayIcon, XIcon } from '@phosphor-icons/react';
import type { Exercise } from '../data/routine';
import { assetUrl } from '../lib/assets';

type ExerciseDialogProps = {
  exercise: Exercise | null;
  onClose: () => void;
};

function youtubeId(source: string): string | null {
  const validId = /^[a-zA-Z0-9_-]{11}$/;
  if (validId.test(source)) return source;

  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;

    if (host === 'youtu.be' || host === 'www.youtu.be') {
      id = url.pathname.split('/')[1] ?? null;
    } else if (
      ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)
    ) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'watch') id = url.searchParams.get('v');
      if (['embed', 'shorts', 'v'].includes(parts[0] ?? '')) id = parts[1] ?? null;
    }

    return id && validId.test(id) ? id : null;
  } catch {
    return null;
  }
}

function safeMediaSource(source: string): string | null {
  if (!source.trim()) return null;
  try {
    const url = new URL(assetUrl(source), window.location.href);
    const isLocal = url.origin === window.location.origin;
    if (url.username || url.password) return null;
    return url.protocol === 'https:' || (isLocal && url.protocol === 'http:') ? url.href : null;
  } catch {
    return null;
  }
}

function DemoPlaceholder({ failed = false }: { failed?: boolean }) {
  return (
    <div className="demo-placeholder">
      <div className="demo-placeholder-icon" aria-hidden="true">
        <BarbellIcon size={60} weight="light" />
      </div>
      <strong>{failed ? 'Demonstration unavailable' : 'Demonstration coming soon'}</strong>
      <p>{failed ? 'This demonstration could not be loaded. Please try again later.' : 'Your exercise video or animation will appear here.'}</p>
    </div>
  );
}

function ExerciseMedia({ exercise }: { exercise: Exercise }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const { media } = exercise;

  if (!media) return <DemoPlaceholder />;
  if (failed) return <DemoPlaceholder failed />;

  if (media.kind === 'youtube') {
    const id = youtubeId(media.src);
    if (!id) return <DemoPlaceholder failed />;

    return loaded ? (
      <iframe
        className="demo-media"
        title={`${exercise.name} demonstration`}
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        allow="encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setFailed(true)}
      />
    ) : (
      <div className="demo-placeholder">
        <PlayIcon size={48} weight="light" aria-hidden="true" />
        <strong>See the movement</strong>
        <p>Load this exercise demonstration from YouTube.</p>
        <button className="primary-button demo-load-button" type="button" onClick={() => setLoaded(true)}>
          <PlayIcon size={18} weight="fill" aria-hidden="true" />
          Load video
        </button>
      </div>
    );
  }

  const src = safeMediaSource(media.src);
  if (!src) return <DemoPlaceholder failed />;

  if (media.kind === 'image') {
    return <figure className="demo-figure"><img className="demo-media" src={src} alt={media.alt || `${exercise.name} demonstration`} onError={() => setFailed(true)} />{media.caption && <figcaption>{media.caption}</figcaption>}</figure>;
  }

  return (
    <video className="demo-media" src={src} controls playsInline preload="metadata" onError={() => setFailed(true)}>
      Your browser does not support this exercise video.
    </video>
  );
}

export default function ExerciseDialog({ exercise, onClose }: ExerciseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !exercise) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [exercise]);

  return (
    <dialog
      ref={dialogRef}
      className="exercise-dialog"
      aria-labelledby="exercise-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      {exercise && (
        <>
          <div className="dialog-heading">
            <div>
              <span className="dialog-eyebrow">Exercise guide</span>
              <h2 id="exercise-dialog-title">{exercise.name}</h2>
            </div>
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close exercise guide" autoFocus>
              <XIcon size={22} aria-hidden="true" />
            </button>
          </div>
          <div className="exercise-tags">
            <span>{exercise.muscleGroup}</span>
            <span>{exercise.equipment}</span>
          </div>
          <ExerciseMedia key={`${exercise.id}:${exercise.media?.src ?? ''}`} exercise={exercise} />
          <dl className="exercise-stats">
            <div><dt>Sets</dt><dd>{exercise.sets}</dd></div>
            <div><dt>Reps</dt><dd>{exercise.reps}</dd></div>
            <div><dt>Rest</dt><dd>{exercise.restSeconds}s</dd></div>
          </dl>
          <div className="dialog-notes">
            <h3>Routine notes</h3>
            <p>{exercise.notes}</p>
          </div>
        </>
      )}
    </dialog>
  );
}

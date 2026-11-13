import { useId, useState } from 'react';
import { ArrowUpRightIcon, BarbellIcon, PlayIcon } from '@phosphor-icons/react';
import type { Exercise } from '../data/routine';

type ExerciseViewerProps = {
  exercise: Exercise;
  onOpenGuide: () => void;
};

function safeMediaSource(source: string): string | null {
  if (!source.trim()) return null;
  try {
    const url = new URL(source, window.location.href);
    const local = url.origin === window.location.origin;
    if (url.username || url.password) return null;
    return url.protocol === 'https:' || (local && url.protocol === 'http:') ? url.href : null;
  } catch {
    return null;
  }
}

function ViewerMedia({ exercise, onOpenGuide }: ExerciseViewerProps) {
  const [failed, setFailed] = useState(false);
  const media = exercise.media;
  const source = media && media.kind !== 'youtube' ? safeMediaSource(media.src) : null;
  const unavailable = failed || Boolean(media && media.kind !== 'youtube' && !source);

  if (unavailable || !media) {
    return (
      <div className="viewer-placeholder">
        <BarbellIcon size={64} weight="light" aria-hidden="true" />
        <strong>{unavailable ? 'Demonstration unavailable' : 'Demonstration coming soon'}</strong>
        <p>{unavailable ? 'This demonstration could not be loaded. Exercise notes are still available below.' : 'Your Bacon Hair demonstration will appear here.'}</p>
      </div>
    );
  }

  if (media.kind === 'youtube') {
    return (
      <div className="viewer-placeholder">
        <PlayIcon size={48} weight="light" aria-hidden="true" />
        <strong>Watch the movement</strong>
        <p>Open the guide to load this demonstration from YouTube.</p>
        <button className="viewer-guide-button" type="button" onClick={onOpenGuide}>
          Open video guide <ArrowUpRightIcon size={17} aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (media.kind === 'image') {
    return <img className="viewer-image" src={source!} alt={media.alt || `${exercise.name} Bacon Hair image concept`} onError={() => setFailed(true)} />;
  }

  return (
    <video className="viewer-image" src={source!} aria-label={`${exercise.name} demonstration`} controls playsInline preload="metadata" onError={() => setFailed(true)}>
      Your browser does not support this exercise video.
    </video>
  );
}

export default function ExerciseViewer({ exercise, onOpenGuide }: ExerciseViewerProps) {
  const captionId = useId();
  return (
    <figure className="exercise-viewer" aria-labelledby={captionId}>
      <div className="viewer-stage">
        <ViewerMedia key={`${exercise.id}:${exercise.media?.kind ?? ''}:${exercise.media?.src ?? ''}`} exercise={exercise} onOpenGuide={onOpenGuide} />
      </div>
      <figcaption className="viewer-caption" id={captionId}>
        <div>
          <strong className="viewer-title">{exercise.name}</strong>
          <span className="viewer-format">{exercise.sets} sets × {exercise.reps} reps</span>
        </div>
        <button className="viewer-guide-button" type="button" onClick={onOpenGuide}>
          Exercise notes <ArrowUpRightIcon size={17} aria-hidden="true" />
        </button>
      </figcaption>
      {exercise.media?.kind === 'image' && <p className="viewer-status">{exercise.media.caption || 'Bacon Hair image concept. Animation is not added yet.'}</p>}
    </figure>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ITEMS, UNITS } from '../content/index';
import { buildSession } from '../core/session';
import { useProgress } from '../state/useProgress';
import { BugStep } from './steps/BugStep';
import { QuizStep } from './steps/QuizStep';
import type { StepResult } from './steps/types';

export function ReviewScreen() {
  const { progress, dispatch, today } = useProgress();
  // Snapshot the queue: answering moves cards out of "due", which must not reshuffle this round.
  const [queue] = useState(() => buildSession(UNITS, progress, today).review);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);

  if (queue.length === 0) {
    return (
      <section className="review-empty">
        <h1>Nothing to review</h1>
        <p>Cards come back 1, 3, 7, 14 and 30 days after you answer them. Today's lesson adds new ones.</p>
        <Link className="btn btn-primary" to="/">
          Back to today
        </Link>
      </section>
    );
  }

  if (index >= queue.length) {
    return (
      <section className="complete">
        <h1>Review done</h1>
        <p className="lead">
          {right} of {queue.length} held up.
        </p>
        <p>Right answers move a card to a longer gap. Misses come back tomorrow, no harm done.</p>
        <Link className="btn btn-primary" to="/">
          Back to today
        </Link>
      </section>
    );
  }

  const id = queue[index];
  const step = ITEMS.get(id)?.step;
  const onDone = (r?: StepResult) => {
    if (r?.correct !== undefined) {
      dispatch({ type: 'answer', itemId: id, correct: r.correct, today });
      if (r.correct) setRight((n) => n + 1);
    }
    setIndex((i) => i + 1);
    window.scrollTo?.({ top: 0 });
  };

  return (
    <div className="lesson">
      <div className="lesson-head">
        <Link to="/" className="btn btn-quiet lesson-close" aria-label="Leave review">
          ✕
        </Link>
        <div
          className="lesson-progress"
          role="progressbar"
          aria-label="Review progress"
          aria-valuemin={0}
          aria-valuemax={queue.length}
          aria-valuenow={index}
        >
          <span style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
      </div>
      <p className="lesson-title muted">
        Review, card {index + 1} of {queue.length}
      </p>
      {step?.kind === 'quiz' ? (
        <QuizStep key={id} step={step} onDone={onDone} />
      ) : step?.kind === 'bug' ? (
        <BugStep key={id} step={step} onDone={onDone} />
      ) : (
        <button type="button" className="btn" onClick={() => onDone()}>
          Skip
        </button>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ITEMS } from '../content/index';
import { useProgress } from '../state/useProgress';
import { StepView } from './steps/StepView';
import type { StepResult } from './steps/types';

export function ItemRoute() {
  const { itemId = '' } = useParams();
  return <ItemScreen key={itemId} itemId={itemId} />;
}

/** Plays a single item on its own: used for re-solving a full problem that has come due. */
export function ItemScreen({ itemId }: { itemId: string }) {
  const { dispatch, today } = useProgress();
  const [result, setResult] = useState<StepResult | null>(null);
  const step = ITEMS.get(itemId)?.step;

  if (!step) {
    return (
      <section>
        <h1>Item not found</h1>
        <p>It may have been renamed. Today's path has everything that's due.</p>
        <Link className="btn" to="/">
          Back to today
        </Link>
      </section>
    );
  }

  if (result) {
    return (
      <section className="complete">
        <h1>{result.correct ? 'Solved again' : 'Done for now'}</h1>
        <p>
          {result.correct
            ? 'It held up. It comes back after a longer gap.'
            : 'It comes back tomorrow. A second pass usually makes it stick.'}
        </p>
        <Link className="btn btn-primary" to="/">
          Back to today
        </Link>
      </section>
    );
  }

  const onDone = (r?: StepResult) => {
    if (r?.correct !== undefined) dispatch({ type: 'answer', itemId, correct: r.correct, today });
    if (r?.selfGrade !== undefined) dispatch({ type: 'selfGrade', itemId, score: r.selfGrade, today });
    setResult(r ?? {});
    window.scrollTo?.({ top: 0 });
  };

  return (
    <div className="lesson">
      <div className="lesson-head">
        <Link to="/" className="btn btn-quiet lesson-close" aria-label="Leave re-solve">
          ✕
        </Link>
      </div>
      <p className="lesson-title muted">Re-solve</p>
      <StepView step={step} onDone={onDone} />
    </div>
  );
}

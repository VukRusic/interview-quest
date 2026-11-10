import { useState } from 'react';
import type { StoryStep as Story } from '../../content/types';
import { useProgress } from '../../state/useProgress';
import type { StepProps } from './types';
import { emptyStar, StoryEditor, wordCount } from './StoryEditor';

const MAX_WORDS = 300; // about two minutes spoken

export function StoryStep({ step, onDone }: StepProps<Story>) {
  const { progress } = useProgress();
  const words = wordCount(progress.stories[step.id] ?? emptyStar());
  const [hasNumber, setHasNumber] = useState(false);
  const [saysI, setSaysI] = useState(false);
  const short = words > 0 && words <= MAX_WORDS;

  return (
    <section className="step story">
      <h2 className="step-prompt">{step.prompt}</h2>
      <p className="private-note">Saved only on this device (and in your export file). Never uploaded.</p>
      {step.hints.length > 0 && (
        <ul className="hints">
          {step.hints.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      <StoryEditor id={step.id} />
      <p className={`word-count ${words > MAX_WORDS ? 'is-over' : ''}`} aria-live="polite">
        {words} words {words > MAX_WORDS ? `(over ${MAX_WORDS}: trim it to stay under 2 minutes)` : `of ${MAX_WORDS}`}
      </p>
      <fieldset className="rubric">
        <legend>Self-check</legend>
        <label className="choice">
          <input type="checkbox" checked={hasNumber} onChange={(e) => setHasNumber(e.target.checked)} />
          <span>Has a number or a concrete result</span>
        </label>
        <label className="choice">
          <input type="checkbox" checked={saysI} onChange={(e) => setSaysI(e.target.checked)} />
          <span>Says "I", not just "we"</span>
        </label>
        <label className="choice">
          <input type="checkbox" checked={short} disabled readOnly />
          <span>Under 2 minutes to say ({MAX_WORDS} words or fewer, checked for you)</span>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={words === 0}
          onClick={() => onDone({ selfGrade: [hasNumber, saysI, short].filter(Boolean).length / 3 })}
        >
          Finish
        </button>
      </fieldset>
    </section>
  );
}

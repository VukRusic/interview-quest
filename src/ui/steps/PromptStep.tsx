import { useState } from 'react';
import type { PromptStep as Prompt } from '../../content/types';
import { estimateTokens } from '../../core/tokens';
import { useProgress } from '../../state/useProgress';
import type { StepProps } from './types';
import { CopyForReview } from './CopyForReview';
import { promptReviewPrompt } from '../reviewPrompt';

/** Longer pastes are cut here so a stray paste cannot fill the browser's storage. */
const MAX_CHARS = 20_000;

/** Write a prompt inside a token budget. The draft is saved with mock answers; the budget line grades itself. */
export function PromptStep({ step, onDone }: StepProps<Prompt>) {
  const { progress, dispatch } = useProgress();
  const [text, setText] = useState(() => progress.mockAnswers[step.id] ?? '');
  const [grading, setGrading] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => step.rubric.map(() => false));

  const used = estimateTokens(text);
  const over = Math.max(0, used - step.budget);
  const fits = used > 0 && over === 0;
  const summary = `About ${used} of ${step.budget} tokens`;

  function edit(value: string) {
    const next = value.slice(0, MAX_CHARS);
    setText(next);
    dispatch({ type: 'saveMockAnswer', id: step.id, text: next });
  }

  return (
    <section className="step prompt-step">
      <p className="muted">Prompt exercise. Nobody is timing you, and nothing you write leaves this device.</p>
      <h2 className="step-prompt">The task</h2>
      <p className="prompt-brief">{step.brief}</p>

      {step.material && (
        <div className="prompt-material">
          <h3>Notes you were given</h3>
          <p className="muted small">About {estimateTokens(step.material)} tokens, more than your budget.</p>
          <div className="prompt-notes" tabIndex={0} role="region" aria-label="Notes you were given">
            {step.material.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      <label className="field">
        <span>Your prompt</span>
        <textarea rows={10} maxLength={MAX_CHARS} value={text} onChange={(e) => edit(e.target.value)} />
      </label>

      <div className={`budget ${over > 0 ? 'is-over' : ''}`}>
        <div
          className="budget-bar"
          role="meter"
          aria-label="Token estimate"
          aria-valuemin={0}
          aria-valuemax={step.budget}
          aria-valuenow={used}
          aria-valuetext={over > 0 ? `${summary}, ${over} over` : summary}
        >
          <span style={{ width: `${Math.min(100, (used / step.budget) * 100)}%` }} />
        </div>
        <p className="budget-text">
          <span>{summary}</span>
          {over > 0 && <strong className="budget-over">{over} over</strong>}
        </p>
        <p className="muted small">
          An estimate: about 4 characters per token. Real counts come from the model provider and differ, more so for code
          and non-English text.
        </p>
      </div>

      {!grading && (
        <button type="button" className="btn btn-primary" disabled={used === 0} onClick={() => setGrading(true)}>
          Grade my prompt
        </button>
      )}
      <CopyForReview getText={() => promptReviewPrompt(step, text)} />

      {grading && (
        <fieldset className="rubric">
          <legend>Does your prompt do these?</legend>
          <p className="muted small">Self-grades count at half weight toward readiness.</p>
          <p className={`choice budget-result ${fits ? 'is-right' : 'is-wrong'}`} data-testid="fits-budget">
            <span aria-hidden="true">{fits ? '✓' : '✗'}</span>
            <span>
              Fits the budget <span className="muted">({fits ? 'checked for you' : `about ${over} over`})</span>
            </span>
          </p>
          {step.rubric.map((r, i) => (
            <label key={r} className="choice">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={(e) => setChecked(checked.map((c, k) => (k === i ? e.target.checked : c)))}
              />
              <span>{r}</span>
            </label>
          ))}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onDone({ selfGrade: (checked.filter(Boolean).length + (fits ? 1 : 0)) / (step.rubric.length + 1) })}
          >
            Finish
          </button>
        </fieldset>
      )}
    </section>
  );
}

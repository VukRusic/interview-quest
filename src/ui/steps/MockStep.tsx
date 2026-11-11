import { useState } from 'react';
import type { MockStep as Mock } from '../../content/types';
import { useProgress } from '../../state/useProgress';
import type { StepProps } from './types';
import { CopyForReview } from './CopyForReview';
import { mockReviewPrompt } from '../reviewPrompt';

const marker = (q: string) => `\n\n### ${q}\n`;

/** One saved text holds the main answer plus each follow-up answer under a heading. */
function split(saved: string | undefined, followUps: string[]): string[] {
  const parts = Array(followUps.length + 1).fill('') as string[];
  if (!saved) return parts;
  let rest = saved;
  for (let i = followUps.length - 1; i >= 0; i--) {
    const at = rest.lastIndexOf(marker(followUps[i]));
    if (at >= 0) {
      parts[i + 1] = rest.slice(at + marker(followUps[i]).length);
      rest = rest.slice(0, at);
    }
  }
  parts[0] = rest;
  return parts;
}

function join(parts: string[], followUps: string[], revealed: number): string {
  let text = parts[0];
  for (let i = 0; i < revealed; i++) text += marker(followUps[i]) + parts[i + 1];
  return text;
}

export function MockStep({ step, onDone }: StepProps<Mock>) {
  const { progress, dispatch } = useProgress();
  const [parts, setParts] = useState(() => split(progress.mockAnswers[step.id], step.followUps));
  const [revealed, setRevealed] = useState(0);
  const [grading, setGrading] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => step.rubric.map(() => false));

  function edit(i: number, value: string) {
    const next = parts.map((p, k) => (k === i ? value : p));
    setParts(next);
    dispatch({ type: 'saveMockAnswer', id: step.id, text: join(next, step.followUps, Math.max(revealed, i)) });
  }

  return (
    <section className="step mock">
      <p className="muted">Mock interview. Answer as you would out loud; nobody is timing you.</p>
      <h2 className="step-prompt">{step.prompt}</h2>
      <label className="field">
        <span>Your answer</span>
        <textarea rows={6} value={parts[0]} onChange={(e) => edit(0, e.target.value)} />
      </label>
      {step.followUps.slice(0, revealed).map((q, i) => (
        <div key={q} className="followup">
          <p className="followup-q">
            <span className="followup-who">Interviewer:</span> {q}
          </p>
          <label className="field">
            <span className="sr-only">Answer to follow-up {i + 1}</span>
            <textarea rows={4} value={parts[i + 1]} onChange={(e) => edit(i + 1, e.target.value)} />
          </label>
        </div>
      ))}
      {!grading && revealed < step.followUps.length && (
        <button type="button" className="btn" onClick={() => setRevealed(revealed + 1)}>
          Next question
        </button>
      )}
      {!grading && revealed >= step.followUps.length && (
        <button type="button" className="btn btn-primary" onClick={() => setGrading(true)}>
          Grade my answer
        </button>
      )}
      <CopyForReview getText={() => mockReviewPrompt(step, join(parts, step.followUps, revealed))} />
      {grading && (
        <fieldset className="rubric">
          <legend>Did your answer cover these?</legend>
          <p className="muted small">Self-grades count at half weight toward readiness.</p>
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
            onClick={() => onDone({ selfGrade: checked.filter(Boolean).length / step.rubric.length })}
          >
            Finish
          </button>
        </fieldset>
      )}
    </section>
  );
}

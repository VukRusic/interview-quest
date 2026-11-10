import { useState } from 'react';
import type { QuizStep as Quiz } from '../../content/types';
import type { StepProps } from './types';
import { Feedback } from './Feedback';

export function QuizStep({ step, onDone }: StepProps<Quiz>) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === step.answer;

  return (
    <section className="step">
      <h2 className="step-prompt">{step.prompt}</h2>
      <div className="options" role="group" aria-label="Answers">
        {step.options.map((opt, i) => {
          const state = !answered ? '' : i === step.answer ? 'is-right' : i === picked ? 'is-wrong' : 'is-dim';
          return (
            <button
              key={i}
              type="button"
              className={`option ${state}`}
              disabled={answered}
              aria-pressed={picked === i}
              onClick={() => setPicked(i)}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <Feedback correct={correct} onContinue={() => onDone({ correct })}>
          <p>{step.why}</p>
        </Feedback>
      )}
    </section>
  );
}

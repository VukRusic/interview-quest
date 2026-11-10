import type { Step } from '../../content/types';
import { BugStep } from './BugStep';
import { ExplainStep } from './ExplainStep';
import { QuizStep } from './QuizStep';
import type { StepResult } from './types';

/** Renders any step kind. Each kind's component owns its own interaction. */
export function StepView({ step, onDone }: { step: Step; onDone: (r?: StepResult) => void }) {
  switch (step.kind) {
    case 'explain':
      return <ExplainStep step={step} onDone={onDone} />;
    case 'quiz':
      return <QuizStep step={step} onDone={onDone} />;
    case 'bug':
      return <BugStep step={step} onDone={onDone} />;
    default:
      return (
        <section className="step">
          <p className="muted">This step type is coming soon.</p>
          <button type="button" className="btn btn-primary" onClick={() => onDone()}>
            Continue
          </button>
        </section>
      );
  }
}

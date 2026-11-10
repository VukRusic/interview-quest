import type { Step } from '../../content/types';
import { BugStep } from './BugStep';
import { ExplainStep } from './ExplainStep';
import { QuizStep } from './QuizStep';
import { PythonStep } from './PythonStep';
import { SandboxStep } from './SandboxStep';
import { MockStep } from './MockStep';
import { StoryStep } from './StoryStep';
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
    case 'python':
      return <PythonStep step={step} onDone={onDone} />;
    case 'sandbox':
      return <SandboxStep step={step} onDone={onDone} />;
    case 'mock':
      return <MockStep step={step} onDone={onDone} />;
    case 'story':
      return <StoryStep step={step} onDone={onDone} />;
  }
}

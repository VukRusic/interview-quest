import Markdown from 'react-markdown';
import type { ExplainStep as Explain } from '../../content/types';
import { VISUALS } from '../visuals';
import type { StepProps } from './types';

export function ExplainStep({ step, onDone }: StepProps<Explain>) {
  const Visual = step.visual ? VISUALS[step.visual] : undefined;
  return (
    <section className="step">
      <h2>{step.title}</h2>
      {Visual && (
        <figure className="visual">
          <Visual />
        </figure>
      )}
      <div className="prose">
        <Markdown>{step.body}</Markdown>
      </div>
      <button type="button" className="btn btn-primary" onClick={() => onDone()}>
        Continue
      </button>
    </section>
  );
}

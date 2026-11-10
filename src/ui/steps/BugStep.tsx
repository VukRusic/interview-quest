import { useState } from 'react';
import { Highlight } from 'prism-react-renderer';
import type { BugStep as Bug } from '../../content/types';
import { codeTheme, LANG_LABEL, PRISM_LANG } from '../code';
import type { StepProps } from './types';
import { Feedback } from './Feedback';

function linesText(lines: number[]): string {
  if (lines.length === 1) return `line ${lines[0]}`;
  return `lines ${lines.slice(0, -1).join(', ')} and ${lines[lines.length - 1]}`;
}

export function BugStep({ step, onDone }: StepProps<Bug>) {
  const [line, setLine] = useState<number | null>(null);
  const [option, setOption] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = line !== null && step.bugLines.includes(line) && option === step.answer;

  return (
    <section className="step">
      <h2 className="step-prompt">Find the bug</h2>
      <p className="muted">Tap the line where it bites, then pick what's wrong.</p>
      <div className="code-card">
        <div className="code-lang">{LANG_LABEL[step.lang]}</div>
        <Highlight code={step.code.replace(/\n$/, '')} language={PRISM_LANG[step.lang]} theme={codeTheme}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre className="code">
              {tokens.map((tokenLine, i) => {
                const n = i + 1;
                const isBug = checked && step.bugLines.includes(n);
                const isMarked = line === n;
                const cls = [
                  'code-line',
                  isMarked ? 'is-marked' : '',
                  isBug ? 'is-bug' : '',
                  checked && isMarked && !isBug ? 'is-miss' : '',
                ].join(' ');
                const { className: _c, ...lineProps } = getLineProps({ line: tokenLine });
                return (
                  <button
                    key={i}
                    type="button"
                    {...lineProps}
                    className={cls}
                    aria-label={`Line ${n}`}
                    aria-pressed={isMarked}
                    disabled={checked}
                    onClick={() => setLine(n)}
                  >
                    <span className="ln" aria-hidden="true">
                      {n}
                    </span>
                    <span className="lc">
                      {tokenLine.map((token, k) => {
                        const { key: _k, ...tp } = getTokenProps({ token });
                        return <span key={k} {...tp} />;
                      })}
                      {'\n'}
                    </span>
                  </button>
                );
              })}
            </pre>
          )}
        </Highlight>
      </div>
      <fieldset className="choices" disabled={checked}>
        <legend>What's the problem?</legend>
        {step.options.map((opt, i) => (
          <label key={i} className={`choice ${checked && i === step.answer ? 'is-right' : ''}`}>
            <input type="radio" name={`bug-${step.id}`} checked={option === i} onChange={() => setOption(i)} />
            <span>{opt}</span>
          </label>
        ))}
      </fieldset>
      {!checked && (
        <button
          type="button"
          className="btn btn-primary"
          disabled={line === null || option === null}
          onClick={() => setChecked(true)}
        >
          Check
        </button>
      )}
      {checked && (
        <Feedback
          correct={correct}
          title={correct ? 'Spotted it.' : `Not quite. The bug is on ${linesText(step.bugLines)}.`}
          onContinue={() => onDone({ correct })}
        >
          <p>{step.why}</p>
          <h4>The fix</h4>
          <p>{step.fix}</p>
        </Feedback>
      )}
    </section>
  );
}

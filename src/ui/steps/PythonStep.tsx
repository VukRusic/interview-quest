import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import Markdown from 'react-markdown';
import type { PythonStep as Py } from '../../content/types';
import { runTests, type RunOutcome } from '../../python/runPython';
import type { StepProps } from './types';
import { Walkthrough } from './Walkthrough';

/** Editor colors come from the same CSS tokens as the read-only snippets, so both themes stay legible. */
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.operatorKeyword, t.bool, t.null], color: 'var(--code-keyword)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--code-string)' },
  { tag: [t.function(t.definition(t.variableName)), t.function(t.variableName), t.className], color: 'var(--code-fn)' },
  { tag: [t.number], color: 'var(--code-number)' },
  { tag: [t.comment], color: 'var(--ink-soft)', fontStyle: 'italic' },
  { tag: [t.operator, t.punctuation, t.bracket], color: 'var(--ink-soft)' },
]);

const extensions = [
  python(),
  syntaxHighlighting(highlight),
  EditorView.contentAttributes.of({ 'aria-label': 'Python code editor' }),
];

/** JSON value → how Python would print it, so expected values read like `got`. */
export function pyRepr(v: unknown): string {
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(v)) return `[${v.map(pyRepr).join(', ')}]`;
  if (typeof v === 'object')
    return `{${Object.entries(v as Record<string, unknown>)
      .map(([k, x]) => `${pyRepr(k)}: ${pyRepr(x)}`)
      .join(', ')}}`;
  return String(v);
}

export function PythonStep({ step, onDone }: StepProps<Py>) {
  const [code, setCode] = useState(step.starter);
  const [running, setRunning] = useState(false);
  const [everRan, setEverRan] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [passed, setPassed] = useState(false);
  const [walkthrough, setWalkthrough] = useState(false);
  const [peeked, setPeeked] = useState(false);

  async function run() {
    setRunning(true);
    const r = await runTests(code, step.fn, step.tests);
    setRunning(false);
    setEverRan(true);
    setOutcome(r);
    if (r.status === 'done' && r.results.every((x) => x.ok)) {
      setPassed(true);
      setWalkthrough(true);
    }
  }

  function showWalkthrough() {
    if (!passed) setPeeked(true);
    setWalkthrough(true);
  }

  const passCount = outcome?.status === 'done' ? outcome.results.filter((x) => x.ok).length : 0;

  return (
    <section className="step">
      <div className="prose">
        <Markdown>{step.prompt}</Markdown>
      </div>
      <div className="editor">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={extensions}
          basicSetup={{ foldGutter: false, highlightActiveLine: false }}
          theme="none"
        />
      </div>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={run} disabled={running}>
          {running ? (everRan ? 'Running…' : 'Loading Python…') : 'Run tests'}
        </button>
        {!walkthrough && (
          <button type="button" className="btn btn-quiet" onClick={showWalkthrough}>
            Show walkthrough
          </button>
        )}
      </div>
      {running && !everRan && (
        <p className="muted" role="status">
          Loading Python… The first run downloads it once; after that it's quick.
        </p>
      )}
      {outcome?.status === 'timeout' && (
        <p className="run-msg is-wrong" role="alert">
          Stopped after 5 s — check for an infinite loop.
        </p>
      )}
      {outcome?.status === 'error' && (
        <pre className="run-msg is-wrong" role="alert">
          {outcome.message}
        </pre>
      )}
      {outcome?.status === 'done' && (
        <div className="results" role="status">
          <p className={passCount === step.tests.length ? 'run-msg is-right' : 'run-msg is-wrong'}>
            {passCount === step.tests.length
              ? `All ${step.tests.length} tests pass.`
              : `${passCount} of ${step.tests.length} tests pass.`}
          </p>
          <ol className="test-list">
            {outcome.results.map((r, i) => (
              <li key={i} className={r.ok ? 'is-right' : 'is-wrong'}>
                <span className="mark" aria-label={r.ok ? 'passed' : 'failed'}>
                  {r.ok ? '✓' : '✗'}
                </span>
                <code>
                  {step.fn}({step.tests[i].args.map(pyRepr).join(', ')})
                </code>
                {!r.ok && (
                  <dl>
                    <dt>expected</dt>
                    <dd>
                      <code>{pyRepr(step.tests[i].expected)}</code>
                    </dd>
                    {r.error ? (
                      <>
                        <dt>error</dt>
                        <dd>
                          <code>{r.error}</code>
                        </dd>
                      </>
                    ) : (
                      <>
                        <dt>got</dt>
                        <dd>
                          <code>{r.got}</code>
                        </dd>
                      </>
                    )}
                  </dl>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
      {walkthrough && <Walkthrough reference={step.reference} frames={step.walkthrough} />}
      {(passed || walkthrough) && (
        <button type="button" className="btn btn-primary" onClick={() => onDone({ correct: passed && !peeked })}>
          Continue
        </button>
      )}
    </section>
  );
}

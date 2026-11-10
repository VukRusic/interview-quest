import { useState } from 'react';
import { Highlight } from 'prism-react-renderer';
import type { PythonStep } from '../../content/types';
import { codeTheme } from '../code';

/** Steps through the reference solution: highlighted line, variable table, a note per frame. */
export function Walkthrough({ reference, frames }: { reference: string; frames: PythonStep['walkthrough'] }) {
  const [i, setI] = useState(0);
  const f = frames[i];
  if (!f) return null;
  const names = Object.keys(f.vars);
  return (
    <div className="walkthrough">
      <h3>Walkthrough</h3>
      <p className="muted">
        Frame {i + 1} of {frames.length}
      </p>
      <div className="code-card">
        <Highlight code={reference.replace(/\n$/, '')} language="python" theme={codeTheme}>
          {({ tokens, getTokenProps }) => (
            <pre className="code">
              {tokens.map((line, k) => (
                <div key={k} className={`code-line ${k + 1 === f.line ? 'is-current' : ''}`}>
                  <span className="ln" aria-hidden="true">
                    {k + 1}
                  </span>
                  <span className="lc">
                    {line.map((token, t) => {
                      const { key: _k, ...tp } = getTokenProps({ token });
                      return <span key={t} {...tp} />;
                    })}
                    {'\n'}
                  </span>
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
      {names.length > 0 && (
        <table className="vars">
          <thead>
            <tr>
              <th scope="col">Variable</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {names.map((n) => (
              <tr key={n}>
                <td>
                  <code>{n}</code>
                </td>
                <td>
                  <code>{f.vars[n]}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="walk-note" aria-live="polite">
        {f.note}
      </p>
      <div className="row">
        <button type="button" className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          Back
        </button>
        <button type="button" className="btn" disabled={i === frames.length - 1} onClick={() => setI(i + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

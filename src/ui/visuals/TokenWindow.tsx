import { useState } from 'react';

const WINDOW = 120;
const INSTRUCTIONS = 10;
const DOCUMENT = 30;
const QUESTION = 6;
const REPLY = 10;

/** What one request carries as a conversation grows: the whole history is sent again on every turn. */
export function TokenWindow() {
  const [turns, setTurns] = useState(1);
  const [doc, setDoc] = useState(false);

  // Request n carries the instructions, the document, n questions and the n-1 earlier replies.
  const sentAt = (n: number) => INSTRUCTIONS + (doc ? DOCUMENT : 0) + n * QUESTION + (n - 1) * REPLY;
  const sent = sentAt(turns);
  const used = sent + REPLY;
  const total = Array.from({ length: turns }, (_, i) => sentAt(i + 1)).reduce((a, b) => a + b, 0);
  const full = sentAt(turns + 1) + REPLY > WINDOW;
  const pct = (n: number) => `${(n / WINDOW) * 100}%`;

  return (
    <div className="viz viz-tokens">
      <div className="viz-controls">
        <label className="switch">
          <input
            type="checkbox"
            checked={doc}
            onChange={(e) => {
              setDoc(e.target.checked);
              setTurns(1);
            }}
          />
          <span>Attach a long document</span>
        </label>
        <button type="button" className="btn" disabled={full} onClick={() => setTurns(turns + 1)}>
          Add a turn
        </button>
      </div>
      <div className="tok-bar" role="img" aria-label={`Context window: ${used} of ${WINDOW} used`}>
        <span className="tok-seg tok-instructions" style={{ width: pct(INSTRUCTIONS) }} />
        {doc && <span className="tok-seg tok-document" style={{ width: pct(DOCUMENT) }} />}
        <span className="tok-seg tok-history" style={{ width: pct(sent - INSTRUCTIONS - (doc ? DOCUMENT : 0)) }} />
        <span className="tok-seg tok-reply" style={{ width: pct(REPLY) }} />
      </div>
      <p className="viz-legend">
        <span className="dot tok-instructions" /> instructions {doc && (<><span className="dot tok-document" /> document </>)}
        <span className="dot tok-history" /> conversation so far <span className="dot tok-reply" /> the reply being written
      </p>
      <dl className="viz-stats">
        <div>
          <dt>Turn</dt>
          <dd>{turns}</dd>
        </div>
        <div>
          <dt>Sent with this request</dt>
          <dd>{sent}</dd>
        </div>
        <div>
          <dt>Sent in total so far</dt>
          <dd>{total}</dd>
        </div>
      </dl>
      <p className="viz-note" aria-live="polite">
        {full
          ? 'The next turn no longer fits in the window. Older turns have to be dropped or summarised.'
          : 'Each turn sends everything again, so the total you pay for grows much faster than the conversation does.'}{' '}
        Illustrative token counts.
      </p>
    </div>
  );
}

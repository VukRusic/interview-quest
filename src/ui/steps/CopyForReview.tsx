import { useState } from 'react';

/** Copies a ready-made prompt so the user can get AI feedback in a chat of their choice, for free. */
export function CopyForReview({ getText }: { getText: () => string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setState('copied');
    } catch {
      setState('failed');
    }
  }
  return (
    <div className="copy-review">
      <button type="button" className="btn" onClick={copy}>
        Copy for AI review
      </button>
      <span className="muted small" role="status">
        {state === 'copied'
          ? 'Copied. Paste it into Claude or ChatGPT for feedback.'
          : state === 'failed'
            ? "Couldn't copy here. Select your answer and copy it by hand."
            : 'Optional: get feedback from an AI chat you already use. Nothing is sent from this app.'}
      </span>
    </div>
  );
}

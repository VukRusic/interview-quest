import { useEffect, useRef, type ReactNode } from 'react';

/** The reveal panel after an answer: right/wrong headline, explanation, Continue. */
export function Feedback({
  correct,
  title,
  children,
  onContinue,
}: {
  correct: boolean;
  title?: string;
  children: ReactNode;
  onContinue: () => void;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus({ preventScroll: false }), []);
  return (
    <div className={`feedback ${correct ? 'is-right' : 'is-wrong'}`} role="status">
      <h3>{title ?? (correct ? 'Right.' : 'Not quite.')}</h3>
      {children}
      <button ref={btn} type="button" className="btn btn-primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

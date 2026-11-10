import type { Star } from '../../state/progress';
import { useProgress } from '../../state/useProgress';

export const STAR_FIELDS: { key: keyof Star; label: string; prompt: string }[] = [
  { key: 'situation', label: 'Situation', prompt: 'Where were you, and what was going on? One or two sentences.' },
  { key: 'task', label: 'Task', prompt: 'What were you responsible for? What was at stake?' },
  { key: 'action', label: 'Action', prompt: 'What did you do, step by step? Say "I", not only "we".' },
  { key: 'result', label: 'Result', prompt: 'What changed? A number helps: time saved, errors cut, users served.' },
];

export const emptyStar = (): Star => ({ situation: '', task: '', action: '', result: '' });

export const wordCount = (s: Star) =>
  Object.values(s)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

/** Four STAR fields bound to progress.stories[id]; every keystroke is saved locally. */
export function StoryEditor({ id }: { id: string }) {
  const { progress, dispatch } = useProgress();
  const star = progress.stories[id] ?? emptyStar();
  return (
    <div className="star">
      {STAR_FIELDS.map((f) => (
        <label key={f.key} className="field">
          <span>{f.label}</span>
          <small className="muted">{f.prompt}</small>
          <textarea
            rows={3}
            aria-label={f.label}
            value={star[f.key]}
            onChange={(e) => dispatch({ type: 'saveStory', id, star: { ...star, [f.key]: e.target.value } })}
          />
        </label>
      ))}
    </div>
  );
}

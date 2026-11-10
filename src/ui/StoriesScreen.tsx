import { useState } from 'react';
import { ITEMS } from '../content/index';
import { useProgress } from '../state/useProgress';
import { emptyStar, StoryEditor, wordCount } from './steps/StoryEditor';
import { Sprite } from './sprites/Sprite';

/** Every story prompt from the content plus any saved story whose prompt was renamed or removed. */
export function StoriesScreen() {
  const { progress } = useProgress();
  const [open, setOpen] = useState<string | null>(null);
  const prompts = new Map<string, string>();
  for (const [id, { step }] of ITEMS) if (step.kind === 'story') prompts.set(id, step.prompt);
  const ids = [...new Set([...Object.keys(progress.stories), ...prompts.keys()])];
  ids.sort((a, b) => wordCount(progress.stories[b] ?? emptyStar()) - wordCount(progress.stories[a] ?? emptyStar()));

  return (
    <section className="stories">
      <h1>
        <Sprite name="scroll" size={4} /> Your stories
      </h1>
      <p className="private-note">
        Saved only on this device (and in your export file). Never uploaded, never in the app's code.
      </p>
      {ids.length === 0 && <p>No story prompts yet. They appear as you reach them on the path.</p>}
      <ul className="story-list">
        {ids.map((id) => {
          const words = wordCount(progress.stories[id] ?? emptyStar());
          return (
            <li key={id} className="story-item">
              <button
                type="button"
                className="story-head"
                aria-expanded={open === id}
                onClick={() => setOpen(open === id ? null : id)}
              >
                <span className="story-title">{prompts.get(id) ?? 'A story (its prompt was removed)'}</span>
                <span className="muted">{words ? `${words} words` : 'Not started'}</span>
              </button>
              {open === id && <StoryEditor id={id} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonScreen } from '../../src/ui/LessonScreen';
import { LessonSchema } from '../../src/content/types';
import { loadProgress } from '../../src/state/progress';
import { memoryStorage, Wrap } from './helpers';

const lesson = LessonSchema.parse({
  id: 'fixture',
  title: 'Fixture lesson',
  pillar: 'design',
  slot: 'lesson',
  steps: [
    { kind: 'explain', title: 'Idea', body: 'Caches keep **hot** data close.' },
    { kind: 'quiz', id: 'fq', topic: 'caching', prompt: 'Pick A', options: ['A', 'B'], answer: 0, why: 'A is right.' },
  ],
});

test('playing a lesson to the end marks it completed today and records the answer', async () => {
  const storage = memoryStorage();
  render(
    <Wrap storage={storage} today="2026-11-10">
      <LessonScreen lesson={lesson} />
    </Wrap>,
  );
  expect(screen.getByRole('heading', { name: 'Idea' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await userEvent.click(screen.getByRole('button', { name: 'A' }));
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
  const saved = loadProgress(storage);
  expect(saved.completed.fixture).toBe('2026-11-10');
  expect(saved.srs.fq?.box).toBe(0);
  expect(saved.streak.current).toBe(1);
});

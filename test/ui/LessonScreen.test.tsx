import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonRoute, LessonScreen } from '../../src/ui/LessonScreen';
import { LessonSchema, UnitSchema } from '../../src/content/types';
import { emptyProgress, loadProgress, saveProgress } from '../../src/state/progress';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProgressProvider } from '../../src/state/useProgress';
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

describe('the daily limit on the lesson route', () => {
  const q = (id: string) => ({ kind: 'quiz', id, topic: 'caching', prompt: `Prompt ${id}`, options: ['A', 'B'], answer: 0, why: 'w' });
  const unit = UnitSchema.parse({
    id: 'u',
    title: 'U',
    lessons: ['a', 'b', 'c', 'd'].map((id) => ({ id, title: `Lesson ${id}`, pillar: 'design', slot: 'lesson', steps: [q(`${id}-q`)] })),
  });

  function at(lessonId: string, completed: Record<string, string>, today = '2026-11-10') {
    const storage = memoryStorage();
    saveProgress({ ...emptyProgress(), completed }, storage);
    const ui = (day: string) => (
      <MemoryRouter initialEntries={[`/lesson/${lessonId}`]}>
        <ProgressProvider storage={storage} today={day}>
          <Routes>
            <Route path="/lesson/:lessonId" element={<LessonRoute units={[unit]} />} />
          </Routes>
        </ProgressProvider>
      </MemoryRouter>
    );
    const view = render(ui(today));
    return { storage, rerenderOn: (day: string) => view.rerender(ui(day)) };
  }

  test('a held lesson opened by address shows "Opens tomorrow" and a way back', () => {
    at('c', { a: '2026-11-10', b: '2026-11-10' });
    expect(screen.getByRole('heading', { name: 'Opens tomorrow' })).toBeInTheDocument();
    expect(screen.getByText('Lesson c')).toBeInTheDocument();
    expect(screen.getByText('You can do two new lessons a day. Reviews and finished lessons stay open.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to today' })).toHaveAttribute('href', '/');
    expect(screen.queryByText('Prompt c-q')).toBeNull();
  });

  test('a lesson further down the trail shows "Not yet"', () => {
    at('d', {});
    expect(screen.getByRole('heading', { name: 'Not yet' })).toBeInTheDocument();
    expect(screen.queryByText('Prompt d-q')).toBeNull();
  });

  test('a lesson finished earlier opens even when held', () => {
    at('a', { a: '2026-11-09', b: '2026-11-10', c: '2026-11-10' });
    expect(screen.getByText('Prompt a-q')).toBeInTheDocument();
  });

  test('one of today’s lessons opens', () => {
    at('b', { a: '2026-11-09' });
    expect(screen.getByText('Prompt b-q')).toBeInTheDocument();
  });

  test('a lesson already open stays open when the day changes and other lessons were finished elsewhere', () => {
    const { storage, rerenderOn } = at('c', { a: '2026-11-09', b: '2026-11-09' });
    expect(screen.getByText('Prompt c-q')).toBeInTheDocument();
    // another tab finishes two other lessons "tomorrow", then this tab's date rolls over
    saveProgress({ ...emptyProgress(), completed: { a: '2026-11-09', b: '2026-11-09', d: '2026-11-11' } }, storage);
    rerenderOn('2026-11-11');
    expect(screen.getByText('Prompt c-q')).toBeInTheDocument();
  });

  test('a held notice does not outlive its day: the lesson opens once the date moves on', () => {
    const { rerenderOn } = at('c', { a: '2026-11-10', b: '2026-11-10' });
    expect(screen.getByRole('heading', { name: 'Opens tomorrow' })).toBeInTheDocument();
    rerenderOn('2026-11-11');
    expect(screen.queryByRole('heading', { name: 'Opens tomorrow' })).toBeNull();
    expect(screen.getByText('Prompt c-q')).toBeInTheDocument();
  });

  test('a lesson open across midnight can be finished and counts toward the new day', async () => {
    const { storage, rerenderOn } = at('c', { a: '2026-11-09', b: '2026-11-09' });
    rerenderOn('2026-11-11');
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
    expect(loadProgress(storage).completed.c).toBe('2026-11-11');
  });

  test('finishing the second lesson of the day shows its completion screen, not the held notice', async () => {
    at('b', { a: '2026-11-10' });
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument();
  });

  test('an unknown lesson id still shows "Lesson not found"', () => {
    at('zzz', {});
    expect(screen.getByRole('heading', { name: 'Lesson not found' })).toBeInTheDocument();
  });
});

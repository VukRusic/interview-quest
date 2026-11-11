import { render, screen, within } from '@testing-library/react';
import { HomeScreen } from '../../src/ui/HomeScreen';
import { UnitSchema } from '../../src/content/types';
import { Wrap } from './helpers';

const quiz = (id: string, topic = 'caching') => ({ kind: 'quiz', id, topic, prompt: 'p', options: ['a', 'b'], answer: 0, why: 'w' });
const unit = UnitSchema.parse({
  id: 'u1',
  title: 'Foundations',
  lessons: [
    { id: 'l1', title: 'The answer flow', pillar: 'design', slot: 'lesson', steps: [quiz('q1')] },
    { id: 'p1', title: 'Slow page', pillar: 'design', slot: 'practice', steps: [quiz('q2')] },
    { id: 'l2', title: 'Caching', pillar: 'design', slot: 'lesson', steps: [quiz('q3')] },
  ],
});

test('fresh progress: first lesson is next and the streak reads 0 days', () => {
  render(
    <Wrap>
      <HomeScreen units={[unit]} />
    </Wrap>,
  );
  expect(screen.getByText('0 day streak')).toBeInTheDocument();
  const path = screen.getByRole('list', { name: /unit path/i });
  const next = within(path).getByText('Next').closest('li')!;
  expect(next).toHaveTextContent('The answer flow');
  expect(within(path).getByText('Caching').closest('li')).toHaveTextContent(/locked/i);
});

test('self-graded topics are labelled as self-graded, never as learned', async () => {
  const { memoryStorage } = await import('./helpers');
  const { saveProgress, emptyProgress } = await import('../../src/state/progress');
  const storyUnit = UnitSchema.parse({
    id: 'u2',
    title: 'Stories',
    lessons: [
      { id: 's', title: 'Story', pillar: 'stories', slot: 'extra', steps: [{ kind: 'story', id: 'st', topic: 'behavioural', prompt: 'p', hints: [] }] },
    ],
  });
  const storage = memoryStorage();
  saveProgress({ ...emptyProgress(), selfGrades: { st: 1 } }, storage);
  render(
    <Wrap storage={storage}>
      <HomeScreen units={[storyUnit]} />
    </Wrap>,
  );
  const meter = screen.getByRole('meter', { name: 'Behavioural stories' });
  const row = meter.closest('li')!;
  expect(row).toHaveTextContent('self-graded');
  expect(row).not.toHaveTextContent(/learned/);
});

describe('streak hint says whether today is done yet', () => {
  async function homeWith(streak: { current: number; best: number; lastDay: string | null }, today: string) {
    const { memoryStorage } = await import('./helpers');
    const { saveProgress, emptyProgress } = await import('../../src/state/progress');
    const storage = memoryStorage();
    saveProgress({ ...emptyProgress(), streak }, storage);
    render(
      <Wrap storage={storage} today={today}>
        <HomeScreen units={[unit]} />
      </Wrap>,
    );
  }

  test('streak alive but today not done → says how to extend it', async () => {
    await homeWith({ current: 1, best: 1, lastDay: '2026-11-10' }, '2026-11-11');
    expect(screen.getByText('1 day streak')).toBeInTheDocument();
    expect(screen.getByText('Do one card or lesson today to make it 2.')).toBeInTheDocument();
  });

  test('today already done → says so', async () => {
    await homeWith({ current: 2, best: 2, lastDay: '2026-11-11' }, '2026-11-11');
    expect(screen.getByText('Done for today.')).toBeInTheDocument();
  });

  test('streak broken or never started → invites a fresh start', async () => {
    await homeWith({ current: 5, best: 5, lastDay: '2026-11-01' }, '2026-11-11');
    expect(screen.getByText('0 day streak')).toBeInTheDocument();
    expect(screen.getByText('Do one card or lesson today to start a streak.')).toBeInTheDocument();
  });
});

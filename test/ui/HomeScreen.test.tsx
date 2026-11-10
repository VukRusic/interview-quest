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

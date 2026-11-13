import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizStep } from '../../src/ui/steps/QuizStep';
import type { QuizStep as Quiz } from '../../src/content/types';

const step: Quiz = {
  kind: 'quiz',
  id: 'q1',
  topic: 'caching',
  prompt: 'What does a cache hit save?',
  options: ['A database round trip', 'Disk space', 'Nothing'],
  answer: 0,
  why: 'The value comes from memory instead of the database.',
};

test('a wrong pick reveals why, then Continue reports correct:false', async () => {
  const onDone = vi.fn();
  render(<QuizStep step={step} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: /Disk space/ }));
  expect(screen.getByText(step.why)).toBeVisible();
  expect(onDone).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(onDone).toHaveBeenCalledWith({ correct: false });
});

test('the right pick reports correct:true', async () => {
  const onDone = vi.fn();
  render(<QuizStep step={step} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: /A database round trip/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true });
});

test('shows the look-up phrase only after answering', async () => {
  render(<QuizStep step={{ ...step, lookUp: 'consistent hashing' }} onDone={() => {}} />);
  expect(screen.queryByText(/Look up:/)).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: /Disk space/ }));
  expect(screen.getByText('Look up: consistent hashing')).toBeInTheDocument();
});

test('no look-up line when the step has none', async () => {
  render(<QuizStep step={step} onDone={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: /Disk space/ }));
  expect(screen.queryByText(/Look up:/)).toBeNull();
});

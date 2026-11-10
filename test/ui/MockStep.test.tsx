import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockStep } from '../../src/ui/steps/MockStep';
import type { MockStep as Mock } from '../../src/content/types';
import { loadProgress } from '../../src/state/progress';
import { memoryStorage, Wrap } from './helpers';

const step: Mock = {
  kind: 'mock',
  id: 'm1',
  topic: 'design-flow',
  prompt: 'Design a URL shortener.',
  followUps: ['How many writes per second?'],
  rubric: ['Clarified requirements', 'Estimated scale', 'Discussed trade-offs'],
};

test('follow-ups reveal one at a time, the answer autosaves, and 2 of 3 rubric items → selfGrade 2/3', async () => {
  const storage = memoryStorage();
  const onDone = vi.fn();
  render(
    <Wrap storage={storage}>
      <MockStep step={step} onDone={onDone} />
    </Wrap>,
  );
  expect(screen.queryByText(step.followUps[0])).not.toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/your answer/i), 'Short codes in a KV store');
  await userEvent.click(screen.getByRole('button', { name: 'Next question' }));
  expect(screen.getByText(step.followUps[0])).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/answer to follow-up 1/i), 'About 100');
  expect(loadProgress(storage).mockAnswers.m1).toContain('Short codes in a KV store');
  expect(loadProgress(storage).mockAnswers.m1).toContain('About 100');

  await userEvent.click(screen.getByRole('button', { name: 'Grade my answer' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Clarified requirements' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Discussed trade-offs' }));
  await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
  expect(onDone).toHaveBeenCalledWith({ selfGrade: 2 / 3 });
});

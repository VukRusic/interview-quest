import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryStep } from '../../src/ui/steps/StoryStep';
import type { StoryStep as Story } from '../../src/content/types';
import { loadProgress } from '../../src/state/progress';
import { memoryStorage, Wrap } from './helpers';

const step: Story = {
  kind: 'story',
  id: 'story-1',
  topic: 'behavioural',
  prompt: 'Tell me about a system you built.',
  hints: ['Think about the API gateway work.'],
};

function setup() {
  const storage = memoryStorage();
  const onDone = vi.fn();
  render(
    <Wrap storage={storage}>
      <StoryStep step={step} onDone={onDone} />
    </Wrap>,
  );
  return { storage, onDone };
}

test('typing persists to the store under the step id and says it stays on this device', async () => {
  const { storage } = setup();
  expect(screen.getByText(/saved only on this device/i)).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Situation'), 'Legacy gateway');
  await userEvent.type(screen.getByLabelText('Result'), 'Cut p95 by 40%');
  const saved = loadProgress(storage).stories['story-1'];
  expect(saved.situation).toBe('Legacy gateway');
  expect(saved.result).toBe('Cut p95 by 40%');
});

test('the word counter updates live', async () => {
  setup();
  expect(screen.getByText(/^0 words of/)).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Action'), 'I rewrote the routing layer');
  expect(screen.getByText(/^5 words of/)).toBeInTheDocument();
});

test('the self-check gives a self-grade', async () => {
  const { onDone } = setup();
  await userEvent.type(screen.getByLabelText('Action'), 'I led it');
  await userEvent.click(screen.getByRole('checkbox', { name: /says "I"/i }));
  await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
  // "I" checked + under-300-words (automatic) = 2 of 3
  expect(onDone).toHaveBeenCalledWith({ selfGrade: 2 / 3 });
});

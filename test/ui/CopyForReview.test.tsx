import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockReviewPrompt, storyReviewPrompt } from '../../src/ui/reviewPrompt';
import { MockStep } from '../../src/ui/steps/MockStep';
import type { MockStep as Mock, StoryStep as Story } from '../../src/content/types';
import { Wrap } from './helpers';

const mock: Mock = {
  kind: 'mock',
  id: 'm',
  topic: 'design-flow',
  prompt: 'Design a URL shortener.',
  followUps: ['How do you generate codes?'],
  rubric: ['Asked about requirements', 'Gave estimates'],
};
const story: Story = { kind: 'story', id: 's', topic: 'behavioural', prompt: 'Tell me about a system you built.', hints: [] };

test('the mock prompt holds the question, follow-ups, the answer and the rubric', () => {
  const text = mockReviewPrompt(mock, 'My answer.\n\n### How do you generate codes?\nBase62.');
  for (const part of [mock.prompt, mock.followUps[0], 'My answer.', 'Base62.', ...mock.rubric]) expect(text).toContain(part);
  expect(text).toMatch(/interviewer/i);
});

test('the story prompt holds the STAR fields and the self-check', () => {
  const text = storyReviewPrompt(story, { situation: 'Sit', task: 'Tsk', action: 'Act', result: 'Res' });
  for (const part of [story.prompt, 'Situation: Sit', 'Task: Tsk', 'Action: Act', 'Result: Res', 'concrete result']) expect(text).toContain(part);
});

test('the mock step copies the review prompt to the clipboard', async () => {
  const user = userEvent.setup();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  render(
    <Wrap>
      <MockStep step={mock} onDone={vi.fn()} />
    </Wrap>,
  );
  await user.type(screen.getByLabelText(/your answer/i), 'Short codes in a KV store');
  await user.click(screen.getByRole('button', { name: /copy for ai review/i }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Short codes in a KV store'));
  expect(await screen.findByText(/copied/i)).toBeInTheDocument();
});

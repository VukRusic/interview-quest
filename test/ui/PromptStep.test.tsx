import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptStep } from '../../src/ui/steps/PromptStep';
import type { PromptStep as Prompt } from '../../src/content/types';
import { loadProgress } from '../../src/state/progress';
import { promptReviewPrompt } from '../../src/ui/reviewPrompt';
import { memoryStorage, Wrap } from './helpers';

const step: Prompt = {
  kind: 'prompt',
  id: 'pr1',
  topic: 'ai-prompts',
  brief: 'Write a system prompt for a support assistant.',
  material: 'Policy notes. '.repeat(40),
  budget: 100,
  rubric: ['States the task', 'Gives the output format', 'No filler'],
};

function show(storage = memoryStorage(), onDone = vi.fn()) {
  const view = render(
    <Wrap storage={storage}>
      <PromptStep step={step} onDone={onDone} />
    </Wrap>,
  );
  const box = screen.getByLabelText('Your prompt') as HTMLTextAreaElement;
  const write = (text: string) => fireEvent.change(box, { target: { value: text } });
  const meter = () => screen.getByRole('meter', { name: /token estimate/i });
  return { storage, onDone, box, write, meter, view };
}
const gradeBtn = () => screen.getByRole('button', { name: 'Grade my prompt' });

test('shows the brief and the notes with their own count', () => {
  show();
  expect(screen.getByText(step.brief)).toBeInTheDocument();
  expect(screen.getByText('Notes you were given')).toBeInTheDocument();
  expect(screen.getByText('About 140 tokens, more than your budget.')).toBeInTheDocument();
});

test('the meter follows the text: 100 characters reads "About 25 of 100 tokens"', () => {
  const { write, meter } = show();
  expect(meter()).toHaveAttribute('aria-valuetext', 'About 0 of 100 tokens');
  write('x'.repeat(100));
  expect(meter()).toHaveAttribute('aria-valuetext', 'About 25 of 100 tokens');
  expect(meter()).toHaveAttribute('aria-valuenow', '25');
  expect(meter()).toHaveAttribute('aria-valuemax', '100');
  expect(screen.getByText('About 25 of 100 tokens')).toBeInTheDocument();
});

test('over budget says how far over in words and still allows grading', () => {
  const { write, meter } = show();
  write('x'.repeat(480));
  expect(meter()).toHaveAttribute('aria-valuetext', 'About 120 of 100 tokens, 20 over');
  expect(screen.getByText('20 over')).toBeInTheDocument();
  expect(gradeBtn()).toBeEnabled();
});

test('an empty or whitespace-only prompt cannot be graded', () => {
  const { write } = show();
  expect(gradeBtn()).toBeDisabled();
  write('   \n ');
  expect(gradeBtn()).toBeDisabled();
  write('Reply briefly.');
  expect(gradeBtn()).toBeEnabled();
});

test('says the count is an estimate', () => {
  show();
  expect(
    screen.getByText(
      'An estimate: about 4 characters per token. Real counts come from the model provider and differ, more so for code and non-English text.',
    ),
  ).toBeInTheDocument();
});

test('the draft is saved as it is typed and restored when the step is shown again', async () => {
  const first = show();
  await userEvent.type(first.box, 'You draft refund replies.');
  expect(loadProgress(first.storage).mockAnswers.pr1).toBe('You draft refund replies.');
  first.view.unmount();
  const again = show(first.storage);
  expect(again.box.value).toBe('You draft refund replies.');
});

test('within budget with 2 of 3 rubric lines ticked → selfGrade 3/4', async () => {
  const { write, onDone } = show();
  write('x'.repeat(100));
  await userEvent.click(gradeBtn());
  await userEvent.click(screen.getByRole('checkbox', { name: 'States the task' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'No filler' }));
  await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
  expect(onDone).toHaveBeenCalledWith({ selfGrade: 3 / 4 });
});

test('over budget with 3 of 3 ticked → selfGrade 3/4', async () => {
  const { write, onDone } = show();
  write('x'.repeat(480));
  await userEvent.click(gradeBtn());
  for (const r of step.rubric) await userEvent.click(screen.getByRole('checkbox', { name: r }));
  await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
  expect(onDone).toHaveBeenCalledWith({ selfGrade: 3 / 4 });
});

test('"Fits the budget" is shown as a result, not a checkbox', async () => {
  const { write } = show();
  write('x'.repeat(100));
  await userEvent.click(gradeBtn());
  expect(screen.getByText(/Fits the budget/)).toBeInTheDocument();
  expect(screen.queryByRole('checkbox', { name: /Fits the budget/ })).toBeNull();
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
});

test('editing after grading started updates the budget result', async () => {
  const { write } = show();
  write('x'.repeat(100));
  await userEvent.click(gradeBtn());
  expect(screen.getByTestId('fits-budget')).toHaveTextContent('✓');
  write('x'.repeat(480));
  expect(screen.getByTestId('fits-budget')).toHaveTextContent('✗');
});

test('a 20,000 character paste is accepted, counted as about 5000 tokens, and saved', () => {
  const { write, meter, storage, box } = show();
  write('y'.repeat(20_000));
  expect(meter()).toHaveAttribute('aria-valuetext', 'About 5000 of 100 tokens, 4900 over');
  expect(loadProgress(storage).mockAnswers.pr1).toHaveLength(20_000);
  expect(box).toHaveAttribute('maxlength', '20000');
});

test('emoji and non-Latin text render a count without throwing', () => {
  const { write, meter } = show();
  write('返金について 👍👍 こんにちは');
  expect(meter().getAttribute('aria-valuetext')).toMatch(/^About \d+ of 100 tokens$/);
});

test('the review text contains the brief, the budget, the estimate, the draft and every rubric line', () => {
  const text = promptReviewPrompt(step, 'You draft refund replies.');
  expect(text).toContain(step.brief);
  expect(text).toContain('100 tokens');
  expect(text).toContain('about 7 tokens');
  expect(text).toContain('You draft refund replies.');
  for (const r of step.rubric) expect(text).toContain(r);
  expect(promptReviewPrompt(step, '  ')).toContain('(no prompt written yet)');
});

test('a prompt emptied after grading started cannot be finished', async () => {
  const { write, onDone } = show();
  write('Reply briefly.');
  await userEvent.click(gradeBtn());
  for (const r of step.rubric) await userEvent.click(screen.getByRole('checkbox', { name: r }));
  write('   ');
  expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
  expect(screen.getByTestId('fits-budget')).toHaveTextContent('Nothing written yet');
  expect(screen.getByTestId('fits-budget')).not.toHaveTextContent('0 over');
  write('Reply briefly.');
  await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
  expect(onDone).toHaveBeenCalledTimes(1);
});

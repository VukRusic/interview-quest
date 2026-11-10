import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BugStep } from '../../src/ui/steps/BugStep';
import type { BugStep as Bug } from '../../src/content/types';

const step: Bug = {
  kind: 'bug',
  id: 'b1',
  topic: 'async',
  lang: 'csharp',
  code: 'public class A\n{\n    async void OnClick() => await Save();\n}',
  bugLines: [3],
  options: ['Missing semicolon', 'async void swallows exceptions'],
  answer: 1,
  why: 'Exceptions from async void crash the process instead of reaching the caller.',
  fix: 'Return Task and await it.',
};

async function play(line: number, option: RegExp) {
  const onDone = vi.fn();
  render(<BugStep step={step} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: `Line ${line}` }));
  await userEvent.click(screen.getByRole('radio', { name: option }));
  await userEvent.click(screen.getByRole('button', { name: 'Check' }));
  expect(screen.getByText(step.why)).toBeVisible();
  expect(screen.getByText(step.fix)).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  return onDone;
}

test('right line and right option → correct', async () => {
  expect(await play(3, /async void/)).toHaveBeenCalledWith({ correct: true });
});

test('right option on the wrong line → not correct', async () => {
  expect(await play(1, /async void/)).toHaveBeenCalledWith({ correct: false });
});

test('right line with the wrong option → not correct', async () => {
  expect(await play(3, /semicolon/)).toHaveBeenCalledWith({ correct: false });
});

test('a miss names every bug line in plain words', async () => {
  render(<BugStep step={{ ...step, bugLines: [1, 3] }} onDone={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Line 2' }));
  await userEvent.click(screen.getByRole('radio', { name: /async void/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Check' }));
  expect(screen.getByText('Not quite. The bug is on lines 1 and 3.')).toBeInTheDocument();
});

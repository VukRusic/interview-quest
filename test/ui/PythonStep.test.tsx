import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PythonStep as Py } from '../../src/content/types';

const runTests = vi.fn();
vi.mock('../../src/python/runPython', () => ({ runTests: (...a: unknown[]) => runTests(...a) }));
// CodeMirror needs layout APIs jsdom lacks; a textarea stands in for the editor in tests.
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Code editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const { PythonStep } = await import('../../src/ui/steps/PythonStep');

const step: Py = {
  kind: 'python',
  id: 'p1',
  topic: 'two-pointers',
  prompt: 'Return the indices of two numbers that add up to target.',
  fn: 'pair_with_sum',
  starter: 'def pair_with_sum(nums, target):\n    pass\n',
  tests: [
    { args: [[1, 2, 3], 5], expected: [1, 2] },
    { args: [[], 1], expected: null },
  ],
  walkthrough: [
    { line: 1, vars: { left: '0', right: '2' }, note: 'Start at both ends.' },
    { line: 2, vars: { left: '1', right: '2' }, note: 'Sum is 5. Found it.' },
  ],
  reference: 'def pair_with_sum(nums, target):\n    return None\n',
};

beforeEach(() => runTests.mockReset());

test('all tests passing unlocks the walkthrough and reports correct:true', async () => {
  runTests.mockResolvedValue({
    status: 'done',
    results: [
      { ok: true, got: '[1, 2]', error: null },
      { ok: true, got: 'None', error: null },
    ],
  });
  const onDone = vi.fn();
  render(<PythonStep step={step} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: 'Run tests' }));
  expect(await screen.findByText(/all 2 tests pass/i)).toBeInTheDocument();
  expect(screen.getByText('Start at both ends.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Sum is 5. Found it.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(onDone).toHaveBeenCalledWith({ correct: true });
  expect(runTests).toHaveBeenCalledWith(step.starter, 'pair_with_sum', step.tests);
});

test('a timeout shows the infinite-loop message', async () => {
  runTests.mockResolvedValue({ status: 'timeout' });
  render(<PythonStep step={step} onDone={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Run tests' }));
  expect(await screen.findByText('Stopped after 5 s — check for an infinite loop.')).toBeInTheDocument();
});

test('a failing test shows got and expected', async () => {
  runTests.mockResolvedValue({
    status: 'done',
    results: [
      { ok: false, got: 'None', error: null },
      { ok: true, got: 'None', error: null },
    ],
  });
  render(<PythonStep step={step} onDone={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Run tests' }));
  expect(await screen.findByText(/1 of 2 tests pass/i)).toBeInTheDocument();
  expect(screen.getByText('[1, 2]')).toBeInTheDocument();
});

test('showing the walkthrough before passing reports correct:false', async () => {
  const onDone = vi.fn();
  render(<PythonStep step={step} onDone={onDone} />);
  await userEvent.click(screen.getByRole('button', { name: 'Show walkthrough' }));
  expect(screen.getByText('Start at both ends.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(onDone).toHaveBeenCalledWith({ correct: false });
});

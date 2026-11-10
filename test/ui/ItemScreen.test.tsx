import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemScreen } from '../../src/ui/ItemScreen';
import { loadProgress, saveProgress, emptyProgress } from '../../src/state/progress';
import { ITEMS } from '../../src/content/index';
import { memoryStorage, Wrap } from './helpers';

test('re-solving a single item records the answer on its schedule', async () => {
  const id = 'df-first-move';
  const step = ITEMS.get(id)!.step;
  if (step.kind !== 'quiz') throw new Error('fixture expects a quiz');
  const storage = memoryStorage();
  saveProgress({ ...emptyProgress(), srs: { [id]: { id, box: 0, due: '2026-11-10', lastAnswered: '2026-11-09' } } }, storage);
  render(
    <Wrap storage={storage} today="2026-11-10">
      <ItemScreen itemId={id} />
    </Wrap>,
  );
  await userEvent.click(screen.getByRole('button', { name: step.options[step.answer] }));
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(loadProgress(storage).srs[id]).toMatchObject({ box: 1, due: '2026-11-13' });
  expect(screen.getByText(/back to today/i)).toBeInTheDocument();
});

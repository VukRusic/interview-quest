import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsScreen } from '../../src/ui/SettingsScreen';
import { emptyProgress, exportProgress, loadProgress, progressReducer, saveProgress } from '../../src/state/progress';
import { memoryStorage, Wrap } from './helpers';

function seeded() {
  const storage = memoryStorage();
  const p = progressReducer(emptyProgress(), { type: 'answer', itemId: 'q1', correct: true, today: '2026-11-09' });
  saveProgress(p, storage);
  return { storage, p };
}

test('importing invalid JSON shows the error and leaves progress unchanged', async () => {
  const { storage, p } = seeded();
  render(
    <Wrap storage={storage}>
      <SettingsScreen />
    </Wrap>,
  );
  const file = new File(['{oops'], 'bad.json', { type: 'application/json' });
  await userEvent.upload(screen.getByLabelText(/import progress/i), file);
  expect(await screen.findByRole('alert')).toHaveTextContent(/not valid JSON/i);
  expect(loadProgress(storage)).toEqual(p);
});

test('a valid import asks for confirmation before replacing', async () => {
  const { storage, p } = seeded();
  render(
    <Wrap storage={storage}>
      <SettingsScreen />
    </Wrap>,
  );
  const incoming = progressReducer(emptyProgress(), { type: 'completeLesson', lessonId: 'x', today: '2026-11-01' });
  await userEvent.upload(screen.getByLabelText(/import progress/i), new File([exportProgress(incoming)], 'ok.json'));
  expect(await screen.findByText(/replace your current progress/i)).toBeInTheDocument();
  expect(loadProgress(storage)).toEqual(p);
  await userEvent.click(screen.getByRole('button', { name: 'Replace progress' }));
  expect(loadProgress(storage)).toEqual(incoming);
});

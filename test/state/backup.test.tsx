import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { backupStatus, requestPersistentStorage } from '../../src/state/backup';
import { emptyProgress, importProgress, exportProgress, progressReducer, saveProgress, loadProgress } from '../../src/state/progress';
import { HomeScreen } from '../../src/ui/HomeScreen';
import { SettingsScreen } from '../../src/ui/SettingsScreen';
import { memoryStorage, Wrap } from '../ui/helpers';

const T = '2026-11-20';
const withLessons = (n: number) => {
  const completed: Record<string, string> = {};
  for (let i = 0; i < n; i++) completed[`l${i}`] = '2026-11-10';
  return { ...emptyProgress(), completed };
};

describe('backupStatus', () => {
  test('no reminder for a brand-new user', () => {
    expect(backupStatus(emptyProgress(), T)).toEqual({ lastExport: null, daysSince: null, remind: false });
  });
  test('reminds once there is real progress and no backup', () => {
    expect(backupStatus(withLessons(3), T).remind).toBe(true);
  });
  test('reminds again 14 days after the last backup, not before', () => {
    const p = { ...withLessons(3), lastExport: '2026-11-10' };
    expect(backupStatus(p, '2026-11-23')).toMatchObject({ daysSince: 13, remind: false });
    expect(backupStatus(p, '2026-11-24')).toMatchObject({ daysSince: 14, remind: true });
  });
});

test('markExported records the day and survives export → import', () => {
  const p = progressReducer(withLessons(1), { type: 'markExported', today: T });
  expect(p.lastExport).toBe(T);
  const r = importProgress(exportProgress(p));
  expect(r.ok && r.progress.lastExport).toBe(T);
});

test('old progress without lastExport still loads', () => {
  const r = importProgress(JSON.stringify(emptyProgress()));
  expect(r.ok).toBe(true);
});

test('Home shows a backup reminder linking to Settings', () => {
  const storage = memoryStorage();
  saveProgress(withLessons(3), storage);
  render(
    <Wrap storage={storage} today={T}>
      <HomeScreen units={[]} />
    </Wrap>,
  );
  expect(screen.getByRole('link', { name: /back up your progress/i })).toHaveAttribute('href', '/settings');
});

test('Settings shows the last backup and exporting records it', async () => {
  const storage = memoryStorage();
  saveProgress({ ...withLessons(3), lastExport: '2026-11-15' }, storage);
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  render(
    <Wrap storage={storage} today={T}>
      <SettingsScreen />
    </Wrap>,
  );
  expect(screen.getByText(/last backup: 5 days ago/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Export progress' }));
  expect(loadProgress(storage).lastExport).toBe(T);
  expect(screen.getByText(/last backup: today/i)).toBeInTheDocument();
});

describe('requestPersistentStorage', () => {
  afterEach(() => vi.unstubAllGlobals());
  test('asks once when supported and not yet persisted', async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal('navigator', { storage: { persisted: async () => false, persist } });
    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });
  test('does nothing when already persisted', async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal('navigator', { storage: { persisted: async () => true, persist } });
    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).not.toHaveBeenCalled();
  });
  test('is harmless where the API is missing or throws', async () => {
    vi.stubGlobal('navigator', {});
    expect(await requestPersistentStorage()).toBe(false);
    vi.stubGlobal('navigator', { storage: { persisted: async () => { throw new Error('x'); }, persist: vi.fn() } });
    expect(await requestPersistentStorage()).toBe(false);
  });
});

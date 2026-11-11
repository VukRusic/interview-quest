import { daysBetween, type DayKey } from '../core/dates';
import type { Progress } from './progress';

const REMIND_AFTER_DAYS = 14;
const REMIND_AFTER_LESSONS = 3;

export type BackupStatus = { lastExport: DayKey | null; daysSince: number | null; remind: boolean };

/** Progress lives only in this browser, so nudge an export once there is something worth keeping. */
export function backupStatus(p: Progress, today: DayKey): BackupStatus {
  const lastExport = p.lastExport ?? null;
  const daysSince = lastExport ? daysBetween(lastExport, today) : null;
  const hasProgress = Object.keys(p.completed).length >= REMIND_AFTER_LESSONS || Object.keys(p.stories).length > 0;
  const remind = hasProgress && (daysSince === null || daysSince >= REMIND_AFTER_DAYS);
  return { lastExport, daysSince, remind };
}

export function describeLastBackup(s: BackupStatus): string {
  if (s.daysSince === null) return 'Last backup: never';
  if (s.daysSince <= 0) return 'Last backup: today';
  if (s.daysSince === 1) return 'Last backup: yesterday';
  return `Last backup: ${s.daysSince} days ago`;
}

/**
 * Ask the browser to keep this site's storage even under storage pressure. Browsers decide
 * silently (Firefox may ask the user), so call it only once the user has real progress.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const storage = (globalThis.navigator as Navigator | undefined)?.storage;
    if (!storage?.persist || !storage.persisted) return false;
    if (await storage.persisted()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

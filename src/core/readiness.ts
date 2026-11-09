import { ITEMS, type ItemIndex } from '../content/index';
import type { SrsItem } from './srs';

export type ReadinessInput = {
  srs: Record<string, SrsItem>;
  selfGrades: Record<string, number>;
  completed: Record<string, string>;
};

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/**
 * 0..1 for one topic. Auto-checked items earn box/4 (box 0 = never proven yet);
 * self-graded items (mock, story) earn half their self-grade. Unknown ids are ignored.
 */
export function readiness(topic: string, progress: ReadinessInput, items: ItemIndex = ITEMS): number {
  let earned = 0;
  let count = 0;
  for (const [id, { step }] of items) {
    if (step.topic !== topic) continue;
    count++;
    if (step.kind === 'mock' || step.kind === 'story') {
      earned += 0.5 * clamp01(progress.selfGrades[id] ?? 0);
    } else {
      const s = progress.srs[id];
      earned += s ? clamp01(s.box / 4) : 0;
    }
  }
  return count === 0 ? 0 : earned / count;
}

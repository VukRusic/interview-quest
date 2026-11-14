import { ITEMS, type ItemIndex } from '../content/index';
import { isSelfKind } from '../content/types';
import type { Progress } from '../state/progress';

export type ReadinessInput = Pick<Progress, 'srs' | 'selfGrades' | 'completed'>;

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

const SELF_WEIGHT = 0.5;

/**
 * 0..1 for one topic: what its items have earned over what they can earn. An auto-checked item can
 * earn 1 and earns box/4 (box 0 = never proven yet). A self-graded item (mock, story, prompt) can earn half
 * and earns half its self-grade, so it weighs half next to auto work but a self-graded-only topic
 * can still reach 1. Unknown ids are ignored.
 */
export function readiness(topic: string, progress: ReadinessInput, items: ItemIndex = ITEMS): number {
  let earned = 0;
  let max = 0;
  for (const [id, { step }] of items) {
    if (step.topic !== topic) continue;
    if (isSelfKind(step.kind)) {
      max += SELF_WEIGHT;
      earned += SELF_WEIGHT * clamp01(progress.selfGrades[id] ?? 0);
    } else {
      max += 1;
      const s = progress.srs[id];
      earned += s ? clamp01(s.box / 4) : 0;
    }
  }
  return max === 0 ? 0 : earned / max;
}

/** 0..1: the share of a topic's items answered or self-graded at least once. Says nothing about recall. */
export function practised(topic: string, progress: ReadinessInput, items: ItemIndex = ITEMS): number {
  let done = 0;
  let count = 0;
  for (const [id, { step }] of items) {
    if (step.topic !== topic) continue;
    count++;
    if (isSelfKind(step.kind) ? progress.selfGrades[id] !== undefined : progress.srs[id] !== undefined) done++;
  }
  return count === 0 ? 0 : done / count;
}

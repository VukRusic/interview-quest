import { indexItems } from '../content/index';
import type { Pillar, Unit } from '../content/types';
import { readiness } from '../core/readiness';
import { isLearned } from '../core/srs';
import { useProgress } from '../state/useProgress';
import { PILLAR_LABELS, topicLabel } from './labels';

/** One bar per topic, grouped by pillar. Bars fill only from answers that held on review. */
export function ReadinessMap({ units }: { units: Unit[] }) {
  const { progress } = useProgress();
  const items = indexItems(units);
  const lessonPillar = new Map(units.flatMap((u) => u.lessons.map((l) => [l.id, l.pillar] as const)));
  const byPillar = new Map<Pillar, Map<string, string[]>>();
  for (const [id, { step, lessonId }] of items) {
    const pillar = lessonPillar.get(lessonId)!;
    const topics = byPillar.get(pillar) ?? new Map<string, string[]>();
    topics.set(step.topic, [...(topics.get(step.topic) ?? []), id]);
    byPillar.set(pillar, topics);
  }
  if (byPillar.size === 0) return null;

  return (
    <section className="readiness" aria-labelledby="readiness-h">
      <h2 id="readiness-h">Readiness</h2>
      <p className="muted small">
        Bars fill from right answers that still hold days later. Self-graded work counts half.
      </p>
      {[...byPillar].map(([pillar, topics]) => (
        <div key={pillar} className="pillar">
          <h3>{PILLAR_LABELS[pillar]}</h3>
          <ul>
            {[...topics].map(([topic, ids]) => {
              const r = readiness(topic, progress, items);
              const learned = ids.filter((id) => progress.srs[id] && isLearned(progress.srs[id])).length;
              const started = ids.filter((id) => progress.srs[id] || progress.selfGrades[id] !== undefined).length;
              const status =
                learned === ids.length
                  ? 'learned'
                  : started === 0
                    ? 'not started'
                    : `${learned} of ${ids.length} learned, ${started - learned} in progress`;
              return (
                <li key={topic}>
                  <div className="rd-row">
                    <span className="rd-name">{topicLabel(topic)}</span>
                    <span className="rd-pct">{Math.round(r * 100)}%</span>
                  </div>
                  <div
                    className="rd-bar"
                    role="meter"
                    aria-label={topicLabel(topic)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(r * 100)}
                  >
                    <span style={{ width: `${r * 100}%` }} />
                  </div>
                  <div className="rd-status muted">{status}</div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

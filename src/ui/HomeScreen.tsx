import { Link } from 'react-router-dom';
import { indexItems, UNITS } from '../content/index';
import type { Lesson, Unit } from '../content/types';
import { buildSession } from '../core/session';
import { displayStreak } from '../core/streak';
import { backupStatus } from '../state/backup';
import { useProgress } from '../state/useProgress';
import { PILLAR_LABELS } from './labels';
import { ReadinessMap } from './ReadinessMap';
import { Sprite } from './sprites/Sprite';

const SLOT_LABEL: Record<Lesson['slot'], string> = { lesson: 'Lesson', practice: 'Practice', extra: 'Extra' };

export function HomeScreen({ units = UNITS }: { units?: Unit[] }) {
  const { progress, today } = useProgress();
  const session = buildSession(units, progress, today);
  const all = units.flatMap((u) => u.lessons.map((l) => ({ unit: u, lesson: l })));
  const byId = new Map(all.map((x) => [x.lesson.id, x.lesson]));
  const doneToday = (id?: string) => !!id && progress.completed[id] === today;
  const nextId = all.find((x) => !progress.completed[x.lesson.id])?.lesson.id;
  const inSession = new Set([session.lesson, session.practice, ...session.extras].filter(Boolean));
  const unitDone = !session.lesson && !session.practice;
  const s = progress.streak;
  const shown = displayStreak(s, today);
  const streakHint =
    s.lastDay === today
      ? 'Done for today.'
      : shown > 0
        ? `Do one card or lesson today to make it ${shown + 1}.`
        : 'Do one card or lesson today to start a streak.';

  const card = (slot: Lesson['slot'], id?: string) => {
    const l = id ? byId.get(id) : undefined;
    if (!l) return null;
    const done = doneToday(id);
    return (
      <li key={l.id} className={`quest ${done ? 'is-done' : ''}`}>
        <Link to={`/lesson/${l.id}`} className="quest-link">
          <span className="quest-slot">{SLOT_LABEL[slot]}</span>
          <span className="quest-title">{l.title}</span>
          <span className="quest-meta muted">{PILLAR_LABELS[l.pillar]}</span>
          <span className="quest-check" aria-label={done ? 'done' : 'to do'}>
            {done ? '✓' : ''}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="home">
      <header className="home-head">
        <h1>Today's quest</h1>
        <div className="streak">
          <Sprite name="flame" size={4} />
          <div>
            <div className="streak-n">{shown} day streak</div>
            <div className="muted small">{streakHint}</div>
            <div className="muted small">Best: {s.best}</div>
          </div>
        </div>
      </header>

      {backupStatus(progress, today).remind && (
        <Link to="/settings" className="backup-nudge">
          <Sprite name="scroll" size={3} />
          <span>
            <strong>Back up your progress</strong>
            <span className="muted small"> Progress lives only in this browser. Export a file to keep it safe.</span>
          </span>
        </Link>
      )}

      {unitDone ? (
        <div className="unit-done">
          <Sprite name="castle" size={6} />
          <h2>Unit complete</h2>
          <p>You reached the castle. Keep your reviews going; more units are on the way.</p>
        </div>
      ) : null}

      <ol className="quests" aria-label="Today's session">
        <li className={`quest ${session.review.length === 0 ? 'is-done' : ''}`}>
          {session.review.length > 0 ? (
            <Link to="/review" className="quest-link">
              <span className="quest-slot">Warm-up</span>
              <span className="quest-title">Review {session.review.length} {session.review.length === 1 ? 'card' : 'cards'}</span>
              <span className="quest-meta muted">About {Math.max(1, Math.round(session.review.length / 3))} min</span>
              <span className="quest-check" aria-label="to do" />
            </Link>
          ) : (
            <div className="quest-link">
              <span className="quest-slot">Warm-up</span>
              <span className="quest-title">No reviews due</span>
              <span className="quest-meta muted">Cards come back 1, 3, 7, 14 and 30 days after you answer them.</span>
              <span className="quest-check" aria-label="done">
                ✓
              </span>
            </div>
          )}
        </li>
        {session.resolve && <ResolveCard id={session.resolve} units={units} />}
        {card('lesson', session.lesson)}
        {card('practice', session.practice)}
        {session.extras.map((id) => card('extra', id))}
      </ol>

      {units.map((u) => (
        <section key={u.id} className="unit">
          <h2>{u.title}</h2>
          <ol className="trail" aria-label={`Unit path: ${u.title}`}>
            {u.lessons.map((l) => {
              const done = !!progress.completed[l.id];
              const isNext = l.id === nextId;
              const open = done || isNext || inSession.has(l.id);
              const state = done ? 'done' : isNext ? 'next' : open ? 'open' : 'locked';
              const body = (
                <>
                  <span className="trail-mark" aria-hidden="true">
                    {done ? <Sprite name="shield" size={2} /> : isNext ? <Sprite name="flag" size={3} /> : null}
                  </span>
                  <span className="trail-text">
                    <span className="trail-title">{l.title}</span>
                    <span className="trail-meta muted">
                      {SLOT_LABEL[l.slot]}, {PILLAR_LABELS[l.pillar]}
                    </span>
                  </span>
                  <span className={`trail-badge badge-${state}`}>
                    {state === 'done' ? 'Done' : state === 'next' ? 'Next' : state === 'open' ? 'Today' : 'Locked'}
                  </span>
                </>
              );
              return (
                <li key={l.id} className={`trail-step is-${state}`}>
                  {open ? (
                    <Link to={`/lesson/${l.id}`} className="trail-link">
                      {body}
                    </Link>
                  ) : (
                    <div className="trail-link">{body}</div>
                  )}
                </li>
              );
            })}
            <li className="trail-step trail-end" aria-hidden="true">
              <Sprite name="castle" size={4} />
            </li>
          </ol>
        </section>
      ))}

      <ReadinessMap units={units} />
    </div>
  );
}

function ResolveCard({ id, units }: { id: string; units: Unit[] }) {
  const { progress, today } = useProgress();
  const entry = indexItems(units).get(id);
  if (!entry) return null;
  const done = progress.srs[id]?.lastAnswered === today;
  const title = units.flatMap((u) => u.lessons).find((l) => l.id === entry.lessonId)?.title ?? id;
  return (
    <li className={`quest ${done ? 'is-done' : ''}`}>
      <Link to={`/item/${id}`} className="quest-link">
        <span className="quest-slot">Re-solve</span>
        <span className="quest-title">{title}</span>
        <span className="quest-meta muted">A problem you solved before, back to check it still holds</span>
        <span className="quest-check" aria-label={done ? 'done' : 'to do'}>
          {done ? '✓' : ''}
        </span>
      </Link>
    </li>
  );
}

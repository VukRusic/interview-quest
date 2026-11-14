import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { findLesson, ITEMS, UNITS } from '../content/index';
import type { Lesson, Unit } from '../content/types';
import { buildSession, lessonAccess } from '../core/session';
import { readiness } from '../core/readiness';
import { useProgress } from '../state/useProgress';
import { StepView } from './steps/StepView';
import type { StepResult } from './steps/types';
import { topicLabel } from './labels';

export function LessonRoute({ units = UNITS }: { units?: Unit[] }) {
  const { lessonId = '' } = useParams();
  const found = findLesson(lessonId, units);
  if (!found) {
    return (
      <section>
        <h1>Lesson not found</h1>
        <p>This lesson may have been renamed. Go back to today's path to continue.</p>
        <Link className="btn" to="/">
          Back to today
        </Link>
      </section>
    );
  }
  return <GatedLesson key={lessonId} lesson={found.lesson} units={units} />;
}

/**
 * Applies the daily limit. Once a lesson has been shown it is never taken away: not when the date
 * rolls over, and not when finishing it uses up today. A held notice is re-checked on every render.
 */
function GatedLesson({ lesson, units }: { lesson: Lesson; units: Unit[] }) {
  const { progress, today } = useProgress();
  const access = lessonAccess(buildSession(units, progress, today), progress, lesson.id);
  // Latch only the open state. A held notice must stay live, or it would outlive the day it was true.
  const opened = useRef(false);
  if (access === 'done' || access === 'today') opened.current = true;
  if (!opened.current && (access === 'tomorrow' || access === 'later')) {
    return (
      <section className="held">
        <h1>{access === 'tomorrow' ? 'Opens tomorrow' : 'Not yet'}</h1>
        <p className="lead">{lesson.title}</p>
        <p>You can do two new lessons a day. Reviews and finished lessons stay open.</p>
        <Link className="btn btn-primary" to="/">
          Back to today
        </Link>
      </section>
    );
  }
  return <LessonScreen lesson={lesson} />;
}

export function LessonScreen({ lesson }: { lesson: Lesson }) {
  const { progress, dispatch, today } = useProgress();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ correct: number; graded: number }>({ correct: 0, graded: 0 });
  const topics = useMemo(
    () => [...new Set(lesson.steps.flatMap((s) => (s.kind === 'explain' ? [] : [s.topic])))],
    [lesson],
  );
  const before = useRef(Object.fromEntries(topics.map((t) => [t, readiness(t, progress, itemsFor(lesson))])));
  const finished = index >= lesson.steps.length;

  function onDone(r?: StepResult) {
    const step = lesson.steps[index];
    if (step.kind !== 'explain' && r) {
      if (r.correct !== undefined) {
        dispatch({ type: 'answer', itemId: step.id, correct: r.correct, today });
        setResults((x) => ({ correct: x.correct + (r.correct ? 1 : 0), graded: x.graded + 1 }));
      }
      if (r.selfGrade !== undefined) dispatch({ type: 'selfGrade', itemId: step.id, score: r.selfGrade, today });
    }
    if (index + 1 >= lesson.steps.length) dispatch({ type: 'completeLesson', lessonId: lesson.id, today });
    setIndex(index + 1);
    window.scrollTo?.({ top: 0 });
  }

  if (finished) {
    return (
      <section className="complete">
        <h1>Lesson complete</h1>
        <p className="lead">{lesson.title}</p>
        {results.graded > 0 && (
          <p>
            You got {results.correct} of {results.graded} right. Quick checks come back in tomorrow's review and
            full problems return later as a re-solve; readiness grows when your answers still hold days later.
          </p>
        )}
        {topics.length > 0 && (
          <ul className="deltas">
            {topics.map((t) => {
              const after = readiness(t, progress, itemsFor(lesson));
              return (
                <li key={t}>
                  <span>{topicLabel(t)}</span>
                  <span className="delta-bar" aria-hidden="true">
                    <span style={{ width: `${Math.round(after * 100)}%` }} />
                  </span>
                  <span className="delta-num">
                    {pct(before.current[t] ?? 0)} → {pct(after)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <Link className="btn btn-primary" to="/">
          Back to today
        </Link>
      </section>
    );
  }

  return (
    <div className="lesson">
      <div className="lesson-head">
        <Link to="/" className="btn btn-quiet lesson-close" aria-label="Leave lesson">
          ✕
        </Link>
        <div
          className="lesson-progress"
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={0}
          aria-valuemax={lesson.steps.length}
          aria-valuenow={index}
        >
          <span style={{ width: `${(index / lesson.steps.length) * 100}%` }} />
        </div>
      </div>
      <p className="lesson-title muted">{lesson.title}</p>
      <StepView key={index} step={lesson.steps[index]} onDone={onDone} />
    </div>
  );
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Readiness over the global index, falling back to this lesson's own items (fixtures, new content). */
function itemsFor(lesson: Lesson) {
  const has = lesson.steps.some((s) => s.kind !== 'explain' && ITEMS.has(s.id));
  if (has) return ITEMS;
  const local = new Map(ITEMS);
  for (const s of lesson.steps) if (s.kind !== 'explain') local.set(s.id, { step: s, lessonId: lesson.id });
  return local;
}

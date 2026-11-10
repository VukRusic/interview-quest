import { useEffect, useRef, useState } from 'react';

const REQUESTS = ['A', 'A', 'B', 'A', 'C', 'A', 'B', 'A', 'A', 'D'];
const HIT_MS = 2;
const DB_MS = 40;

type Outcome = 'hit' | 'miss' | 'db';

function simulate(cacheOn: boolean): Outcome[] {
  const cached = new Set<string>();
  return REQUESTS.map((key) => {
    if (!cacheOn) return 'db';
    if (cached.has(key)) return 'hit';
    cached.add(key);
    return 'miss';
  });
}

/** Ten product-page requests, with and without cache-aside. Watch the database calls drop. */
export function CacheFlow() {
  const [cacheOn, setCacheOn] = useState(true);
  const [shown, setShown] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const outcomes = simulate(cacheOn);

  useEffect(() => () => window.clearInterval(timer.current), []);

  function play() {
    window.clearInterval(timer.current);
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return setShown(REQUESTS.length);
    setShown(0);
    let n = 0;
    timer.current = window.setInterval(() => {
      n++;
      setShown(n);
      if (n >= REQUESTS.length) window.clearInterval(timer.current);
    }, 280);
  }

  const done = outcomes.slice(0, shown);
  const dbCalls = done.filter((o) => o !== 'hit').length;
  const hits = done.filter((o) => o === 'hit').length;
  const totalMs = done.reduce((s, o) => s + (o === 'hit' ? HIT_MS : DB_MS + (o === 'miss' ? HIT_MS : 0)), 0);

  return (
    <div className="viz viz-cache">
      <div className="viz-controls">
        <label className="switch">
          <input
            type="checkbox"
            checked={cacheOn}
            onChange={(e) => {
              setCacheOn(e.target.checked);
              setShown(0);
            }}
          />
          <span>Cache in front of the database</span>
        </label>
        <button type="button" className="btn" onClick={play}>
          Send 10 requests
        </button>
      </div>
      <ol className="req-row" aria-label="Requests">
        {REQUESTS.map((key, i) => {
          const o = i < shown ? outcomes[i] : null;
          return (
            <li key={i} className={`req ${o ? `req-${o}` : ''}`} title={o ?? 'waiting'}>
              {key}
            </li>
          );
        })}
      </ol>
      <dl className="viz-stats">
        <div>
          <dt>Cache hits</dt>
          <dd>{hits}</dd>
        </div>
        <div>
          <dt>Database queries</dt>
          <dd>{dbCalls}</dd>
        </div>
        <div>
          <dt>Time spent</dt>
          <dd>{totalMs} ms</dd>
        </div>
      </dl>
      <p className="viz-legend">
        <span className="dot req-hit" /> hit (~{HIT_MS} ms) <span className="dot req-miss" /> miss, then fill the cache{' '}
        <span className="dot req-db" /> straight to the database (~{DB_MS} ms). Illustrative numbers.
      </p>
    </div>
  );
}

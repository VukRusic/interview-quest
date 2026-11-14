import { useState } from 'react';

const THREADS = 4;
const IO_SECONDS = 1;

/** A pool of four threads serving requests that each wait one second on I/O, blocking or awaiting. */
export function AwaitThreads() {
  const [async, setAsync] = useState(false);
  const [requests, setRequests] = useState(8);
  const total = async ? IO_SECONDS : Math.ceil(requests / THREADS) * IO_SECONDS;
  const inFlight = async ? requests : Math.min(requests, THREADS);
  const queued = requests - inFlight;

  return (
    <div className="viz viz-threads">
      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={async} onChange={(e) => setAsync(e.target.checked)} />
          <span>Use async and await</span>
        </label>
      </div>
      <label className="viz-slider">
        <span>
          Requests arriving at once: <strong>{requests}</strong>, each waiting {IO_SECONDS} s on the database
        </span>
        <input
          type="range"
          min={4}
          max={32}
          step={4}
          value={requests}
          aria-label="Requests arriving at once"
          onChange={(e) => setRequests(Number(e.target.value))}
        />
      </label>
      <ul className="lb-servers thread-pool" aria-label="Thread pool">
        {Array.from({ length: THREADS }, (_, i) => (
          <li key={i} className={`lb-server ${async ? '' : 'is-down'}`}>
            <strong>Thread {i + 1}</strong>
            <span className="muted small">{async ? 'free during the wait' : 'blocked, waiting'}</span>
          </li>
        ))}
      </ul>
      <dl className="viz-stats">
        <div>
          <dt>Requests in progress</dt>
          <dd>{inFlight}</dd>
        </div>
        <div>
          <dt>Waiting for a thread</dt>
          <dd>{queued}</dd>
        </div>
        <div>
          <dt>Threads sitting idle, blocked</dt>
          <dd>{async ? 0 : Math.min(requests, THREADS)}</dd>
        </div>
        <div>
          <dt>All {requests} requests finished after</dt>
          <dd>{total} s</dd>
        </div>
      </dl>
      <p className="viz-note" aria-live="polite">
        {async
          ? 'While the database works, no thread is held. The same four threads start every request and pick each one up again when its answer arrives.'
          : 'Each thread sits blocked for the whole wait, so only four requests make progress at a time and the rest queue for a thread.'}{' '}
        Illustrative numbers.
      </p>
    </div>
  );
}

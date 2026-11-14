import { useState } from 'react';

const SERVERS = [1, 2, 3];
const BATCH = 6;

/** Three app servers. Send requests with and without a load balancer, and stop a server to see who notices. */
export function LoadBalancer() {
  const [lbOn, setLbOn] = useState(true);
  const [up, setUp] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true });
  const [counts, setCounts] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0 });
  const [failed, setFailed] = useState(0);
  const [next, setNext] = useState(0);

  function send() {
    const c = { ...counts };
    let f = 0;
    let n = next;
    for (let i = 0; i < BATCH; i++) {
      if (!lbOn) {
        // Without a load balancer, clients only know one address: server 1.
        if (up[1]) c[1]++;
        else f++;
        continue;
      }
      const healthy = SERVERS.filter((s) => up[s]);
      if (healthy.length === 0) {
        f++;
        continue;
      }
      c[healthy[n % healthy.length]]++;
      n++;
    }
    setCounts(c);
    setFailed(failed + f);
    setNext(n);
  }

  function reset(nextLb = lbOn) {
    setLbOn(nextLb);
    setCounts({ 1: 0, 2: 0, 3: 0 });
    setFailed(0);
    setNext(0);
  }

  const served = SERVERS.reduce((s, k) => s + counts[k], 0);

  return (
    <div className="viz viz-lb">
      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={lbOn} onChange={(e) => reset(e.target.checked)} />
          <span>Load balancer in front</span>
        </label>
        <button type="button" className="btn" onClick={send}>
          Send {BATCH} requests
        </button>
      </div>
      <ul className="lb-servers">
        {SERVERS.map((s) => (
          <li key={s} data-testid={`server-${s}`} className={`lb-server ${up[s] ? '' : 'is-down'} ${!lbOn && s > 1 ? 'is-idle' : ''}`}>
            <strong>Server {s}</strong>
            <span>
              {counts[s]} {counts[s] === 1 ? 'request' : 'requests'}
            </span>
            <span className="muted small">{!up[s] ? 'stopped' : !lbOn && s > 1 ? 'unreachable' : 'healthy'}</span>
            <button
              type="button"
              className="btn btn-small"
              aria-label={`${up[s] ? 'Stop' : 'Start'} server ${s}`}
              onClick={() => setUp({ ...up, [s]: !up[s] })}
            >
              {up[s] ? 'Stop' : 'Start'}
            </button>
          </li>
        ))}
      </ul>
      <dl className="viz-stats">
        <div>
          <dt>Served</dt>
          <dd>{served}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{failed}</dd>
        </div>
      </dl>
      <p className="viz-legend">
        The load balancer checks each server's health and sends requests, in turn, only to the ones that answer. Without it,
        clients know a single address.
      </p>
    </div>
  );
}

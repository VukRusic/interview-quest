import { useState } from 'react';

/** A write to the leader and what the follower knows, with and without waiting for it. */
export function ReplicationLag() {
  const [sync, setSync] = useState(false);
  const [leader, setLeader] = useState(10);
  const [follower, setFollower] = useState(10);
  const [wait, setWait] = useState<string>('not written yet');

  function write() {
    setLeader(20);
    if (sync) {
      setFollower(20);
      setWait('leader and follower (slower)');
    } else {
      setFollower(10);
      setWait('leader only (fast)');
    }
  }
  function reset(nextSync: boolean) {
    setSync(nextSync);
    setLeader(10);
    setFollower(10);
    setWait('not written yet');
  }
  const behind = leader !== follower;

  return (
    <div className="viz viz-replication">
      <div className="viz-controls">
        <label className="switch">
          <input type="checkbox" checked={sync} onChange={(e) => reset(e.target.checked)} />
          <span>Wait for the follower (synchronous)</span>
        </label>
      </div>
      <div className="viz-controls">
        <button type="button" className="btn" onClick={write}>
          Write price = 20
        </button>
        <button type="button" className="btn" disabled={!behind} onClick={() => setFollower(leader)}>
          Let replication catch up
        </button>
      </div>
      <dl className="viz-stats">
        <div>
          <dt>Leader has</dt>
          <dd>{leader}</dd>
        </div>
        <div>
          <dt>Follower has</dt>
          <dd>{follower}</dd>
        </div>
        <div>
          <dt>Write confirmed after</dt>
          <dd className="stat-text">{wait}</dd>
        </div>
      </dl>
      <p className="viz-note" aria-live="polite">
        {behind
          ? 'A read from the follower right now returns the old price. If the leader died at this moment, the write would be lost.'
          : sync && leader === 20
            ? 'The follower already has the write, so a read from it is current and a failover loses nothing. The price is a slower write, and a write that cannot finish while the follower is unreachable.'
            : 'Leader and follower agree.'}
      </p>
    </div>
  );
}

import { useState } from 'react';

const STEPS = [
  {
    name: 'Requirements',
    time: '5–8 min',
    what: 'Ask what it must do and for whom. Agree on 2–3 core features and the non-functional needs: scale, latency, availability.',
  },
  {
    name: 'Estimates',
    time: '3–5 min',
    what: 'Rough numbers: users, requests per second, read/write ratio, storage per year. They decide which parts need care.',
  },
  {
    name: 'High-level design',
    time: '10–15 min',
    what: 'Boxes and arrows for the main path: clients, API, services, data stores. Name the API and the data model.',
  },
  {
    name: 'Deep dive',
    time: '10–15 min',
    what: 'Pick the hardest part, often the hot path or the data layer, and go deep: caching, indexes, partitioning, failure cases.',
  },
  {
    name: 'Trade-offs',
    time: '5 min',
    what: 'Say what you chose, what it costs, and what you would change at 10× scale. Interviewers listen for this.',
  },
];

/** The five-step answer flow for a 45-minute design round. */
export function DesignFlow() {
  const [open, setOpen] = useState(0);
  return (
    <div className="viz viz-flow">
      <ol className="flow">
        {STEPS.map((s, i) => (
          <li key={s.name}>
            <button
              type="button"
              className={`flow-step ${open === i ? 'is-open' : ''}`}
              aria-expanded={open === i}
              onClick={() => setOpen(i)}
            >
              <span className="flow-n">{i + 1}</span>
              <span className="flow-name">{s.name}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="flow-detail" aria-live="polite">
        <h4>
          {STEPS[open].name} <span className="muted flow-time">about {STEPS[open].time}</span>
        </h4>
        <p>{STEPS[open].what}</p>
      </div>
    </div>
  );
}

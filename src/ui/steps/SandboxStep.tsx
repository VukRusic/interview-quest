import { useMemo, useState } from 'react';
import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { SandboxStep as Sandbox } from '../../content/types';
import { COMPONENTS, SCENARIOS } from '../../content/scenarios';
import { eventMetrics, KINDS, meetsSlo, type Architecture, type ComponentKind, type Metrics } from '../../core/sandbox';
import type { StepProps } from './types';

const MAX_COUNT: Record<ComponentKind, number> = { cdn: 1, lb: 1, app: 4, cache: 2, queue: 1, db: 1, replica: 3 };
const MIN_COUNT: Partial<Record<ComponentKind, number>> = { app: 1, db: 1 };

type TierData = { label: string; count: number; hot: boolean; down: boolean; util: number | null };

function TierNode({ data }: NodeProps<Node<TierData>>) {
  return (
    <div className={`tier-node ${data.hot ? 'is-hot' : ''} ${data.down ? 'is-down' : ''}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <div className="tier-label">{data.label}</div>
      <div className="tier-meta">
        {data.count > 1 ? `×${data.count}` : ''}
        {data.down ? ' down' : data.util !== null ? ` ${Math.round(data.util * 100)}% busy` : ''}
      </div>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}
const nodeTypes = { tier: TierNode };

function buildGraph(arch: Architecture, m: Metrics, dbDown: boolean): { nodes: Node<TierData>[]; edges: Edge[] } {
  const order: (ComponentKind | 'users')[] = ['users', ...KINDS.filter((k) => arch[k] > 0)];
  const nodes: Node<TierData>[] = order.map((k, i) => {
    const tier = k === 'users' ? undefined : m.tiers.find((t) => t.kind === k);
    const util = tier && tier.capacity > 0 ? tier.load / tier.capacity : null;
    return {
      id: k,
      type: 'tier',
      position: { x: i * 150, y: k === 'replica' || k === 'cdn' ? 70 : 0 },
      draggable: false,
      selectable: false,
      data: {
        label: k === 'users' ? 'Users' : COMPONENTS[k].label,
        count: k === 'users' ? 1 : arch[k],
        hot: m.bottleneck === k,
        down: dbDown && k === 'db',
        util,
      },
    };
  });
  const edges: Edge[] = [];
  for (let i = 1; i < order.length; i++) {
    const to = order[i];
    // CDN hangs off users; replica hangs off the app path next to the db.
    const from = to === 'replica' ? (arch.cache ? 'cache' : 'app') : to === 'cdn' ? 'users' : prevMain(order, i);
    edges.push({ id: `${from}-${to}`, source: from, target: to, animated: true });
  }
  return { nodes, edges };
}

function prevMain(order: (ComponentKind | 'users')[], i: number) {
  for (let j = i - 1; j >= 0; j--) if (order[j] !== 'cdn' && order[j] !== 'replica') return order[j];
  return 'users';
}

const fmtPct = (n: number) => `${(n * 100).toFixed(n > 0 && n < 0.1 ? 1 : 0)}%`;

export function SandboxStep({ step, onDone }: StepProps<Sandbox>) {
  const sc = SCENARIOS[step.scenarioId];
  const [arch, setArch] = useState<Architecture>(() => ({ ...(sc?.start ?? ({} as Architecture)) }));
  const [eventIdx, setEventIdx] = useState(0);
  const [stuck, setStuck] = useState(false);

  const all = useMemo(() => (sc ? eventMetrics(sc, arch) : []), [sc, arch]);
  if (!sc) {
    return (
      <section className="step">
        <p>This scenario is missing. Continue to skip it.</p>
        <button type="button" className="btn btn-primary" onClick={() => onDone()}>
          Continue
        </button>
      </section>
    );
  }
  const m = all[eventIdx];
  const ev = sc.events[eventIdx];
  const solved = all.every((x) => meetsSlo(x, sc.slo));
  const graph = buildGraph(arch, m, !!ev.load.dbDown);

  const change = (k: ComponentKind, d: number) =>
    setArch((a) => ({ ...a, [k]: Math.min(MAX_COUNT[k], Math.max(MIN_COUNT[k] ?? 0, a[k] + d)) }));

  const checks = [
    { label: 'p95 latency', value: `${m.p95Ms} ms`, target: `≤ ${sc.slo.p95Ms} ms`, ok: m.p95Ms <= sc.slo.p95Ms },
    { label: 'Errors', value: fmtPct(m.errorRate), target: `≤ ${fmtPct(sc.slo.errorRate)}`, ok: m.errorRate <= sc.slo.errorRate },
    { label: 'Cost', value: `$${m.monthlyCost}/mo`, target: `≤ $${sc.slo.budget}`, ok: m.monthlyCost <= sc.slo.budget },
  ];

  return (
    <section className="step sandbox">
      <h2 className="step-prompt">{sc.title}</h2>
      <p>{sc.story}</p>
      <div className="flow-box" aria-label="Architecture diagram">
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={12} size={1} color="var(--line)" />
        </ReactFlow>
      </div>

      <div className="palette" role="group" aria-label="Components">
        {sc.palette.map((k) => (
          <div key={k} className="palette-row">
            <span className="palette-name">{COMPONENTS[k].label}</span>
            <span className="muted palette-cost">${COMPONENTS[k].monthlyCost}/mo</span>
            <button
              type="button"
              className="btn btn-small"
              aria-label={`Remove ${COMPONENTS[k].label}`}
              disabled={arch[k] <= (MIN_COUNT[k] ?? 0)}
              onClick={() => change(k, -1)}
            >
              −
            </button>
            <span className="palette-count" aria-live="polite">
              {arch[k]}
            </span>
            <button
              type="button"
              className="btn btn-small"
              aria-label={`Add ${COMPONENTS[k].label}`}
              disabled={arch[k] >= MAX_COUNT[k]}
              onClick={() => change(k, 1)}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className="events" role="tablist" aria-label="Traffic and chaos events">
        {sc.events.map((e, i) => {
          const ok = meetsSlo(all[i], sc.slo);
          return (
            <button
              key={e.label}
              type="button"
              role="tab"
              aria-selected={i === eventIdx}
              className={`event ${i === eventIdx ? 'is-on' : ''}`}
              onClick={() => setEventIdx(i)}
            >
              <span className={ok ? 'ok' : 'bad'} aria-label={ok ? 'meets the goal' : 'misses the goal'}>
                {ok ? '✓' : '✗'}
              </span>{' '}
              {e.label}
            </button>
          );
        })}
      </div>

      <div className="metrics" role="tabpanel" aria-live="polite">
        {checks.map((c) => (
          <div key={c.label} className={`metric ${c.ok ? 'is-right' : 'is-wrong'}`}>
            <div className="metric-label">{c.label}</div>
            <div className="metric-value">{c.value}</div>
            <div className="metric-target">goal {c.target}</div>
          </div>
        ))}
        <p className="metric-note">
          {m.bottleneck
            ? `Bottleneck: ${COMPONENTS[m.bottleneck].label}, at ${Math.round(
                ((m.tiers.find((t) => t.kind === m.bottleneck)?.load ?? 0) /
                  (m.tiers.find((t) => t.kind === m.bottleneck)?.capacity || 1)) *
                  100,
              )}% of capacity.`
            : ev.load.dbDown && arch.replica === 0
              ? 'The database is down and nothing else can answer reads.'
              : 'No component is near its limit.'}
        </p>
        <p className="muted small">Illustrative numbers from a simple capacity model, not real benchmarks.</p>
      </div>

      {solved ? (
        <div className="feedback is-right" role="status">
          <h3>All green.</h3>
          <p>Every event meets the goal within budget.</p>
          <p>{sc.lesson}</p>
          <button type="button" className="btn btn-primary" onClick={() => onDone({ correct: true })}>
            Continue
          </button>
        </div>
      ) : stuck ? (
        <div className="feedback is-wrong" role="status">
          <h3>Hint</h3>
          <p>{sc.lesson}</p>
          <button type="button" className="btn btn-primary" onClick={() => onDone({ correct: false })}>
            Continue
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-quiet" onClick={() => setStuck(true)}>
          I'm stuck
        </button>
      )}
    </section>
  );
}

import { COMPONENTS } from '../content/scenarios';

export type ComponentKind = 'cdn' | 'lb' | 'app' | 'cache' | 'queue' | 'db' | 'replica';
export const KINDS: ComponentKind[] = ['cdn', 'lb', 'app', 'cache', 'queue', 'db', 'replica'];

/** Count per kind; app ≥ 1, db = 1. */
export type Architecture = Record<ComponentKind, number>;
export type Load = { rps: number; readRatio: number; staticRatio: number; dbDown?: boolean };
export type Tier = { kind: ComponentKind; load: number; capacity: number };
export type Metrics = {
  p95Ms: number;
  errorRate: number;
  monthlyCost: number;
  bottleneck: ComponentKind | null;
  tiers: Tier[];
};
export type Slo = { p95Ms: number; errorRate: number; budget: number };
export type Scenario = {
  id: string;
  title: string;
  story: string;
  start: Architecture;
  palette: ComponentKind[];
  baseLoad: Load;
  events: { label: string; load: Partial<Load> }[];
  slo: Slo;
  lesson: string;
};

export const CACHE_HIT_RATE = 0.8;
/** With a queue in front, writes reach the database at no more than half its capacity. */
const QUEUE_DRAIN = 0.5;
const BOTTLENECK_AT = 0.85;

export function emptyArch(): Architecture {
  return { cdn: 0, lb: 0, app: 0, cache: 0, queue: 0, db: 0, replica: 0 };
}

const latency = (kind: ComponentKind, u: number) => COMPONENTS[kind].baseMs / Math.max(1 - u, 0.05);

/**
 * Capacity/latency model with illustrative numbers (not benchmarks). Static requests go to the CDN
 * if there is one, otherwise to the app. Dynamic reads pass the cache (80% hits), then spread over
 * the primary and its replicas; writes go to the primary, smoothed by a queue if present.
 */
export function simulate(arch: Architecture, load: Load): Metrics {
  const rps = Math.max(0, load.rps);
  const staticRps = rps * load.staticRatio;
  const dynamic = rps - staticRps;
  const appLoad = arch.cdn > 0 ? dynamic : rps;
  const hit = arch.cache > 0 ? CACHE_HIT_RATE : 0;
  const readsTotal = dynamic * load.readRatio;
  const reads = readsTotal * (1 - hit);
  const writes = dynamic * (1 - load.readRatio);
  const dbCap = COMPONENTS.db.capacityRps * arch.db;
  const writesToDb = arch.queue > 0 ? Math.min(writes, dbCap * QUEUE_DRAIN) : writes;

  let failed = 0;
  let primaryLoad: number;
  let replicaLoad: number;
  if (load.dbDown) {
    primaryLoad = 0;
    if (arch.replica > 0) {
      replicaLoad = reads;
      failed += writes;
    } else {
      replicaLoad = 0;
      failed += reads + writes;
    }
  } else {
    const share = reads / (1 + arch.replica);
    primaryLoad = writesToDb + share;
    replicaLoad = reads - share;
  }

  const tiers: Tier[] = [];
  const add = (kind: ComponentKind, l: number) => {
    if (arch[kind] > 0) tiers.push({ kind, load: l, capacity: COMPONENTS[kind].capacityRps * arch[kind] });
  };
  add('cdn', staticRps);
  add('lb', appLoad);
  add('app', appLoad);
  add('cache', readsTotal);
  add('queue', writes);
  if (!load.dbDown) add('db', primaryLoad);
  else if (arch.db > 0) tiers.push({ kind: 'db', load: 0, capacity: 0 });
  add('replica', replicaLoad);

  // Latency of the dynamic request path (the slow one): front tiers, app, cache, then the busiest DB node.
  let pathMs = 0;
  let dataMs = 0;
  let dropped = 0;
  let worst: { kind: ComponentKind; u: number } | null = null;
  for (const t of tiers) {
    if (t.capacity === 0) continue;
    const u = t.load / t.capacity;
    dropped += Math.max(0, t.load - t.capacity);
    if (!worst || u > worst.u) worst = { kind: t.kind, u };
    if (t.kind === 'cdn' || t.kind === 'queue') continue;
    const ms = latency(t.kind, u);
    if (t.kind === 'db' || t.kind === 'replica') dataMs = Math.max(dataMs, t.load > 0 ? ms : 0);
    else pathMs += ms;
  }
  const p95Ms = Math.round((pathMs + dataMs) * 2);
  const errorRate = rps === 0 ? 0 : Math.min(1, Math.max(0, (dropped + failed) / rps));
  const monthlyCost = (Object.keys(arch) as ComponentKind[]).reduce((s, k) => s + arch[k] * COMPONENTS[k].monthlyCost, 0);
  const bottleneck = worst && worst.u >= BOTTLENECK_AT ? worst.kind : null;
  return { p95Ms, errorRate, monthlyCost, bottleneck, tiers };
}

export function meetsSlo(m: Metrics, slo: Slo): boolean {
  return m.p95Ms <= slo.p95Ms && m.errorRate <= slo.errorRate && m.monthlyCost <= slo.budget;
}

export function eventMetrics(sc: Scenario, arch: Architecture): Metrics[] {
  return sc.events.map((e) => simulate(arch, { ...sc.baseLoad, ...e.load }));
}

/** Every event meets the SLO within budget. */
export function solves(sc: Scenario, arch: Architecture): boolean {
  return eventMetrics(sc, arch).every((m) => meetsSlo(m, sc.slo));
}

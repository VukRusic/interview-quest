import type { ComponentKind, Scenario } from '../core/sandbox';

/** Illustrative capacities and costs for the sandbox. Not real benchmarks or prices. */
export const COMPONENTS: Record<ComponentKind, { label: string; capacityRps: number; baseMs: number; monthlyCost: number }> = {
  cdn: { label: 'CDN', capacityRps: 50_000, baseMs: 5, monthlyCost: 20 },
  lb: { label: 'Load balancer', capacityRps: 20_000, baseMs: 1, monthlyCost: 20 },
  app: { label: 'App server', capacityRps: 3_000, baseMs: 20, monthlyCost: 40 },
  cache: { label: 'Cache', capacityRps: 10_000, baseMs: 1, monthlyCost: 30 },
  queue: { label: 'Queue', capacityRps: 5_000, baseMs: 2, monthlyCost: 15 },
  db: { label: 'Database', capacityRps: 800, baseMs: 10, monthlyCost: 100 },
  replica: { label: 'Read replica', capacityRps: 800, baseMs: 10, monthlyCost: 80 },
};

const arch = (p: Partial<Record<ComponentKind, number>>) => ({
  cdn: 0,
  lb: 0,
  app: 0,
  cache: 0,
  queue: 0,
  db: 0,
  replica: 0,
  ...p,
});

export const SCENARIOS: Record<string, Scenario> = {
  'slow-product-page': {
    id: 'slow-product-page',
    title: 'The slow product page',
    story:
      'A shop runs on one app server and one database. A newsletter goes out tomorrow and traffic will jump about 10×. Last month the database host also had an outage. Keep product pages fast and up, for at most $280 a month.',
    start: arch({ app: 1, db: 1 }),
    palette: ['app', 'cache', 'replica', 'cdn'],
    baseLoad: { rps: 200, readRatio: 0.99, staticRatio: 0.3 },
    events: [
      { label: 'Normal traffic', load: {} },
      { label: 'Newsletter spike (10×)', load: { rps: 2000 } },
      { label: 'Database primary down', load: { dbDown: true } },
    ],
    slo: { p95Ms: 250, errorRate: 0.01, budget: 280 },
    lesson:
      'Product pages are almost all reads. A cache in front of the database absorbs most of them, so the spike never reaches the database. A read replica keeps serving those reads when the primary is down; only the few writes (like checkout) fail until failover. More replicas without a cache also survive the spike, but cost more than the budget.',
  },
};

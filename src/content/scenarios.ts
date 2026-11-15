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
  'flash-sale': {
    id: 'flash-sale',
    title: 'The flash sale',
    story:
      'A shop runs one app server, a cache and one database. A flash sale starts tonight and opens with a ten-minute order rush: about 10× the traffic, and half of it is people placing orders. During the last sale an app server crashed halfway through. Keep the shop fast and taking orders through the rush, even if a server dies, for at most $290 a month.',
    start: arch({ app: 1, cache: 1, db: 1 }),
    palette: ['lb', 'app', 'queue', 'cache', 'replica'],
    baseLoad: { rps: 300, readRatio: 0.5, staticRatio: 0 },
    events: [
      { label: 'Normal traffic', load: {} },
      { label: 'Flash sale (order rush)', load: { rps: 3000 } },
      { label: 'One app server dies mid-sale', load: { rps: 3000, appDown: 1 } },
    ],
    slo: { p95Ms: 300, errorRate: 0.01, budget: 290 },
    lesson:
      'Two different problems, two different fixes. The app tier needed more servers, and extra servers only help behind a load balancer, which spreads requests and stops sending them to a server that has died. That is also why you need one more server than the sale itself requires. The database could not take the burst of orders, and a cache or a replica does not help with writes. A queue accepts each order straight away and lets the database work through them at a pace it can hold. The cost is that orders are confirmed later, not instantly: the backlog keeps draining after the rush ends. In a real system you would watch how long it gets and add workers until that wait is acceptable.',
  },
  'dashboard-rush': {
    id: 'dashboard-rush',
    title: 'The Monday dashboard',
    story:
      'A reporting product runs on one app server and one database. Every Monday at 9:00 all customers open their dashboards at once, and every dashboard runs its own queries, so a cache barely helps. Each night a data import writes a large batch of new rows. Last month the primary database also failed during the Monday rush. Keep dashboards fast, keep accepting the import and new writes through an outage, and stay within $400 a month.',
    start: arch({ app: 1, db: 1 }),
    palette: ['replica', 'queue', 'app', 'lb'],
    baseLoad: { rps: 400, readRatio: 0.9, staticRatio: 0 },
    events: [
      { label: 'Normal traffic', load: {} },
      { label: 'Monday 9:00, everyone opens dashboards', load: { rps: 2000, readRatio: 0.95 } },
      { label: 'Nightly data import', load: { rps: 1500, readRatio: 0.2 } },
      { label: 'Primary fails during the Monday rush', load: { rps: 2000, readRatio: 0.95, dbDown: true } },
    ],
    slo: { p95Ms: 300, errorRate: 0.01, budget: 400 },
    lesson:
      'Reads and writes needed different fixes again. Read replicas multiply how many dashboard queries you can answer, and they keep answering when the primary dies. They do nothing for the import, because every write still goes to the one primary. The queue lets the import arrive as fast as it likes while the database takes rows at a pace it can hold, and during the outage it holds new writes until a replica is promoted. This model is kinder than real life in one way: with asynchronous replication, the last few writes the old primary confirmed may not have reached a replica, and those are lost in a failover. The price of replicas is lag: a dashboard may show data that is a moment behind the primary, which is fine for a report and would not be for an account balance.',
  },
};

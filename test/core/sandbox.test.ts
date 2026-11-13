import { simulate, emptyArch, meetsSlo, solves, type Architecture, type Load } from '../../src/core/sandbox';
import { COMPONENTS, SCENARIOS } from '../../src/content/scenarios';

const arch = (p: Partial<Architecture>): Architecture => ({ ...emptyArch(), app: 1, db: 1, ...p });
const low: Load = { rps: 100, readRatio: 0.9, staticRatio: 0 };
const spike: Load = { ...low, rps: 2000 };
const dbLoad = (m: ReturnType<typeof simulate>) => m.tiers.find((t) => t.kind === 'db')!.load;

test('1 app + 1 db at low rps: no errors, no bottleneck', () => {
  const m = simulate(arch({}), low);
  expect(m.errorRate).toBe(0);
  expect(m.bottleneck).toBeNull();
  expect(m.p95Ms).toBeGreaterThan(0);
});

test('a 10× spike overloads the database', () => {
  const m = simulate(arch({}), spike);
  expect(m.bottleneck).toBe('db');
  expect(m.errorRate).toBeGreaterThan(0);
});

test('a cache takes 80% of reads off the database and cuts errors', () => {
  const without = simulate(arch({}), spike);
  const withCache = simulate(arch({ cache: 1 }), spike);
  const reads = spike.rps * spike.readRatio;
  expect(dbLoad(without) - dbLoad(withCache)).toBeCloseTo(reads * 0.8);
  expect(withCache.errorRate).toBeLessThan(without.errorRate);
});

test('db down with no replica fails every request that needs the database', () => {
  const load: Load = { ...low, dbDown: true };
  const m = simulate(arch({ cache: 1 }), load);
  const dbBound = (load.rps * load.readRatio * 0.2 + load.rps * (1 - load.readRatio)) / load.rps;
  expect(m.errorRate).toBeGreaterThanOrEqual(dbBound - 1e-9);
});

test('db down with a replica: reads succeed, only writes fail', () => {
  const load: Load = { ...low, dbDown: true };
  const m = simulate(arch({ replica: 1 }), load);
  expect(m.errorRate).toBeCloseTo(1 - load.readRatio);
});

test('a CDN serves static requests so they never reach the app', () => {
  const load: Load = { rps: 1000, readRatio: 0.9, staticRatio: 0.4 };
  const app = (a: Architecture) => simulate(a, load).tiers.find((t) => t.kind === 'app')!.load;
  expect(app(arch({}))).toBe(1000);
  expect(app(arch({ cdn: 1 }))).toBe(600);
});

test('monthly cost is the sum of counts × component costs', () => {
  const a = arch({ app: 2, cache: 1, replica: 1 });
  const expected = 2 * COMPONENTS.app.monthlyCost + COMPONENTS.db.monthlyCost + COMPONENTS.cache.monthlyCost + COMPONENTS.replica.monthlyCost;
  expect(simulate(a, low).monthlyCost).toBe(expected);
});

describe('Unit 1 scenario "slow-product-page" stays solvable', () => {
  const sc = SCENARIOS['slow-product-page'];
  const at = (a: Architecture, i: number) => simulate(a, { ...sc.baseLoad, ...sc.events[i].load });
  const spikeIdx = sc.events.findIndex((e) => (e.load.rps ?? 0) > sc.baseLoad.rps);
  const downIdx = sc.events.findIndex((e) => e.load.dbDown);

  test('the start architecture fails the spike', () => {
    expect(meetsSlo(at(sc.start, spikeIdx), sc.slo)).toBe(false);
  });
  test('start + cache passes the spike', () => {
    expect(meetsSlo(at({ ...sc.start, cache: 1 }, spikeIdx), sc.slo)).toBe(true);
  });
  test('start + cache fails the DB outage; start + cache + replica solves every event within budget', () => {
    expect(meetsSlo(at({ ...sc.start, cache: 1 }, downIdx), sc.slo)).toBe(false);
    expect(solves(sc, { ...sc.start, cache: 1, replica: 1 })).toBe(true);
  });
  test('throwing replicas at it without a cache is over budget', () => {
    expect(solves(sc, { ...sc.start, replica: 2 })).toBe(false);
  });
});

describe('load balancing and app server failure', () => {
  const busy: Load = { rps: 4000, readRatio: 0.5, staticRatio: 0 };
  const appTier = (m: ReturnType<typeof simulate>) => m.tiers.find((t) => t.kind === 'app')!;

  test('without a load balancer a second app server takes no traffic', () => {
    expect(appTier(simulate(arch({ app: 2 }), busy)).capacity).toBe(appTier(simulate(arch({ app: 1 }), busy)).capacity);
  });
  test('with a load balancer app capacity scales with servers', () => {
    expect(appTier(simulate(arch({ app: 3, lb: 1 }), busy)).capacity).toBe(3 * COMPONENTS.app.capacityRps);
  });
  test('cost counts every server placed, serving or not', () => {
    expect(simulate(arch({ app: 3 }), low).monthlyCost).toBe(3 * COMPONENTS.app.monthlyCost + COMPONENTS.db.monthlyCost);
  });
  test('appDown removes serving servers; none left fails every request', () => {
    const m = simulate(arch({}), { ...low, appDown: 1 });
    expect(m.errorRate).toBe(1);
    expect(appTier(m).capacity).toBe(0);
  });
  test('appDown larger than the fleet does not go negative', () => {
    expect(simulate(arch({ app: 2, lb: 1 }), { ...low, appDown: 5 }).errorRate).toBe(1);
  });
  test('appDown with a load balancer and a spare server: no errors', () => {
    const m = simulate(arch({ app: 2, lb: 1 }), { ...low, appDown: 1 });
    expect(m.errorRate).toBe(0);
    expect(appTier(m).capacity).toBe(COMPONENTS.app.capacityRps);
  });
});

describe('Unit 2 scenario "flash-sale"', () => {
  const sc = SCENARIOS['flash-sale'];
  const at = (a: Architecture, i: number) => simulate(a, { ...sc.baseLoad, ...sc.events[i].load });
  const SALE = 1;
  const DIES = 2;
  const cost = (a: Architecture) => simulate(a, sc.baseLoad).monthlyCost;

  test('three events: normal, the sale, a server dying mid-sale', () => {
    expect(sc.events).toHaveLength(3);
    expect(sc.events[DIES].load.appDown).toBe(1);
    expect(sc.events[DIES].load.rps).toBe(sc.events[SALE].load.rps);
  });
  test('the start architecture handles normal traffic and fails the sale', () => {
    expect(meetsSlo(at(sc.start, 0), sc.slo)).toBe(true);
    expect(meetsSlo(at(sc.start, SALE), sc.slo)).toBe(false);
  });
  test('more app servers without a load balancer still fail', () => {
    expect(meetsSlo(at({ ...sc.start, app: 3, queue: 1 }, SALE), sc.slo)).toBe(false);
  });
  test('load balancer + enough servers but no queue fails the sale on database writes', () => {
    const m = at({ ...sc.start, lb: 1, app: 3 }, SALE);
    expect(meetsSlo(m, sc.slo)).toBe(false);
    expect(m.bottleneck).toBe('db');
  });
  test('load balancer + queue + exactly enough servers passes the sale but fails when one dies', () => {
    const a = { ...sc.start, lb: 1, queue: 1, app: 2 };
    expect(meetsSlo(at(a, SALE), sc.slo)).toBe(true);
    expect(meetsSlo(at(a, DIES), sc.slo)).toBe(false);
  });
  test('load balancer + queue + one spare server solves every event within budget', () => {
    expect(solves(sc, { ...sc.start, lb: 1, queue: 1, app: 3 })).toBe(true);
  });
  test('one more server than needed is over budget', () => {
    expect(cost({ ...sc.start, lb: 1, queue: 1, app: 3 })).toBeLessThanOrEqual(sc.slo.budget);
    expect(cost({ ...sc.start, lb: 1, queue: 1, app: 4 })).toBeGreaterThan(sc.slo.budget);
  });
  test('a replica instead of a queue does not save the orders', () => {
    expect(solves(sc, { ...sc.start, lb: 1, replica: 1, app: 3 })).toBe(false);
  });
  test('the palette only offers pieces the scenario needs or tempts with', () => {
    expect(sc.palette).toEqual(['lb', 'app', 'queue', 'cache', 'replica']);
  });
});

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

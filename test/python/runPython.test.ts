// A fake Worker that never answers, so runs can be timed out and queued deterministically.
class SilentWorker {
  static instances: SilentWorker[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  terminated = false;
  constructor() {
    SilentWorker.instances.push(this);
  }
  postMessage(msg: { id: number }) {
    // Report "Pyodide loaded" so the 5 s run clock starts, then go quiet (an infinite loop).
    queueMicrotask(() => this.onmessage?.({ data: { id: msg.id, started: true } } as MessageEvent));
  }
  terminate() {
    this.terminated = true;
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  SilentWorker.instances = [];
  vi.stubGlobal('Worker', SilentWorker);
  vi.resetModules();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('when a run is stopped, a second run queued on the same worker settles instead of hanging', async () => {
  const { runTests } = await import('../../src/python/runPython');
  const tests = [{ args: [], expected: null }];
  const first = runTests('while True: pass', 'f', tests, 1000);
  const second = runTests('def f(): return None', 'f', tests, 60_000);
  await vi.advanceTimersByTimeAsync(1001);
  expect(await first).toEqual({ status: 'timeout' });
  const raced = Promise.race([second, new Promise((r) => setTimeout(() => r('hung'), 10))]);
  await vi.advanceTimersByTimeAsync(20);
  const outcome = await raced;
  expect(outcome).not.toBe('hung');
  expect(outcome).toMatchObject({ status: 'error' });
});

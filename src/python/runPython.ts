import { buildHarness, type PyTest } from './harness';

export type TestResult = { ok: boolean; got: string | null; error: string | null };
export type RunOutcome =
  | { status: 'done'; results: TestResult[] }
  | { status: 'timeout' }
  | { status: 'error'; message: string };

type Reply =
  | { id: number; started: true }
  | { id: number; ok: true; stdout: string }
  | { id: number; ok: false; message: string };

/** How long loading Pyodide may take before we give up (first run downloads ~10 MB). */
const LOAD_TIMEOUT_MS = 90_000;

let worker: Worker | null = null;
let nextId = 1;
const handlers = new Map<number, (r: Reply) => void>();

function getWorker(): Worker {
  if (!worker) {
    const w = new Worker(new URL('./worker.ts', import.meta.url), { type: 'classic' });
    w.onmessage = (e: MessageEvent<Reply>) => handlers.get(e.data.id)?.(e.data);
    w.onerror = (e) => {
      e.preventDefault();
      const message = e.message || 'The Python worker crashed.';
      for (const [id, handle] of [...handlers]) handle({ id, ok: false, message });
      kill(w);
    };
    worker = w;
  }
  return worker;
}

/** Stop the worker and settle every run still waiting on it, so none can hang. */
function kill(w: Worker) {
  w.terminate();
  if (worker === w) worker = null;
  for (const [id, handle] of [...handlers]) handle({ id, ok: false, message: 'Python was restarted. Run your code again.' });
}

/** Python traceback text → its last lines (e.g. "SyntaxError: invalid syntax"). */
function tail(message: string): string {
  const lines = message.trim().split('\n').filter(Boolean);
  return lines.slice(-3).join('\n') || 'Python reported an error.';
}

/**
 * Run user code against tests in a Pyodide worker. The timeout clock starts once Pyodide has
 * loaded. On timeout the worker is terminated; the next call starts a fresh one (Pyodide then
 * reloads from the HTTP cache).
 */
export function runTests(userCode: string, fn: string, tests: PyTest[], timeoutMs = 5000): Promise<RunOutcome> {
  let source: string;
  try {
    source = buildHarness(userCode, fn, tests);
  } catch (err) {
    return Promise.resolve({ status: 'error', message: err instanceof Error ? err.message : String(err) });
  }
  const w = getWorker();
  const id = nextId++;
  return new Promise<RunOutcome>((resolve) => {
    let timer = setTimeout(() => {
      finish({ status: 'error', message: "Couldn't load Python. Check your internet connection and try again." });
      kill(w);
    }, LOAD_TIMEOUT_MS);

    function finish(outcome: RunOutcome) {
      clearTimeout(timer);
      handlers.delete(id);
      resolve(outcome);
    }

    handlers.set(id, (reply) => {
      if ('started' in reply) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          finish({ status: 'timeout' });
          kill(w);
        }, timeoutMs);
        return;
      }
      if (!reply.ok) return finish({ status: 'error', message: tail(reply.message) });
      const line = reply.stdout.trim().split('\n').pop() ?? '';
      try {
        const parsed = JSON.parse(line) as { results: TestResult[] };
        finish({ status: 'done', results: parsed.results });
      } catch {
        finish({ status: 'error', message: 'Could not read the test results.' });
      }
    });
    w.postMessage({ id, code: source });
  });
}

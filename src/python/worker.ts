/* Classic web worker: loads Pyodide from the pinned jsDelivr URL and runs Python source. */
/* Kept free of runtime imports so it works as a classic worker (importScripts). */

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

type PyodideLike = {
  runPythonAsync: (code: string, opts?: { globals?: unknown }) => Promise<unknown>;
  setStdout: (opts: { batched: (line: string) => void }) => void;
  setStderr: (opts: { batched: (line: string) => void }) => void;
  globals: { get: (name: string) => unknown };
  toPy: (v: unknown) => { destroy?: () => void };
};

declare function importScripts(...urls: string[]): void;
declare function loadPyodide(opts: { indexURL: string }): Promise<PyodideLike>;

const ctx = self as unknown as {
  postMessage: (m: unknown) => void;
  onmessage: ((e: MessageEvent<{ id: number; code: string }>) => void) | null;
};

let ready: Promise<PyodideLike> | null = null;

function getPyodide(): Promise<PyodideLike> {
  if (!ready) {
    ready = (async () => {
      importScripts(`${PYODIDE_URL}pyodide.js`);
      return loadPyodide({ indexURL: PYODIDE_URL });
    })();
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

ctx.onmessage = async (e) => {
  const { id, code } = e.data;
  try {
    const py = await getPyodide();
    ctx.postMessage({ id, started: true });
    const lines: string[] = [];
    py.setStdout({ batched: (line) => lines.push(line) });
    py.setStderr({ batched: () => {} });
    const scope = py.toPy({});
    try {
      await py.runPythonAsync(code, { globals: scope });
    } finally {
      scope.destroy?.();
    }
    ctx.postMessage({ id, ok: true, stdout: lines.join('\n') });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx.postMessage({ id, ok: false, message });
  }
};

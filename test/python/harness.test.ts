import { buildHarness } from '../../src/python/harness';

const user = 'def pair_with_sum(nums, target):\n    return None\n';

/** Pull out the single-quoted literal inside json.loads('...') and undo Python escaping. */
function extractLiteral(src: string): string {
  const m = src.match(/json\.loads\('((?:[^'\\]|\\.)*)'\)/);
  if (!m) throw new Error('no json.loads literal');
  return m[1].replace(/\\(.)/g, '$1');
}

test('contains the user code verbatim and calls fn', () => {
  const src = buildHarness(user, 'pair_with_sum', [{ args: [[1, 2], 3], expected: [0, 1] }]);
  expect(src).toContain(user);
  expect(src).toContain('pair_with_sum');
});

test('args with quotes and newlines are embedded only as a json.loads literal that round-trips', () => {
  const tests = [{ args: ['a"b\nc', "it's"], expected: "x'\\y" }];
  const src = buildHarness('def f(a, b):\n    return a\n', 'f', tests);
  expect(JSON.parse(extractLiteral(src))).toEqual(tests);
  expect(src).not.toContain('a"b\nc');
  expect(src.match(/json\.loads\('/g)).toHaveLength(1);
});

test('ends by printing a single JSON line', () => {
  const src = buildHarness(user, 'pair_with_sum', [{ args: [[], 0], expected: null }]);
  const lines = src.trimEnd().split('\n');
  expect(lines[lines.length - 1]).toMatch(/^print\(.*json\.dumps\(.*results/);
  expect(src.match(/^print\(/gm)).toHaveLength(1);
});

test('rejects a function name that is not a Python identifier', () => {
  expect(() => buildHarness(user, 'f); import os; (', [])).toThrow();
});

// Runs the real harness under CPython (skipped where python3 is missing). Pyodide reuses one
// interpreter per worker, so a run must not leave sys.stdout swapped out for the next one.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const hasPython = (() => {
  try {
    execFileSync('python3', ['--version']);
    return true;
  } catch {
    return false;
  }
})();

test.skipIf(!hasPython)('a top-level error in user code does not break the next run in the same interpreter', () => {
  const tests = [{ args: [2], expected: 4 }];
  const broken = buildHarness('def double(x):\n    return x * 2\nundefined_name\n', 'double', tests);
  const good = buildHarness('def double(x):\n    return x * 2\n', 'double', tests);
  const dir = mkdtempSync(join(tmpdir(), 'iq-harness-'));
  writeFileSync(join(dir, 'a.py'), broken);
  writeFileSync(join(dir, 'b.py'), good);
  const driver = `
import sys
ns = {}
try:
    exec(open(sys.argv[1]).read(), {})
except Exception:
    pass
exec(open(sys.argv[2]).read(), {})
`;
  const out = execFileSync('python3', ['-I', '-c', driver, join(dir, 'a.py'), join(dir, 'b.py')]).toString();
  const last = out.trim().split('\n').pop()!;
  expect(JSON.parse(last)).toEqual({ results: [{ ok: true, got: '4', error: null }] });
});

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

export type PyTest = { args: unknown[]; expected: unknown };

/** A Python single-quoted string literal holding `text`. */
function pyLiteral(text: string): string {
  return `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
}

/**
 * Python source that runs the user's code, calls fn(*args) for each test inside try/except,
 * compares with == (tuples normalised to lists, since JSON has no tuples) and prints exactly one
 * JSON line: {"results":[{"ok":bool,"got":repr|null,"error":str|null}]}.
 * Test data travels as JSON inside a string literal, never as interpolated code.
 */
export function buildHarness(userCode: string, fn: string, tests: PyTest[]): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(fn)) throw new Error(`invalid function name: ${fn}`);
  const data = pyLiteral(JSON.stringify(tests));
  // Pyodide reuses one interpreter per worker. If an earlier run died at top level it may have left
  // sys.stdout swapped out, so always start from (and finally print to) the original stream.
  return `import json as __iq_json, sys as __iq_sys, io as __iq_io
__iq_sys.stdout = __iq_sys.__stdout__
__iq_sys.stdout = __iq_io.StringIO()

${userCode}

def __iq_norm(v):
    if isinstance(v, (list, tuple)):
        return [__iq_norm(x) for x in v]
    if isinstance(v, dict):
        return {k: __iq_norm(x) for k, x in v.items()}
    return v

def __iq_run():
    out = []
    tests = __iq_json.loads(${data})
    target = globals().get(${pyLiteral(fn)})
    for t in tests:
        if not callable(target):
            out.append({"ok": False, "got": None, "error": "Define a function named ${fn}."})
            continue
        try:
            got = target(*t["args"])
            out.append({"ok": __iq_norm(got) == t["expected"], "got": repr(got), "error": None})
        except Exception as e:
            out.append({"ok": False, "got": None, "error": type(e).__name__ + ": " + str(e)})
    return out

__iq_results = __iq_run()
__iq_sys.stdout = __iq_sys.__stdout__
print(__iq_json.dumps({"results": __iq_results}))
`;
}

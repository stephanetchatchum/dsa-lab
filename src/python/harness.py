# Test harness shared by the browser worker and scripts/verify.ts.
# Runs learner code, then each test, and returns a JSON report.
import json, sys, io, traceback, math


def _same(got, exp, mode):
    if mode == "sorted":
        return sorted(got) == sorted(exp)
    if mode == "unordered":
        norm = lambda xs: sorted(sorted(x) if isinstance(x, (list, tuple)) else x for x in xs)
        return norm(got) == norm(exp)
    if mode == "approx":
        return math.isclose(got, exp, rel_tol=1e-6, abs_tol=1e-9)
    return got == exp


def _clip(s, n=300):
    return s if len(s) <= n else s[: n - 3] + "..."


def run_tests(user_code, setup, tests_json):
    tests = json.loads(tests_json)
    out = io.StringIO()
    old = sys.stdout
    sys.stdout = out
    ns = {"__name__": "__learner__"}
    report = {"results": [], "error": None, "stdout": ""}
    try:
        try:
            if setup:
                exec(setup, ns)
            exec(user_code, ns)
        except Exception:
            tb = traceback.format_exc(limit=3)
            report["error"] = _clip(tb.split('File "<string>"')[-1] if '<string>' in tb else tb, 1200)
            return json.dumps(report)
        for t in tests:
            local = dict(ns)
            try:
                if t.get("call"):
                    got = eval(t["call"], local)
                else:
                    exec(t["code"], local)
                    got = local.get("result")
                exp = eval(t["expected"], local)
                ok = bool(_same(got, exp, t.get("compare", "exact")))
                report["results"].append({"ok": ok, "got": _clip(repr(got))})
            except Exception as e:
                report["results"].append({"ok": False, "error": _clip(f"{type(e).__name__}: {e}")})
    finally:
        sys.stdout = old
        report["stdout"] = _clip(out.getvalue(), 2000)
    return json.dumps(report)

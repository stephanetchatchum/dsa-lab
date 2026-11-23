/// <reference lib="webworker" />
// Runs Python (Pyodide) off the main thread so an infinite loop can be killed.
import harness from './harness.py?raw';

// Python is bundled with the site (see vite.config.ts) so it works offline.
// VITE_PYODIDE_URL can point elsewhere, e.g. a CDN.
const BASE =
  (import.meta.env.VITE_PYODIDE_URL as string) || new URL(`${import.meta.env.BASE_URL}pyodide/`, self.location.origin).href;

let pyPromise: Promise<any> | null = null;
function getPy() {
  if (!pyPromise) {
    pyPromise = (async () => {
      const mod = await import(/* @vite-ignore */ BASE + 'pyodide.mjs');
      const py = await mod.loadPyodide({ indexURL: BASE });
      py.runPython(harness);
      return py;
    })();
  }
  return pyPromise;
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, code, setup, tests } = e.data;
  try {
    const py = await getPy();
    if (type === 'warm') {
      self.postMessage({ id, ok: true });
      return;
    }
    const fn = py.globals.get('run_tests');
    const json = fn(code, setup ?? '', JSON.stringify(tests));
    fn.destroy?.();
    self.postMessage({ id, ok: true, report: JSON.parse(json) });
  } catch (err: any) {
    // a fatal interpreter error (e.g. JS stack overflow) leaves Pyodide unusable: tell the main thread to restart us
    self.postMessage({ id, ok: false, fatal: !!err?.pyodide_fatal_error || /fatal/i.test(String(err)), error: String(err?.message ?? err) });
  }
};

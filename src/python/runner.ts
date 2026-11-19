import type { Test } from '../types';

export interface TestResult {
  ok: boolean;
  got?: string;
  error?: string;
}
export interface Report {
  results: TestResult[];
  error: string | null;
  stdout: string;
  timedOut?: boolean;
}

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (v: any) => void>();
let ready = false;
const readyListeners = new Set<(r: boolean) => void>();

function spawn() {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => {
    const cb = pending.get(e.data.id);
    if (cb) {
      pending.delete(e.data.id);
      cb(e.data);
    }
  };
  return worker;
}

function call(msg: any, timeoutMs: number): Promise<any> {
  const w = worker ?? spawn();
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      // kill the stuck interpreter and start fresh next time
      w.terminate();
      worker = null;
      ready = false;
      resolve({ ok: true, timedOut: true });
    }, timeoutMs);
    pending.set(id, (v) => {
      clearTimeout(timer);
      resolve(v);
    });
    w.postMessage({ id, ...msg });
  });
}

export const python = {
  get ready() {
    return ready;
  },
  onReady(l: (r: boolean) => void) {
    readyListeners.add(l);
    return () => readyListeners.delete(l);
  },
  /** Start downloading Python early (first load ~10 MB, then cached). */
  async warm() {
    if (ready) return true;
    const r = await call({ type: 'warm' }, 120000);
    ready = !!r.ok && !r.timedOut;
    readyListeners.forEach((l) => l(ready));
    if (!r.ok) throw new Error(r.error || 'Python failed to load');
    return ready;
  },
  async run(code: string, tests: Test[], setup = ''): Promise<Report> {
    if (!ready) await python.warm();
    const r = await call({ type: 'run', code, setup, tests }, 8000);
    if (r.timedOut) {
      return { results: tests.map(() => ({ ok: false, error: 'Stopped' })), error: 'Your code ran longer than 8 seconds and was stopped. Check for a loop that never ends.', stdout: '', timedOut: true };
    }
    if (!r.ok) {
      if (r.fatal) {
        worker?.terminate();
        worker = null;
        ready = false;
        return {
          results: tests.map(() => ({ ok: false, error: 'Stopped' })),
          error: 'Python crashed (usually a recursion that goes too deep, or a very long chain of objects). It has been restarted, so you can run again.',
          stdout: '',
        };
      }
      return { results: [], error: r.error, stdout: '' };
    }
    return r.report as Report;
  },
};

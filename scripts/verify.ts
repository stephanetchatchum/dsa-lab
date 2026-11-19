/*
  Content verifier. Run: npm run verify   (or: npm run verify -- big-o arrays)

  For every topic it:
   1. runs every reference solution (build, fill, problems) against its tests
      in real Pyodide - the same Python the browser uses - with the same harness;
   2. checks that starter code does NOT already pass (so the exercise is real);
   3. generates every animation frame (hook, watch, play ops, predict, trace)
      and checks ids are unique and edges/pointers point at real cells;
   4. checks quiz/predict answer indexes.
  Exits non-zero on any failure.
*/
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadPyodide } from 'pyodide';
import type { Frame, Test, Topic } from '../src/types';
import { fillCode } from '../src/content/lib/fill';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);

const py = await loadPyodide();
py.runPython(readFileSync(join(root, 'src/python/harness.py'), 'utf8'));
const runTests = py.globals.get('run_tests');

function run(code: string, tests: Test[], setup = '') {
  return JSON.parse(runTests(code, setup, JSON.stringify(tests))) as {
    results: { ok: boolean; got?: string; error?: string }[];
    error: string | null;
  };
}

let failures = 0;
const fail = (where: string, msg: string) => {
  failures++;
  console.log(`   ✗ ${where}: ${msg}`);
};

function checkFrames(where: string, frames: Frame[]) {
  if (!frames.length) return fail(where, 'no frames');
  frames.forEach((f, i) => {
    if (!f.say?.trim()) fail(`${where}#${i}`, 'frame has no narration');
    const ids = new Set<string>();
    const cells = new Set<string>();
    for (const p of f.scene.prims) {
      if (ids.has(p.id)) fail(`${where}#${i}`, `duplicate id ${p.id}`);
      ids.add(p.id);
      if (p.kind === 'cell') cells.add(p.id);
    }
    const bars = new Set(f.scene.prims.filter((p) => p.kind === 'bar').map((p) => p.id));
    for (const p of f.scene.prims) {
      if (p.kind === 'edge' && (!cells.has(p.from) || !cells.has(p.to))) fail(`${where}#${i}`, `edge ${p.id} points at a missing cell`);
      if (p.kind === 'pointer' && !cells.has(p.target) && !bars.has(p.target)) fail(`${where}#${i}`, `pointer ${p.text} points at missing ${p.target}`);
      for (const k of ['x', 'y', 'w', 'h', 'x1', 'y1', 'x2', 'y2'] as const) {
        const v = (p as any)[k];
        if (v !== undefined && !Number.isFinite(v)) fail(`${where}#${i}`, `${p.id}.${k} is ${v}`);
      }
    }
  });
}

function checkTask(where: string, code: string, tests: Test[], setup?: string, starter?: string) {
  const r = run(code, tests, setup);
  if (r.error) return fail(where, `reference crashed: ${r.error}`);
  r.results.forEach((x, i) => {
    if (!x.ok) fail(where, `test ${i + 1} (${tests[i].show ?? tests[i].call ?? 'code'}) expected ${tests[i].expected}, got ${x.error ?? x.got}`);
  });
  if (starter !== undefined) {
    const s = run(starter, tests, setup);
    if (!s.error && s.results.every((x) => x.ok)) fail(where, 'starter code already passes every test');
  }
  return r.results.filter((x) => x.ok).length;
}

const coursesDir = join(root, 'src/content/courses');
let topicsChecked = 0;
let testsPassed = 0;
for (const course of readdirSync(coursesDir)) {
  const tdir = join(coursesDir, course, 'topics');
  if (!existsSync(tdir)) continue;
  for (const file of readdirSync(tdir).filter((f) => f.endsWith('.ts')).sort()) {
    const t: Topic = (await import(pathToFileURL(join(tdir, file)).href)).default;
    if (only.length && !only.includes(t.id)) continue;
    topicsChecked++;
    const before = failures;
    console.log(`\n▸ ${course}/${t.id}`);

    if (t.hook) checkFrames('hook', t.hook.frames());
    t.watch?.forEach((c) => checkFrames(`watch:${c.id}`, c.frames()));
    if (t.trace) checkFrames('trace', t.trace.frames());
    t.predict?.forEach((q) => {
      checkFrames(`predict:${q.id}`, q.frames());
      checkFrames(`predict:${q.id}:scene`, [{ scene: q.scene, say: 'scene' }]);
      if (q.answer < 0 || q.answer >= q.options.length) fail(`predict:${q.id}`, 'answer index out of range');
    });
    if (t.play) {
      let s = t.play.init();
      checkFrames('play:view', [{ scene: t.play.view(s), say: 'view' }]);
      for (const op of t.play.ops) {
        const args = Object.fromEntries((op.args ?? []).map((a) => [a.name, a.default]));
        try {
          const r = op.run(s, args);
          checkFrames(`play:${op.id}`, r.frames.length ? r.frames : [{ scene: t.play.view(r.state), say: 'x' }]);
          s = r.state;
          checkFrames(`play:${op.id}:view`, [{ scene: t.play.view(s), say: 'view' }]);
        } catch (e: any) {
          fail(`play:${op.id}`, `threw ${e.message}`);
        }
      }
    }
    t.quiz?.forEach((q, i) => {
      if (q.answer < 0 || q.answer >= q.options.length) fail(`quiz#${i}`, 'answer index out of range');
    });
    if (t.build) testsPassed += checkTask('build', t.build.solution, t.build.tests, t.build.setup, t.build.starter) ?? 0;
    if (t.fill) {
      if (t.fill.code.split('\n').filter((l) => l.trim() === '____').length !== 1) fail('fill', 'needs exactly one ____ line');
      testsPassed += checkTask('fill', fillCode(t.fill.code, t.fill.answer), t.fill.tests, t.fill.setup) ?? 0;
    }
    t.problems?.forEach((p) => {
      testsPassed += checkTask(`problem:${p.id}`, p.solution, p.tests, p.setup, p.starter) ?? 0;
    });
    if ((t.problems?.length ?? 0) !== 3) fail('problems', `expected 3 problems, found ${t.problems?.length ?? 0}`);
    if (failures === before) {
      const n = (t.build?.tests.length ?? 0) + (t.fill?.tests.length ?? 0) + (t.problems ?? []).reduce((a, p) => a + p.tests.length, 0);
      console.log(`   ✓ all frames valid, ${n} reference tests pass`);
    }
  }
}

console.log(`\n${topicsChecked} topics checked, ${testsPassed} reference tests passed, ${failures} problem(s).`);
process.exit(failures ? 1 : 0);

import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python as pyLang } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { Course, Test, Topic } from '../types';
import { python, type Report } from '../python/runner';
import { useProgress } from '../state/progress';
import { Say } from '../speech/Say';

export interface StepProps {
  course: Course;
  topic: Topic;
  /** progress key "course/topic" */
  pkey: string;
  /** a step can block Next until something is done */
  setCanNext: (ok: boolean) => void;
  /** lesson part being shown (lesson step only) */
  part?: number;
}

const cmTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'var(--code-bg)', color: 'var(--code-text)' },
    '.cm-content': { caretColor: 'var(--curr)', padding: '10px 0' },
    '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--code-com)', border: 'none' },
    '.cm-activeLine': { backgroundColor: 'rgba(127,127,127,.08)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--text)' },
    '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--curr)', borderLeftWidth: '2px' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'rgba(246,213,92,.25) !important' },
  },
  { dark: true },
);

const cmHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.operatorKeyword, t.bool, t.null], color: 'var(--code-kw)' },
    { tag: [t.string, t.special(t.string)], color: 'var(--code-str)' },
    { tag: [t.number], color: 'var(--code-num)' },
    { tag: [t.comment, t.lineComment], color: 'var(--code-com)', fontStyle: 'italic' },
    { tag: [t.function(t.variableName), t.function(t.definition(t.variableName)), t.definition(t.function(t.variableName))], color: 'var(--code-fn)' },
    { tag: [t.className, t.definition(t.className)], color: 'var(--code-fn)', fontWeight: '700' },
    { tag: [t.variableName, t.propertyName, t.operator, t.punctuation, t.bracket], color: 'var(--code-text)' },
  ]),
);

export function CodeEditor({ value, onChange, minHeight = '220px' }: { value: string; onChange: (v: string) => void; minHeight?: string }) {
  const ext = useMemo(() => [pyLang(), cmTheme, cmHighlight, EditorView.lineWrapping], []);
  return (
    <div className="editor">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={ext}
        theme="none"
        minHeight={minHeight}
        basicSetup={{ foldGutter: false, highlightActiveLine: true, autocompletion: true, indentOnInput: true }}
        indentWithTab
        aria-label="Python code editor"
      />
    </div>
  );
}

/** Persisted editor text keyed by id. */
export function useSavedCode(id: string, fallback: string) {
  const { doc, update } = useProgress();
  const [code, setCode] = useState(doc.code[id] ?? fallback);
  const t = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (doc.code[id] !== undefined && doc.code[id] !== code) setCode(doc.code[id]);
    // only when the stored value first arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const set = (v: string) => {
    setCode(v);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => update((d) => void (d.code[id] = v)), 600);
  };
  return [code, set] as const;
}

export function usePythonReady() {
  const [ready, setReady] = useState(python.ready);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const off = python.onReady(setReady);
    python.warm().catch((e) => setError(String(e.message ?? e)));
    return () => {
      off();
    };
  }, []);
  return { ready, error };
}

/** Editor + Run tests + results. Used by Build, Problems. */
export function CodeTaskView({
  id,
  starter,
  tests,
  setup,
  onPass,
  solution,
  revealAfter = 1,
}: {
  id: string;
  starter: string;
  tests: Test[];
  setup?: string;
  onPass?: () => void;
  solution?: string;
  /** runs before "show reference" appears */
  revealAfter?: number;
}) {
  const [code, setCode] = useSavedCode(id, starter);
  const [report, setReport] = useState<Report | null>(null);
  const [running, setRunning] = useState(false);
  const [runs, setRuns] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const { ready, error } = usePythonReady();

  async function run() {
    setRunning(true);
    const r = await python.run(code, tests, setup);
    setRunning(false);
    setReport(r);
    setRuns((n) => n + 1);
    if (!r.error && r.results.length === tests.length && r.results.every((x) => x.ok)) onPass?.();
  }
  const passed = report?.results.filter((r) => r.ok).length ?? 0;
  const allPass = report && !report.error && passed === tests.length;

  return (
    <div className="col">
      <CodeEditor value={code} onChange={setCode} />
      <div className="runbar">
        <button className="btn primary" onClick={run} disabled={running || !!error}>
          {running ? 'Running…' : '▶ Run tests'}
        </button>
        <button className="btn ghost" onClick={() => setCode(starter)}>Reset code</button>
        <span className="status" role="status">
          {error
            ? 'Python could not load. Check your connection and refresh.'
            : !ready
              ? 'Loading Python in your browser (first time is ~10 MB, then cached)…'
              : report
                ? allPass
                  ? `All ${tests.length} tests pass ✓`
                  : `${passed} of ${tests.length} tests pass`
                : 'Python ready'}
        </span>
      </div>
      {report?.error && <div className="err">{report.error}</div>}
      {report?.stdout && (
        <div>
          <div className="dim" style={{ fontSize: '.8rem' }}>Your print() output</div>
          <div className="err" style={{ color: 'var(--text)' }}>{report.stdout}</div>
        </div>
      )}
      <div className="tests" aria-label="Test cases">
        {tests.map((t, i) => {
          const r = report?.results[i];
          return (
            <div key={i} className={`test ${r ? (r.ok ? 'pass' : 'fail') : ''}`}>
              <span className="s">{r ? (r.ok ? '✓' : '✗') : '•'}</span>
              <span className="d">
                {t.show ?? t.call} → {t.expected}
                {r && !r.ok && <div className="got">{r.error ? r.error : `got ${r.got}`}</div>}
              </span>
            </div>
          );
        })}
      </div>
      {solution && (runs >= revealAfter || allPass) && (
        <div>
          <button className="btn sm" onClick={() => setShowSol((s) => !s)}>
            {showSol ? 'Hide reference solution' : 'Show reference solution'}
          </button>
          {showSol && (
            <div style={{ marginTop: '.7rem' }}>
              <ReadOnlyCode code={solution} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReadOnlyCode({ code }: { code: string }) {
  const ext = useMemo(() => [pyLang(), cmTheme, cmHighlight, EditorView.editable.of(false)], []);
  return (
    <div className="editor">
      <CodeMirror value={code} extensions={ext} theme="none" basicSetup={{ foldGutter: false, highlightActiveLine: false }} editable={false} />
    </div>
  );
}

export function Lines({ lines, lead = false }: { lines: string[]; lead?: boolean }) {
  return (
    <div className="chunks">
      {lines.map((l, i) => (
        <Say key={i} text={l} className={lead ? 'lead' : ''} />
      ))}
    </div>
  );
}

/** Option list with instant feedback. */
export function Choice({
  options,
  answer,
  picked,
  onPick,
}: {
  options: string[];
  answer: number;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  return (
    <div className="opts">
      {options.map((o, i) => {
        const cls = picked === null ? '' : i === answer ? 'right' : i === picked ? 'wrong' : '';
        return (
          <button key={i} className={`opt ${cls}`} disabled={picked !== null} onClick={() => onPick(i)}>
            <span className="k">{'abcd'[i]}</span>
            <span>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

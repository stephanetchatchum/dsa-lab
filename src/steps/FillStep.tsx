import { useState } from 'react';
import { python, type Report } from '../python/runner';
import { highlight } from '../viz/CodeView';
import { Lines, usePythonReady, type StepProps } from './common';
import { fillCode } from '../content/lib/fill';


export function FillStep({ topic }: StepProps) {
  const f = topic.fill!;
  const [line, setLine] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [tries, setTries] = useState(0);
  const [running, setRunning] = useState(false);
  const { ready } = usePythonReady();
  const lines = f.code.split('\n');
  const ok = report && !report.error && report.results.every((r) => r.ok);

  async function run() {
    setRunning(true);
    const r = await python.run(fillCode(f.code, line), f.tests, f.setup);
    setRunning(false);
    setReport(r);
    setTries((t) => t + 1);
  }

  return (
    <div className="twocol">
      <div className="col">
        <div className="code" style={{ lineHeight: 2.1 }}>
          {lines.map((l, i) => {
            const blank = l.trim() === '____';
            const indent = l.length - l.trimStart().length;
            return (
              <div key={i} className={`ln ${blank ? 'cur' : ''}`}>
                <span className="n">{i + 1}</span>
                {blank ? (
                  <span style={{ paddingLeft: `${indent}ch`, flex: 1, display: 'flex' }}>
                    <input
                      type="text"
                      aria-label="Missing line"
                      autoFocus
                      spellCheck={false}
                      value={line}
                      onChange={(e) => setLine(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && line.trim() && run()}
                      placeholder="type the missing line"
                      style={{ flex: 1, fontFamily: 'var(--font-code)', fontSize: '.92rem', padding: '.15rem .5rem', borderColor: 'var(--curr)' }}
                    />
                  </span>
                ) : (
                  <span>{highlight(l)}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="runbar">
          <button className="btn primary" onClick={run} disabled={!line.trim() || running}>
            {running ? 'Running…' : '▶ Run tests'}
          </button>
          <span className="status" role="status">
            {!ready ? 'Loading Python…' : report ? (ok ? 'All tests pass ✓' : `${report.results.filter((r) => r.ok).length} of ${f.tests.length} pass`) : ''}
          </span>
        </div>
        {report?.error && <div className="err">{report.error}</div>}
        <div className="tests">
          {f.tests.map((t, i) => {
            const r = report?.results[i];
            return (
              <div key={i} className={`test ${r ? (r.ok ? 'pass' : 'fail') : ''}`}>
                <span className="s">{r ? (r.ok ? '✓' : '✗') : '•'}</span>
                <span className="d">
                  {t.show ?? t.call} → {t.expected}
                  {r && !r.ok && <div className="got">{r.error ?? `got ${r.got}`}</div>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="side">
        <div className="panel-title">Fill the gap</div>
        <Lines lines={f.intro} />
        {tries >= 2 && !ok && (
          <div className="hint">
            <b>Answer:</b> <code>{f.answer}</code>
          </div>
        )}
      </div>
    </div>
  );
}

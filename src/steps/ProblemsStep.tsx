import { useState } from 'react';
import { useProgress } from '../state/progress';
import { Say } from '../speech/Say';
import { CodeView } from '../viz/CodeView';
import { CodeTaskView, Lines, type StepProps } from './common';

export function ProblemsStep({ topic, pkey }: StepProps) {
  const ps = topic.problems!;
  const [pi, setPi] = useState(0);
  const [hints, setHints] = useState<number[]>(ps.map(() => 0));
  const { doc, update } = useProgress();
  const p = ps[pi];
  const pid = `${pkey}/${p.id}`;
  const solved = (id: string) => !!doc.problems[`${pkey}/${id}`]?.solved;

  return (
    <div className="col gap-lg">
      <div className="problem-tabs" role="tablist">
        {ps.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === pi} className={`btn sm ${i === pi ? 'on' : ''}`} onClick={() => setPi(i)}>
            {solved(x.id) ? '✓ ' : ''}
            {x.title} <span className={`diff ${x.difficulty}`}>{x.difficulty}</span>
          </button>
        ))}
      </div>
      <div className="twocol" key={p.id}>
        <CodeTaskView
          id={pid}
          starter={p.starter}
          tests={p.tests}
          setup={p.setup}
          solution={p.solution}
          revealAfter={3}
          onPass={() => update((d) => void (d.problems[pid] = { solved: true, at: Date.now() }))}
        />
        <div className="side">
          <div>
            <div className="panel-title">{p.title}</div>
            <div className="row" style={{ marginBottom: '.6rem' }}>
              <span className={`diff ${p.difficulty}`}>{p.difficulty}</span>
              <span className="chip">{p.pattern}</span>
            </div>
            <Lines lines={p.intro} />
          </div>
          {p.setup && (
            <details>
              <summary className="dim">Helpers already loaded for you</summary>
              <CodeView code={p.setup} />
            </details>
          )}
          <div className="col" style={{ gap: '.5rem' }}>
            {p.examples.map((e, i) => (
              <div key={i} className="ex">
                <div>
                  <span className="dim">in </span>
                  {e.input}
                </div>
                <div>
                  <span className="dim">out </span>
                  {e.output}
                </div>
                {e.why && <div className="dim" style={{ fontFamily: 'var(--font-body)' }}>{e.why}</div>}
              </div>
            ))}
          </div>
          <div className="hints">
            {p.hints.slice(0, hints[pi]).map((h, i) => (
              <div key={i} className="hint">
                <b>{['Pattern', 'Approach', 'Pseudocode'][i]}:</b> <Say as="span" text={h} code={i === 2} />
              </div>
            ))}
            {hints[pi] < 3 && (
              <button className="btn sm" onClick={() => setHints((h) => h.map((v, i) => (i === pi ? v + 1 : v)))}>
                💡 {['Show pattern hint', 'Show approach hint', 'Show pseudocode'][hints[pi]]}
              </button>
            )}
          </div>
          <div className="dim" style={{ fontSize: '.9rem' }}>
            Target: {p.complexity.time} time, {p.complexity.space} extra space.
          </div>
        </div>
      </div>
      {topic.extra && topic.extra.length > 0 && (
        <div className="panel">
          <div className="panel-title">Extra practice on LeetCode</div>
          <Say className="dim" text="Same patterns, real interview problems. Solve them on LeetCode itself." />
          <div className="row" style={{ marginTop: '.7rem' }}>
            {topic.extra.map((x) => (
              <a key={x.url} className="chip" href={x.url} target="_blank" rel="noreferrer">
                <span className={`diff ${x.difficulty}`}>{x.difficulty[0].toUpperCase()}</span> {x.name} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { allCourses, getCourse } from '../content/registry';
import { level } from '../viz/CodeView';
import { Say } from '../speech/Say';
import { Choice } from '../steps/common';
import { href } from '../router';

export function Compare({ cid }: { cid?: string }) {
  const lc = getCourse(cid ?? '') ?? allCourses().find((c) => c.course.compare);
  const cmp = lc?.course.compare;
  const [picked, setPicked] = useState<(number | null)[]>(cmp?.scenarios.map(() => null) ?? []);
  if (!lc || !cmp) return <div className="page">No comparison for this course yet.</div>;
  return (
    <div className="page col gap-lg">
      <h1 className="title" style={{ fontSize: '3rem' }}>When to use which</h1>
      <Say className="lead" text="Same jobs, different costs. Green is cheap, red is expensive. Pick the structure whose cheap operations match what you do most." />
      <div className="tablewrap">
        <table className="ctable">
          <thead>
            <tr>
              <th>Structure</th>
              {cmp.ops.map((o) => (
                <th key={o}>{o}</th>
              ))}
              <th>Great for</th>
              <th>Avoid when</th>
            </tr>
          </thead>
          <tbody>
            {cmp.rows.map((r) => (
              <tr key={r.structure}>
                <td>{r.topic ? <a href={href(`learn/${lc.course.id}/${r.topic}`)}>{r.structure}</a> : r.structure}</td>
                {cmp.ops.map((o) => {
                  const v = r.costs[o] ?? '—';
                  const l = v === '—' ? 0 : level(v);
                  return (
                    <td key={o}>
                      {v === '—' ? (
                        <span className="dim">—</span>
                      ) : (
                        <div className="cm">
                          <span className={`meter l${l}`} aria-hidden>
                            <i /> <i /> <i /> <i /> <i />
                          </span>
                          <span className={`o l${l}`} style={{ fontFamily: 'var(--font-code)', fontWeight: 700, fontSize: '.85rem' }}>
                            {v}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
                <td style={{ fontSize: '.9rem' }}>{r.goodFor}</td>
                <td style={{ fontSize: '.9rem' }} className="dim">{r.badFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel col gap-lg">
        <div className="panel-title">Pick the structure</div>
        {cmp.scenarios.map((s, i) => (
          <div key={i} className="col">
            <Say text={s.q} />
            <Choice options={s.options} answer={s.answer} picked={picked[i]} onPick={(k) => setPicked(picked.map((v, j) => (j === i ? k : v)))} />
            {picked[i] !== null && <Say className="dim" text={s.why} />}
          </div>
        ))}
      </div>
    </div>
  );
}

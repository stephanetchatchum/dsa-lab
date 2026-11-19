import type { JSX } from 'react';
import type { BigO, Cost } from '../types';

const KW = new Set(
  'def return if elif else for while in not and or is None True False class import from as with lambda yield pass break continue try except finally raise global nonlocal del assert'.split(' '),
);

/** Tiny Python highlighter (good enough for short snippets). */
export function highlight(line: string) {
  const out: JSX.Element[] = [];
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    const k = i++;
    if (m[1]) out.push(<span key={k} className="tok-com">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k} className="tok-str">{m[2]}</span>);
    else if (m[3]) out.push(<span key={k} className="tok-num">{m[3]}</span>);
    else if (m[4]) out.push(<span key={k} className={KW.has(m[4]) ? 'tok-kw' : 'tok-fn'}>{m[4]}</span>);
    else if (m[5]) out.push(KW.has(m[5]) ? <span key={k} className="tok-kw">{m[5]}</span> : <span key={k}>{m[5]}</span>);
    else out.push(<span key={k}>{m[0]}</span>);
  }
  return out;
}

export function CodeView({ code, line }: { code: string; line?: number }) {
  const lines = code.replace(/\n$/, '').split('\n');
  return (
    <div className="code" data-say={undefined}>
      {lines.map((l, i) => (
        <div key={i} className={`ln ${line === i + 1 ? 'cur' : ''}`}>
          <span className="n">{i + 1}</span>
          <span>{highlight(l)}</span>
        </div>
      ))}
    </div>
  );
}

export function Vars({ vars, prev }: { vars?: Record<string, string | number>; prev?: Record<string, string | number> }) {
  if (!vars) return null;
  return (
    <div className="vars" aria-label="Variables">
      {Object.entries(vars).map(([k, v]) => (
        <span key={k} className={`chip ${prev && prev[k] !== v ? 'changed' : ''}`}>
          {k} = {String(v)}
        </span>
      ))}
    </div>
  );
}

export function level(o: BigO): number {
  const s = o.replace(/\s/g, '');
  if (s === 'O(1)') return 1;
  if (/^O\(log/.test(s) || s === 'O(h)' || s === 'O(α(n))' || s === 'O(L)' || s === 'O(k)' || s === 'O(m)') return 2;
  if (/nlog|n·log|ElogV|\(V\+E\)log/.test(s)) return 4;
  if (/n²|n\^2|n\*m|nm|V²|n·m|n×m|n\*W|nW|n·W/.test(s)) return 5;
  if (/2ⁿ|2\^n|n!|\^/.test(s)) return 6;
  return 3; // O(n), O(V+E), O(n+k)...
}

export function CostMeter({ costs, title = 'What it costs' }: { costs: Cost[]; title?: string }) {
  return (
    <div>
      <div className="panel-title">{title}</div>
      <div className="cost">
        {costs.map((c) => {
          const l = level(c.time);
          return (
            <div key={c.op} style={{ display: 'contents' }}>
              <span className="op">{c.op}</span>
              <span className={`meter l${l}`} aria-hidden>
                <i /> <i /> <i /> <i /> <i />
              </span>
              <span className={`o l${l}`} title={c.space ? `extra space ${c.space}` : undefined}>
                {c.time}
                {c.space && <span className="dim" style={{ fontWeight: 400 }}> · {c.space} space</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

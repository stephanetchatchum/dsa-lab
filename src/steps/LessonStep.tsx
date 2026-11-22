import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { LessonBlock } from '../types';
import { Say, useReader } from '../speech/Say';
import { reader } from '../speech/reader';
import { useSettings } from '../state/settings';
import { Player } from '../viz/Player';
import { Stage } from '../viz/Stage';
import { CodeView } from '../viz/CodeView';
import { md } from '../speech/md';
import type { StepProps } from './common';
import { lessonParts } from '../content/registry';

const NOTE: Record<string, { label: string; icon: string }> = {
  why: { label: 'Why it works', icon: '💡' },
  pitfall: { label: 'Watch out', icon: '⚠️' },
  python: { label: 'In Python', icon: '🐍' },
  cost: { label: 'What it costs', icon: '⏱️' },
  science: { label: 'In science & engineering', icon: '🔬' },
  remember: { label: 'Remember', icon: '📌' },
  example: { label: 'Example', icon: '✏️' },
};

function Block({ b }: { b: LessonBlock }) {
  if ('p' in b) return <Say as="p" className="lp" text={b.p} />;
  if ('list' in b) {
    const L = b.ordered ? 'ol' : 'ul';
    return (
      <L className="ll">
        {b.list.map((x, i) => (
          <Say key={i} as="li" text={x} btn={false} />
        ))}
      </L>
    );
  }
  if ('code' in b)
    return (
      <div className="lcode" data-tts="code" data-say={b.say}>
        <CodeView code={b.code} />
      </div>
    );
  if ('figure' in b) return <Figure make={b.figure} caption={b.caption} />;
  if ('scene' in b)
    return (
      <figure className="lfig">
        <Stage scene={b.scene} label={b.caption} />
        <Say as="figcaption" text={b.caption} btn={false} />
      </figure>
    );
  if ('note' in b) {
    const n = NOTE[b.kind];
    return (
      <aside className={`lnote ${b.kind}`}>
        <span className="lnote-ic" aria-hidden>
          {n.icon}
        </span>
        <Say as="p" text={`**${n.label}.** ${b.note}`} btn={false} />
      </aside>
    );
  }
  if ('table' in b) {
    const [head, ...rows] = b.table;
    return (
      <div className="tablewrap">
        <table className="ltable">
          <thead>
            <tr data-tts="">
              {head.map((h, i) => (
                <th key={i}>
                  {md(h)}
                  {i < head.length - 1 && <span className="sr">, </span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} data-tts="">
                {r.map((c, ci) => (
                  <td key={ci}>
                    {md(c)}
                    {ci < r.length - 1 && <span className="sr">, </span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {b.caption && <Say as="p" className="dim" text={b.caption} btn={false} />}
      </div>
    );
  }
  return null;
}

function Figure({ make, caption }: { make: () => import('../types').Frame[]; caption: string }) {
  const frames = useMemo(() => make(), [make]);
  return (
    <figure className="lfig">
      <Player frames={frames} compact />
      <Say as="figcaption" text={caption} btn={false} />
    </figure>
  );
}

const BREAK_TEXT: Record<string, string> = {
  watch: 'Good place to pause. Take a breath, then next you’ll **watch it move**: the animations show what you just read.',
  play: 'Nice. Stretch for a moment. Next you’ll **try it yourself**: run the algorithms and see the costs.',
  predict: 'Quick break. Next you’ll **predict** what happens before the animation shows you.',
  trace: 'Short break. Next you’ll **trace the code** line by line.',
  recall: 'Pause here. Next you’ll **write it back** from memory.',
};

export function LessonStep({ topic, part = 0 }: StepProps) {
  const all = topic.lesson!;
  const parts = lessonParts(topic);
  const range = parts[Math.min(part, parts.length - 1)] ?? { from: 0, to: all.length - 1 };
  const sections = all.slice(range.from, range.to + 1);
  const isLast = part >= parts.length - 1;
  const st = useSettings();
  const rs = useReader();
  const refs = useRef<(HTMLElement | null)[]>([]);
  const [cur, setCur] = useState(0);

  const words = useMemo(() => {
    let n = 0;
    for (const s of sections)
      for (const b of s.blocks) {
        const t = 'p' in b ? b.p : 'note' in b ? b.note : 'list' in b ? b.list.join(' ') : 'figure' in b || 'scene' in b ? b.caption : '';
        n += t.split(/\s+/).length;
      }
    return n;
  }, [sections]);
  const minutes = Math.max(1, Math.round(words / (155 * st.rate)));

  // which section is on screen / being read
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.sec));
        if (vis.length) setCur(Math.min(...vis));
      },
      { rootMargin: '-30% 0px -55% 0px' },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <div className="lesson-wrap">
      <article className="lesson">
        <div className="lesson-intro no-tts">
          <button className="btn primary" onClick={() => (rs.playing ? reader.pause() : reader.play(rs.idx > 0 ? undefined : 0))}>
            {rs.playing ? '❚❚ Pause' : rs.idx > 0 ? '▶ Resume listening' : '▶ Listen to the whole lesson'}
          </button>
          <span className="dim">
            {parts.length > 1 ? `Part ${part + 1} of ${parts.length} · ` : ''}about {minutes} min · double-click any paragraph to listen from there
          </span>
        </div>
        {sections.map((s, si) => (
          <section key={si} className="lsec" data-sec={si} ref={(el) => void (refs.current[si] = el)}>
            <Say as="h2" className="lh" text={`${range.from + si + 1}. ${s.title}`} />
            {s.blocks.map((b, bi) => (
              <Fragment key={bi}>
                <Block b={b} />
              </Fragment>
            ))}
          </section>
        ))}
        <aside className="lbreak">
          <span className="lbreak-ic" aria-hidden>
            {isLast ? '🎉' : '☕'}
          </span>
          <Say
            as="p"
            btn={false}
            text={
              isLast
                ? 'That’s the whole lesson. Next you’ll **write it back** in your own words, then practise.'
                : BREAK_TEXT[range.breakAfter ?? 'watch'] ?? 'Good place to pause before the next part.'
            }
          />
        </aside>
      </article>
      <nav className="ltoc no-tts" aria-label="Lesson parts">
        <div className="panel-title">{parts.length > 1 ? `Part ${part + 1} of ${parts.length}` : 'In this lesson'}</div>
        <ol start={range.from + 1} style={{ counterReset: `s ${range.from}` }}>
          {sections.map((s, si) => (
            <li key={si} className={si === cur ? 'on' : si < cur ? 'past' : ''}>
              <button
                onClick={() => {
                  const el = refs.current[si];
                  el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
                  const h = el?.querySelector('[data-tts]') as HTMLElement | null;
                  if (h && rs.playing) reader.fromElement(h);
                }}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        {parts.length > 1 && !isLast && (
          <p className="dim" style={{ fontSize: '.9rem', marginTop: '.8rem' }}>
            Coming later: {all.slice(range.to + 1).map((x) => x.title).join(' · ')}
          </p>
        )}
        <p className="dim" style={{ fontSize: '.85rem', marginTop: '.8rem' }}>
          Space: play / pause · ← →: previous / next line · Esc: stop
        </p>
      </nav>
    </div>
  );
}

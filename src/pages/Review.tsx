import { useMemo, useState } from 'react';
import type { QuizQ } from '../types';
import { allCourses, topicKey } from '../content/registry';
import { useProgress } from '../state/progress';
import type { ProgressDoc } from '../storage/types';
import { Say } from '../speech/Say';
import { Choice } from '../steps/common';
import { href } from '../router';

const DAY = 86400000;
export const MARKS = [
  { key: 'd1', days: 1 },
  { key: 'd3', days: 3 },
  { key: 'd7', days: 7 },
];

export interface Due {
  key: string;
  mark: string;
  title: string;
  course: string;
}

/** Topics finished 1, 3 or 7+ days ago whose review for that mark isn't done. */
export function dueReviews(doc: ProgressDoc, now = Date.now()): Due[] {
  const out: Due[] = [];
  for (const { course, topics } of allCourses()) {
    for (const t of topics) {
      const key = topicKey(course.id, t.id);
      const p = doc.topics[key];
      if (!p?.completedAt) continue;
      const age = (now - p.completedAt) / DAY;
      // the earliest pending mark that has come due
      const m = MARKS.find((m) => !p.reviews?.[m.key]);
      if (m && age >= m.days) out.push({ key, mark: m.key, title: t.title, course: course.id });
    }
  }
  return out;
}

function shuffle<T>(xs: T[], seed: number) {
  const a = [...xs];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Review() {
  const { doc, update } = useProgress();
  const due = dueReviews(doc);
  const [i, setI] = useState(0);
  const cur = due[Math.min(i, due.length - 1)];

  if (!due.length) {
    const finished = Object.values(doc.topics).filter((t) => t.completedAt).length;
    return (
      <div className="page col gap-lg">
        <h1 className="title" style={{ fontSize: '3rem' }}>Review</h1>
        <Say
          className="lead"
          text={
            finished
              ? 'Nothing due right now. Topics come back 1, 3 and 7 days after you finish them.'
              : 'Finish a topic and it will come back here 1, 3 and 7 days later for a quick recall.'
          }
        />
        <MixedPractice />
        <a className="btn" href={href('')}>Back to the map</a>
      </div>
    );
  }
  return (
    <div className="page col gap-lg">
      <div className="row">
        <h1 className="title" style={{ fontSize: '3rem' }}>Review</h1>
        <span className="spacer" />
        <span className="count">{due.length} due</span>
      </div>
      <ReviewCard
        key={cur.key + cur.mark}
        due={cur}
        onDone={() => {
          update((d) => {
            const t = d.topics[cur.key];
            t.reviews = { ...(t.reviews ?? {}), [cur.mark]: Date.now() };
          });
          setI(0);
        }}
      />
    </div>
  );
}

function ReviewCard({ due, onDone }: { due: Due; onDone: () => void }) {
  const { doc } = useProgress();
  const p = doc.topics[due.key];
  const [text, setText] = useState('');
  const [reveal, setReveal] = useState(false);
  const course = allCourses().find((c) => c.course.id === due.course)!;
  const topic = course.topics.find((t) => topicKey(due.course, t.id) === due.key)!;
  const q = useMemo<QuizQ | undefined>(() => {
    const pool = topic.quiz ?? [];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [topic]);
  const [picked, setPicked] = useState<number | null>(null);
  const dayLabel = { d1: '1 day', d3: '3 days', d7: '7 days' }[due.mark];

  return (
    <div className="twocol">
      <div className="col gap-lg">
        <Say className="lead" text={`${due.title}, ${dayLabel} later. Rewrite your explanation from memory, without peeking.`} />
        <textarea className="lined" value={text} onChange={(e) => setText(e.target.value)} placeholder="From memory…" aria-label="Rewrite from memory" />
        <button className="btn" disabled={text.trim().length < 15} onClick={() => setReveal(true)}>
          Show what I wrote before
        </button>
        {reveal && <Say className="model" text={p.explain || p.recall || 'You did not save an explanation for this topic.'} />}
      </div>
      <div className="side">
        {q && (
          <>
            <div className="panel-title">Quick recall</div>
            <Say text={q.q} />
            <Choice options={q.options} answer={q.answer} picked={picked} onPick={setPicked} />
            {picked !== null && <Say className="dim" text={q.why} />}
          </>
        )}
        <button className="btn primary big" disabled={!reveal || (q && picked === null)} onClick={onDone}>
          Done with this review
        </button>
      </div>
    </div>
  );
}

/** Interleaved questions from every finished topic, so you practise choosing. */
export function MixedPractice() {
  const { doc } = useProgress();
  const pool = useMemo(() => {
    const qs: (QuizQ & { from: string })[] = [];
    for (const { course, topics } of allCourses())
      for (const t of topics)
        if (doc.topics[topicKey(course.id, t.id)]?.completedAt) for (const q of t.quiz ?? []) qs.push({ ...q, from: t.title });
    for (const { course } of allCourses()) for (const s of course.compare?.scenarios ?? []) qs.push({ ...s, from: 'Choosing a structure' });
    return shuffle(qs, Date.now() % 1000).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [picked, setPicked] = useState<(number | null)[]>(pool.map(() => null));
  if (!pool.length) return null;
  return (
    <div className="panel col gap-lg">
      <div className="panel-title">Mixed practice</div>
      <Say className="dim" text="Questions from different topics, shuffled. Mixing them trains you to pick the right tool." />
      {pool.map((q, i) => (
        <div key={i} className="col">
          <div className="dim" style={{ fontSize: '.85rem' }}>{q.from}</div>
          <Say text={q.q} />
          <Choice options={q.options} answer={q.answer} picked={picked[i]} onPick={(k) => setPicked(picked.map((v, j) => (j === i ? k : v)))} />
          {picked[i] !== null && <Say className="dim" text={q.why} />}
        </div>
      ))}
    </div>
  );
}

import { allCourses, stepsFor, topicKey } from '../content/registry';
import { streak, useProgress } from '../state/progress';
import { href } from '../router';
import { Say } from '../speech/Say';
import { dueReviews } from './Review';

export function Dashboard() {
  const { doc } = useProgress();
  const courses = allCourses();
  const solved = Object.values(doc.problems).filter((p) => p.solved).length;
  const done = Object.values(doc.topics).filter((t) => t.completedAt).length;
  const due = dueReviews(doc).length;
  const s = streak(doc.days);

  return (
    <div className="page">
      <div className="hero">
        <div>
          <div className="dim">Welcome back</div>
          <h1>Watch it. Say it. Write it. Use it.</h1>
        </div>
        <div className="spacer" />
        <div className="stats">
          <div className="stat panel">
            <div className="v">{done}</div>
            <div className="l">topics finished</div>
          </div>
          <div className="stat panel">
            <div className="v">{solved}</div>
            <div className="l">problems solved</div>
          </div>
          <div className="stat panel">
            <div className="v">{s}</div>
            <div className="l">day streak</div>
          </div>
          {due > 0 && (
            <a className="stat panel" href={href('review')} style={{ textDecoration: 'none', color: 'inherit', borderColor: 'var(--new)' }}>
              <div className="v" style={{ color: 'var(--new)' }}>{due}</div>
              <div className="l">reviews due →</div>
            </a>
          )}
        </div>
      </div>

      {courses.map(({ course, topics }) => {
        const nextIdx = topics.findIndex((t) => !doc.topics[topicKey(course.id, t.id)]?.completedAt);
        return (
          <section key={course.id} className="col gap-lg" style={{ marginBottom: '2.5rem' }}>
            <div className="row">
              <h2 className="title" style={{ fontSize: '2.2rem' }}>{course.title}</h2>
              <span className="spacer" />
              {course.compare && (
                <a className="btn sm" href={href(`compare/${course.id}`)}>
                  When to use which
                </a>
              )}
            </div>
            <Say text={course.short} className="dim" />
            <div className="map">
              {topics.map((t, i) => {
                const p = doc.topics[topicKey(course.id, t.id)];
                const total = stepsFor(course, t).length;
                const pct = p ? (p.completedAt ? 100 : Math.round((p.done.length / total) * 100)) : 0;
                return (
                  <a
                    key={t.id}
                    href={href(`learn/${course.id}/${t.id}`)}
                    className={`tile ${p?.completedAt ? 'done' : ''} ${i === nextIdx ? 'next' : ''}`}
                  >
                    <span className="num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ic" aria-hidden>{p?.completedAt ? '✅' : t.icon}</span>
                    <h3>{t.title}</h3>
                    <span className="dim" style={{ fontSize: '.9rem' }}>{t.short}</span>
                    <div className="bar" aria-label={`${pct}% done`}>
                      <div style={{ width: `${pct}%` }} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

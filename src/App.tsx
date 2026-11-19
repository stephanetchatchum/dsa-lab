import { allCourses } from './content/registry';
import { useRoute, href } from './router';
import { useProgress } from './state/progress';
import { Dashboard } from './pages/Dashboard';
import { TopicPage } from './pages/TopicPage';
import { Compare } from './pages/Compare';
import { Review, dueReviews } from './pages/Review';
import { Settings } from './pages/Settings';

export function App() {
  const r = useRoute();
  const { doc } = useProgress();
  const due = dueReviews(doc).length;
  const firstCourse = allCourses()[0]?.course.id ?? '';

  let page;
  if (r[0] === 'learn' && r[1] && r[2]) page = <TopicPage key={`${r[1]}/${r[2]}`} cid={r[1]} tid={r[2]} stepParam={r[3]} />;
  else if (r[0] === 'compare') page = <Compare cid={r[1] ?? firstCourse} />;
  else if (r[0] === 'review') page = <Review />;
  else if (r[0] === 'settings') page = <Settings />;
  else page = <Dashboard />;

  const nav = (to: string, i: string, label: string, badge?: number) => (
    <a className={`nav ${(r[0] ?? '') === to ? 'active' : ''}`} href={href(to)}>
      <span className="i" aria-hidden>{i}</span>
      {label}
      {!!badge && <span className="badge">{badge}</span>}
    </a>
  );

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <a className="logo" href={href('')} aria-label="Home">{'{ }'}</a>
        {nav('', '▦', 'Map')}
        {nav('review', '↻', 'Review', due)}
        {nav('compare', '⚖', 'Compare')}
        <span className="sp" />
        {nav('settings', '⚙', 'Settings')}
      </nav>
      <main className="main">{page}</main>
    </div>
  );
}

import type { Course, StepKind, Topic } from '../types';

/*
  Content is discovered automatically:
    src/content/courses/<courseId>/course.ts        -> export default Course
    src/content/courses/<courseId>/topics/<any>.ts  -> export default Topic
  Add a file, and it appears in the app. No app code changes needed.
*/
const courseMods = import.meta.glob<Course>('./courses/*/course.ts', { eager: true, import: 'default' });
const topicMods = import.meta.glob<Topic>('./courses/*/topics/*.ts', { eager: true, import: 'default' });

export interface LoadedCourse {
  course: Course;
  topics: Topic[];
}

const courses: LoadedCourse[] = Object.entries(courseMods)
  .map(([path, course]) => {
    const dir = path.split('/')[2];
    const topics = Object.entries(topicMods)
      .filter(([p]) => p.split('/')[2] === dir)
      .map(([, t]) => t)
      .sort((a, b) => a.order - b.order);
    return { course, topics };
  })
  .sort((a, b) => a.course.title.localeCompare(b.course.title));

export const allCourses = () => courses;
export const getCourse = (id: string) => courses.find((c) => c.course.id === id);
export const getTopic = (cid: string, tid: string) => getCourse(cid)?.topics.find((t) => t.id === tid);
export const topicKey = (cid: string, tid: string) => `${cid}/${tid}`;

const has: Record<StepKind, (t: Topic) => boolean> = {
  /** topics with a full lesson introduce the analogy inside it, after the concept */
  hook: (t) => !!t.hook && !t.lesson?.length,
  watch: (t) => !!t.watch?.length,
  lesson: (t) => !!t.lesson?.length,
  recall: (t) => !!t.recall,
  play: (t) => !!t.play,
  predict: (t) => !!t.predict?.length,
  trace: (t) => !!t.trace,
  build: (t) => !!t.build,
  fill: (t) => !!t.fill,
  wild: (t) => !!t.wild?.length,
  problems: (t) => !!t.problems?.length,
  recap: (t) => !!(t.quiz?.length || true),
};

export interface StepRef {
  /** unique within the topic, used for progress */
  key: string;
  kind: StepKind;
  /** lesson part index (lesson steps only) */
  part?: number;
  parts?: number;
}

/** Split a lesson into parts at sections marked `breakAfter`. */
export function lessonParts(t: Topic): { from: number; to: number; breakAfter?: StepKind }[] {
  const out: { from: number; to: number; breakAfter?: StepKind }[] = [];
  const secs = t.lesson ?? [];
  let from = 0;
  secs.forEach((s, i) => {
    if (s.breakAfter || i === secs.length - 1) {
      out.push({ from, to: i, breakAfter: s.breakAfter });
      from = i + 1;
    }
  });
  return out;
}

/**
 * The steps a topic actually has. A lesson split into parts is interleaved with the
 * steps named in `breakAfter`, so learning is spaced out: read a bit, watch, read, play…
 */
export function stepsFor(c: Course, t: Topic): StepRef[] {
  const base = c.steps.filter((k) => has[k](t));
  if (!base.includes('lesson')) return base.map((k) => ({ key: k, kind: k }));
  const parts = lessonParts(t);
  const used = new Set<StepKind>(['lesson']);
  const inner: StepRef[] = [];
  parts.forEach((p, i) => {
    inner.push({ key: `lesson:${i}`, kind: 'lesson', part: i, parts: parts.length });
    if (p.breakAfter && base.includes(p.breakAfter) && !used.has(p.breakAfter)) {
      inner.push({ key: p.breakAfter, kind: p.breakAfter });
      used.add(p.breakAfter);
    }
  });
  const out: StepRef[] = [];
  for (const k of base) {
    if (k === 'lesson') out.push(...inner);
    else if (!used.has(k)) out.push({ key: k, kind: k });
  }
  return out;
}

export const stepLabel = (r: StepRef) =>
  r.kind === 'lesson' && (r.parts ?? 1) > 1 ? `Learn · part ${(r.part ?? 0) + 1} of ${r.parts}` : STEP_LABEL[r.kind];

export const STEP_LABEL: Record<StepKind, string> = {
  hook: 'Hook',
  watch: 'Watch it',
  lesson: 'Learn the concept',
  recall: 'Write it back',
  play: 'Play with it',
  predict: 'Predict',
  trace: 'Trace the code',
  build: 'Build it',
  fill: 'Fill the gap',
  wild: 'In the wild',
  problems: 'Problems',
  recap: 'Recap',
};

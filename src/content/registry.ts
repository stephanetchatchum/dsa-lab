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
  hook: (t) => !!t.hook,
  watch: (t) => !!t.watch?.length,
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

/** Steps a topic actually has, in the course's order. */
export const stepsFor = (c: Course, t: Topic): StepKind[] => c.steps.filter((k) => has[k](t));

export const STEP_LABEL: Record<StepKind, string> = {
  hook: 'Hook',
  watch: 'Watch it',
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

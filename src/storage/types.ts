import type { StepKind } from '../types';

export interface TopicProgress {
  /** index of the step the learner is on */
  step: number;
  done: StepKind[];
  completedAt?: number;
  /** "write it back" answer (step 3) */
  recall?: string;
  /** final "explain in your own words" */
  explain?: string;
  quizScore?: number;
  /** spaced review: day-mark -> timestamp done, e.g. { d1: 1700000000 } */
  reviews?: Record<string, number>;
}

export interface ProgressDoc {
  v: 1;
  topics: Record<string, TopicProgress>;
  problems: Record<string, { solved: boolean; at?: number }>;
  /** saved editor contents by editor id */
  code: Record<string, string>;
  /** active days, YYYY-MM-DD (local time) */
  days: string[];
  updatedAt: number;
}

export const emptyDoc = (): ProgressDoc => ({ v: 1, topics: {}, problems: {}, code: {}, days: [], updatedAt: 0 });

/** Anything that can load/save progress. Swap implementations without touching the UI. */
export interface ProgressStore {
  kind: 'local' | 'supabase';
  load(): Promise<ProgressDoc | null>;
  save(doc: ProgressDoc): Promise<void>;
}

/** Merge two docs without losing work from either side. */
export function mergeDocs(a: ProgressDoc, b: ProgressDoc): ProgressDoc {
  const topics: Record<string, TopicProgress> = { ...a.topics };
  for (const [k, t] of Object.entries(b.topics)) {
    const o = topics[k];
    if (!o) {
      topics[k] = t;
      continue;
    }
    topics[k] = {
      step: Math.max(o.step, t.step),
      done: Array.from(new Set([...o.done, ...t.done])),
      completedAt: o.completedAt && t.completedAt ? Math.min(o.completedAt, t.completedAt) : o.completedAt ?? t.completedAt,
      recall: o.recall || t.recall,
      explain: (a.updatedAt >= b.updatedAt ? o.explain || t.explain : t.explain || o.explain),
      quizScore: Math.max(o.quizScore ?? 0, t.quizScore ?? 0) || undefined,
      reviews: { ...(t.reviews ?? {}), ...(o.reviews ?? {}) },
    };
  }
  const problems = { ...b.problems };
  for (const [k, p] of Object.entries(a.problems)) problems[k] = { solved: p.solved || !!problems[k]?.solved, at: p.at ?? problems[k]?.at };
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  const older = newer === a ? b : a;
  return {
    v: 1,
    topics,
    problems,
    code: { ...older.code, ...newer.code },
    days: Array.from(new Set([...a.days, ...b.days])).sort(),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

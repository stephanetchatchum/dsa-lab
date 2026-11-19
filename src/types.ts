/* =========================================================================
   Content contract. Everything a course/topic file can describe lives here.
   Topic files are plain data + pure functions (no React), so they can be
   tested in Node by scripts/verify.ts.
   ========================================================================= */

/** Fixed meaning colours. Same role = same colour in every theme. */
export type Role =
  | 'default' // plain value
  | 'head' // head / root / start          (blue)
  | 'curr' // current pointer / i          (yellow)
  | 'new' // newly created / inserted     (pink)
  | 'second' // second pointer / j / fast   (purple)
  | 'done' // visited / sorted / found     (green)
  | 'danger' // removed / collision / wrong (red)
  | 'muted'; // old / irrelevant            (dim)

/* ---------- Scene primitives (all coordinates are CENTRES, viewBox units) ---------- */
interface Base {
  id: string;
  role?: Role;
  glow?: boolean;
  opacity?: number;
}
/** A box. shape 'node' = value + pointer slot (linked list style). */
export interface CellP extends Base {
  kind: 'cell';
  x: number;
  y: number;
  w?: number;
  h?: number;
  value?: string | number;
  shape?: 'box' | 'node' | 'circle';
  /** small label under the cell, e.g. index */
  sub?: string;
  /** small label above the cell */
  sup?: string;
}
export interface EdgeP extends Base {
  kind: 'edge';
  from: string;
  to: string;
  dashed?: boolean;
  label?: string;
  /** bend amount (-1..1) */
  curve?: number;
  directed?: boolean;
}
/** A named pointer tag (head, curr, i, j...) attached to a cell. */
export interface PointerP extends Base {
  kind: 'pointer';
  target: string;
  text: string;
  side?: 'top' | 'bottom';
  /** stack offset when several pointers share a side */
  slot?: number;
}
export interface TextP extends Base {
  kind: 'text';
  x: number;
  y: number;
  text: string;
  size?: number;
  hand?: boolean;
  anchor?: 'start' | 'middle' | 'end';
}
export interface BarP extends Base {
  kind: 'bar';
  x: number;
  /** baseline y */
  y: number;
  w: number;
  h: number;
  value?: string | number;
  sub?: string;
}
export interface RegionP extends Base {
  kind: 'region';
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  dashed?: boolean;
}
export interface LineP extends Base {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  arrow?: boolean;
  width?: number;
  label?: string;
}
export interface DotP extends Base {
  kind: 'dot';
  x: number;
  y: number;
  r?: number;
  label?: string;
}
export interface IconP extends Base {
  kind: 'icon';
  x: number;
  y: number;
  emoji: string;
  size?: number;
}
export interface PathP extends Base {
  kind: 'path';
  points: [number, number][];
  dashed?: boolean;
  width?: number;
}
export type Prim = CellP | EdgeP | PointerP | TextP | BarP | RegionP | LineP | DotP | IconP | PathP;

export interface Scene {
  prims: Prim[];
  /** viewBox size, default 1000 x 440 */
  w?: number;
  h?: number;
}

export type BigO = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2ⁿ)' | string;
export interface Cost {
  op: string;
  time: BigO;
  space?: BigO;
  note?: string;
}

/** One moment of an animation. */
export interface Frame {
  scene: Scene;
  /** spoken narration (also the on-screen caption unless `caption` set). Keep to 1 short sentence. */
  say: string;
  caption?: string;
  /** 1-based highlighted code line */
  line?: number;
  vars?: Record<string, string | number>;
  cost?: Cost;
}

export interface Clip {
  id: string;
  title: string;
  frames: () => Frame[];
  code?: string;
  costs?: Cost[];
}

/* ---------- Interactive playground ---------- */
export interface OpArg {
  name: string;
  kind: 'int' | 'text';
  default: string | number;
}
export interface OpResult<S> {
  state: S;
  frames: Frame[];
  cost?: Cost;
}
export interface PlayOp<S> {
  id: string;
  label: string;
  args?: OpArg[];
  run: (state: S, args: Record<string, string | number>) => OpResult<S>;
}
export interface Playground<S> {
  intro: string;
  init: () => S;
  view: (state: S) => Scene;
  ops: PlayOp<S>[];
}

/* ---------- Questions ---------- */
export interface PredictQ {
  id: string;
  question: string;
  /** what you see before answering */
  scene: Scene;
  options: string[];
  answer: number;
  /** animation revealing the answer */
  frames: () => Frame[];
  why: string;
}
export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

/* ---------- Python tasks ---------- */
export interface Test {
  /** python expression evaluated after user code, e.g. "pair_sum([1,2], 3)" */
  call?: string;
  /** OR multi-line python that sets `result` */
  code?: string;
  /** label shown to the learner (defaults to call) */
  show?: string;
  /** python literal/expression for the expected value */
  expected: string;
  compare?: 'exact' | 'sorted' | 'unordered' | 'approx';
}
export interface CodeTask {
  intro: string[];
  starter: string;
  solution: string;
  tests: Test[];
  /** helper code run before the learner's code (e.g. ListNode) */
  setup?: string;
}
export interface BuildTask extends CodeTask {
  /** after building: how to use the built-in version */
  builtin: { text: string; code: string };
}
export interface FillTask {
  intro: string[];
  /** code containing exactly one line that is just `____` (indented) */
  code: string;
  answer: string;
  tests: Test[];
  setup?: string;
}
export interface Problem extends CodeTask {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern: string;
  examples: { input: string; output: string; why?: string }[];
  hints: [string, string, string];
  complexity: { time: BigO; space: BigO };
}

/* ---------- Topic & course ---------- */
export type StepKind =
  | 'hook'
  | 'watch'
  | 'recall'
  | 'play'
  | 'predict'
  | 'trace'
  | 'build'
  | 'fill'
  | 'wild'
  | 'problems'
  | 'recap';

export interface Topic {
  id: string;
  order: number;
  title: string;
  /** one line, shown on the map */
  short: string;
  icon: string;
  hook?: { frames: () => Frame[]; lines: string[] };
  watch?: Clip[];
  recall?: { prompt: string; model: string; keywords: string[][] };
  play?: Playground<any>;
  predict?: PredictQ[];
  trace?: { title: string; code: string; frames: () => Frame[] };
  build?: BuildTask;
  fill?: FillTask;
  wild?: { icon: string; title: string; text: string }[];
  problems?: Problem[];
  extra?: { name: string; url: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  quiz?: QuizQ[];
  /** main operation costs, used by the cost meter + compare view */
  costs?: Cost[];
}

export interface CompareRow {
  structure: string;
  topic?: string;
  costs: Record<string, BigO>;
  goodFor: string;
  badFor: string;
}
export interface CompareScenario {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Course {
  id: string;
  title: string;
  short: string;
  /** step order for this course; topics may omit steps */
  steps: StepKind[];
  compare?: { ops: string[]; rows: CompareRow[]; scenarios: CompareScenario[] };
}

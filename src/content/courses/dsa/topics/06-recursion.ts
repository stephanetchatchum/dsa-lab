import type { Frame, Prim, Role, Topic } from '../../../../types';
import { cell, cost, edge, Frames, ptr, region, scene, txt } from '../../../lib/viz';
import { layoutTree, treePrims, type GNode } from '../../../lib/tree';

/* ---------------- call-stack picture ---------------- */
interface CallFrame {
  id: string;
  label: string;
  role?: Role;
}
function callStack(frames: CallFrame[], o: { x?: number; title?: string } = {}): Prim[] {
  const x = o.x ?? 260;
  const out: Prim[] = [region('cs', x, 220, 330, 400, { role: 'muted', label: o.title ?? 'call stack', dashed: true })];
  frames.forEach((f, i) => out.push(cell(f.id, x, 380 - i * 66, f.label, { w: 290, h: 54, role: f.role })));
  if (frames.length) out.push(ptr('running', frames[frames.length - 1].id, 'curr', { id: 'running' }));
  return out;
}

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const rows = [1, 2, 3, 4];
  const people = (hl: Record<number, Role> = {}, ans: Record<number, string> = {}): Prim[] =>
    rows.flatMap((r) => [
      cell(`p${r}`, 500, 60 + (r - 1) * 100, r === 4 ? '🙋 you' : '🧑', { w: 140, h: 70, role: hl[r] }),
      ...(ans[r] ? [txt(`a${r}`, 660, 70 + (r - 1) * 100, ans[r], { size: 34, role: 'done', anchor: 'start' })] : []),
    ]);
  f.add([...people({ 4: 'curr' })], 'Dark cinema. You want to know which row you’re in, but you can’t count the rows.');
  f.add([...people({ 4: 'curr', 3: 'curr' }), edge('p4', 'p3', { curve: -0.5 })], 'So you ask the person in front: which row are you in? They ask the person in front of them…');
  f.add([...people({ 4: 'curr', 3: 'curr', 2: 'curr', 1: 'head' }), edge('p4', 'p3', { curve: -0.5 }), edge('p3', 'p2', { curve: -0.5 }), edge('p2', 'p1', { curve: -0.5 })], '…until the front row, who just knows: row 1. That’s the base case.');
  f.add([...people({ 1: 'done', 2: 'done', 3: 'done', 4: 'done' }, { 1: 'row 1', 2: '1 + 1 = 2', 3: '2 + 1 = 3', 4: '3 + 1 = 4 ✓' })], 'Answers flow back, each adding one. A big question solved by asking a smaller version of itself. That’s recursion.');
  return f.get();
}

/* ---------------- watch: call stack ---------------- */
const FACT_CODE = `def fact(n):
    if n <= 1:
        return 1
    rest = fact(n - 1)
    return n * rest`;

function factFrames(n = 4, withLines = true): Frame[] {
  const f = new Frames();
  const st: CallFrame[] = [];
  const L = (l: number) => (withLines ? { line: l } : {});
  for (let k = n; k >= 1; k--) {
    st.push({ id: `fact${k}`, label: `fact(${k})  n=${k}`, role: 'new' });
    const pic = callStack(st.map((s, i) => ({ ...s, role: i === st.length - 1 ? (k === 1 ? 'head' : 'new') : 'muted' })));
    f.add(pic, k === n ? `Call fact of ${n}. A new frame goes on the call stack.` : k === 1 ? 'fact of 1 hits the base case: no more calls.' : `fact of ${k + 1} can’t finish yet. It calls fact of ${k}: another frame.`, { ...L(k === 1 ? 2 : 4), vars: { n: k } });
  }
  let val = 1;
  for (let k = 1; k <= n; k++) {
    if (k > 1) val *= k;
    st[st.length - 1] = { ...st[st.length - 1], label: `fact(${k}) = ${val}`, role: 'done' };
    f.add(callStack(st.map((s, i) => (i === st.length - 1 ? s : { ...s, role: 'muted' }))), k === 1 ? 'It returns 1.' : `fact of ${k} gets ${val / k} back, returns ${k} times ${val / k}: ${val}.`, { ...L(k === 1 ? 3 : 5), vars: { n: k, rest: k === 1 ? '-' : val / k } });
    st.pop();
  }
  f.add([...callStack([]), txt('ans', 650, 220, `fact(${n}) = ${val}`, { size: 48, role: 'done' })], `Stack empty again. Depth was ${n} frames: O of n time and O of n stack space.`, L(5));
  return f.get();
}

/* ---------------- watch: recursion tree ---------------- */
function fibTree(n: number): GNode {
  let k = 0;
  const mk = (m: number): GNode => ({ id: `f${k++}`, v: m, kids: m <= 1 ? [] : [mk(m - 1), mk(m - 2)] });
  return mk(n);
}
function depthOf(root: GNode) {
  const d = new Map<string, number>();
  const w = (g: GNode, x: number) => {
    d.set(g.id, x);
    g.kids.forEach((c) => w(c, x + 1));
  };
  w(root, 0);
  return d;
}
function fibFrames(n = 5): Frame[] {
  const root = fibTree(n);
  const pos = layoutTree(root, { dy: 82 });
  const depth = depthOf(root);
  const maxD = Math.max(...depth.values());
  const f = new Frames();
  const prune = (g: GNode, lim: number): GNode => ({ ...g, kids: (depth.get(g.id)! < lim ? g.kids : []).map((c) => prune(c, lim)) });
  for (let lim = 0; lim <= maxD; lim++) {
    const t = prune(root, lim);
    f.add([...treePrims(t, pos)], lim === 0 ? `fib of ${n} calls fib of ${n - 1} and fib of ${n - 2}.` : lim === maxD ? 'Calls stop at fib of 1 and fib of 0, the base cases.' : 'Each call makes two more calls…');
  }
  const all: GNode[] = [];
  const w = (g: GNode) => {
    all.push(g);
    g.kids.forEach(w);
  };
  w(root);
  const dup = Object.fromEntries(all.filter((g) => g.v === 2).map((g) => [g.id, 'danger' as Role]));
  f.add([...treePrims(root, pos, { roles: dup, glow: Object.keys(dup) })], `fib of 2 is computed ${Object.keys(dup).length} times. The same work, again and again.`);
  f.add([...treePrims(root, pos, { roles: dup }), txt('t', 500, 430, `${all.length} calls for n = ${n}  ·  grows like 2ⁿ`, { size: 32, role: 'danger' })], 'The tree roughly doubles with each n: O of 2 to the n. Remembering answers fixes this. That’s dynamic programming, topic 12.');
  return f.get();
}

/* ---------------- watch: backtracking subsets ---------------- */
function subsetTree(items: string[]): GNode {
  let k = 0;
  const mk = (i: number, path: string): GNode => ({ id: `s${k++}_${path || 'e'}`, v: path || '∅', kids: i === items.length ? [] : [mk(i + 1, path), mk(i + 1, path + items[i])] });
  return mk(0, '');
}
function subsetFrames(items = ['a', 'b', 'c']): Frame[] {
  const root = subsetTree(items);
  const pos = layoutTree(root, { dy: 95 });
  const f = new Frames();
  const visible = new Set<string>();
  const found: string[] = [];
  const order: { g: GNode; parent?: GNode; take?: boolean }[] = [];
  const w = (g: GNode, parent?: GNode, take?: boolean) => {
    order.push({ g, parent, take });
    g.kids.forEach((c, i) => w(c, g, i === 1));
  };
  w(root);
  const shown = (g: GNode): GNode => ({ ...g, kids: g.kids.filter((c) => visible.has(c.id)).map(shown) });
  const edgeRoles: Record<string, Role> = {};
  for (const { g, take } of order) {
    visible.add(g.id);
    edgeRoles[g.id] = take ? 'new' : 'muted';
    const leaf = !g.kids.length;
    if (leaf) found.push(String(g.v));
    const roles: Record<string, Role> = { [g.id]: leaf ? 'done' : 'curr' };
    const resultTxt = txt('res', 500, 470, `found: ${found.map((s) => `{${s === '∅' ? '' : s.split('').join(',')}}`).join(' ')}`, { size: 26, role: 'done' });
    if (g === root) f.add([...treePrims(shown(root), pos, { roles, edgeRoles }), resultTxt], 'Build every subset of a, b, c. At each level, decide: skip this item, or take it.');
    else if (leaf) f.add([...treePrims(shown(root), pos, { roles, edgeRoles }), resultTxt], `All items decided: record {${String(g.v) === '∅' ? '' : String(g.v).split('').join(', ')}}. Then back up and try the other choice.`);
    else f.add([...treePrims(shown(root), pos, { roles, edgeRoles }), resultTxt], take ? `Take ${items[String(g.v).length - 1]}.` : 'Skip it.');
  }
  f.add([...treePrims(root, pos, { edgeRoles }), txt('res', 500, 470, `${found.length} subsets = 2³  ·  O(2ⁿ) results`, { size: 30, role: 'done' })], 'Eight subsets for three items. Each item doubles the count: 2 to the n. Choose, explore, un-choose: that’s backtracking.');
  return f.get();
}

/* ---------------- watch: 4 queens ---------------- */
function queensFrames(n = 4): Frame[] {
  const f = new Frames();
  const S = 74;
  const x0 = 500 - ((n - 1) * S) / 2;
  const y0 = 230 - ((n - 1) * S) / 2;
  const board = (qs: number[], hl: Record<string, Role> = {}, msg?: string): Prim[] => {
    const out: Prim[] = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const id = `q${r}_${c}`;
        const isQ = qs[r] === c;
        out.push(cell(id, x0 + c * S, y0 + r * S, isQ ? '♛' : '', { w: S - 8, h: S - 8, role: hl[id] ?? (isQ ? 'curr' : (r + c) % 2 ? 'muted' : 'default') }));
      }
    if (msg) out.push(txt('m', 500, 420, msg, { size: 30 }));
    return out;
  };
  const ok = (qs: number[], r: number, c: number) => qs.slice(0, r).every((qc, qr) => qc !== c && Math.abs(qc - c) !== r - qr);
  const qs: number[] = [];
  f.add(board([], {}, 'one queen per row, none attacking'), 'Place 4 queens so none share a row, column or diagonal.');
  let done = false;
  const go = (r: number) => {
    if (done) return;
    if (r === n) {
      done = true;
      f.add(board(qs, Object.fromEntries(qs.map((c, rr) => [`q${rr}_${c}`, 'done' as Role])), 'solution!'), 'All four placed. Backtracking found it by undoing bad choices early.');
      return;
    }
    for (let c = 0; c < n && !done; c++) {
      if (!ok(qs, r, c)) continue;
      qs[r] = c;
      f.add(board(qs, { [`q${r}_${c}`]: 'new' }), `Row ${r + 1}: column ${c + 1} is safe. Place a queen.`);
      go(r + 1);
      if (done) return;
      f.add(board(qs, { [`q${r}_${c}`]: 'danger' }), `Dead end below. Remove the queen in row ${r + 1} and try further right.`);
      qs.length = r;
    }
    if (!done && r > 0) f.add(board(qs, Object.fromEntries(Array.from({ length: n }, (_, c) => [`q${r}_${c}`, 'danger' as Role]))), `No safe square in row ${r + 1}. Go back up.`);
  };
  go(0);
  return f.get();
}

/* ---------------- topic ---------------- */
interface S {
  last: string;
}

const topic: Topic = {
  id: 'recursion',
  order: 6,
  title: 'Recursion & backtracking',
  short: 'Solve it by solving a smaller copy. Choose, explore, undo.',
  icon: '🪆',
  costs: [cost('fact(n): n calls', 'O(n)', 'O(n)'), cost('naive fib(n)', 'O(2ⁿ)', 'O(n)'), cost('all subsets', 'O(2ⁿ)'), cost('all orderings', 'O(n!)')],

  hook: { frames: hook, lines: ['Recursion solves a problem by handing a smaller version of it to yourself.', 'It needs a base case that answers directly, or the questions never stop.'] },

  watch: [
    { id: 'stack', title: 'The call stack', frames: () => factFrames(4, false), code: FACT_CODE, costs: [cost('fact(n)', 'O(n)', 'O(n)')] },
    { id: 'tree', title: 'Recursion tree', frames: () => fibFrames(5), costs: [cost('naive fib(n)', 'O(2ⁿ)', 'O(n)')] },
    { id: 'subsets', title: 'Backtracking: subsets', frames: () => subsetFrames(), costs: [cost('all subsets', 'O(2ⁿ)', 'O(n)')] },
    { id: 'queens', title: 'Backtracking: 4 queens', frames: () => queensFrames(4) },
  ],

  recall: {
    prompt: 'What two parts does every recursive function need? And what does “backtracking” mean?',
    model:
      'A base case that answers directly without recursing, and a recursive case that calls itself on a smaller input, moving towards the base case. Each pending call waits on the call stack. Backtracking explores choices recursively: make a choice, explore what follows, then undo the choice and try the next one.',
    keywords: [
      ['base case', 'base', 'stop'],
      ['smaller', 'sub-problem', 'subproblem', 'calls itself'],
      ['stack', 'frame', 'waits'],
      ['undo', 'un-choose', 'back up', 'go back', 'remove', 'try the next', 'try another'],
    ],
  },

  play: {
    intro: 'Run recursive functions and watch them unfold. Try different sizes: notice which ones explode.',
    init: (): S => ({ last: '' }),
    view: () => scene([...callStack([]), txt('t', 700, 220, 'pick a function →', { size: 34 })]),
    ops: [
      {
        id: 'fact',
        label: 'fact(n)',
        args: [{ name: 'n', kind: 'int', default: 5 }],
        run: (s: S, a) => {
          const n = Math.max(1, Math.min(6, Number(a.n)));
          return { state: s, frames: factFrames(n, false), cost: cost('fact(n)', 'O(n)', 'O(n)') };
        },
      },
      {
        id: 'fib',
        label: 'fib(n) tree',
        args: [{ name: 'n', kind: 'int', default: 4 }],
        run: (s: S, a) => {
          const n = Math.max(2, Math.min(6, Number(a.n)));
          return { state: s, frames: fibFrames(n), cost: cost('naive fib', 'O(2ⁿ)', 'O(n)') };
        },
      },
      {
        id: 'subsets',
        label: 'subsets of letters',
        args: [{ name: 'letters', kind: 'text', default: 'ab' }],
        run: (s: S, a) => {
          const letters = [...new Set(String(a.letters).replace(/\s/g, '').split(''))].slice(0, 3);
          return { state: s, frames: subsetFrames(letters.length ? letters : ['a']), cost: cost('subsets', 'O(2ⁿ)') };
        },
      },
      {
        id: 'queens',
        label: 'n-queens (4–5)',
        args: [{ name: 'n', kind: 'int', default: 5 }],
        run: (s: S, a) => {
          const n = Math.max(4, Math.min(5, Number(a.n)));
          return { state: s, frames: queensFrames(n), cost: cost('n-queens', 'O(n!)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'depth',
      question: 'fact(4) calls fact(3), which calls fact(2), then fact(1) (the base case). How many frames are on the call stack at the deepest point?',
      scene: scene([...callStack([{ id: 'fact4', label: 'fact(4)  n=4', role: 'new' }])]),
      options: ['1', '2', '4', '24'],
      answer: 2,
      frames: () => factFrames(4, false).slice(0, 5),
      why: 'fact(4), fact(3), fact(2) and fact(1) are all waiting at once: 4 frames.',
    },
    {
      id: 'fib2',
      question: 'Naive fib(5) calls fib(4) and fib(3), and so on. How many times is fib(2) computed?',
      scene: scene([cell('r', 500, 200, 'fib(5)', { w: 160, role: 'curr' })]),
      options: ['Once', 'Twice', '3 times', '5 times'],
      answer: 2,
      frames: () => fibFrames(5),
      why: 'fib(2) appears three times in the tree. Repeated work like this is why naive fib is exponential.',
    },
    {
      id: 'count-subsets',
      question: 'How many subsets does [a, b, c, d] have (counting the empty set and the full set)?',
      scene: scene([cell('a', 350, 200, 'a'), cell('b', 450, 200, 'b'), cell('c', 550, 200, 'c'), cell('d', 650, 200, 'd')]),
      options: ['4', '8', '16', '24'],
      answer: 2,
      frames: () => [
        { scene: scene([cell('a', 350, 200, 'a'), cell('b', 450, 200, 'b'), cell('c', 550, 200, 'c'), cell('d', 650, 200, 'd'), txt('t', 500, 330, '2 × 2 × 2 × 2', { size: 48, role: 'curr' })]), say: 'Each item is either in or out: two choices, four times.' },
        { scene: scene([cell('a', 350, 200, 'a'), cell('b', 450, 200, 'b'), cell('c', 550, 200, 'c'), cell('d', 650, 200, 'd'), txt('t', 500, 330, '= 16 = 2⁴', { size: 48, role: 'done' })]), say: 'Two to the fourth is 16.' },
      ],
      why: 'Every item is independently in or out: 2ⁿ = 16.',
    },
  ],

  trace: { title: 'fact(4) and its call stack', code: FACT_CODE, frames: () => factFrames(4, true) },

  build: {
    intro: [
      'Build the two classic backtracking generators without itertools: every subset, and every ordering.',
      'Keep items in their original order inside each subset. Pattern: choose, recurse, un-choose (path.pop()).',
    ],
    starter: `def subsets(items):
    out = []
    path = []
    def go(i):
        pass
    go(0)
    return out


def permutations(items):
    out = []
    path = []
    used = [False] * len(items)
    def go():
        pass
    go()
    return out
`,
    solution: `def subsets(items):
    out = []
    path = []
    def go(i):
        if i == len(items):
            out.append(path[:])
            return
        go(i + 1)
        path.append(items[i])
        go(i + 1)
        path.pop()
    go(0)
    return out


def permutations(items):
    out = []
    path = []
    used = [False] * len(items)
    def go():
        if len(path) == len(items):
            out.append(path[:])
            return
        for i, x in enumerate(items):
            if not used[i]:
                used[i] = True
                path.append(x)
                go()
                path.pop()
                used[i] = False
    go()
    return out
`,
    tests: [
      { call: 'subsets(["a", "b", "c"])', expected: '[[], ["a"], ["b"], ["c"], ["a", "b"], ["a", "c"], ["b", "c"], ["a", "b", "c"]]', compare: 'sorted' },
      { call: 'subsets([])', expected: '[[]]' },
      { call: 'len(subsets(list(range(10))))', expected: '1024' },
      { call: 'permutations([1, 2, 3])', expected: '[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]', compare: 'sorted' },
      { call: 'permutations([])', expected: '[[]]' },
      { call: 'len(permutations(list(range(6))))', expected: '720' },
    ],
    builtin: {
      text: 'Python’s itertools does this for you, lazily: combinations for subsets of a given size, permutations for orderings.',
      code: `from itertools import combinations, permutations
[c for r in range(4) for c in combinations("abc", r)]
list(permutations([1, 2, 3]))`,
    },
  },

  fill: {
    intro: ['This builds every subset with choose / explore / un-choose.', 'After exploring with items[i] taken, undo that choice so the path is clean for the caller.'],
    code: `def subsets(items):
    out, path = [], []
    def go(i):
        if i == len(items):
            out.append(path[:])
            return
        go(i + 1)
        path.append(items[i])
        go(i + 1)
        ____
    go(0)
    return out`,
    answer: 'path.pop()',
    tests: [
      { call: 'subsets([1, 2])', expected: '[[], [2], [1], [1, 2]]' },
      { call: 'subsets([])', expected: '[[]]' },
      { call: 'len(subsets([1, 2, 3, 4]))', expected: '16' },
    ],
  },

  wild: [
    { icon: '📁', title: 'File systems', text: 'Folders contain folders. Finding every file (like os.walk or du) recurses into each subfolder.' },
    { icon: '🧩', title: 'Solvers', text: 'Sudoku solvers, timetable schedulers and chip-layout tools backtrack: place, check constraints, undo on conflict.' },
    { icon: '🛠️', title: 'Compilers & parsers', text: 'JSON, HTML and code are nested. Parsers recurse into each bracket or tag, building a tree.' },
    { icon: '❄️', title: 'Graphics & science', text: 'Fractals, recursive mesh refinement in simulations, and divide-and-conquer algorithms like merge sort all split a problem into smaller copies.' },
  ],

  problems: [
    {
      id: 'flatten',
      title: 'Unpack the boxes',
      difficulty: 'easy',
      pattern: 'Recursion over nested structure',
      intro: ['nested is a list whose items are numbers or more lists, nested to any depth. Return all the numbers in one flat list, left to right.'],
      examples: [
        { input: 'flatten([1, [2, [3, 4]], 5])', output: '[1, 2, 3, 4, 5]' },
        { input: 'flatten([[[]]])', output: '[]' },
      ],
      starter: `def flatten(nested):
    pass
`,
      solution: `def flatten(nested):
    out = []
    for x in nested:
        if isinstance(x, list):
            out.extend(flatten(x))
        else:
            out.append(x)
    return out
`,
      tests: [
        { call: 'flatten([1, [2, [3, 4]], 5])', expected: '[1, 2, 3, 4, 5]' },
        { call: 'flatten([[[]]])', expected: '[]' },
        { call: 'flatten([])', expected: '[]' },
        { call: 'flatten([[1], [], [2, [3, [4, [5]]]]])', expected: '[1, 2, 3, 4, 5]' },
        { code: 'x = [7]\nfor _ in range(200): x = [x]\nresult = flatten(x)', show: '200 levels deep', expected: '[7]' },
      ],
      hints: ['A list of lists is a smaller version of the same problem.', 'Loop over items. Numbers go straight into the result. A list gets flattened by a recursive call, and its result is added on.', 'out = [] → for x: if list: out.extend(flatten(x)) else out.append(x) → return out'],
      complexity: { time: 'O(n)', space: 'O(depth)' },
    },
    {
      id: 'power',
      title: 'Fast power',
      difficulty: 'easy',
      pattern: 'Halving recursion',
      intro: ['Return x to the power n (n is a whole number ≥ 0) without using ** or pow.', 'Multiplying n times is too slow for the last test. Use x^n = (x^(n/2))², with one extra x when n is odd.'],
      examples: [
        { input: 'power(2, 10)', output: '1024' },
        { input: 'power(1, 10**18)', output: '1', why: 'n is huge, so only O(log n) works.' },
      ],
      starter: `def power(x, n):
    pass
`,
      solution: `def power(x, n):
    if n == 0:
        return 1
    half = power(x, n // 2)
    if n % 2 == 0:
        return half * half
    return half * half * x
`,
      tests: [
        { call: 'power(2, 10)', expected: '1024' },
        { call: 'power(3, 0)', expected: '1' },
        { call: 'power(5, 1)', expected: '5' },
        { call: 'power(2, 100)', expected: '2 ** 100' },
        { call: 'power(-2, 3)', expected: '-8' },
        { call: 'power(1, 10**18)', expected: '1' },
      ],
      hints: ['Divide and conquer: halve n each call, so depth is log n.', 'Compute half = power(x, n // 2) once. Even n: half × half. Odd n: half × half × x. Base case n == 0 returns 1.', 'if n == 0: return 1 → half = power(x, n // 2) → return half*half if n even else half*half*x'],
      complexity: { time: 'O(log n)', space: 'O(log n)' },
    },
    {
      id: 'combos',
      title: 'Exact change',
      difficulty: 'medium',
      pattern: 'Backtracking with pruning',
      intro: [
        'coins holds different positive values; each coin can be used at most once. Return every combination that adds up to exactly target.',
        'Each combination should be in ascending order. The list of combinations can be in any order.',
      ],
      examples: [
        { input: 'exact_change([2, 3, 5, 6, 8], 8)', output: '[[2, 6], [3, 5], [8]]' },
        { input: 'exact_change([1, 2, 3], 7)', output: '[]' },
      ],
      starter: `def exact_change(coins, target):
    pass
`,
      solution: `def exact_change(coins, target):
    coins = sorted(coins)
    out, path = [], []
    def go(start, remaining):
        if remaining == 0:
            out.append(path[:])
            return
        for i in range(start, len(coins)):
            if coins[i] > remaining:
                break
            path.append(coins[i])
            go(i + 1, remaining - coins[i])
            path.pop()
    go(0, target)
    return out
`,
      tests: [
        { call: 'exact_change([2, 3, 5, 6, 8], 8)', expected: '[[2, 6], [3, 5], [8]]', compare: 'sorted' },
        { call: 'exact_change([1, 2, 3], 7)', expected: '[]' },
        { call: 'exact_change([4], 4)', expected: '[[4]]' },
        { call: 'exact_change([10, 1, 2, 7, 6, 5], 8)', expected: '[[1, 2, 5], [1, 7], [2, 6]]', compare: 'sorted' },
        { call: 'exact_change(list(range(1, 16)), 5)', expected: '[[1, 4], [2, 3], [5]]', compare: 'sorted' },
      ],
      hints: [
        'Backtracking: choose a coin, explore with the rest of the target, un-choose. Sort first so you can stop early.',
        'Sort coins. go(start, remaining) tries each coin from start onward; if it’s bigger than remaining, stop the loop (everything after is bigger too). Recurse with i + 1 so each coin is used once.',
        'sort → go(start, rem): if rem == 0: record copy; for i from start: if c[i] > rem: break; push; go(i+1, rem − c[i]); pop',
      ],
      complexity: { time: 'O(2ⁿ)', space: 'O(n)' },
    },
  ],

  extra: [
    { name: 'Subsets', url: 'https://leetcode.com/problems/subsets/', difficulty: 'medium' },
    { name: 'Permutations', url: 'https://leetcode.com/problems/permutations/', difficulty: 'medium' },
    { name: 'Combination Sum II', url: 'https://leetcode.com/problems/combination-sum-ii/', difficulty: 'medium' },
    { name: 'Pow(x, n)', url: 'https://leetcode.com/problems/powx-n/', difficulty: 'medium' },
    { name: 'Generate Parentheses', url: 'https://leetcode.com/problems/generate-parentheses/', difficulty: 'medium' },
    { name: 'N-Queens', url: 'https://leetcode.com/problems/n-queens/', difficulty: 'hard' },
  ],

  quiz: [
    { q: 'What happens if a recursive function has no reachable base case?', options: ['It returns None', 'It recurses until the stack overflows (RecursionError)', 'Python adds one automatically', 'It runs in O(1)'], answer: 1, why: 'Every call adds a frame; with no stopping point the stack runs out.' },
    { q: 'Why is naive recursive Fibonacci so slow?', options: ['Recursion is slow in Python', 'It recomputes the same subproblems many times', 'It uses too much memory', 'Addition is expensive'], answer: 1, why: 'The call tree repeats work and grows like 2ⁿ. Memoising fixes it.' },
    { q: 'In backtracking, what is path.pop() for?', options: ['Freeing memory', 'Undoing the last choice before trying the next one', 'Sorting the path', 'Stopping recursion'], answer: 1, why: 'Choose → explore → un-choose keeps one shared path correct for every branch.' },
  ],
};

export default topic;

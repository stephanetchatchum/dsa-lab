import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cell, cost, edge, Frames, scene, spread, txt } from '../../../lib/viz';
import { layoutTree, treePrims, type GNode } from '../../../lib/tree';
import { dpLesson } from '../lessons/12-dynamic-programming';

/* dp row: cells d0..dn with index labels */
const dpRow = (vals: (number | string)[], roles: Record<number, Role> = {}, y = 250, glow: number[] = []) =>
  arrayRow(vals.map((v) => (v === Infinity ? '∞' : v)), { y, gap: Math.min(100, 900 / Math.max(vals.length, 1)), prefix: 'd', roles, glow });
const xOf = (n: number, i: number) => spread(n, Math.min(100, 900 / Math.max(n, 1)))[i];

/* ---------------- hook: stairs ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const steps = (hl: Record<number, Role> = {}, ways: Record<number, number> = {}) =>
    Array.from({ length: 6 }, (_, i) => cell(`st${i}`, 140 + i * 140, 380 - i * 55, ways[i] !== undefined ? ways[i] : i === 0 ? 'start' : '', { w: 120, h: 44, role: hl[i], sub: ways[i] !== undefined ? 'ways' : undefined }));
  f.add(steps(), 'You climb stairs taking 1 or 2 steps at a time. How many different ways reach step 5?');
  f.add(steps({ 5: 'curr', 4: 'second', 3: 'second' }), 'Your last move came from step 4 or step 3. So ways to 5 = ways to 4 + ways to 3.');
  f.add(steps({ 0: 'done', 1: 'done' }, { 0: 1, 1: 1 }), 'Small answers are easy: one way to stand at the start, one way to reach step 1.');
  const w = [1, 1, 2, 3, 5, 8];
  for (let i = 2; i <= 5; i++) f.add(steps({ ...Object.fromEntries(w.slice(0, i).map((_, k) => [k, 'done' as Role])), [i]: 'new' }, Object.fromEntries(w.slice(0, i + 1).map((v, k) => [k, v]))), `Step ${i}: ${w[i - 1]} + ${w[i - 2]} = ${w[i]}. Written down, never recomputed.`);
  f.add(steps(Object.fromEntries(w.map((_, k) => [k, 'done' as Role])), Object.fromEntries(w.map((v, k) => [k, v]))), 'Eight ways. Big answer from small answers you saved: that’s dynamic programming.');
  return f.get();
}

/* ---------------- memoization ---------------- */
function fibTree(n: number): GNode {
  let k = 0;
  const mk = (m: number): GNode => ({ id: `f${k++}`, v: m, kids: m <= 1 ? [] : [mk(m - 1), mk(m - 2)] });
  return mk(n);
}
function memoFrames(n = 6): Frame[] {
  const root = fibTree(n);
  const pos = layoutTree(root, { dy: 64, y0: 40 });
  const f = new Frames();
  const all: GNode[] = [];
  const w = (g: GNode) => {
    all.push(g);
    g.kids.forEach(w);
  };
  w(root);
  f.add([...treePrims(root, pos, { r: 44 }), txt('c', 500, 430, `naive: ${all.length} calls`, { size: 30, role: 'danger' })], `Naive fib of ${n} makes ${all.length} calls, recomputing the same values.`);
  const memo: (number | string)[] = Array.from({ length: n + 1 }, () => '');
  const firsts = new Set<string>();
  const seen = new Set<number>();
  const order: GNode[] = [];
  const visit = (g: GNode) => {
    if (seen.has(g.v as number)) return;
    order.push(g);
    g.kids.forEach(visit);
    seen.add(g.v as number);
  };
  visit(root);
  order.forEach((g) => firsts.add(g.id));
  const pruned = (g: GNode): GNode => ({ ...g, kids: g.kids.filter((k) => firsts.has(k.id)).map(pruned) });
  const fib = (m: number): number => (m <= 1 ? m : fib(m - 1) + fib(m - 2));
  const memoRow = () => arrayRow(memo, { y: 440, gap: 80, w: 66, prefix: 'm', roles: Object.fromEntries(memo.map((v, i) => [i, v === '' ? 'muted' : 'done'])) });
  const done = new Set<string>();
  const post = [...order].reverse();
  f.add([...treePrims(pruned(root), pos, { r: 44, roles: Object.fromEntries(all.filter((g) => !firsts.has(g.id)).map((g) => [g.id, 'muted' as Role])) }), ...memoRow()], 'Memoisation: keep a notebook. Before computing fib of k, check if it’s already written down.');
  for (const g of post) {
    memo[g.v as number] = fib(g.v as number);
    done.add(g.id);
    f.add([...treePrims(pruned(root), pos, { r: 44, roles: Object.fromEntries([...done].map((id) => [id, 'done' as Role])) }), ...memoRow()], `fib of ${g.v} is ${memo[g.v as number]}. Write it down.`);
  }
  f.add([...treePrims(pruned(root), pos, { r: 44, roles: Object.fromEntries([...done].map((id) => [id, 'done' as Role])) }), ...memoRow(), txt('c', 860, 60, `${order.length} calls`, { size: 30, role: 'done' })], `Every repeat is now a lookup. ${order.length} calls instead of ${all.length}: O of n instead of O of 2 to the n.`);
  return f.get();
}

/* ---------------- coin change DP ---------------- */
const COIN_CODE = `def min_coins(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] != INF else -1`;

function coinFrames(coins: number[], amount: number, withLines = false): Frame[] {
  const f = new Frames();
  const dp: number[] = [0, ...Array(amount).fill(Infinity)];
  const n = amount + 1;
  const L = (l: number) => (withLines ? { line: l } : {});
  const label = [txt('lab', 500, 120, `dp[a] = fewest coins to make a, using ${coins.join(', ')}`, { size: 28 })];
  f.add([...dpRow(dp, { 0: 'done' }), ...label], 'Build a table: dp of a is the fewest coins that make amount a. dp of 0 is 0.', { ...L(3), vars: { 'dp[0]': 0 } });
  for (let a = 1; a <= amount; a++) {
    let bestFrom = -1;
    for (const c of coins) {
      if (c > a) continue;
      const cand = dp[a - c] + 1;
      const better = cand < dp[a];
      if (better) {
        dp[a] = cand;
        bestFrom = a - c;
      }
      if (withLines || a === amount)
        f.add(
          [...dpRow(dp, { ...Object.fromEntries(dp.slice(0, a).map((_, i) => [i, 'done' as Role])), [a]: 'curr', [a - c]: 'second' }), edge(`d${a - c}`, `d${a}`, { role: 'second', curve: -0.5, label: `+${c}` }), ...label],
          `Amount ${a} with a ${c} coin: dp of ${a - c} plus 1 = ${cand === Infinity ? 'infinity' : cand}.${better ? ' Best so far.' : ''}`,
          { ...L(better ? 7 : 6), vars: { a, c, [`dp[${a}]`]: dp[a] === Infinity ? '∞' : dp[a] } },
        );
    }
    if (!withLines && a !== amount)
      f.add([...dpRow(dp, { ...Object.fromEntries(dp.slice(0, a).map((_, i) => [i, 'done' as Role])), [a]: 'new' }), ...(bestFrom >= 0 ? [edge(`d${bestFrom}`, `d${a}`, { role: 'new', curve: -0.5 })] : []), ...label], `dp of ${a} is ${dp[a]}: try each coin as the last one and keep the best.`);
  }
  f.add([...dpRow(dp, Object.fromEntries(dp.map((_, i) => [i, 'done' as Role])), 250, [amount]), ...label, txt('ans', 500, 400, `answer: ${dp[amount]} coins   ·   O(amount × coins)`, { size: 30, role: 'done' })], `dp of ${amount} is ${dp[amount]}. DP checked every option, so unlike greedy it can’t be fooled.`, { ...L(8), vars: { answer: dp[amount] } });
  void n;
  return f.get();
}

/* ---------------- 2D grid DP ---------------- */
function gridFrames(R = 4, C = 5, block: [number, number][] = [[1, 2]]): Frame[] {
  const f = new Frames();
  const S = 86;
  const x0 = 500 - ((C - 1) * S) / 2;
  const y0 = 220 - ((R - 1) * S) / 2;
  const blocked = (r: number, c: number) => block.some(([a, b]) => a === r && b === c);
  const dp: (number | string)[][] = Array.from({ length: R }, () => Array(C).fill(''));
  const pic = (hl: Record<string, Role> = {}, extra: Prim[] = []): Prim[] => {
    const out: Prim[] = [];
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) out.push(cell(`g${r}_${c}`, x0 + c * S, y0 + r * S, blocked(r, c) ? '🪨' : dp[r][c], { w: S - 10, h: S - 10, role: hl[`${r}_${c}`] ?? (blocked(r, c) ? 'danger' : dp[r][c] === '' ? 'muted' : 'done') }));
    return [...out, ...extra];
  };
  f.add(pic({ '0_0': 'head', [`${R - 1}_${C - 1}`]: 'curr' }), 'A robot moves only right or down. How many paths from the top-left to the bottom-right, avoiding the rock?');
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (blocked(r, c)) dp[r][c] = 0;
      else if (r === 0 && c === 0) dp[r][c] = 1;
      else dp[r][c] = (r > 0 ? (dp[r - 1][c] as number) : 0) + (c > 0 ? (dp[r][c - 1] as number) : 0);
      if (r === 0 && c === 0) f.add(pic({ '0_0': 'new' }), 'One way to be at the start.');
      else if (!blocked(r, c) && (r + c) % 2 === 0)
        f.add(pic({ [`${r}_${c}`]: 'new', ...(r > 0 ? { [`${r - 1}_${c}`]: 'second' } : {}), ...(c > 0 ? { [`${r}_${c - 1}`]: 'second' } : {}) }), `Paths here = paths from above + paths from the left = ${dp[r][c]}.`);
    }
  f.add(pic({ [`${R - 1}_${C - 1}`]: 'curr' }), `${dp[R - 1][C - 1]} paths. Each cell was computed once from two neighbours: O of rows times columns.`);
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  coins: number[];
}
const parseCoins = (s: string) =>
  [...new Set(String(s).split(/[^0-9]+/).map(Number).filter((x) => x > 0 && x <= 20))].slice(0, 4).sort((a, b) => a - b);

const topic: Topic = {
  id: 'dynamic-programming',
  order: 12,
  title: 'Dynamic programming',
  short: 'Solve each small problem once, save it, build up.',
  icon: '🧱',
  costs: [cost('fib (memoised)', 'O(n)', 'O(n)'), cost('min coins', 'O(n·k)', 'O(n)'), cost('grid paths', 'O(n·m)', 'O(n·m)'), cost('LCS of two strings', 'O(n·m)', 'O(n·m)')],

  intro: {
    what: "Dynamic programming solves a big problem by solving each smaller version once, saving the answers, and building up.",
    why: "It turns impossibly slow recursive solutions into fast ones. It powers DNA alignment, diff tools, spell checkers and route planning.",
    builds: "Recursion from topic 6 and the greedy failure from topic 11.",
    goals: ["Spot overlapping subproblems", "Memoise a recursive function", "Fill a 1D and a 2D table bottom-up", "Solve coin change correctly where greedy fails"],
  },

  hook: { frames: hook, lines: ['Dynamic programming solves a big problem from the answers to smaller ones.', 'The trick: write each small answer down once, so you never solve it twice.'] },

  watch: [
    { id: 'memo', title: 'Memoisation', frames: () => memoFrames(6), costs: [cost('naive', 'O(2ⁿ)'), cost('memoised', 'O(n)', 'O(n)')] },
    { id: 'coins', title: 'Bottom-up: coins', frames: () => coinFrames([1, 3, 4], 6), code: COIN_CODE, costs: [cost('min coins', 'O(n·k)', 'O(n)')] },
    { id: 'grid', title: '2D table: grid paths', frames: () => gridFrames(), costs: [cost('grid paths', 'O(n·m)', 'O(n·m)')] },
  ],

  lesson: dpLesson({ hook, memo: () => memoFrames(6), coins: () => coinFrames([1, 3, 4], 6), grid: () => gridFrames() }),
  recall: {
    prompt: 'What two things make a problem a good fit for dynamic programming? What’s the difference between memoisation and a bottom-up table?',
    model:
      'The problem’s answer must be built from answers to smaller versions of itself (optimal substructure), and those smaller problems must repeat (overlapping subproblems). Memoisation is top-down: write the normal recursion, but cache each result. Bottom-up fills a table from the smallest cases upward, with no recursion, so each cell uses cells already filled.',
    keywords: [
      ['smaller', 'subproblem', 'sub-problem', 'substructure'],
      ['repeat', 'overlap', 'same', 'again'],
      ['cache', 'memo', 'save', 'remember', 'store'],
      ['table', 'bottom-up', 'bottom up', 'fill', 'iterat'],
    ],
  },

  play: {
    intro: 'Pick your own coins and an amount. Compare the DP answer with greedy: can you find coins that fool greedy?',
    init: (): S => ({ coins: [1, 3, 4] }),
    view: (s: S) => scene([txt('c', 500, 200, `coins: ${s.coins.join(', ')}`, { size: 44, role: 'curr' }), txt('h', 500, 280, 'set coins, then run DP or greedy', { size: 28 })]),
    ops: [
      {
        id: 'set',
        label: 'set coins',
        args: [{ name: 'coins', kind: 'text', default: '1, 5, 6, 9' }],
        run: (s: S, a) => {
          const coins = parseCoins(String(a.coins));
          if (!coins.length) return { state: s, frames: [{ scene: scene([txt('c', 500, 200, 'type numbers like 1, 3, 4', { size: 34 })]), say: 'Use whole numbers from 1 to 20.' }] };
          return { state: { coins }, frames: [{ scene: scene([txt('c', 500, 200, `coins: ${coins.join(', ')}`, { size: 44, role: 'new' })]), say: `Coins set to ${coins.join(', ')}.` }] };
        },
      },
      {
        id: 'dp',
        label: 'DP: fewest coins for',
        args: [{ name: 'amount', kind: 'int', default: 11 }],
        run: (s: S, a) => {
          const amt = Math.max(1, Math.min(14, Number(a.amount)));
          return { state: s, frames: coinFrames(s.coins, amt), cost: cost('DP min coins', 'O(n·k)') };
        },
      },
      {
        id: 'greedy',
        label: 'greedy for',
        args: [{ name: 'amount', kind: 'int', default: 11 }],
        run: (s: S, a) => {
          const amt = Math.max(1, Math.min(14, Number(a.amount)));
          const desc = [...s.coins].sort((x, y) => y - x);
          let left = amt;
          const taken: number[] = [];
          for (const c of desc)
            while (left >= c) {
              left -= c;
              taken.push(c);
            }
          const prims: Prim[] = [
            ...(taken.length ? arrayRow(taken, { y: 230, gap: 84, w: 70, prefix: 'g', idx: false, roles: Object.fromEntries(taken.map((_, i) => [i, 'curr' as Role])) }) : []),
            txt('r', 500, 380, left ? `greedy got stuck with ${left} left!` : `greedy: ${taken.length} coins`, { size: 34, role: left ? 'danger' : 'curr' }),
          ];
          return { state: s, frames: [{ scene: scene(prims), say: left ? `Greedy can’t finish: ${left} left over. DP would know whether it’s possible.` : `Greedy used ${taken.length} coins. Run DP on the same amount to compare.` }], cost: cost('greedy', 'O(n)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'stairs-5',
      question: 'Climbing with steps of 1 or 2. ways(1) = 1, ways(2) = 2. How many ways to reach step 5?',
      scene: scene(dpRow(['1', '1', '2', '?', '?', '?'], { 0: 'done', 1: 'done', 2: 'done' })),
      options: ['5', '6', '8', '10'],
      answer: 2,
      frames: () => {
        const w = [1, 1, 2, 3, 5, 8];
        const f = new Frames();
        for (let i = 3; i <= 5; i++)
          f.add([...dpRow(w.map((v, k) => (k <= i ? v : '?')), { ...Object.fromEntries(w.slice(0, i).map((_, k) => [k, 'done' as Role])), [i]: 'new', [i - 1]: 'second', [i - 2]: 'second' })], `ways(${i}) = ${w[i - 1]} + ${w[i - 2]} = ${w[i]}.`);
        return f.get();
      },
      why: '1, 1, 2, 3, 5, 8: each is the sum of the two before it.',
    },
    {
      id: 'memo-count',
      question: 'With memoisation, how many different fib(k) values does fib(30) ever compute?',
      scene: scene([txt('t', 500, 200, 'fib(30)', { size: 60, role: 'curr' })]),
      options: ['30', '31', 'about 1.6 million', '2³⁰'],
      answer: 1,
      frames: () => memoFrames(5),
      why: 'fib(0) through fib(30): 31 values, each computed once. Without the memo it’s about 1.6 million calls.',
    },
    {
      id: 'dp-coins',
      question: 'Coins 1, 3 and 4. What is the fewest number of coins that make 6?',
      scene: scene(dpRow([0, '?', '?', '?', '?', '?', '?'], { 0: 'done' })),
      options: ['1', '2', '3', '6'],
      answer: 1,
      frames: () => coinFrames([1, 3, 4], 6),
      why: '3 + 3. DP finds it because it tries every last coin; greedy grabs 4 and ends up with 3 coins.',
    },
  ],

  trace: { title: 'Bottom-up coin change', code: COIN_CODE, frames: () => coinFrames([1, 3, 4], 6, true) },

  build: {
    intro: [
      'Build your own memoize: it takes a function and returns a version that caches results in a dict keyed by the arguments.',
      'Then write min_coins bottom-up (return -1 if the amount can’t be made). Don’t use functools.',
    ],
    starter: `def memoize(fn):
    cache = {}
    def wrapper(*args):
        pass
    return wrapper


@memoize
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def min_coins(coins, amount):
    pass
`,
    solution: `def memoize(fn):
    cache = {}
    def wrapper(*args):
        if args not in cache:
            cache[args] = fn(*args)
        return cache[args]
    return wrapper


@memoize
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)


def min_coins(coins, amount):
    INF = float("inf")
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return dp[amount] if dp[amount] != INF else -1
`,
    tests: [
      { call: 'fib(10)', expected: '55' },
      { call: 'fib(90)', show: 'fib(90) (impossible without the cache)', expected: '2880067194370816120' },
      { code: 'calls = []\n@memoize\ndef sq(x):\n    calls.append(x)\n    return x * x\nresult = (sq(4), sq(4), sq(5), len(calls))', show: 'cache hits don’t re-run the function', expected: '(16, 16, 25, 2)' },
      { call: 'min_coins([1, 3, 4], 6)', expected: '2' },
      { call: 'min_coins([2], 3)', expected: '-1' },
      { call: 'min_coins([1, 5, 10, 25], 63)', expected: '6' },
      { call: 'min_coins([7], 0)', expected: '0' },
      { call: 'min_coins([3, 7, 405, 436], 8839)', expected: '25' },
    ],
    builtin: {
      text: 'Python ships memoisation as functools.cache (or lru_cache with a size limit). One decorator line turns exponential recursion linear.',
      code: `from functools import cache

@cache
def ways(n):
    return 1 if n <= 1 else ways(n - 1) + ways(n - 2)`,
    },
  },

  fill: {
    intro: ['Count right/down paths through a rows × cols grid. The first row and column are all 1.', 'Write the line that fills dp[r][c] from the cell above and the cell to the left.'],
    code: `def grid_paths(rows, cols):
    dp = [[1] * cols for _ in range(rows)]
    for r in range(1, rows):
        for c in range(1, cols):
            ____
    return dp[-1][-1]`,
    answer: 'dp[r][c] = dp[r - 1][c] + dp[r][c - 1]',
    tests: [
      { call: 'grid_paths(3, 3)', expected: '6' },
      { call: 'grid_paths(1, 5)', expected: '1' },
      { call: 'grid_paths(3, 7)', expected: '28' },
      { call: 'grid_paths(10, 10)', expected: '48620' },
    ],
  },

  wild: [
    { icon: '🧬', title: 'DNA alignment', text: 'Comparing genes fills a 2D table of best alignment scores (Needleman–Wunsch, Smith–Waterman). It powers genome research.' },
    { icon: '📝', title: 'Diff & spell check', text: 'git diff and spell checkers use longest-common-subsequence and edit-distance tables to find the smallest set of changes.' },
    { icon: '🗣️', title: 'Speech & signals', text: 'The Viterbi algorithm, a DP over time steps, decodes speech, phone signals and GPS tracks.' },
    { icon: '🤖', title: 'AI & finance', text: 'Reinforcement learning is built on the Bellman equation, a DP recurrence. Option pricing fills binomial-tree tables backwards.' },
  ],

  problems: [
    {
      id: 'harvest',
      title: 'Best harvest',
      difficulty: 'easy',
      pattern: '1D DP: take it or skip it',
      intro: ['fields[i] is the crop in field i. You can’t harvest two neighbouring fields. Return the most crop you can harvest.'],
      examples: [{ input: 'best_harvest([2, 7, 9, 3, 1])', output: '12', why: '2 + 9 + 1.' }],
      starter: `def best_harvest(fields):
    pass
`,
      solution: `def best_harvest(fields):
    take, skip = 0, 0
    for x in fields:
        take, skip = skip + x, max(take, skip)
    return max(take, skip)
`,
      tests: [
        { call: 'best_harvest([2, 7, 9, 3, 1])', expected: '12' },
        { call: 'best_harvest([1, 2, 3, 1])', expected: '4' },
        { call: 'best_harvest([])', expected: '0' },
        { call: 'best_harvest([5])', expected: '5' },
        { call: 'best_harvest([2, 1, 1, 2])', expected: '4' },
        { call: 'best_harvest([1] * 100000)', expected: '50000' },
      ],
      hints: ['DP with two choices per field: take it (then the previous was skipped) or skip it.', 'best(i) = max(best(i−1), best(i−2) + fields[i]). You only need the last two values.', 'take = skip = 0 → for x: take, skip = skip + x, max(take, skip) → return max(take, skip)'],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'energy',
      title: 'Least tiring climb',
      difficulty: 'easy',
      pattern: '1D DP: min of two ways in',
      intro: ['energy[i] is what it costs to stand on step i. From a step you climb 1 or 2 steps. You start below step 0 or step 1 (free) and want to reach just past the last step.', 'Return the least total energy.'],
      examples: [{ input: 'least_energy([10, 15, 20])', output: '15', why: 'Start on step 1, then jump past the end.' }],
      starter: `def least_energy(energy):
    pass
`,
      solution: `def least_energy(energy):
    a, b = 0, 0
    for i in range(2, len(energy) + 1):
        a, b = b, min(b + energy[i - 1], a + energy[i - 2])
    return b
`,
      tests: [
        { call: 'least_energy([10, 15, 20])', expected: '15' },
        { call: 'least_energy([1, 100, 1, 1, 1, 100, 1, 1, 100, 1])', expected: '6' },
        { call: 'least_energy([5, 3])', expected: '3' },
        { call: 'least_energy([0, 0, 0])', expected: '0' },
        { call: 'least_energy([2] * 100000)', expected: '100000' },
      ],
      hints: ['DP: the cheapest way to reach a spot comes from the cheapest way to reach one of the two spots before it.', 'cost(i) = min(cost(i−1) + energy[i−1], cost(i−2) + energy[i−2]), with cost(0) = cost(1) = 0. The answer is cost(n).', 'a = b = 0 → for i in 2..n: a, b = b, min(b + e[i−1], a + e[i−2]) → return b'],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'shared-genes',
      title: 'Longest shared gene sequence',
      difficulty: 'medium',
      pattern: '2D DP table',
      intro: [
        'Two DNA strings a and b. Return the length of the longest sequence of letters that appears in both in the same order (not necessarily next to each other).',
        'Fill a table where cell (i, j) holds the answer for the first i letters of a and the first j letters of b.',
      ],
      examples: [{ input: 'shared_length("ACGTA", "AGTCA")', output: '4', why: 'A G T A.' }],
      starter: `def shared_length(a, b):
    pass
`,
      solution: `def shared_length(a, b):
    prev = [0] * (len(b) + 1)
    for i in range(1, len(a) + 1):
        cur = [0] * (len(b) + 1)
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                cur[j] = prev[j - 1] + 1
            else:
                cur[j] = max(prev[j], cur[j - 1])
        prev = cur
    return prev[-1]
`,
      tests: [
        { call: 'shared_length("ACGTA", "AGTCA")', expected: '4' },
        { call: 'shared_length("AAAA", "CCCC")', expected: '0' },
        { call: 'shared_length("", "ACGT")', expected: '0' },
        { call: 'shared_length("GATTACA", "GATTACA")', expected: '7' },
        { call: 'shared_length("ABCBDAB", "BDCABA")', expected: '4' },
        { call: 'shared_length("ACGT" * 150, "TGCA" * 150)', expected: '299' },
      ],
      hints: [
        '2D DP over prefixes of both strings.',
        'If the last letters match, the answer is 1 + the answer without both. If not, it’s the better of dropping a letter from a or from b.',
        'dp[i][j] = dp[i−1][j−1] + 1 if a[i−1] == b[j−1] else max(dp[i−1][j], dp[i][j−1]); answer dp[n][m]',
      ],
      complexity: { time: 'O(n·m)', space: 'O(m)' },
    },
  ],

  extra: [
    { name: 'Climbing Stairs', url: 'https://leetcode.com/problems/climbing-stairs/', difficulty: 'easy' },
    { name: 'Min Cost Climbing Stairs', url: 'https://leetcode.com/problems/min-cost-climbing-stairs/', difficulty: 'easy' },
    { name: 'House Robber', url: 'https://leetcode.com/problems/house-robber/', difficulty: 'medium' },
    { name: 'Coin Change', url: 'https://leetcode.com/problems/coin-change/', difficulty: 'medium' },
    { name: 'Unique Paths', url: 'https://leetcode.com/problems/unique-paths/', difficulty: 'medium' },
    { name: 'Longest Common Subsequence', url: 'https://leetcode.com/problems/longest-common-subsequence/', difficulty: 'medium' },
    { name: 'Edit Distance', url: 'https://leetcode.com/problems/edit-distance/', difficulty: 'medium' },
  ],

  quiz: [
    { q: 'Which pair of properties signals a DP problem?', options: ['Sorted input and no duplicates', 'Optimal substructure and overlapping subproblems', 'A graph and weights', 'Recursion and a base case'], answer: 1, why: 'Answers build from smaller answers, and those smaller ones repeat.' },
    { q: 'Memoised fib(n) runs in…', options: ['O(2ⁿ)', 'O(n²)', 'O(n)', 'O(log n)'], answer: 2, why: 'Each of the n+1 values is computed once.' },
    { q: 'Why does DP beat greedy on coin change with coins [1, 3, 4]?', options: ['DP is always faster', 'DP tries every possible last coin and keeps the best', 'DP sorts the coins', 'DP uses bigger coins'], answer: 1, why: 'It never commits early, so it can’t be trapped by the 4.' },
  ],
};

export default topic;

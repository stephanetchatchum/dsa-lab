import type { Frame, Prim, Topic } from '../../../../types';
import { arrayRow, bar, cell, cost, Frames, icon, ptr, region, scene, spread, txt } from '../../../lib/viz';

/* ---------------- shared pictures ---------------- */
const counter = (k: number | string, x = 860, y = 70, label = 'steps') => txt('counter', x, y, `${label}: ${k}`, { size: 38, role: 'curr' });

function cellsN(n: number, roles: Record<number, any> = {}, glow: number[] = []) {
  const gap = n > 10 ? 56 : 80;
  return arrayRow(Array.from({ length: n }, (_, i) => i + 1), { gap, w: gap - 10, roles, glow, y: 230, idx: false });
}

function pairGrid(n: number, filled: number, size = 34, cx = 500, cy = 240, role: any = 'curr'): Prim[] {
  const out: Prim[] = [];
  const x0 = cx - ((n - 1) * size) / 2;
  const y0 = cy - ((n - 1) * size) / 2;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const k = r * n + c;
      out.push(cell(`g${r}_${c}`, x0 + c * size, y0 + r * size, '', { w: size - 6, h: size - 6, role: k < filled ? role : 'muted' }));
    }
  return out;
}

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const pile = (k: number, found = false): Prim[] =>
    Array.from({ length: 8 }, (_, i) =>
      cell(`pc${i}`, 90 + (i % 4) * 92, 190 + Math.floor(i / 4) * 92, i < k ? (i === 7 && found ? 'Maya' : '✗') : '?', {
        w: 78,
        h: 78,
        role: i < k ? (i === 7 && found ? 'done' : 'muted') : 'default',
      }),
    );
  const book = (lo: number, hi: number, mid?: number): Prim[] =>
    Array.from({ length: 8 }, (_, i) =>
      cell(`bk${i}`, 560 + i * 54, 236, 'ABCDEFGH'[i], {
        w: 46,
        h: 70,
        role: i === mid ? 'curr' : i < lo || i > hi ? 'muted' : 'head',
      }),
    );
  const head = [icon('i1', 245, 70, '🃏', 54), icon('i2', 750, 70, '📖', 54), txt('t1', 245, 130, 'shuffled pile', { size: 30 }), txt('t2', 750, 130, 'sorted book', { size: 30 })];
  f.add([...head, ...pile(0), ...book(0, 7)], 'You need to find Maya. Two ways to store the names.');
  f.add([...head, ...pile(3), ...book(0, 7)], 'In a shuffled pile you check card after card.');
  f.add([...head, ...pile(8, true), ...book(0, 7), counter(8, 245, 400, 'checks')], 'Worst case: every single card. Eight cards, eight checks.');
  f.add([...head, ...pile(8, true), ...book(0, 7, 3), counter(1, 750, 400, 'checks')], 'In a sorted book, open the middle.');
  f.add([...head, ...pile(8, true), ...book(4, 7, 5), counter(2, 750, 400, 'checks')], 'Maya comes after D, so the whole first half is gone.');
  f.add([...head, ...pile(8, true), ...book(6, 7, 6), counter(3, 750, 400, 'checks')], 'Halve again. Three checks for eight names.');
  f.add(
    [...head, ...pile(8, true), ...book(6, 7, 6), txt('dbl', 500, 400, 'double the names → pile: 16 checks · book: 4 checks', { size: 30, role: 'new' })],
    'Double the names and the pile doubles its work. The book adds just one step. That difference is what Big-O measures.',
  );
  return f.get();
}

/* ---------------- watch clips ---------------- */
const LINEAR_CODE = `def total(nums):
    s = 0
    for x in nums:
        s += x
    return s`;

function linear(): Frame[] {
  const nums = [3, 1, 4, 1, 5, 9];
  const f = new Frames();
  f.add([...arrayRow(nums), counter(0)], 'Here is a list of six numbers. Let’s count the steps to add them up.', { line: 2, vars: { s: 0 } });
  let s = 0;
  nums.forEach((x, i) => {
    s += x;
    f.add(
      [...arrayRow(nums, { roles: Object.fromEntries(nums.map((_, k) => [k, k < i ? 'done' : k === i ? 'curr' : 'default'])) }), ptr('x', `a${i}`, 'curr'), counter(i + 1)],
      i === 0 ? 'The loop touches the first item. One step.' : i === nums.length - 1 ? 'Last item. Six items, six steps.' : `Next item. Step ${i + 1}.`,
      { line: 4, vars: { x, s } },
    );
  });
  f.add([...arrayRow(nums, { roles: { 0: 'done', 1: 'done', 2: 'done', 3: 'done', 4: 'done', 5: 'done' } }), counter(6), txt('big', 500, 400, 'n items → n steps → O(n)', { size: 40, role: 'new' })], 'One step per item. Steps grow in a straight line with n. That is O of n, linear time.', {
    line: 5,
    vars: { s },
  });
  return f.get();
}

const NESTED_CODE = `def all_pairs(n):
    for i in range(n):
        for j in range(n):
            check(i, j)`;

function nested(): Frame[] {
  const n = 5;
  const f = new Frames();
  const lab: Prim[] = [txt('li', 270, 240, 'i ↓', { size: 32, role: 'curr' }), txt('lj', 500, 120, 'j →', { size: 32, role: 'second' })];
  f.add([...pairGrid(n, 0), ...lab, counter(0)], 'A loop inside a loop. Each square is one check of a pair, i and j.', { line: 2 });
  for (let r = 1; r <= n; r++) {
    f.add([...pairGrid(n, r * n), ...lab, counter(r * n)], r === 1 ? 'For i equals zero, j runs across the whole row. Five checks.' : `Row ${r} done. ${r * n} checks so far.`, {
      line: 4,
      vars: { i: r - 1, j: n - 1 },
    });
  }
  f.add([...pairGrid(n, 25), ...lab, counter(25), txt('big', 500, 420, 'n × n = n² checks → O(n²)', { size: 38, role: 'new' })], 'Five rows of five: n times n. Double n and the work goes up four times. That is quadratic, O of n squared.');
  return f.get();
}

const HALVE_CODE = `def halvings(n):
    steps = 0
    while n > 1:
        n = n // 2
        steps += 1
    return steps`;

function halving(): Frame[] {
  const n = 16;
  const f = new Frames();
  const row = (lo: number, hi: number) =>
    arrayRow(
      Array.from({ length: n }, (_, i) => i + 1),
      { gap: 56, w: 46, idx: false, roles: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, i < lo || i > hi ? 'muted' : 'head'])) },
    );
  const xs = spread(n, 56);
  const reg = (lo: number, hi: number) => region('rg', (xs[lo] + xs[hi]) / 2, 220, xs[hi] - xs[lo] + 60, 100, { role: 'curr', dashed: true });
  let lo = 0;
  let hi = n - 1;
  f.add([...row(lo, hi), reg(lo, hi), counter(0)], 'Sixteen items. Each step throws away half of what is left.', { line: 2, vars: { n: 16, steps: 0 } });
  let k = 0;
  let m = 16;
  while (hi > lo) {
    k++;
    m = m / 2;
    hi = lo + (hi - lo + 1) / 2 - 1;
    f.add([...row(lo, hi), reg(lo, hi), counter(k)], `Step ${k}: ${m} left.`, { line: 5, vars: { n: m, steps: k } });
  }
  f.add([...row(lo, hi), reg(lo, hi), counter(k), txt('big', 500, 400, '16 → 8 → 4 → 2 → 1 : 4 steps = log₂ 16', { size: 34, role: 'new' })], 'Four halvings for sixteen items. A million items needs only about twenty. That is O of log n.', {
    line: 6,
    vars: { n: 1, steps: 4 },
  });
  return f.get();
}

function race(): Frame[] {
  const names = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];
  const roles = ['done', 'head', 'curr', 'second', 'danger'] as const;
  const xs = spread(5, 170);
  const f = new Frames();
  for (const n of [4, 8, 16, 32, 64]) {
    const lg = Math.log2(n);
    const vals = [1, lg, n, n * lg, n * n];
    const prims: Prim[] = vals.map((v, i) =>
      bar(`b${i}`, xs[i], Math.min(300, v * 4), { w: 90, role: roles[i], value: Math.min(300, v * 4) >= 300 ? `${v} ↑` : v, sub: names[i] }),
    );
    prims.push(txt('n', 120, 60, `n = ${n}`, { size: 42, role: 'curr' }));
    f.add(
      prims,
      n === 4
        ? 'A race between growth rates. Bar height is the number of steps. n is 4.'
        : n === 8
          ? 'n doubles to 8. Watch the red bar.'
          : n === 16
            ? 'At 16, n squared has already left the chart.'
            : n === 32
              ? 'n log n is now climbing too. Log n has barely moved.'
              : 'At 64: n squared needs 4096 steps, log n needs 6. For big inputs, the shape of the curve is everything.',
    );
  }
  return f.get();
}

function space(): Frame[] {
  const a = [4, 7, 1, 9];
  const f = new Frames();
  f.add([...arrayRow(a, { y: 150 }), txt('l', 500, 60, 'extra memory: 0', { size: 34, role: 'done' })], 'Space complexity counts the extra memory an algorithm needs.');
  f.add(
    [...arrayRow(a, { y: 150 }), ...arrayRow([9, 1, 7, 4], { y: 320, prefix: 'c', roles: { 0: 'new', 1: 'new', 2: 'new', 3: 'new' } }), txt('l', 500, 60, 'extra memory: n cells → O(n)', { size: 34, role: 'new' })],
    'Reversing into a new list needs n new cells. That is O of n extra space.',
  );
  f.add(
    [...arrayRow([9, 1, 7, 4], { y: 150, roles: { 0: 'curr', 3: 'curr' } }), txt('l', 500, 60, 'extra memory: 1 temp → O(1)', { size: 34, role: 'done' })],
    'Swapping ends in place needs one temporary value, whatever n is. That is O of 1 space.',
  );
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  n: number;
}
const clampN = (n: number, max = 16) => Math.max(2, Math.min(max, Math.round(n)));

/* ---------------- predict ---------------- */
function binaryHalvings(): Frame[] {
  const f = new Frames();
  let n = 1024;
  let k = 0;
  const w = (m: number) => Math.max(8, (m / 1024) * 800);
  while (n >= 1) {
    f.add([region('r', 500, 220, w(n), 90, { role: n === 1 ? 'done' : 'head', label: `${n} left` }), counter(k)], n === 1024 ? 'Start with 1024 items.' : n === 1 ? `One item left after ${k} halvings.` : `${n} left.`);
    if (n === 1) break;
    n /= 2;
    k++;
  }
  return f.get();
}

function compareGrowth(): Frame[] {
  const f = new Frames();
  for (const n of [10, 100, 200, 1000]) {
    const a = 100 * n;
    const b = (n * n) / 2;
    const s = 300 / 500000;
    f.add(
      [
        bar('a', 380, Math.max(4, a * s), { w: 120, role: 'curr', value: a.toLocaleString(), sub: '100·n' }),
        bar('b', 620, Math.max(4, Math.min(300, b * s)), { w: 120, role: 'danger', value: b.toLocaleString(), sub: 'n²/2' }),
        txt('n', 500, 60, `n = ${n}`, { size: 40, role: 'curr' }),
      ],
      n === 10
        ? 'At n equals 10, 100 n is bigger: 1000 steps against 50.'
        : n === 100
          ? 'At 100, still bigger: 10,000 against 5,000.'
          : n === 200
            ? 'At 200 they tie.'
            : 'At 1000, n squared over 2 is five times worse, and the gap keeps growing. Constants lose to growth.',
    );
  }
  return f.get();
}

/* ---------------- trace ---------------- */
const TRACE_CODE = `def count_pairs(nums, target):
    count = 0
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                count += 1
    return count`;

function trace(): Frame[] {
  const nums = [1, 4, 2, 3];
  const target = 5;
  const f = new Frames();
  let count = 0;
  let checks = 0;
  f.add([...arrayRow(nums), counter(0, 860, 70, 'checks')], 'Count pairs that add up to 5. count starts at zero.', { line: 2, vars: { count: 0, target } });
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      checks++;
      const hit = nums[i] + nums[j] === target;
      const prims = [...arrayRow(nums, { roles: { [i]: 'curr', [j]: 'second' }, glow: hit ? [i, j] : [] }), ptr('i', `a${i}`, 'curr'), ptr('j', `a${j}`, 'second'), counter(checks, 860, 70, 'checks')];
      f.add(prims, `${nums[i]} plus ${nums[j]} is ${nums[i] + nums[j]}.${hit ? ' A match!' : ''}`, { line: 5, vars: { i, j, 'nums[i]+nums[j]': nums[i] + nums[j], count } });
      if (hit) {
        count++;
        f.add(prims, `count goes up to ${count}.`, { line: 6, vars: { i, j, count } });
      }
    }
  }
  f.add([...arrayRow(nums), counter(checks, 860, 70, 'checks'), txt('big', 500, 400, '4 items → 6 checks = n(n−1)/2 → O(n²)', { size: 34, role: 'new' })], 'Six checks for four items: about n squared over two. Drop the constant: O of n squared.', {
    line: 7,
    vars: { count },
  });
  return f.get();
}

/* ---------------- topic ---------------- */
const topic: Topic = {
  id: 'big-o',
  order: 1,
  title: 'Big-O basics',
  short: 'Count steps, not seconds. How work grows with input.',
  icon: '📈',
  costs: [cost('Read a[i]', 'O(1)'), cost('Halve until 1', 'O(log n)'), cost('Scan a list', 'O(n)'), cost('Good sort', 'O(n log n)'), cost('All pairs', 'O(n²)')],

  hook: {
    frames: hook,
    lines: [
      'Big-O answers one question: when the input doubles, what happens to the work?',
      'We count steps, not seconds, because seconds change with every laptop.',
    ],
  },

  watch: [
    { id: 'linear', title: 'Count the steps', frames: linear, code: LINEAR_CODE, costs: [cost('Sum a list', 'O(n)', 'O(1)')] },
    { id: 'nested', title: 'Loop in a loop', frames: nested, code: NESTED_CODE, costs: [cost('All pairs', 'O(n²)', 'O(1)')] },
    { id: 'halving', title: 'Halving', frames: halving, code: HALVE_CODE, costs: [cost('Halve until 1', 'O(log n)', 'O(1)')] },
    { id: 'race', title: 'Growth race', frames: race },
    { id: 'space', title: 'Space too', frames: space, costs: [cost('Reverse into copy', 'O(n)', 'O(n)'), cost('Reverse in place', 'O(n)', 'O(1)')] },
  ],

  recall: {
    prompt: 'In your own words: what does O(n) tell you, and why do we ignore constants like the 2 in 2n?',
    model:
      'O(n) says the work grows in step with the input size: double n, roughly double the work. We drop constants because they don’t change the shape of growth. For big inputs the shape wins, so 2n and n are both linear.',
    keywords: [
      ['grow', 'grows', 'growth', 'scale', 'increase'],
      ['input', 'size', ' n '],
      ['double', 'twice', 'proportional', 'linear', 'straight'],
      ['constant', 'drop', 'ignore', 'shape'],
    ],
  },

  play: {
    intro: 'Pick n, then run each kind of algorithm. Watch how the step counter grows.',
    init: (): S => ({ n: 8 }),
    view: (s: S) => scene([...cellsN(s.n), counter(0)]),
    ops: [
      {
        id: 'o1',
        label: 'O(1): read the first item',
        args: [{ name: 'n', kind: 'int', default: 8 }],
        run: (_s: S, a) => {
          const n = clampN(Number(a.n));
          const f = new Frames();
          f.add([...cellsN(n), counter(0)], `n is ${n}.`);
          f.add([...cellsN(n, { 0: 'curr' }, [0]), counter(1)], 'One step, no matter how big n is.');
          return { state: { n }, frames: f.get(), cost: cost('Read first', 'O(1)') };
        },
      },
      {
        id: 'ologn',
        label: 'O(log n): keep halving',
        args: [{ name: 'n', kind: 'int', default: 16 }],
        run: (_s: S, a) => {
          const n = clampN(Number(a.n));
          const f = new Frames();
          let lo = 0;
          let hi = n - 1;
          let k = 0;
          const roles = () => Object.fromEntries(Array.from({ length: n }, (_, i) => [i, i < lo || i > hi ? 'muted' : 'head']));
          f.add([...cellsN(n, roles()), counter(0)], `n is ${n}. Halve until one is left.`);
          while (hi > lo) {
            k++;
            hi = lo + Math.ceil((hi - lo + 1) / 2) - 1;
            f.add([...cellsN(n, roles()), counter(k)], `${hi - lo + 1} left.`);
          }
          f.add([...cellsN(n, roles()), counter(k)], `${k} steps. log base 2 of ${n} is about ${Math.log2(n).toFixed(1)}.`);
          return { state: { n }, frames: f.get(), cost: cost('Halving', 'O(log n)') };
        },
      },
      {
        id: 'on',
        label: 'O(n): visit every item',
        args: [{ name: 'n', kind: 'int', default: 8 }],
        run: (_s: S, a) => {
          const n = clampN(Number(a.n));
          const f = new Frames();
          for (let i = 0; i <= n; i++) {
            const roles = Object.fromEntries(Array.from({ length: n }, (_, k) => [k, k < i ? 'done' : 'default']));
            f.add([...cellsN(n, roles, i > 0 ? [i - 1] : []), counter(i)], i === 0 ? `n is ${n}.` : i === n ? `${n} steps for ${n} items.` : `Step ${i}.`);
          }
          return { state: { n }, frames: f.get(), cost: cost('Visit all', 'O(n)') };
        },
      },
      {
        id: 'on2',
        label: 'O(n²): check all pairs',
        args: [{ name: 'n', kind: 'int', default: 6 }],
        run: (_s: S, a) => {
          const n = clampN(Number(a.n), 10);
          const f = new Frames();
          const size = n > 7 ? 30 : 38;
          for (let r = 0; r <= n; r++) f.add([...pairGrid(n, r * n, size), counter(r * n)], r === 0 ? `n is ${n}: an ${n} by ${n} grid of pairs.` : r === n ? `${n * n} steps. Try n doubled.` : `Row ${r}.`);
          return { state: { n }, frames: f.get(), cost: cost('All pairs', 'O(n²)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'double-nested',
      question: 'A loop inside a loop takes 64 steps when n = 8. About how many steps when n = 16?',
      scene: { prims: [...pairGrid(8, 64, 30), counter(64)], w: 1000, h: 440 },
      options: ['128 (double)', '256 (four times)', '72 (a few more)', '4096'],
      answer: 1,
      frames: () => {
        const f = new Frames();
        f.add([...pairGrid(8, 64, 30), counter(64)], 'Eight by eight: 64.');
        f.add([...pairGrid(16, 256, 22), counter(256)], 'Sixteen by sixteen: 256. Double n, four times the work.');
        return f.get();
      },
      why: 'With n² work, doubling n multiplies work by 2² = 4.',
    },
    {
      id: 'binary-1024',
      question: 'You halve a list of 1,024 items until one is left. How many halvings?',
      scene: { prims: [region('r', 500, 220, 800, 90, { role: 'head', label: '1024 items' })], w: 1000, h: 440 },
      options: ['1024', '512', '10', '32'],
      answer: 2,
      frames: binaryHalvings,
      why: '2¹⁰ = 1024, so ten halvings. That is log₂ n.',
    },
    {
      id: 'constants',
      question: 'Algorithm A takes 100·n steps. Algorithm B takes n²/2. Which is faster when n = 1,000?',
      scene: { prims: [txt('a', 330, 200, 'A: 100·n', { size: 48, role: 'curr' }), txt('b', 670, 200, 'B: n²/2', { size: 48, role: 'danger' })], w: 1000, h: 440 },
      options: ['A', 'B', 'They tie', 'Depends on the computer'],
      answer: 0,
      frames: compareGrowth,
      why: 'B is faster for tiny n, but past n = 200 the n² term takes over. Big-O predicts the large-n winner.',
    },
  ],

  trace: { title: 'Counting pairs that sum to a target', code: TRACE_CODE, frames: trace },

  build: {
    intro: [
      'Build a step counter. Each function should run the loop and count how many times the body runs.',
      'Don’t use a formula. Write the loop and count. That’s how you’ll read real code.',
    ],
    starter: `def steps_linear(n):
    # count how many times the body of "for i in range(n)" runs
    count = 0
    return count


def steps_pairs(n):
    # body of: for i in range(n): for j in range(i + 1, n)
    count = 0
    return count


def steps_halving(n):
    # body of: while n > 1: n = n // 2
    count = 0
    return count
`,
    solution: `def steps_linear(n):
    count = 0
    for i in range(n):
        count += 1
    return count


def steps_pairs(n):
    count = 0
    for i in range(n):
        for j in range(i + 1, n):
            count += 1
    return count


def steps_halving(n):
    count = 0
    while n > 1:
        n = n // 2
        count += 1
    return count
`,
    tests: [
      { call: 'steps_linear(5)', expected: '5' },
      { call: 'steps_linear(0)', expected: '0' },
      { call: 'steps_pairs(4)', expected: '6' },
      { call: 'steps_pairs(1)', expected: '0' },
      { call: 'steps_pairs(10)', expected: '45' },
      { call: 'steps_halving(16)', expected: '4' },
      { call: 'steps_halving(1000)', expected: '9' },
      { call: 'steps_halving(1)', expected: '0' },
    ],
    builtin: {
      text: 'Real code measures time with timeit. Try timing a linear and a quadratic function at n and 2n: the ratio tells you the Big-O.',
      code: `import timeit
t1 = timeit.timeit(lambda: steps_pairs(500), number=10)
t2 = timeit.timeit(lambda: steps_pairs(1000), number=10)
print(t2 / t1)   # about 4 -> quadratic`,
    },
  },

  fill: {
    intro: ['This checks whether any two different items add up to target.', 'The inner loop is missing. Each pair should be checked once, and an item can’t pair with itself.'],
    code: `def has_pair_sum(nums, target):
    for i in range(len(nums)):
        ____
            if nums[i] + nums[j] == target:
                return True
    return False`,
    answer: 'for j in range(i + 1, len(nums)):',
    tests: [
      { call: 'has_pair_sum([1, 4, 2, 3], 5)', expected: 'True' },
      { call: 'has_pair_sum([1, 2], 5)', expected: 'False' },
      { call: 'has_pair_sum([3], 6)', expected: 'False' },
      { call: 'has_pair_sum([3, 3], 6)', expected: 'True' },
      { call: 'has_pair_sum([], 0)', expected: 'False' },
    ],
  },

  wild: [
    { icon: '🗄️', title: 'Databases', text: 'Without an index, a query scans every row: O(n). With a B-tree index it’s O(log n). That’s the difference between seconds and milliseconds.' },
    { icon: '🎮', title: 'Games', text: 'A frame has about 16 milliseconds. Checking every pair of objects for collisions is O(n²), so engines use spatial grids to skip far-apart pairs.' },
    { icon: '🌌', title: 'Simulations', text: 'Gravity between n stars is O(n²) per step. Barnes–Hut groups far stars together and gets O(n log n), making galaxy simulations possible.' },
    { icon: '🔎', title: 'Search engines', text: 'Billions of pages means only O(log n) or O(1) lookups are affordable per query. Anything linear is out.' },
  ],

  problems: [
    {
      id: 'above-average',
      title: 'Readings above average',
      difficulty: 'easy',
      pattern: 'Two passes, O(n)',
      intro: [
        'A sensor logged some readings. Return how many readings are strictly greater than the average of all readings.',
        'Return 0 for an empty list.',
      ],
      examples: [
        { input: 'count_above_average([1, 2, 3, 4])', output: '2', why: 'Average is 2.5. Only 3 and 4 are above it.' },
        { input: 'count_above_average([5, 5, 5])', output: '0' },
      ],
      starter: `def count_above_average(nums):
    pass
`,
      solution: `def count_above_average(nums):
    if not nums:
        return 0
    avg = sum(nums) / len(nums)
    count = 0
    for x in nums:
        if x > avg:
            count += 1
    return count
`,
      tests: [
        { call: 'count_above_average([1, 2, 3, 4])', expected: '2' },
        { call: 'count_above_average([5, 5, 5])', expected: '0' },
        { call: 'count_above_average([])', expected: '0' },
        { call: 'count_above_average([10, -10, 1])', expected: '2' },
        { call: 'count_above_average([1, 1, 1, 9])', expected: '1' },
        { call: 'count_above_average(list(range(100000)))', expected: '50000', show: 'count_above_average(list(range(100000)))' },
      ],
      hints: [
        'Two separate passes over the list is still O(n). 2n drops to n.',
        'First compute the average once. Then count values above it. Don’t recompute the average inside the loop, which would be O(n²).',
        'if empty: return 0 → avg = sum / len → count = 0 → for x: if x > avg: count += 1 → return count',
      ],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'biggest-drop',
      title: 'Biggest overnight drop',
      difficulty: 'easy',
      pattern: 'Single scan with a running best',
      intro: [
        'temps holds one temperature per day. Return the biggest drop from one day to the very next day.',
        'If the temperature never drops, or there are fewer than two days, return 0.',
      ],
      examples: [
        { input: 'biggest_drop([20, 18, 25, 15])', output: '10', why: '25 → 15 drops by 10.' },
        { input: 'biggest_drop([1, 2, 3])', output: '0' },
      ],
      starter: `def biggest_drop(temps):
    pass
`,
      solution: `def biggest_drop(temps):
    best = 0
    for i in range(len(temps) - 1):
        best = max(best, temps[i] - temps[i + 1])
    return best
`,
      tests: [
        { call: 'biggest_drop([20, 18, 25, 15])', expected: '10' },
        { call: 'biggest_drop([1, 2, 3])', expected: '0' },
        { call: 'biggest_drop([])', expected: '0' },
        { call: 'biggest_drop([5])', expected: '0' },
        { call: 'biggest_drop([9, 4, 6, 1])', expected: '5' },
        { call: 'biggest_drop([3, 3])', expected: '0' },
      ],
      hints: [
        'Only neighbours matter, so one pass with a “best so far” variable is enough.',
        'Look at each pair (i, i+1). The drop is temps[i] − temps[i+1]. Keep the largest, starting from 0.',
        'best = 0 → for i in 0 .. len−2: best = max(best, temps[i] − temps[i+1]) → return best',
      ],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'best-growth',
      title: 'Best growth window',
      difficulty: 'medium',
      pattern: 'Running minimum: O(n²) → O(n)',
      intro: [
        'readings is a culture’s size measured over time. Return the largest increase readings[j] − readings[i] with i before j.',
        'If it never grows, return 0. The last test has 50,000 readings, so checking every pair will be too slow.',
      ],
      examples: [
        { input: 'best_growth([7, 1, 5, 3, 6, 4])', output: '5', why: 'From 1 up to 6.' },
        { input: 'best_growth([7, 6, 4, 3, 1])', output: '0' },
      ],
      starter: `def best_growth(readings):
    pass
`,
      solution: `def best_growth(readings):
    best = 0
    lowest = float('inf')
    for r in readings:
        lowest = min(lowest, r)
        best = max(best, r - lowest)
    return best
`,
      tests: [
        { call: 'best_growth([7, 1, 5, 3, 6, 4])', expected: '5' },
        { call: 'best_growth([7, 6, 4, 3, 1])', expected: '0' },
        { call: 'best_growth([2, 4, 1])', expected: '2' },
        { call: 'best_growth([])', expected: '0' },
        { call: 'best_growth([3, 8, 1, 9])', expected: '8' },
        { call: 'best_growth(list(range(50000)))', expected: '49999' },
      ],
      hints: [
        'Running minimum. The best pair ending at j always uses the smallest value seen before j.',
        'Walk once. Track the lowest reading so far. At each reading, the best growth ending here is reading − lowest. Keep the max.',
        'best = 0, lowest = +∞ → for r: lowest = min(lowest, r); best = max(best, r − lowest) → return best',
      ],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
  ],

  extra: [
    { name: 'Best Time to Buy and Sell Stock', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', difficulty: 'easy' },
    { name: 'Contains Duplicate', url: 'https://leetcode.com/problems/contains-duplicate/', difficulty: 'easy' },
    { name: 'Missing Number', url: 'https://leetcode.com/problems/missing-number/', difficulty: 'easy' },
    { name: 'Maximum Subarray', url: 'https://leetcode.com/problems/maximum-subarray/', difficulty: 'medium' },
  ],

  quiz: [
    {
      q: 'A loop over n items, with another loop over n items inside it, is…',
      options: ['O(n)', 'O(2n)', 'O(n²)', 'O(log n)'],
      answer: 2,
      why: 'n iterations, each doing n work: n × n.',
    },
    {
      q: 'Why is O(3n + 5) written as O(n)?',
      options: ['Because 3 and 5 are small', 'Constants don’t change how the work grows', 'Python ignores constants', 'It’s a rounding rule'],
      answer: 1,
      why: 'Big-O describes the growth shape. 3n+5 is still a straight line.',
    },
    {
      q: 'Which grows slowest as n gets huge?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(n²)'],
      answer: 1,
      why: 'Doubling n adds just one step to log₂ n.',
    },
  ],
};

export default topic;

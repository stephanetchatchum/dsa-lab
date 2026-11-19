import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, bar, cost, Frames, ptr, region, scene, spread, txt } from '../../../lib/viz';

interface It {
  id: string;
  v: number;
}
let uid = 0;
const mk = (vals: number[]): It[] => vals.map((v) => ({ id: `v${uid++}`, v }));

function bars(items: It[], o: { roles?: Record<string, Role>; regions?: [number, number, Role?][]; gap?: number; scale?: number } = {}): Prim[] {
  const gap = o.gap ?? 92;
  const xs = spread(items.length, gap);
  const max = Math.max(...items.map((x) => x.v), 1);
  const scale = o.scale ?? 260 / max;
  const out: Prim[] = [];
  (o.regions ?? []).forEach(([a, b, r], k) => out.push(region(`rg${k}`, (xs[a] + xs[b]) / 2, 250, xs[b] - xs[a] + gap - 6, 300, { role: r ?? 'second', dashed: true })));
  items.forEach((it, i) => out.push(bar(it.id, xs[i], Math.max(14, it.v * scale), { w: gap - 22, value: it.v, sub: String(i), role: o.roles?.[it.id], y: 390 })));
  return out;
}

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const cards = mk([7, 3, 9, 5]);
  f.add(bars(cards), 'You’re dealt cards one at a time and keep your hand in order.');
  const order = [cards[1], cards[0], cards[2], cards[3]];
  f.add(bars(order, { roles: { [cards[1].id]: 'curr' } }), 'Each new card slides left past bigger cards until it fits. That’s insertion sort.');
  const sorted = [cards[1], cards[3], cards[0], cards[2]];
  f.add(bars(sorted, { roles: Object.fromEntries(sorted.map((c) => [c.id, 'done' as Role])) }), 'Sorted. Now finding a card is fast: open the middle and throw half away. That’s binary search, and it only works on sorted data.');
  return f.get();
}

/* ---------------- insertion sort ---------------- */
function insertionFrames(vals: number[]): Frame[] {
  const a = mk(vals);
  const f = new Frames();
  const doneRoles = (k: number, extra: Record<string, Role> = {}) => ({ ...Object.fromEntries(a.slice(0, k).map((x) => [x.id, 'done' as Role])), ...extra });
  f.add(bars(a, { roles: doneRoles(1) }), 'The first item alone is already a sorted hand.');
  for (let i = 1; i < a.length; i++) {
    let j = i;
    f.add(bars(a, { roles: doneRoles(i, { [a[i].id]: 'curr' }) }), `Pick up ${a[i].v}.`);
    while (j > 0 && a[j - 1].v > a[j].v) {
      [a[j - 1], a[j]] = [a[j], a[j - 1]];
      j--;
      f.add(bars(a, { roles: doneRoles(i + 1, { [a[j].id]: 'curr', [a[j + 1].id]: 'second' }) }), `${a[j + 1].v} is bigger, so ${a[j].v} slides left past it.`);
    }
  }
  f.add(bars(a, { roles: doneRoles(a.length) }), 'Sorted. Worst case each item slides past all before it: O of n squared. But on nearly sorted data it’s almost O of n.');
  return f.get();
}

/* ---------------- merge sort (bottom-up so levels are visible) ---------------- */
function mergeFrames(vals: number[]): Frame[] {
  let a = mk(vals);
  const n = a.length;
  const f = new Frames();
  const segs = (w: number): [number, number, Role?][] => {
    const out: [number, number, Role?][] = [];
    for (let s = 0; s < n; s += w) out.push([s, Math.min(n, s + w) - 1, 'second']);
    return out;
  };
  f.add(bars(a, { regions: segs(1) }), 'Merge sort. Start by treating every item as a tiny sorted list of one.');
  let level = 0;
  for (let w = 1; w < n; w *= 2) {
    level++;
    const next: It[] = [];
    for (let s = 0; s < n; s += 2 * w) {
      const L = a.slice(s, Math.min(s + w, n));
      const R = a.slice(Math.min(s + w, n), Math.min(s + 2 * w, n));
      let i = 0;
      let j = 0;
      while (i < L.length || j < R.length) {
        if (j >= R.length || (i < L.length && L[i].v <= R[j].v)) next.push(L[i++]);
        else next.push(R[j++]);
      }
    }
    f.add(bars(a, { regions: segs(2 * w).map(([x, y]) => [x, y, 'curr'] as [number, number, Role]) }), `Level ${level}: pair up neighbouring sorted runs of ${w}.`);
    a = next;
    f.add(bars(a, { regions: segs(2 * w) }), `Merge each pair by repeatedly taking the smaller front item. Runs of ${Math.min(2 * w, n)} are sorted. This level touched every item once: O of n.`);
  }
  f.add(bars(a, { roles: Object.fromEntries(a.map((x) => [x.id, 'done' as Role])) }), `${level} levels, because we double the run size each time: log of n levels. n work per level: O of n log n, always.`);
  return f.get();
}

/* ---------------- quick sort partition ---------------- */
function partitionFrames(vals: number[]): Frame[] {
  const a = mk(vals);
  const f = new Frames();
  const hi = a.length - 1;
  const pivot = a[hi];
  let i = 0;
  const pic = (j: number, extra: Record<string, Role> = {}) => {
    const roles: Record<string, Role> = { [pivot.id]: 'head' };
    a.slice(0, i).forEach((x) => (roles[x.id] = 'done'));
    const prims = bars(a, { roles: { ...roles, ...extra } });
    if (i <= hi) prims.push(ptr('i', a[Math.min(i, hi)].id, 'second', { side: 'top', id: 'pi', slot: 1 }));
    if (j <= hi) prims.push(ptr('j', a[j].id, 'curr', { side: 'top', id: 'pj' }));
    return prims;
  };
  f.add(pic(0), `Quick sort picks a pivot, here the last item, ${pivot.v}. Goal: smaller items to its left, bigger to its right.`);
  for (let j = 0; j < hi; j++) {
    if (a[j].v < pivot.v) {
      f.add(pic(j, { [a[j].id]: 'curr' }), `${a[j].v} is smaller than ${pivot.v}: swap it into the left zone.`);
      [a[i], a[j]] = [a[j], a[i]];
      i++;
      f.add(pic(j), 'The green zone grows by one.');
    } else f.add(pic(j, { [a[j].id]: 'muted' }), `${a[j].v} is bigger: leave it.`);
  }
  [a[i], a[hi]] = [a[hi], a[i]];
  const roles: Record<string, Role> = { [pivot.id]: 'done' };
  f.add(bars(a, { roles, regions: [[0, i - 1, 'second'], [i + 1, hi, 'second']] }), `Swap the pivot into place: index ${i}. It will never move again.`);
  f.add(bars([...a].sort((x, y) => x.v - y.v), { roles: Object.fromEntries(a.map((x) => [x.id, 'done' as Role])) }), 'Repeat on each side. Average O of n log n, in place. A bad pivot every time gives O of n squared, so real code picks pivots randomly.');
  return f.get();
}

/* ---------------- binary search ---------------- */
const BS_CODE = `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`;

function bsFrames(nums: number[], target: number, withLines = true): Frame[] {
  const f = new Frames();
  let lo = 0;
  let hi = nums.length - 1;
  const L = (l: number) => (withLines ? { line: l } : {});
  const pic = (mid?: number, found = false) => {
    const roles: Record<number, Role> = {};
    nums.forEach((_, k) => (roles[k] = k < lo || k > hi ? 'muted' : 'default'));
    if (mid !== undefined) roles[mid] = found ? 'done' : 'curr';
    const p: Prim[] = [...arrayRow(nums, { roles, gap: 92 }), txt('t', 500, 400, `target = ${target}`, { size: 32 })];
    if (lo <= hi) {
      p.push(ptr('lo', `a${lo}`, 'head', { side: 'bottom', id: 'plo' }));
      p.push(ptr('hi', `a${hi}`, 'second', { side: 'bottom', id: 'phi', slot: lo === hi ? 1 : 0 }));
    }
    if (mid !== undefined) p.push(ptr('mid', `a${mid}`, found ? 'done' : 'curr', { id: 'pmid' }));
    return p;
  };
  f.add(pic(), `Find ${target}. lo and hi mark the part that could still contain it.`, { ...L(2), vars: { lo, hi } });
  let steps = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    steps++;
    if (nums[mid] === target) {
      f.add(pic(mid, true), `Middle is ${nums[mid]}. Found it in ${steps} comparison${steps > 1 ? 's' : ''}.`, { ...L(6), vars: { lo, hi, mid, 'nums[mid]': nums[mid] } });
      return f.get();
    }
    f.add(pic(mid), `Check the middle: ${nums[mid]}.`, { ...L(4), vars: { lo, hi, mid, 'nums[mid]': nums[mid] } });
    if (nums[mid] < target) {
      lo = mid + 1;
      f.add(pic(), `${nums[mid]} is too small, so everything left of it is too. Drop that half.`, { ...L(8), vars: { lo, hi } });
    } else {
      hi = mid - 1;
      f.add(pic(), `${nums[mid]} is too big. Drop the right half.`, { ...L(10), vars: { lo, hi } });
    }
  }
  f.add(pic(), `lo passed hi: ${target} isn’t here. Return -1 after only ${steps} checks.`, { ...L(11), vars: { lo, hi } });
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  a: It[];
}
let seed = 7;
const rnd = () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

const topic: Topic = {
  id: 'sorting',
  order: 7,
  title: 'Sorting & binary search',
  short: 'Put things in order, then find anything in log n steps.',
  icon: '📚',
  costs: [cost('insertion sort', 'O(n²)', 'O(1)'), cost('merge sort', 'O(n log n)', 'O(n)'), cost('quick sort (avg)', 'O(n log n)', 'O(log n)'), cost('binary search', 'O(log n)', 'O(1)')],

  hook: { frames: hook, lines: ['Sorting is how you put a hand of cards in order.', 'Once data is sorted, binary search finds anything by halving: a million items in about 20 steps.'] },

  watch: [
    { id: 'insertion', title: 'Insertion sort', frames: () => insertionFrames([5, 2, 4, 6, 1, 3]), costs: [cost('insertion sort', 'O(n²)', 'O(1)'), cost('…already sorted', 'O(n)')] },
    { id: 'merge', title: 'Merge sort', frames: () => mergeFrames([38, 27, 43, 3, 9, 82, 10, 21]), costs: [cost('merge sort', 'O(n log n)', 'O(n)')] },
    { id: 'quick', title: 'Quick sort', frames: () => partitionFrames([8, 3, 5, 1, 9, 2, 7]), costs: [cost('partition', 'O(n)'), cost('quick sort (avg)', 'O(n log n)', 'O(log n)')] },
    { id: 'binary', title: 'Binary search', frames: () => bsFrames([1, 3, 5, 7, 9, 11, 13, 15, 17], 13, false), code: BS_CODE, costs: [cost('binary search', 'O(log n)', 'O(1)')] },
  ],

  recall: {
    prompt: 'Why is merge sort O(n log n)? And what does binary search need before it can work?',
    model:
      'Merge sort keeps halving until runs have one item, which takes log n levels, and merging at each level touches every item once, so n work per level: n log n. Binary search needs the data sorted. Then each comparison with the middle throws away half of what is left.',
    keywords: [
      ['half', 'halv', 'split', 'divide'],
      ['log'],
      ['level', 'merge', 'each item once', 'n work'],
      ['sorted', 'in order'],
    ],
  },

  play: {
    intro: 'Shuffle the bars, pick a sort and watch it work. Then binary search the sorted result.',
    init: (): S => ({ a: mk([6, 2, 8, 4, 7, 1, 5, 3]) }),
    view: (s: S) => scene(bars(s.a)),
    ops: [
      {
        id: 'shuffle',
        label: 'shuffle',
        run: (s: S) => {
          const a = [...s.a];
          for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
          }
          return { state: { a }, frames: [{ scene: scene(bars(a)), say: 'Shuffled.' }] };
        },
      },
      {
        id: 'ins',
        label: 'insertion sort',
        run: (s: S) => {
          const sorted = [...s.a].sort((x, y) => x.v - y.v);
          const fr = insertionFrames(s.a.map((x) => x.v));
          return { state: { a: sorted }, frames: fr.map((x) => ({ ...x })), cost: cost('insertion sort', 'O(n²)') };
        },
      },
      {
        id: 'merge',
        label: 'merge sort',
        run: (s: S) => ({ state: { a: [...s.a].sort((x, y) => x.v - y.v) }, frames: mergeFrames(s.a.map((x) => x.v)), cost: cost('merge sort', 'O(n log n)') }),
      },
      {
        id: 'bs',
        label: 'binary search for v',
        args: [{ name: 'v', kind: 'int', default: 5 }],
        run: (s: S, a) => {
          const vals = s.a.map((x) => x.v);
          const isSorted = vals.every((v, i) => i === 0 || vals[i - 1] <= v);
          if (!isSorted) return { state: s, frames: [{ scene: scene(bars(s.a, { roles: Object.fromEntries(s.a.map((x) => [x.id, 'danger' as Role])) })), say: 'Not sorted! Binary search would give wrong answers. Sort first.' }] };
          return { state: s, frames: bsFrames(vals, Number(a.v), false), cost: cost('binary search', 'O(log n)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'bs-steps',
      question: 'Binary search for 13 in [1, 3, 5, 7, 9, 11, 13, 15, 17]. How many middle-checks until it’s found?',
      scene: scene(arrayRow([1, 3, 5, 7, 9, 11, 13, 15, 17], { gap: 92 })),
      options: ['1', '2', '3', '7'],
      answer: 1,
      frames: () => bsFrames([1, 3, 5, 7, 9, 11, 13, 15, 17], 13, false),
      why: 'First middle is 9 (too small), then the middle of the right half is 13.',
    },
    {
      id: 'ins-sorted',
      question: 'Insertion sort gets a list that is ALREADY sorted, with n items. How much work?',
      scene: scene(bars(mk([1, 2, 3, 4, 5, 6]))),
      options: ['O(1)', 'O(n): one check per item', 'O(n log n)', 'O(n²)'],
      answer: 1,
      frames: () => insertionFrames([1, 2, 3, 4, 5, 6]),
      why: 'Each item compares once with its left neighbour and stays put. That’s why insertion sort is great for nearly sorted data.',
    },
    {
      id: 'pivot-spot',
      question: 'Partition [8, 3, 9, 1, 2, 5] around the pivot 5 (smaller left, bigger right). At which index does 5 end up?',
      scene: scene(bars(mk([8, 3, 9, 1, 2, 5]))),
      options: ['0', '2', '3', '5'],
      answer: 2,
      frames: () => partitionFrames([8, 3, 9, 1, 2, 5]).slice(0, -1),
      why: 'Exactly three items (3, 1, 2) are smaller, so 5 lands at index 3.',
    },
  ],

  trace: { title: 'Binary search, step by step', code: BS_CODE, frames: () => bsFrames([2, 4, 7, 10, 14, 19, 23, 28, 31], 23) },

  build: {
    intro: [
      'Write merge_sort (returns a new sorted list) and binary_search (index of target, or -1). Don’t use sort() or sorted().',
      'merge_sort: split in half, sort each half recursively, then merge by repeatedly taking the smaller front item.',
    ],
    starter: `def merge(left, right):
    out = []
    # take the smaller front item until one side runs out
    return out


def merge_sort(nums):
    pass


def binary_search(nums, target):
    pass
`,
    solution: `def merge(left, right):
    out = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out


def merge_sort(nums):
    if len(nums) <= 1:
        return list(nums)
    mid = len(nums) // 2
    return merge(merge_sort(nums[:mid]), merge_sort(nums[mid:]))


def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    tests: [
      { call: 'merge([1, 4, 9], [2, 3, 10])', expected: '[1, 2, 3, 4, 9, 10]' },
      { call: 'merge_sort([5, 2, 4, 6, 1, 3])', expected: '[1, 2, 3, 4, 5, 6]' },
      { call: 'merge_sort([])', expected: '[]' },
      { call: 'merge_sort([3, 1, 3, 1])', expected: '[1, 1, 3, 3]' },
      { code: 'import random\nrandom.seed(1)\nxs = [random.randint(-1000, 1000) for _ in range(20000)]\nresult = merge_sort(xs) == sorted(xs)', show: '20,000 random numbers', expected: 'True' },
      { call: 'binary_search([1, 3, 5, 7, 9], 7)', expected: '3' },
      { call: 'binary_search([1, 3, 5, 7, 9], 4)', expected: '-1' },
      { call: 'binary_search([], 1)', expected: '-1' },
      { call: 'binary_search(list(range(0, 2000000, 2)), 1999998)', expected: '999999' },
    ],
    builtin: {
      text: 'Python’s sorted() uses Timsort: merge sort plus insertion sort on small runs, O(n log n) and stable. The bisect module does binary search.',
      code: `nums = sorted([5, 2, 9])        # O(n log n)
import bisect
bisect.bisect_left(nums, 5)     # O(log n) -> 1
people.sort(key=lambda p: p.age)`,
    },
  },

  fill: {
    intro: ['Binary search on a sorted list.', 'When the middle value is too small, the target can only be to its right. Write the line that moves lo.'],
    code: `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            ____
        else:
            hi = mid - 1
    return -1`,
    answer: 'lo = mid + 1',
    tests: [
      { call: 'binary_search([1, 3, 5, 7, 9, 11], 11)', expected: '5' },
      { call: 'binary_search([1, 3, 5, 7, 9, 11], 1)', expected: '0' },
      { call: 'binary_search([1, 3, 5], 4)', expected: '-1' },
      { call: 'binary_search([2], 2)', expected: '0' },
    ],
  },

  wild: [
    { icon: '🐍', title: 'Python & Java', text: 'Timsort, designed for Python, sorts real data fast by spotting runs that are already in order. Java adopted it too.' },
    { icon: '🗄️', title: 'Databases', text: 'ORDER BY sorts results, and B-tree indexes keep keys sorted so range queries like “dates in March” are a binary-search-style walk.' },
    { icon: '🐞', title: 'git bisect', text: 'A bug appeared somewhere in 1,000 commits? git bisect binary-searches them: about 10 tests to find the culprit.' },
    { icon: '🎨', title: 'Graphics', text: 'Renderers sort transparent objects by distance so they’re drawn back to front.' },
  ],

  problems: [
    {
      id: 'first-at-least',
      title: 'First reading at or above',
      difficulty: 'easy',
      pattern: 'Binary search (lower bound)',
      intro: ['readings is sorted (may contain repeats). Return the index of the first reading ≥ x, or len(readings) if there is none.', 'Use binary search: the last test has two million readings.'],
      examples: [
        { input: 'first_at_least([1, 3, 3, 5, 8], 3)', output: '1' },
        { input: 'first_at_least([1, 3, 3, 5, 8], 9)', output: '5' },
      ],
      starter: `def first_at_least(readings, x):
    pass
`,
      solution: `def first_at_least(readings, x):
    lo, hi = 0, len(readings)
    while lo < hi:
        mid = (lo + hi) // 2
        if readings[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo
`,
      tests: [
        { call: 'first_at_least([1, 3, 3, 5, 8], 3)', expected: '1' },
        { call: 'first_at_least([1, 3, 3, 5, 8], 9)', expected: '5' },
        { call: 'first_at_least([1, 3, 3, 5, 8], 0)', expected: '0' },
        { call: 'first_at_least([1, 3, 3, 5, 8], 4)', expected: '3' },
        { call: 'first_at_least([], 4)', expected: '0' },
        { code: 'xs = list(range(2000000))\nresult = sum(first_at_least(xs, q) for q in range(0, 2000000, 997))', show: '2,000 queries on 2,000,000 readings', expected: str_sum() },
      ],
      hints: ['Binary search for a boundary: everything left is < x, everything from the answer on is ≥ x.', 'Keep lo and hi with hi = len (one past the end). If readings[mid] < x the answer is right of mid (lo = mid + 1), else it’s mid or left of it (hi = mid). Stop when lo == hi.', 'lo, hi = 0, n → while lo < hi: mid; if r[mid] < x: lo = mid + 1 else hi = mid → return lo'],
      complexity: { time: 'O(log n)', space: 'O(1)' },
    },
    {
      id: 'overlap',
      title: 'Double-booked?',
      difficulty: 'easy',
      pattern: 'Sort, then compare neighbours',
      intro: ['bookings is a list of [start, end) times (end is exclusive). Return True if any two bookings overlap.', 'A booking ending at 10 and one starting at 10 do not overlap. Sorting by start means you only need to compare neighbours.'],
      examples: [
        { input: 'double_booked([[9, 10], [13, 15], [9.5, 11]])', output: 'True' },
        { input: 'double_booked([[9, 10], [10, 11]])', output: 'False' },
      ],
      starter: `def double_booked(bookings):
    pass
`,
      solution: `def double_booked(bookings):
    b = sorted(bookings)
    for i in range(1, len(b)):
        if b[i][0] < b[i - 1][1]:
            return True
    return False
`,
      tests: [
        { call: 'double_booked([[9, 10], [13, 15], [9.5, 11]])', expected: 'True' },
        { call: 'double_booked([[9, 10], [10, 11]])', expected: 'False' },
        { call: 'double_booked([])', expected: 'False' },
        { call: 'double_booked([[1, 5]])', expected: 'False' },
        { call: 'double_booked([[5, 6], [1, 2], [2, 3], [3, 5.5]])', expected: 'True' },
        { call: 'double_booked([[i, i + 1] for i in range(50000, 0, -1)])', expected: 'False' },
      ],
      hints: ['Sorting turns an all-pairs check (O(n²)) into a neighbours check.', 'Sort by start time. If any booking starts before the previous one ends, they overlap.', 'b = sorted(bookings) → for i from 1: if b[i].start < b[i−1].end: return True → return False'],
      complexity: { time: 'O(n log n)', space: 'O(n)' },
    },
    {
      id: 'reading-speed',
      title: 'Slowest reading speed',
      difficulty: 'medium',
      pattern: 'Binary search on the answer',
      intro: [
        'pages[i] is the length of book i. At speed k pages/hour you spend ceil(pages[i] / k) whole hours on book i (you never start two books in the same hour).',
        'Return the smallest whole-number k that finishes every book within hours. hours ≥ len(pages).',
      ],
      examples: [
        { input: 'slowest_speed([3, 6, 7, 11], 8)', output: '4', why: '1 + 2 + 2 + 3 = 8 hours at speed 4. Speed 3 needs 10.' },
        { input: 'slowest_speed([30, 11, 23, 4, 20], 5)', output: '30' },
      ],
      starter: `def slowest_speed(pages, hours):
    pass
`,
      solution: `def slowest_speed(pages, hours):
    def hours_needed(k):
        return sum((p + k - 1) // k for p in pages)
    lo, hi = 1, max(pages)
    while lo < hi:
        mid = (lo + hi) // 2
        if hours_needed(mid) <= hours:
            hi = mid
        else:
            lo = mid + 1
    return lo
`,
      tests: [
        { call: 'slowest_speed([3, 6, 7, 11], 8)', expected: '4' },
        { call: 'slowest_speed([30, 11, 23, 4, 20], 5)', expected: '30' },
        { call: 'slowest_speed([30, 11, 23, 4, 20], 6)', expected: '23' },
        { call: 'slowest_speed([1], 1)', expected: '1' },
        { call: 'slowest_speed([10**9], 2)', expected: '5 * 10**8' },
        { call: 'slowest_speed([10**9] * 1000, 10**6)', expected: '10**6' },
      ],
      hints: [
        'Binary search on the answer: if speed k works, every faster speed works too.',
        'The answer is between 1 and max(pages). Write hours_needed(k) = sum of ceil(p / k). Binary search for the smallest k with hours_needed(k) ≤ hours.',
        'lo, hi = 1, max(pages) → while lo < hi: mid; if hours_needed(mid) <= hours: hi = mid else lo = mid + 1 → return lo',
      ],
      complexity: { time: 'O(n log m)', space: 'O(1)' },
    },
  ],

  extra: [
    { name: 'Binary Search', url: 'https://leetcode.com/problems/binary-search/', difficulty: 'easy' },
    { name: 'Search Insert Position', url: 'https://leetcode.com/problems/search-insert-position/', difficulty: 'easy' },
    { name: 'Merge Intervals', url: 'https://leetcode.com/problems/merge-intervals/', difficulty: 'medium' },
    { name: 'Sort Colors', url: 'https://leetcode.com/problems/sort-colors/', difficulty: 'medium' },
    { name: 'Koko Eating Bananas', url: 'https://leetcode.com/problems/koko-eating-bananas/', difficulty: 'medium' },
    { name: 'Find Minimum in Rotated Sorted Array', url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', difficulty: 'medium' },
  ],

  quiz: [
    { q: 'Binary search on 1,000,000 sorted items needs at most about…', options: ['1,000,000 checks', '1,000 checks', '20 checks', '1 check'], answer: 2, why: '2²⁰ ≈ 1,000,000, so about 20 halvings.' },
    { q: 'Which sort is O(n log n) even in the worst case?', options: ['Insertion sort', 'Quick sort', 'Merge sort', 'Bubble sort'], answer: 2, why: 'Merge sort always splits evenly. Quick sort can hit O(n²) with bad pivots.' },
    { q: 'What must be true before binary search works?', options: ['No duplicates', 'The data is sorted', 'The length is a power of 2', 'The data is in a linked list'], answer: 1, why: 'Throwing half away relies on order.' },
  ],
};

function str_sum(): string {
  let s = 0;
  for (let q = 0; q < 2000000; q += 997) s += q;
  return String(s);
}

export default topic;

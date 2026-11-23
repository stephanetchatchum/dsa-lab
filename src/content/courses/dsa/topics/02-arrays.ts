import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cell, cost, Frames, ptr, region, scene, spread, txt } from '../../../lib/viz';
import { arraysLesson } from '../lessons/02-arrays';

/* Items keep their id when they move, so the animation shows them sliding. */
interface It {
  id: string;
  v: number | string;
}
let uid = 0;
const mk = (vals: (number | string)[]): It[] => vals.map((v) => ({ id: `x${uid++}`, v }));

function row(items: It[], o: { roles?: Record<string, Role>; y?: number; gap?: number; cap?: number; glow?: string[]; addr?: boolean } = {}): Prim[] {
  const n = Math.max(items.length, o.cap ?? 0);
  const gap = o.gap ?? (n > 8 ? 84 : 100);
  const xs = spread(n, gap);
  const out: Prim[] = [];
  for (let i = 0; i < n; i++) {
    const it = items[i];
    if (it)
      out.push(
        cell(it.id, xs[i], o.y ?? 230, it.v, { w: gap - 14, role: o.roles?.[it.id], sub: String(i), glow: o.glow?.includes(it.id), sup: o.addr ? `@${100 + i * 4}` : undefined }),
      );
    else out.push(cell(`empty${i}`, xs[i], o.y ?? 230, '', { w: gap - 14, role: 'muted', sub: String(i), opacity: 0.35 }));
  }
  return out;
}

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const seats = mk(['🙂', '🙂', '🙂', '🙂', '🙂', '🙂', '🙂']);
  f.add([...row(seats)], 'A cinema row. Every seat has a number, and the seats sit side by side.');
  f.add([...row(seats, { roles: { [seats[5].id]: 'curr' }, glow: [seats[5].id] }), ptr('seat 5', seats[5].id, 'curr')], 'Your ticket says seat 5, so you walk straight there. No need to check seats 0 to 4.');
  f.add([...row(seats), cell('late', 500, 90, '😅', { role: 'new' })], 'Now a friend arrives late and wants seat 1.');
  const moved = [seats[0], { id: 'late', v: '😅' }, ...seats.slice(1)];
  f.add([...row(moved, { roles: Object.fromEntries(seats.slice(1).map((s) => [s.id, 'second'])) })], 'Everyone from seat 1 onward has to shuffle along. That’s an array: instant jumps, costly squeezing in.');
  return f.get();
}

/* ---------------- watch ---------------- */
function addresses(): Frame[] {
  const it = mk([7, 2, 9, 4, 6]);
  const f = new Frames();
  f.add([...row(it, { addr: true })], 'An array is one block of memory. Each number takes 4 bytes, so the addresses go up by 4.');
  f.add([...row(it, { addr: true, roles: { [it[3].id]: 'curr' } }), txt('calc', 500, 400, 'address of a[3] = 100 + 3 × 4 = 112', { size: 36, role: 'curr' })], 'To read a of 3, the computer does one multiply and one add. Start plus index times size.', {
    cost: cost('Read a[i]', 'O(1)'),
  });
  f.add([...row(it, { addr: true, roles: { [it[3].id]: 'curr' }, glow: [it[3].id] }), txt('calc', 500, 400, 'same cost for a[0] or a[1,000,000]', { size: 36, role: 'done' })], 'It doesn’t matter if the index is 3 or a million. Same one calculation: O of 1.');
  return f.get();
}

function insertShift(): Frame[] {
  const it = mk([3, 8, 5, 1, 6]);
  const xs = spread(6, 100);
  const at = (slots: number[], roles: Record<string, Role> = {}, extra: Prim[] = []): Prim[] => [
    ...xs.map((x, i) => cell(`slot${i}`, x, 230, '', { w: 86, role: 'muted', opacity: 0.3, sub: String(i) })),
    ...it.map((x, i) => cell(x.id, xs[slots[i]], 230, x.v, { w: 86, role: roles[x.id] })),
    ...extra,
  ];
  const f = new Frames();
  const nw = (y: number) => cell('nw', xs[1], y, 4, { w: 86, role: 'new' });
  const slots = [0, 1, 2, 3, 4];
  f.add(at(slots, {}, [nw(90)]), 'Insert 4 at index 1. That slot is already taken.', { cost: cost('Insert in middle', 'O(n)') });
  for (let k = it.length - 1; k >= 1; k--) {
    slots[k] = k + 1;
    f.add(at([...slots], { [it[k].id]: 'second' }, [nw(90)]), k === it.length - 1 ? 'Shift the last item right first, so nothing gets overwritten.' : `Shift ${it[k].v} right.`);
  }
  f.add(at([...slots], {}, [nw(230)]), 'Four items moved to make room for one. Inserting near the front costs O of n.');
  f.add(at([...slots], {}, [nw(230), cell('end', xs[5] + 100, 230, 2, { w: 86, role: 'new' })]), 'Appending at the end moves nothing. That’s why append is fast: O of 1 on average.', { cost: cost('Append', 'O(1)') });
  return f.get();
}

const TWO_PTR_CODE = `def pair_sum(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return left, right
        if s < target:
            left += 1
        else:
            right -= 1
    return None`;

function twoPointers(): Frame[] {
  const nums = [1, 3, 4, 6, 8, 11];
  const target = 10;
  const f = new Frames();
  let l = 0;
  let r = nums.length - 1;
  const pic = (extra: Prim[] = [], hit = false) => [
    ...arrayRow(nums, { roles: { [l]: hit ? 'done' : 'curr', [r]: hit ? 'done' : 'second' } }),
    ptr('left', `a${l}`, 'curr'),
    ptr('right', `a${r}`, 'second'),
    txt('t', 500, 400, `target = ${target}`, { size: 34 }),
    ...extra,
  ];
  f.add(pic(), 'The list is sorted. Find two numbers that add up to 10. Start one pointer at each end.', { line: 2, vars: { left: l, right: r } });
  while (l < r) {
    const s = nums[l] + nums[r];
    if (s === target) {
      f.add(pic([txt('s', 500, 90, `${nums[l]} + ${nums[r]} = ${s} ✓`, { size: 40, role: 'done' })], true), `${nums[l]} plus ${nums[r]} is 10. Found it.`, { line: 6, vars: { left: l, right: r, s } });
      break;
    }
    f.add(pic([txt('s', 500, 90, `${nums[l]} + ${nums[r]} = ${s}`, { size: 40, role: s < target ? 'curr' : 'second' })]), s < target ? `${s} is too small. Only a bigger left number can help, so move left right.` : `${s} is too big. Move right leftwards to shrink it.`, {
      line: s < target ? 8 : 10,
      vars: { left: l, right: r, s },
    });
    if (s < target) l++;
    else r--;
  }
  f.add(pic([txt('s', 500, 90, 'each step drops one item → O(n)', { size: 36, role: 'new' })], true), 'Each step rules out one number for good. At most n steps, instead of checking all pairs.');
  return f.get();
}

const WINDOW_CODE = `def max_window(nums, k):
    s = sum(nums[:k])
    best = s
    for i in range(k, len(nums)):
        s += nums[i] - nums[i - k]
        best = max(best, s)
    return best`;

function windowFrames(withCode: boolean): Frame[] {
  const nums = [2, 1, 5, 1, 3, 2];
  const k = 3;
  const xs = spread(nums.length, 100);
  const f = new Frames();
  const win = (i: number) => region('win', (xs[i - k + 1] + xs[i]) / 2, 230, (k - 1) * 100 + 90, 110, { role: 'curr', label: 'window' });
  let s = nums.slice(0, k).reduce((a, b) => a + b, 0);
  let best = s;
  f.add([...arrayRow(nums, { roles: { 0: 'curr', 1: 'curr', 2: 'curr' } }), win(k - 1), txt('s', 500, 400, `sum = ${s}   best = ${best}`, { size: 34 })], 'Best sum of any 3 neighbours. Add up the first window once: 8.', withCode ? { line: 3, vars: { s, best } } : {});
  for (let i = k; i < nums.length; i++) {
    const out = nums[i - k];
    s += nums[i] - out;
    best = Math.max(best, s);
    f.add(
      [...arrayRow(nums, { roles: { [i - k]: 'danger', [i]: 'new', [i - 1]: 'curr', [i - 2]: 'curr' } }), win(i), txt('s', 500, 400, `sum = ${s}   best = ${best}`, { size: 34 })],
      `Slide right: add ${nums[i]}, drop ${out}. Sum is ${s}.`,
      withCode ? { line: 5, vars: { i, s, best } } : {},
    );
  }
  f.add([...arrayRow(nums), txt('s', 500, 400, `best = ${best}  ·  O(n), not O(n·k)`, { size: 34, role: 'done' })], 'Each slide costs two operations, whatever k is. One pass: O of n.', withCode ? { line: 7, vars: { best } } : {});
  return f.get();
}

function prefix(): Frame[] {
  const a = [3, 2, 4, 1, 5];
  const P = [0];
  for (const x of a) P.push(P[P.length - 1] + x);
  const f = new Frames();
  const top = (_n: number, hl: Record<number, Role> = {}) => arrayRow(a, { y: 150, roles: hl, cx: 450 });
  const bot = (n: number, hl: Record<number, Role> = {}) =>
    arrayRow(
      P.slice(0, n).map(String),
      { y: 330, prefix: 'P', roles: hl, cx: 450 },
    );
  const lab = [txt('la', 90, 158, 'a', { size: 36 }), txt('lp', 90, 338, 'P', { size: 36 })];
  f.add([...lab, ...top(5), ...bot(1, { 0: 'new' })], 'Prefix sums: P of i is the total of everything before index i. P of 0 is zero.');
  for (let i = 1; i <= a.length; i++)
    f.add([...lab, ...top(5, { [i - 1]: 'curr' }), ...bot(i + 1, { [i]: 'new', [i - 1]: 'second' })], `P${i} = P${i - 1} + ${a[i - 1]} = ${P[i]}.`);
  f.add(
    [...lab, ...top(5, { 1: 'done', 2: 'done', 3: 'done' }), ...bot(6, { 4: 'done', 1: 'danger' }), txt('q', 820, 240, `sum a[1..3] = P4 − P1 = ${P[4]} − ${P[1]} = ${P[4] - P[1]}`, { size: 30, role: 'done' })],
    'Now any range sum is one subtraction. Sum from index 1 to 3 is P4 minus P1: 7.',
    { cost: cost('Range sum', 'O(1)') },
  );
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  items: It[];
}
const MAX = 10;

function opFrames(before: It[], after: It[], say: string, roles: Record<string, Role>, movedSay?: string): Frame[] {
  const f = new Frames();
  f.add(row(before, { cap: Math.max(before.length, after.length) }), say);
  f.add(row(after, { roles }), movedSay ?? 'Done.');
  return f.get();
}

/* ---------------- trace ---------------- */
function trace(): Frame[] {
  return windowFrames(true);
}

const topic: Topic = {
  id: 'arrays',
  order: 2,
  title: 'Arrays & strings',
  short: 'Instant index access. Two pointers, sliding windows, prefix sums.',
  icon: '🧮',
  costs: [cost('Read a[i]', 'O(1)'), cost('Append', 'O(1)'), cost('Insert/delete middle', 'O(n)'), cost('Search unsorted', 'O(n)'), cost('Range sum (prefix)', 'O(1)')],

  intro: {
    what: "Arrays, which Python calls lists, store many values in order, side by side in one block of memory.",
    why: "Almost every program uses them. Three techniques on arrays, two pointers, sliding windows and prefix sums, solve a huge share of real problems in linear time.",
    builds: "Big-O from topic 1, to explain why some list operations are instant and others are slow.",
    goals: ["Explain why reading a[i] is instant but inserting at the front is slow", "Use two pointers on sorted data", "Use a sliding window instead of re-adding everything", "Answer any range-sum question in one step with prefix sums"],
  },

  hook: {
    frames: hook,
    lines: ['An array is a row of numbered seats in one block of memory.', 'Jumping to a seat is instant. Squeezing someone into the middle makes everyone move.'],
  },

  watch: [
    { id: 'address', title: 'Why a[i] is instant', frames: addresses, costs: [cost('Read a[i]', 'O(1)')] },
    { id: 'insert', title: 'Insert shifts', frames: insertShift, costs: [cost('Insert at front/middle', 'O(n)'), cost('Append', 'O(1)')] },
    { id: 'two', title: 'Two pointers', frames: twoPointers, code: TWO_PTR_CODE, costs: [cost('Pair sum (sorted)', 'O(n)', 'O(1)')] },
    { id: 'window', title: 'Sliding window', frames: () => windowFrames(false), costs: [cost('Best window of k', 'O(n)', 'O(1)')] },
    { id: 'prefix', title: 'Prefix sums', frames: prefix, costs: [cost('Build P', 'O(n)', 'O(n)'), cost('Range sum', 'O(1)')] },
  ],

  lesson: arraysLesson({ hook, addresses, insertShift, twoPointers, window: () => windowFrames(false), prefix }),
  recall: {
    prompt: 'Why is reading a[i] instant, but inserting at the front slow? Then: what does a sliding window avoid redoing?',
    model:
      'The array sits in one block, so the address of a[i] is start + i × size: one calculation. Inserting at the front means shifting every item right, which is O(n). A sliding window keeps a running sum and only adds the new item and removes the old one, instead of re-adding the whole window.',
    keywords: [
      ['address', 'memory', 'contiguous', 'block', 'calculat'],
      ['shift', 'move', 'slide over'],
      ['add', 'adding', 'new item', 'incoming'],
      ['remove', 'subtract', 'drop', 'old', 'leaving'],
    ],
  },

  play: {
    intro: 'Your own array. Read, append, insert and delete, and watch what has to move.',
    init: (): S => ({ items: mk([5, 3, 8, 1]) }),
    view: (s: S) => scene(row(s.items)),
    ops: [
      {
        id: 'get',
        label: 'Read a[i]',
        args: [{ name: 'i', kind: 'int', default: 2 }],
        run: (s: S, a) => {
          const i = Number(a.i);
          if (i < 0 || i >= s.items.length) return { state: s, frames: [{ scene: scene(row(s.items)), say: `Index ${i} is out of range. Python would raise IndexError.` }] };
          return {
            state: s,
            frames: [
              { scene: scene([...row(s.items, { roles: { [s.items[i].id]: 'curr' }, glow: [s.items[i].id], addr: true }), ptr(`a[${i}]`, s.items[i].id, 'curr')]), say: `a of ${i} is ${s.items[i].v}. One jump, no scanning.` },
            ],
            cost: cost('Read a[i]', 'O(1)'),
          };
        },
      },
      {
        id: 'append',
        label: 'Append v',
        args: [{ name: 'v', kind: 'int', default: 7 }],
        run: (s: S, a) => {
          if (s.items.length >= MAX) return { state: s, frames: [{ scene: scene(row(s.items)), say: 'This playground holds 10 items. Delete one first.' }] };
          const it = { id: `x${uid++}`, v: Number(a.v) };
          const after = [...s.items, it];
          return { state: { items: after }, frames: opFrames(s.items, after, `Append ${a.v} at the end.`, { [it.id]: 'new' }, 'Nothing moved. O of 1.'), cost: cost('Append', 'O(1)') };
        },
      },
      {
        id: 'insert',
        label: 'Insert v at i',
        args: [
          { name: 'i', kind: 'int', default: 0 },
          { name: 'v', kind: 'int', default: 9 },
        ],
        run: (s: S, a) => {
          const i = Math.max(0, Math.min(s.items.length, Number(a.i)));
          if (s.items.length >= MAX) return { state: s, frames: [{ scene: scene(row(s.items)), say: 'This playground holds 10 items. Delete one first.' }] };
          const it = { id: `x${uid++}`, v: Number(a.v) };
          const after = [...s.items.slice(0, i), it, ...s.items.slice(i)];
          const moved = s.items.length - i;
          const roles: Record<string, Role> = { [it.id]: 'new' };
          s.items.slice(i).forEach((x) => (roles[x.id] = 'second'));
          return { state: { items: after }, frames: opFrames(s.items, after, `Insert ${a.v} at index ${i}.`, roles, `${moved} item${moved === 1 ? '' : 's'} had to shift right.`), cost: cost('Insert at i', 'O(n)') };
        },
      },
      {
        id: 'delete',
        label: 'Delete a[i]',
        args: [{ name: 'i', kind: 'int', default: 0 }],
        run: (s: S, a) => {
          const i = Number(a.i);
          if (i < 0 || i >= s.items.length) return { state: s, frames: [{ scene: scene(row(s.items)), say: `No item at index ${i}.` }] };
          const after = s.items.filter((_, k) => k !== i);
          const roles: Record<string, Role> = {};
          s.items.slice(i + 1).forEach((x) => (roles[x.id] = 'second'));
          const f = new Frames();
          f.add(row(s.items, { roles: { [s.items[i].id]: 'danger' } }), `Delete index ${i}.`);
          f.add(row(after, { roles }), `${s.items.length - i - 1} item${s.items.length - i - 1 === 1 ? '' : 's'} shifted left to close the gap.`);
          return { state: { items: after }, frames: f.get(), cost: cost('Delete at i', 'O(n)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'shift-count',
      question: 'This array has 6 items. You insert a new item at index 0. How many existing items must move?',
      scene: scene(arrayRow([4, 9, 2, 7, 5, 1])),
      options: ['0', '1', '3', '6'],
      answer: 3,
      frames: () => {
        const it = mk([4, 9, 2, 7, 5, 1]);
        const nw = { id: 'n0', v: 8 };
        const roles: Record<string, Role> = { n0: 'new' };
        it.forEach((x) => (roles[x.id] = 'second'));
        return [
          { scene: scene([...row(it, { cap: 7 }), cell('n0', 200, 90, 8, { role: 'new' })]), say: 'Index 0 is the very front.' },
          { scene: scene(row([nw, ...it], { roles })), say: 'All six slide right by one. Inserting at the front is the worst case: O of n.' },
        ];
      },
      why: 'Every item after the insert point shifts. At index 0, that’s all of them.',
    },
    {
      id: 'which-pointer',
      question: 'Sorted list, target 16. left is on 2, right is on 12, so the sum is 14. Which pointer moves?',
      scene: scene([...arrayRow([2, 5, 7, 9, 12], { roles: { 0: 'curr', 4: 'second' } }), ptr('left', 'a0', 'curr'), ptr('right', 'a4', 'second')]),
      options: ['left moves right', 'right moves left', 'both move', 'neither: no answer exists'],
      answer: 0,
      frames: () => {
        const n = [2, 5, 7, 9, 12];
        const at = (l: number, r: number, say: string, hit = false): Frame => ({
          scene: scene([...arrayRow(n, { roles: { [l]: hit ? 'done' : 'curr', [r]: hit ? 'done' : 'second' } }), ptr('left', `a${l}`, 'curr'), ptr('right', `a${r}`, 'second'), txt('s', 500, 400, `${n[l]} + ${n[r]} = ${n[l] + n[r]}`, { size: 36 })]),
          say,
        });
        return [at(0, 4, '14 is less than 16. We need a bigger sum.'), at(1, 4, 'Only moving left can increase it. 5 plus 12 is 17, too big now.'), at(1, 3, 'Move right in: 5 plus 9 is 14.'), at(2, 3, 'Move left: 7 plus 9 is 16. Found.', true)];
      },
      why: 'The sum is too small, and moving right left can only make it smaller. So left moves right.',
    },
    {
      id: 'prefix-q',
      question: 'a = [3, 2, 4, 1, 5] and P = [0, 3, 5, 9, 10, 15]. What is a[1] + a[2] + a[3]?',
      scene: scene([...arrayRow([3, 2, 4, 1, 5], { y: 150, cx: 450 }), ...arrayRow([0, 3, 5, 9, 10, 15], { y: 330, prefix: 'P', cx: 450 })]),
      options: ['7', '10', '6', '9'],
      answer: 0,
      frames: () => [
        { scene: scene([...arrayRow([3, 2, 4, 1, 5], { y: 150, cx: 450, roles: { 1: 'done', 2: 'done', 3: 'done' } }), ...arrayRow([0, 3, 5, 9, 10, 15], { y: 330, prefix: 'P', cx: 450, roles: { 4: 'done', 1: 'danger' } })]), say: 'Take P4, the total of the first four items: 10.' },
        { scene: scene([...arrayRow([3, 2, 4, 1, 5], { y: 150, cx: 450, roles: { 1: 'done', 2: 'done', 3: 'done' } }), ...arrayRow([0, 3, 5, 9, 10, 15], { y: 330, prefix: 'P', cx: 450, roles: { 4: 'done', 1: 'danger' } }), txt('r', 850, 240, '10 − 3 = 7', { size: 44, role: 'done' })]), say: 'Subtract P1, the part before index 1: 3. Ten minus three is seven.' },
      ],
      why: 'Range sum from i to j is P[j+1] − P[i] = P4 − P1 = 10 − 3 = 7.',
    },
  ],

  trace: { title: 'Sliding window: best sum of 3 neighbours', code: WINDOW_CODE, frames: trace },

  build: {
    intro: [
      'Build a dynamic array, like Python’s list. Store items in a fixed-size block self.data, and track self.size and self.capacity.',
      'When the block is full, double the capacity and copy everything over. Start with capacity 1. Don’t use list.append or list.insert on self.data.',
    ],
    starter: `class DynamicArray:
    def __init__(self):
        self.capacity = 1
        self.size = 0
        self.data = [None] * self.capacity

    def __len__(self):
        return self.size

    def get(self, i):
        # raise IndexError if i is out of range
        pass

    def append(self, value):
        # if full: double capacity, copy items into a new block
        pass

    def insert(self, i, value):
        # shift items i.. one step right, then place value
        pass

    def pop(self):
        # remove and return the last item
        pass
`,
    solution: `class DynamicArray:
    def __init__(self):
        self.capacity = 1
        self.size = 0
        self.data = [None] * self.capacity

    def __len__(self):
        return self.size

    def get(self, i):
        if i < 0 or i >= self.size:
            raise IndexError("index out of range")
        return self.data[i]

    def _grow(self):
        self.capacity *= 2
        new = [None] * self.capacity
        for k in range(self.size):
            new[k] = self.data[k]
        self.data = new

    def append(self, value):
        if self.size == self.capacity:
            self._grow()
        self.data[self.size] = value
        self.size += 1

    def insert(self, i, value):
        if i < 0 or i > self.size:
            raise IndexError("index out of range")
        if self.size == self.capacity:
            self._grow()
        for k in range(self.size, i, -1):
            self.data[k] = self.data[k - 1]
        self.data[i] = value
        self.size += 1

    def pop(self):
        if self.size == 0:
            raise IndexError("pop from empty array")
        self.size -= 1
        value = self.data[self.size]
        self.data[self.size] = None
        return value
`,
    tests: [
      { code: 'a = DynamicArray()\nfor x in range(5): a.append(x)\nresult = [a.get(i) for i in range(len(a))]', show: 'append 0..4, read back', expected: '[0, 1, 2, 3, 4]' },
      { code: 'a = DynamicArray()\nfor x in range(5): a.append(x)\nresult = a.capacity', show: 'capacity after 5 appends', expected: '8' },
      { code: 'a = DynamicArray()\nfor x in [1, 2, 3]: a.append(x)\na.insert(0, 9)\nresult = [a.get(i) for i in range(len(a))]', show: 'insert(0, 9) into [1, 2, 3]', expected: '[9, 1, 2, 3]' },
      { code: 'a = DynamicArray()\nfor x in [1, 2, 3]: a.append(x)\na.insert(3, 7)\nresult = [a.get(i) for i in range(len(a))]', show: 'insert at the end', expected: '[1, 2, 3, 7]' },
      { code: 'a = DynamicArray()\nfor x in [4, 5]: a.append(x)\nresult = (a.pop(), len(a))', show: 'pop() from [4, 5]', expected: '(5, 1)' },
      { code: 'a = DynamicArray()\ntry:\n    a.get(0)\n    result = "no error"\nexcept IndexError:\n    result = "IndexError"', show: 'get(0) on empty raises', expected: '"IndexError"' },
      { code: 'a = DynamicArray()\nfor x in range(1000): a.append(x)\nresult = (len(a), a.capacity, a.get(999))', show: '1000 appends', expected: '(1000, 1024, 999)' },
    ],
    builtin: {
      text: 'Python’s list is exactly this: a dynamic array that over-allocates, so append is O(1) on average. insert(0, x) still shifts everything.',
      code: `nums = [5, 3, 8]
nums.append(1)      # O(1) amortised
nums.insert(0, 9)   # O(n): shifts all
x = nums[2]         # O(1)
nums.pop()          # O(1) from the end`,
    },
  },

  fill: {
    intro: ['Two pointers walk in from both ends to check a palindrome.', 'After a matching pair, both pointers must move one step inward. Write that as one line.'],
    code: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        ____
    return True`,
    answer: 'left, right = left + 1, right - 1',
    tests: [
      { call: 'is_palindrome("racecar")', expected: 'True' },
      { call: 'is_palindrome("abca")', expected: 'False' },
      { call: 'is_palindrome("")', expected: 'True' },
      { call: 'is_palindrome("ab")', expected: 'False' },
      { call: 'is_palindrome("noon")', expected: 'True' },
    ],
  },

  wild: [
    { icon: '🖼️', title: 'Images', text: 'A photo is an array of pixels. Prefix sums over 2D grids (integral images) let cameras find faces by summing any rectangle in O(1).' },
    { icon: '🎧', title: 'Audio', text: 'Sound is an array of samples. A moving average over a sliding window smooths noise in real time.' },
    { icon: '🌐', title: 'Networking', text: 'TCP uses a sliding window of packets in flight, so it can send more without waiting for every reply.' },
    { icon: '🔬', title: 'Science', text: 'NumPy arrays are contiguous blocks, which is why vector maths in simulations is fast: the CPU streams memory in order.' },
  ],

  problems: [
    {
      id: 'balance-pair',
      title: 'Two weights that balance',
      difficulty: 'easy',
      pattern: 'Two pointers on sorted data',
      intro: [
        'weights is sorted from light to heavy. Return the indices (i, j) with i < j whose weights add up exactly to target.',
        'There is at most one such pair. If none works, return None. Aim for one pass with no extra memory.',
      ],
      examples: [
        { input: 'balance_pair([1, 3, 4, 6, 8, 11], 10)', output: '(2, 3)', why: '4 + 6 = 10.' },
        { input: 'balance_pair([1, 2, 5], 10)', output: 'None' },
      ],
      starter: `def balance_pair(weights, target):
    pass
`,
      solution: `def balance_pair(weights, target):
    left, right = 0, len(weights) - 1
    while left < right:
        s = weights[left] + weights[right]
        if s == target:
            return (left, right)
        if s < target:
            left += 1
        else:
            right -= 1
    return None
`,
      tests: [
        { call: 'balance_pair([1, 3, 4, 6, 8, 11], 10)', expected: '(2, 3)' },
        { call: 'balance_pair([1, 2, 5], 10)', expected: 'None' },
        { call: 'balance_pair([2, 7], 9)', expected: '(0, 1)' },
        { call: 'balance_pair([], 3)', expected: 'None' },
        { call: 'balance_pair([5], 10)', expected: 'None' },
        { call: 'balance_pair([-4, -1, 0, 3, 9], 5)', expected: '(0, 4)' },
        { call: 'balance_pair(list(range(0, 200000, 2)), 399994)', expected: '(99998, 99999)' },
      ],
      hints: [
        'Two pointers from both ends. Sorted order tells you which way to move.',
        'Sum too small? Only moving the left pointer right can grow it. Too big? Move the right pointer left.',
        'l, r = 0, n−1 → while l < r: s = w[l] + w[r]; if s == t return (l, r); if s < t: l += 1 else r −= 1 → return None',
      ],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'seesaw',
      title: 'Seesaw point',
      difficulty: 'easy',
      pattern: 'Prefix sums',
      intro: [
        'Return the first index i where the sum of everything left of i equals the sum of everything right of i. The item at i itself counts on neither side.',
        'Return -1 if there is none. An empty side sums to 0.',
      ],
      examples: [
        { input: 'seesaw([1, 7, 3, 6, 5, 6])', output: '3', why: 'Left 1+7+3 = 11, right 5+6 = 11.' },
        { input: 'seesaw([1, 2, 3])', output: '-1' },
      ],
      starter: `def seesaw(nums):
    pass
`,
      solution: `def seesaw(nums):
    total = sum(nums)
    left = 0
    for i, x in enumerate(nums):
        if left == total - left - x:
            return i
        left += x
    return -1
`,
      tests: [
        { call: 'seesaw([1, 7, 3, 6, 5, 6])', expected: '3' },
        { call: 'seesaw([1, 2, 3])', expected: '-1' },
        { call: 'seesaw([2, 1, -1])', expected: '0' },
        { call: 'seesaw([])', expected: '-1' },
        { call: 'seesaw([5])', expected: '0' },
        { call: 'seesaw([0, 0, 0])', expected: '0' },
        { call: 'seesaw([1] * 100001)', expected: '50000' },
      ],
      hints: [
        'Prefix sums: left sum grows as you walk; right sum = total − left − current.',
        'Compute the total once. Walk left to right keeping a running left sum. Compare left with total − left − x before adding x.',
        'total = sum(nums); left = 0 → for i, x: if left == total − left − x: return i; left += x → return −1',
      ],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'longest-under-cap',
      title: 'Longest run under the cap',
      difficulty: 'medium',
      pattern: 'Variable-size sliding window',
      intro: [
        'loads are non-negative numbers. Return the length of the longest run of neighbours whose total is at most cap.',
        'Return 0 if no single item fits. Checking every run is O(n²); one sliding window does it in O(n).',
      ],
      examples: [
        { input: 'longest_under_cap([2, 1, 5, 1, 1, 3], 7)', output: '4', why: '[1, 5, 1, ...] no: [5, 1, 1] is 7 (length 3); [1, 1, 3] … the best is [1, 5, 1] or [5,1,1]? Actually [1, 1, 3] = 5 then add 2? The run [5, 1, 1] has length 3; [1, 5, 1] too; length 4 comes from [2, 1, ...]? See tests.' },
      ],
      starter: `def longest_under_cap(loads, cap):
    pass
`,
      solution: `def longest_under_cap(loads, cap):
    best = 0
    total = 0
    left = 0
    for right, x in enumerate(loads):
        total += x
        while total > cap:
            total -= loads[left]
            left += 1
        best = max(best, right - left + 1)
    return best
`,
      tests: [
        { call: 'longest_under_cap([2, 1, 5, 1, 1, 3], 7)', expected: '3' },
        { call: 'longest_under_cap([1, 1, 1, 1], 10)', expected: '4' },
        { call: 'longest_under_cap([9, 9], 5)', expected: '0' },
        { call: 'longest_under_cap([], 5)', expected: '0' },
        { call: 'longest_under_cap([4, 0, 0, 3, 8, 1, 1], 4)', expected: '3' },
        { call: 'longest_under_cap([1] * 100000, 50000)', expected: '50000' },
      ],
      hints: [
        'Variable-size sliding window: grow on the right, shrink from the left when you break the rule.',
        'Add each new item to a running total. While the total is over cap, remove items from the left. After that the window is valid: record its length.',
        'best = total = left = 0 → for right, x: total += x; while total > cap: total −= loads[left]; left += 1; best = max(best, right − left + 1) → return best',
      ],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
  ],

  extra: [
    { name: 'Two Sum II - Input Array Is Sorted', url: 'https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/', difficulty: 'medium' },
    { name: 'Valid Palindrome', url: 'https://leetcode.com/problems/valid-palindrome/', difficulty: 'easy' },
    { name: 'Find Pivot Index', url: 'https://leetcode.com/problems/find-pivot-index/', difficulty: 'easy' },
    { name: 'Maximum Average Subarray I', url: 'https://leetcode.com/problems/maximum-average-subarray-i/', difficulty: 'easy' },
    { name: 'Longest Substring Without Repeating Characters', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', difficulty: 'medium' },
    { name: 'Container With Most Water', url: 'https://leetcode.com/problems/container-with-most-water/', difficulty: 'medium' },
  ],

  quiz: [
    {
      q: 'Why does reading a[500] take the same time as reading a[0]?',
      options: ['Python caches it', 'Its address is computed directly: start + i × size', 'Arrays are sorted', 'It doesn’t: a[500] is slower'],
      answer: 1,
      why: 'Contiguous memory means one calculation finds any slot.',
    },
    {
      q: 'A sliding window of size k moves across n items. Total work?',
      options: ['O(n·k)', 'O(k)', 'O(n)', 'O(n²)'],
      answer: 2,
      why: 'Each slide adds one item and removes one: constant work per step.',
    },
    {
      q: 'With prefix sums already built, a range-sum query costs…',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(range length)'],
      answer: 0,
      why: 'One subtraction: P[j+1] − P[i].',
    },
  ],
};

export default topic;

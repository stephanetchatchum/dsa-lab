import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cell, cost, Frames, ptr, region, scene, spread, txt } from '../../../lib/viz';

interface It {
  id: string;
  v: string | number;
}
let uid = 0;
const it = (v: string | number): It => ({ id: `s${uid++}`, v });

/** Vertical stack, bottom at y=390. */
function stackPrims(items: It[], o: { x?: number; roles?: Record<string, Role>; label?: string; glow?: string[] } = {}): Prim[] {
  const x = o.x ?? 300;
  const out: Prim[] = [region('jar', x, 390 - 4 * 34, 150, 8 * 34 + 40, { role: 'muted', label: o.label ?? 'stack', dashed: true })];
  items.forEach((e, i) => out.push(cell(e.id, x, 360 - i * 62, e.v, { w: 110, h: 54, role: o.roles?.[e.id], glow: o.glow?.includes(e.id) })));
  if (items.length) out.push(ptr('top', items[items.length - 1].id, 'curr', { id: `top${x}` }));
  return out;
}

/** Horizontal queue: front on the left. */
function queuePrims(items: It[], o: { cx?: number; y?: number; roles?: Record<string, Role>; gap?: number } = {}): Prim[] {
  const gap = o.gap ?? 100;
  const xs = spread(Math.max(items.length, 1), gap, o.cx ?? 500);
  const y = o.y ?? 230;
  const out: Prim[] = [];
  items.forEach((e, i) => out.push(cell(e.id, xs[i], y, e.v, { w: gap - 14, role: o.roles?.[e.id] })));
  if (items.length) {
    out.push(ptr('front', items[0].id, 'head', { id: 'qf' }));
    out.push(ptr('back', items[items.length - 1].id, 'new', { id: 'qb', side: 'bottom' }));
  }
  return out;
}

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const plates = [it('🍽️'), it('🍽️'), it('🍽️')];
  const people = [it('🧑'), it('👩'), it('🧔')];
  f.add([...stackPrims(plates, { x: 230, label: 'plates' }), ...queuePrims(people, { cx: 680, gap: 110 }), txt('l', 680, 120, 'coffee line', { size: 32 })], 'Two everyday rules for who goes next.');
  const p4 = it('🍽️');
  f.add([...stackPrims([...plates, p4], { x: 230, label: 'plates', roles: { [p4.id]: 'new' } }), ...queuePrims(people, { cx: 680, gap: 110 }), txt('l', 680, 120, 'coffee line', { size: 32 })], 'A clean plate goes on top of the pile…');
  f.add([...stackPrims(plates, { x: 230, label: 'plates' }), ...queuePrims(people, { cx: 680, gap: 110 }), txt('l', 680, 120, 'coffee line', { size: 32 }), txt('r', 230, 60, 'last in, first out', { size: 30, role: 'curr' })], '…and the next plate you take is that same top one. Last in, first out. That’s a stack.');
  f.add([...stackPrims(plates, { x: 230, label: 'plates' }), ...queuePrims(people.slice(1), { cx: 680, gap: 110 }), txt('l', 680, 120, 'coffee line', { size: 32 }), txt('r', 680, 60, 'first in, first out', { size: 30, role: 'head' })], 'In a coffee line, the person who arrived first is served first. First in, first out. That’s a queue.');
  return f.get();
}

/* ---------------- watch ---------------- */
function stackClip(): Frame[] {
  const f = new Frames();
  const s: It[] = [];
  f.add(stackPrims(s), 'An empty stack. You can only touch the top.');
  for (const v of [3, 7, 1]) {
    const e = it(v);
    s.push(e);
    f.add(stackPrims([...s], { roles: { [e.id]: 'new' } }), `push ${v}: it becomes the new top.`, { cost: cost('push', 'O(1)') });
  }
  const top = s[s.length - 1];
  f.add(stackPrims([...s], { roles: { [top.id]: 'danger' } }), 'pop takes the top: 1, the last thing pushed.', { cost: cost('pop', 'O(1)') });
  s.pop();
  f.add(stackPrims([...s]), 'Now 7 is on top. Python’s list does this with append and pop: both O of 1.');
  return f.get();
}

function queueClip(): Frame[] {
  const f = new Frames();
  const q: It[] = [];
  f.add([txt('e', 500, 230, '(empty queue)', { size: 32 })], 'An empty queue. Items join at the back and leave from the front.');
  for (const v of ['a', 'b', 'c']) {
    const e = it(v);
    q.push(e);
    f.add(queuePrims([...q], { roles: { [e.id]: 'new' } }), `enqueue ${v} at the back.`, { cost: cost('enqueue', 'O(1)') });
  }
  f.add(queuePrims([...q], { roles: { [q[0].id]: 'danger' } }), 'dequeue removes from the front: a, the first one in.', { cost: cost('dequeue', 'O(1)') });
  q.shift();
  f.add(queuePrims([...q]), 'Use collections.deque in Python. A plain list’s pop(0) shifts everything: O of n.');
  return f.get();
}

const BRACKET_CODE = `def is_valid(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack`;

function bracketFrames(s: string, withLines = true): Frame[] {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const f = new Frames();
  const st: It[] = [];
  const top = (i: number, role: Role) => arrayRow([...s], { y: 90, cx: 650, gap: 76, roles: i >= 0 ? { [i]: role } : {} });
  const L = (n: number) => (withLines ? { line: n } : {});
  f.add([...top(-1, 'curr'), ...stackPrims([], { x: 220 })], `Check ${s}. Openers go on the stack; each closer must match the top.`, { ...L(3), vars: { stack: '[]' } });
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const show = () => `[${st.map((x) => x.v).join(', ')}]`;
    if ('([{'.includes(ch)) {
      const e = it(ch);
      st.push(e);
      f.add([...top(i, 'curr'), ...stackPrims([...st], { x: 220, roles: { [e.id]: 'new' } })], `${ch} opens. Push it.`, { ...L(6), vars: { ch, stack: show() } });
    } else {
      const t = st[st.length - 1];
      if (!t || t.v !== pairs[ch]) {
        f.add([...top(i, 'danger'), ...stackPrims([...st], { x: 220, roles: t ? { [t.id]: 'danger' } : {} })], t ? `${ch} closes, but the top is ${t.v}. Mismatch: not valid.` : `${ch} closes, but the stack is empty. Not valid.`, { ...L(8), vars: { ch, stack: show() } });
        return f.get();
      }
      f.add([...top(i, 'done'), ...stackPrims([...st], { x: 220, roles: { [t.id]: 'done' } })], `${ch} matches the top ${t.v}. Pop it.`, { ...L(7), vars: { ch, stack: show() } });
      st.pop();
    }
  }
  f.add([...top(-1, 'done'), ...stackPrims([...st], { x: 220 })], st.length ? 'Leftover openers never closed. Not valid.' : 'Stack is empty at the end: every opener was closed in order. Valid.', { ...L(9), vars: { stack: `[${st.map((x) => x.v).join(', ')}]` } });
  return f.get();
}

function monotonic(): Frame[] {
  const nums = [2, 1, 5, 3, 6];
  const res: (number | string)[] = nums.map(() => '?');
  const f = new Frames();
  const st: number[] = [];
  const pic = (i: number, hl: Record<number, Role> = {}): Prim[] => [
    ...arrayRow(nums, { y: 100, cx: 620, roles: hl }),
    ...arrayRow(res, { y: 260, cx: 620, prefix: 'r', idx: false, roles: Object.fromEntries(res.map((v, k) => [k, v === '?' ? 'muted' : 'done'])) }),
    txt('lr', 330, 268, 'next bigger →', { size: 26, anchor: 'end' }),
    ...stackPrims(
      st.map((k) => ({ id: `ms${k}`, v: nums[k] })),
      { x: 130, label: 'waiting' },
    ),
    ...(i >= 0 ? [ptr('i', `a${i}`, 'curr', { id: 'pi' })] : []),
  ];
  f.add(pic(-1), 'For each number, find the next bigger number to its right. The stack holds numbers still waiting for an answer.');
  for (let i = 0; i < nums.length; i++) {
    while (st.length && nums[st[st.length - 1]] < nums[i]) {
      const k = st.pop()!;
      res[k] = nums[i];
      f.add(pic(i, { [i]: 'curr', [k]: 'done' }), `${nums[i]} is bigger than ${nums[k]}, which was waiting. Pop it: its answer is ${nums[i]}.`);
    }
    st.push(i);
    f.add(pic(i, { [i]: 'curr' }), `${nums[i]} starts waiting on the stack.`);
  }
  st.forEach((k) => (res[k] = -1));
  st.length = 0;
  f.add(pic(-1), 'Whatever is left never found a bigger number: -1. Each item is pushed and popped once, so it’s O of n.');
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  st: It[];
  q: It[];
}
const both = (s: S, sr: Record<string, Role> = {}, qr: Record<string, Role> = {}) => [
  ...stackPrims(s.st, { x: 180, roles: sr }),
  ...(s.q.length ? queuePrims(s.q, { cx: 640, roles: qr, gap: 90 }) : [txt('qe', 640, 230, '(empty queue)', { size: 30 })]),
  txt('ql', 640, 380, 'queue: front ← … ← back', { size: 26, role: 'muted' }),
];

const topic: Topic = {
  id: 'stacks-queues',
  order: 4,
  title: 'Stacks & queues',
  short: 'Last in, first out vs first in, first out.',
  icon: '🥞',
  costs: [cost('push / pop (stack)', 'O(1)'), cost('enqueue / dequeue (deque)', 'O(1)'), cost('peek at top/front', 'O(1)'), cost('search inside', 'O(n)')],

  intro: {
    what: "Stacks and queues are lists with one rule about which item comes out next: the newest, or the oldest.",
    why: "Those two rules run the undo button, the function call stack, printers and servers, and breadth-first search.",
    builds: "Arrays from topic 2: both are usually built on top of arrays.",
    goals: ["Explain last-in-first-out and first-in-first-out", "Match brackets with a stack", "Know why a list is a bad queue in Python, and what to use instead", "Use the monotonic-stack trick"],
  },

  hook: { frames: hook, lines: ['A stack is a pile of plates: the last one on is the first one off.', 'A queue is a line at a café: the first to arrive is the first served.'] },

  watch: [
    { id: 'stack', title: 'Stack', frames: stackClip, costs: [cost('push', 'O(1)'), cost('pop', 'O(1)')] },
    { id: 'queue', title: 'Queue', frames: queueClip, costs: [cost('enqueue', 'O(1)'), cost('dequeue (deque)', 'O(1)'), cost('list.pop(0)', 'O(n)')] },
    { id: 'brackets', title: 'Matching brackets', frames: () => bracketFrames('{[()]}', false), code: BRACKET_CODE, costs: [cost('check n chars', 'O(n)', 'O(n)')] },
    { id: 'mono', title: 'Monotonic stack', frames: monotonic, costs: [cost('next bigger for all', 'O(n)', 'O(n)')] },
  ],

  recall: {
    prompt: 'What’s the difference between a stack and a queue? Give one real use of each.',
    model:
      'A stack is last in, first out: you push and pop at the same end, like plates. Undo and matching brackets use a stack. A queue is first in, first out: you add at the back and remove from the front, like a line. Print jobs and breadth-first search use a queue. Both do their main operations in O(1).',
    keywords: [
      ['last in', 'lifo', 'top'],
      ['first in', 'fifo', 'front', 'line'],
      ['undo', 'bracket', 'call stack', 'back button', 'recursion'],
      ['print', 'bfs', 'breadth', 'schedul', 'order', 'line'],
    ],
  },

  play: {
    intro: 'A stack on the left, a queue on the right. Push, pop, enqueue and dequeue, and see which item comes out.',
    init: (): S => ({ st: [it(4), it(9)], q: [it('a'), it('b')] }),
    view: (s: S) => scene(both(s)),
    ops: [
      {
        id: 'push',
        label: 'push v',
        args: [{ name: 'v', kind: 'int', default: 5 }],
        run: (s: S, a) => {
          if (s.st.length >= 7) return { state: s, frames: [{ scene: scene(both(s)), say: 'The stack is full in this playground. Pop first.' }] };
          const e = it(Number(a.v));
          const n = { ...s, st: [...s.st, e] };
          return { state: n, frames: [{ scene: scene(both(n, { [e.id]: 'new' })), say: `push ${a.v}. New top.` }], cost: cost('push', 'O(1)') };
        },
      },
      {
        id: 'pop',
        label: 'pop',
        run: (s: S) => {
          if (!s.st.length) return { state: s, frames: [{ scene: scene(both(s)), say: 'Empty stack: pop would raise an error.' }] };
          const t = s.st[s.st.length - 1];
          const n = { ...s, st: s.st.slice(0, -1) };
          return {
            state: n,
            frames: [
              { scene: scene(both(s, { [t.id]: 'danger' })), say: `pop returns ${t.v}, the top.` },
              { scene: scene(both(n)), say: 'Gone.' },
            ],
            cost: cost('pop', 'O(1)'),
          };
        },
      },
      {
        id: 'enq',
        label: 'enqueue v',
        args: [{ name: 'v', kind: 'text', default: 'c' }],
        run: (s: S, a) => {
          if (s.q.length >= 6) return { state: s, frames: [{ scene: scene(both(s)), say: 'The queue is full in this playground. Dequeue first.' }] };
          const e = it(String(a.v).slice(0, 3));
          const n = { ...s, q: [...s.q, e] };
          return { state: n, frames: [{ scene: scene(both(n, {}, { [e.id]: 'new' })), say: `enqueue ${a.v} at the back.` }], cost: cost('enqueue', 'O(1)') };
        },
      },
      {
        id: 'deq',
        label: 'dequeue',
        run: (s: S) => {
          if (!s.q.length) return { state: s, frames: [{ scene: scene(both(s)), say: 'Empty queue: nothing to dequeue.' }] };
          const t = s.q[0];
          const n = { ...s, q: s.q.slice(1) };
          return {
            state: n,
            frames: [
              { scene: scene(both(s, {}, { [t.id]: 'danger' })), say: `dequeue returns ${t.v}, the front.` },
              { scene: scene(both(n)), say: 'The rest move up.' },
            ],
            cost: cost('dequeue', 'O(1)'),
          };
        },
      },
    ],
  },

  predict: [
    {
      id: 'second-pop',
      question: 'push 1, push 2, push 3, pop, push 4, pop. What does the second pop return?',
      scene: scene(stackPrims([], { x: 500 })),
      options: ['1', '2', '3', '4'],
      answer: 3,
      frames: () => {
        const f = new Frames();
        const s: It[] = [];
        const step = (say: string, roles: Record<string, Role> = {}) => f.add(stackPrims([...s], { x: 500, roles }), say);
        for (const v of [1, 2, 3]) {
          const e = it(v);
          s.push(e);
          step(`push ${v}`, { [e.id]: 'new' });
        }
        step('pop returns 3.', { [s[2].id]: 'danger' });
        s.pop();
        const e4 = it(4);
        s.push(e4);
        step('push 4: now 4 is on top.', { [e4.id]: 'new' });
        step('pop returns 4. The newest item always leaves first.', { [e4.id]: 'danger' });
        return f.get();
      },
      why: 'After the first pop, 4 is pushed on top, so the next pop returns 4.',
    },
    {
      id: 'second-deq',
      question: 'enqueue a, b, c. dequeue. enqueue d. dequeue. What does the second dequeue return?',
      scene: scene([txt('e', 500, 230, '(empty queue)', { size: 32 })]),
      options: ['a', 'b', 'c', 'd'],
      answer: 1,
      frames: () => {
        const f = new Frames();
        const q = ['a', 'b', 'c'].map(it);
        f.add(queuePrims(q), 'a, b, c in line.');
        f.add(queuePrims(q, { roles: { [q[0].id]: 'danger' } }), 'First dequeue: a leaves.');
        const r = q.slice(1);
        const d = it('d');
        r.push(d);
        f.add(queuePrims(r, { roles: { [d.id]: 'new' } }), 'd joins at the back.');
        f.add(queuePrims(r, { roles: { [r[0].id]: 'danger' } }), 'Second dequeue: b, the oldest still waiting.');
        return f.get();
      },
      why: 'A queue serves in arrival order: a, then b. d waits behind c.',
    },
    {
      id: 'mismatch',
      question: 'Is "([)]" a valid bracket string?',
      scene: scene(arrayRow([...'([)]'], { y: 200 })),
      options: ['Yes', 'No: it fails at the )', 'No: it fails at the final ]', 'No: it has too many brackets'],
      answer: 1,
      frames: () => bracketFrames('([)]', false),
      why: 'When ) arrives, the top of the stack is [, not (. Closers must match the most recent opener.',
    },
  ],

  trace: { title: 'Checking brackets with a stack', code: BRACKET_CODE, frames: () => bracketFrames('([]{})') },

  build: {
    intro: [
      'Build a queue out of two stacks (two Python lists used only with append and pop). Push into inbox. To pop or peek, take from outbox.',
      'When outbox is empty, move everything from inbox into outbox. That reverses the order, so the oldest item ends up on top.',
    ],
    starter: `class MyQueue:
    def __init__(self):
        self.inbox = []
        self.outbox = []

    def push(self, x):
        pass

    def _refill(self):
        # if outbox is empty, move every item from inbox to outbox
        pass

    def pop(self):
        pass

    def peek(self):
        pass

    def empty(self):
        pass
`,
    solution: `class MyQueue:
    def __init__(self):
        self.inbox = []
        self.outbox = []

    def push(self, x):
        self.inbox.append(x)

    def _refill(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())

    def pop(self):
        self._refill()
        return self.outbox.pop()

    def peek(self):
        self._refill()
        return self.outbox[-1]

    def empty(self):
        return not self.inbox and not self.outbox
`,
    tests: [
      { code: 'q = MyQueue()\nfor x in [1, 2, 3]: q.push(x)\nresult = [q.pop(), q.pop(), q.pop()]', show: 'push 1,2,3 then pop ×3', expected: '[1, 2, 3]' },
      { code: 'q = MyQueue()\nq.push(1); q.push(2)\nresult = (q.peek(), q.pop(), q.empty())', show: 'peek, pop, empty', expected: '(1, 1, False)' },
      { code: 'q = MyQueue()\nresult = q.empty()', show: 'new queue is empty', expected: 'True' },
      { code: 'q = MyQueue()\nq.push(1); q.push(2); a = q.pop(); q.push(3); q.push(4)\nresult = [a, q.pop(), q.pop(), q.pop(), q.empty()]', show: 'interleaved pushes and pops', expected: '[1, 2, 3, 4, True]' },
      { code: 'q = MyQueue()\nfor i in range(100000): q.push(i)\ns = 0\nfor i in range(100000): s += q.pop()\nresult = s', show: '100k pushes then pops (amortised O(1))', expected: '4999950000' },
    ],
    builtin: {
      text: 'In real code, use a list as a stack and collections.deque as a queue. deque is O(1) at both ends.',
      code: `stack = []
stack.append(1); stack.pop()       # stack
from collections import deque
q = deque()
q.append("a"); q.popleft()         # queue, O(1)`,
    },
  },

  fill: {
    intro: [
      'Next bigger number to the right, using a monotonic stack of indexes still waiting.',
      'While the new value x beats the value at the top index, pop that index and record x as its answer. Write that one line.',
    ],
    code: `def next_bigger(nums):
    result = [-1] * len(nums)
    stack = []
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            ____
        stack.append(i)
    return result`,
    answer: 'result[stack.pop()] = x',
    tests: [
      { call: 'next_bigger([2, 1, 5, 3, 6])', expected: '[5, 5, 6, 6, -1]' },
      { call: 'next_bigger([3, 2, 1])', expected: '[-1, -1, -1]' },
      { call: 'next_bigger([])', expected: '[]' },
      { call: 'next_bigger([1, 1, 2])', expected: '[2, 2, -1]' },
    ],
  },

  wild: [
    { icon: '📞', title: 'The call stack', text: 'Every function call pushes a frame with its local variables; returning pops it. A stack overflow is this stack running out of room.' },
    { icon: '↩️', title: 'Undo & back', text: 'Editors push each action on an undo stack. Your browser’s back button pops from a history stack.' },
    { icon: '🖨️', title: 'Job queues', text: 'Printers, web servers and message brokers like RabbitMQ queue requests so they’re handled fairly, in arrival order.' },
    { icon: '🧭', title: 'Search & compilers', text: 'Breadth-first search explores with a queue. Compilers use stacks to parse nested expressions and brackets.' },
  ],

  problems: [
    {
      id: 'balanced',
      title: 'Balanced formula',
      difficulty: 'easy',
      pattern: 'Stack matching',
      intro: ['text contains a formula with (), [] and {} mixed with other characters. Return True if every bracket is closed by the matching type in the right order.', 'Ignore every non-bracket character.'],
      examples: [
        { input: 'balanced("f(x[i]) + {y}")', output: 'True' },
        { input: 'balanced("a(b]c)")', output: 'False' },
      ],
      starter: `def balanced(text):
    pass
`,
      solution: `def balanced(text):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack
`,
      tests: [
        { call: 'balanced("f(x[i]) + {y}")', expected: 'True' },
        { call: 'balanced("a(b]c)")', expected: 'False' },
        { call: 'balanced("")', expected: 'True' },
        { call: 'balanced("((")', expected: 'False' },
        { call: 'balanced(")(")', expected: 'False' },
        { call: 'balanced("no brackets")', expected: 'True' },
        { call: 'balanced("(" * 50000 + ")" * 50000)', expected: 'True' },
      ],
      hints: ['A stack remembers the most recent unclosed opener.', 'Push openers. On a closer, the top must be its partner: pop and compare. Skip other characters. At the end the stack must be empty.', 'pairs = {")": "(", …}; stack = [] → for ch: if opener: push; elif closer: if empty or pop() != pairs[ch]: return False → return stack is empty'],
      complexity: { time: 'O(n)', space: 'O(n)' },
    },
    {
      id: 'final-text',
      title: 'Keyboard with backspace',
      difficulty: 'easy',
      pattern: 'Stack as an undo buffer',
      intro: ['keys is a list of key presses. A single character types it; "<" is backspace and deletes the last typed character (if any).', 'Return the final text as a string.'],
      examples: [
        { input: 'final_text(["h", "i", "<", "e", "y"])', output: '"hey"' },
        { input: 'final_text(["<", "<", "a"])', output: '"a"' },
      ],
      starter: `def final_text(keys):
    pass
`,
      solution: `def final_text(keys):
    out = []
    for k in keys:
        if k == "<":
            if out:
                out.pop()
        else:
            out.append(k)
    return "".join(out)
`,
      tests: [
        { call: 'final_text(["h", "i", "<", "e", "y"])', expected: '"hey"' },
        { call: 'final_text(["<", "<", "a"])', expected: '"a"' },
        { call: 'final_text([])', expected: '""' },
        { call: 'final_text(["a", "<", "<"])', expected: '""' },
        { call: 'final_text(["x"] * 60000 + ["<"] * 59999)', expected: '"x"' },
      ],
      hints: ['The last typed character is the first to be deleted: a stack.', 'Push typed characters onto a list. On "<", pop if the list isn’t empty. Join at the end. Avoid building strings with + in a loop (O(n²)).', 'out = [] → for k: if k == "<": if out: out.pop() else: out.append(k) → return "".join(out)'],
      complexity: { time: 'O(n)', space: 'O(n)' },
    },
    {
      id: 'calm-streaks',
      title: 'Calm streaks',
      difficulty: 'medium',
      pattern: 'Monotonic stack',
      intro: [
        'For each day, count how many consecutive days ending today (including today) had a reading less than or equal to today’s.',
        'Return the list of counts. Looking back from every day is O(n²); a monotonic stack makes it O(n).',
      ],
      examples: [{ input: 'calm_streaks([100, 80, 60, 70, 60, 75, 85])', output: '[1, 1, 1, 2, 1, 4, 6]', why: 'On day 6 (85), the six days 80…85 are all ≤ 85.' }],
      starter: `def calm_streaks(readings):
    pass
`,
      solution: `def calm_streaks(readings):
    result = []
    stack = []  # (value, streak) pairs, values strictly decreasing
    for r in readings:
        streak = 1
        while stack and stack[-1][0] <= r:
            streak += stack.pop()[1]
        stack.append((r, streak))
        result.append(streak)
    return result
`,
      tests: [
        { call: 'calm_streaks([100, 80, 60, 70, 60, 75, 85])', expected: '[1, 1, 1, 2, 1, 4, 6]' },
        { call: 'calm_streaks([])', expected: '[]' },
        { call: 'calm_streaks([5, 5, 5])', expected: '[1, 2, 3]' },
        { call: 'calm_streaks([3, 2, 1])', expected: '[1, 1, 1]' },
        { call: 'calm_streaks(list(range(60000)))[-1]', expected: '60000' },
      ],
      hints: [
        'Monotonic stack: keep only the days that could still block a future streak.',
        'Keep (value, streak) pairs on a stack with decreasing values. For a new reading, pop every pair with value ≤ it and add their streaks to yours (start at 1). Push yourself.',
        'stack = [] → for r: s = 1; while stack and top.value <= r: s += pop().streak; push (r, s); append s',
      ],
      complexity: { time: 'O(n)', space: 'O(n)' },
    },
  ],

  extra: [
    { name: 'Valid Parentheses', url: 'https://leetcode.com/problems/valid-parentheses/', difficulty: 'easy' },
    { name: 'Implement Queue using Stacks', url: 'https://leetcode.com/problems/implement-queue-using-stacks/', difficulty: 'easy' },
    { name: 'Backspace String Compare', url: 'https://leetcode.com/problems/backspace-string-compare/', difficulty: 'easy' },
    { name: 'Min Stack', url: 'https://leetcode.com/problems/min-stack/', difficulty: 'medium' },
    { name: 'Daily Temperatures', url: 'https://leetcode.com/problems/daily-temperatures/', difficulty: 'medium' },
    { name: 'Online Stock Span', url: 'https://leetcode.com/problems/online-stock-span/', difficulty: 'medium' },
  ],

  quiz: [
    { q: 'Undo in a text editor should use…', options: ['A queue', 'A stack', 'A hash set', 'A sorted array'], answer: 1, why: 'The most recent action is undone first: last in, first out.' },
    { q: 'Why is list.pop(0) a bad way to dequeue in Python?', options: ['It raises an error', 'It removes the wrong item', 'It shifts every other item: O(n)', 'It is not allowed'], answer: 2, why: 'Lists are arrays; removing the front shifts the rest. Use deque.popleft().' },
    { q: 'In the monotonic-stack trick, how many times is each item pushed and popped?', options: ['At most once each', 'Up to n times', 'log n times', 'Twice each'], answer: 0, why: 'That’s why the whole pass is O(n) even with the inner while loop.' },
  ],
};

export default topic;

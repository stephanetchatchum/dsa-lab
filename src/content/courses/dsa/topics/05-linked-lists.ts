import type { Frame, Prim, Role, Topic } from '../../../../types';
import { cell, cost, edge, Frames, listPrims, ptr, scene, txt, type LLNode } from '../../../lib/viz';
import { linkedLessons } from '../lessons/05-linked-lists';

let uid = 0;
const nd = (v: number): LLNode => ({ id: `L${uid++}`, v });

const LIST_SETUP = `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(values):
    head = None
    for v in reversed(values):
        head = ListNode(v, head)
    return head

def to_list(head):
    out = []
    while head:
        out.append(head.val)
        head = head.next
        if len(out) > 200000:
            raise RuntimeError("list too long - is there a loop?")
    return out`;

/** list + head pointer */
function view(nodes: LLNode[], roles: Record<string, Role> = {}, extra: Prim[] = []): Prim[] {
  const out = listPrims(nodes, { roles });
  if (nodes.length) out.push(ptr('head', nodes[0].id, 'head'));
  return [...out, ...extra];
}

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const clue = (id: string, x: number, y: number, t: string, role?: Role) => cell(id, x, y, t, { w: 120, h: 70, role });
  const c = [clue('c1', 150, 200, '🗺️ 1'), clue('c2', 420, 120, '🌳 2'), clue('c3', 650, 300, '⛲ 3'), clue('c4', 880, 160, '🏆')];
  const e = [edge('c1', 'c2', { curve: 0.2 }), edge('c2', 'c3', { curve: -0.2 }), edge('c3', 'c4', { curve: 0.2 })];
  f.add([...c], 'A treasure hunt. Each clue is hidden somewhere different.');
  f.add([...c, ...e], 'Each clue only tells you where the next one is.');
  f.add([...c.map((x, i) => (i === 2 ? { ...x, role: 'curr' as Role, glow: true } : x)), ...e], 'You can’t jump to clue 3. You must follow the trail from clue 1.');
  const nw = clue('cx', 540, 60, '🎈 new', 'new');
  f.add([...c, nw, edge('c1', 'c2', { curve: 0.2 }), edge('c2', 'cx', { role: 'new' }), edge('cx', 'c3', { role: 'new' }), edge('c3', 'c4', { curve: 0.2 })], 'But adding a new clue in the middle is easy: just rewrite one note. Nothing else moves. That’s a linked list.');
  return f.get();
}

/* ---------------- watch ---------------- */
function nodesClip(): Frame[] {
  const f = new Frames();
  const ns = [nd(3), nd(7), nd(12)];
  f.add(view([]), 'An empty list is just a head that points to None.');
  for (let i = 1; i <= 3; i++) f.add(view(ns.slice(0, i), { [ns[i - 1].id]: 'new' }), i === 1 ? 'A node holds a value and a pointer to the next node.' : `Link node ${ns[i - 1].v} on the end.`);
  f.add(view(ns), 'Nodes can live anywhere in memory. Only the arrows hold the order together.');
  return f.get();
}

function walkClip(): Frame[] {
  const f = new Frames();
  const ns = [nd(3), nd(7), nd(12), nd(20)];
  f.add(view(ns), 'Find 12. There’s no index: start at head and follow the arrows.');
  for (let i = 0; i < 3; i++) {
    const hit = ns[i].v === 12;
    f.add(view(ns, { [ns[i].id]: hit ? 'done' : 'curr' }, [ptr('curr', ns[i].id, hit ? 'done' : 'curr', { side: 'bottom' })]), hit ? 'Found 12 after three hops. Reaching item k costs k hops: O of n.' : `${ns[i].v} is not it. Follow next.`, {
      cost: cost('find / access k', 'O(n)'),
    });
  }
  return f.get();
}

const INSERT_CODE = `def insert_after(curr, val):
    new = ListNode(val)
    new.next = curr.next
    curr.next = new`;

function insertClip(): Frame[] {
  const f = new Frames();
  const a = nd(3);
  const b = nd(7);
  const c = nd(12);
  const n = { id: 'newnode', v: 9 };
  const row = (xs: number[]) => [cell(a.id, xs[0], 200, 3, { shape: 'node', role: 'head' }), cell(b.id, xs[1], 200, 7, { shape: 'node', role: 'curr' }), cell(c.id, xs[2], 200, 12, { shape: 'node' }), cell('none', xs[3], 200, 'None', { w: 92, role: 'muted' })];
  const base = [130, 330, 640, 830];
  const ptrs = [ptr('head', a.id, 'head'), ptr('curr', b.id, 'curr')];
  f.add([...row(base), edge(a.id, b.id), edge(b.id, c.id), edge(c.id, 'none'), ...ptrs], 'Insert 9 right after curr, which is the node holding 7.', { line: 1, vars: { curr: 7 } });
  const nn = cell(n.id, 485, 350, 9, { shape: 'node', role: 'new', glow: true });
  f.add([...row(base), nn, edge(a.id, b.id), edge(b.id, c.id), edge(c.id, 'none'), ...ptrs, ptr('new', n.id, 'new', { side: 'bottom' })], 'Make the new node. It isn’t linked to anything yet.', { line: 2, vars: { curr: 7, new: 9 } });
  f.add([...row(base), nn, edge(a.id, b.id), edge(b.id, c.id, { dashed: true }), edge(n.id, c.id, { role: 'new' }), edge(c.id, 'none'), ...ptrs, ptr('new', n.id, 'new', { side: 'bottom' })], 'First, point new’s arrow at the node after curr. Nothing is lost yet.', {
    line: 3,
    vars: { curr: 7, new: 9, 'new.next': 12 },
  });
  f.add([...row(base), nn, edge(a.id, b.id), edge(b.id, n.id, { role: 'new' }), edge(n.id, c.id), edge(c.id, 'none'), ...ptrs, ptr('new', n.id, 'new', { side: 'bottom' })], 'Then point curr at new. Two arrows changed, and nothing shifted.', {
    line: 4,
    vars: { curr: 7, 'curr.next': 9, 'new.next': 12 },
    cost: cost('insert after a node', 'O(1)'),
  });
  f.add(
    [cell(a.id, 130, 200, 3, { shape: 'node', role: 'head' }), cell(b.id, 330, 200, 7, { shape: 'node' }), cell(n.id, 530, 200, 9, { shape: 'node', role: 'new' }), cell(c.id, 730, 200, 12, { shape: 'node' }), cell('none', 900, 200, 'None', { w: 92, role: 'muted' }), edge(a.id, b.id), edge(b.id, n.id), edge(n.id, c.id), edge(c.id, 'none'), ptr('head', a.id, 'head')],
    'The order matters. Do it the other way round and you’d lose the rest of the list.',
  );
  return f.get();
}

function deleteClip(): Frame[] {
  const f = new Frames();
  const ns = [nd(3), nd(7), nd(12), nd(20)];
  const [a, b, c, d] = ns;
  f.add(view(ns, { [b.id]: 'curr' }, [ptr('prev', b.id, 'curr', { side: 'bottom' })]), 'Delete 12. Stand on the node before it, called prev.');
  const prims = listPrims(ns, { roles: { [b.id]: 'curr', [c.id]: 'danger' }, skipEdge: [b.id] });
  f.add([...prims, edge(b.id, d.id, { role: 'new', curve: -0.45 }), ptr('head', a.id, 'head'), ptr('prev', b.id, 'curr', { side: 'bottom' })], 'Point prev’s arrow past it: prev.next = prev.next.next.', { cost: cost('delete after prev', 'O(1)') });
  f.add(view([a, b, d]), '12 is unreachable now, and Python frees it. No shifting needed.');
  return f.get();
}

const REVERSE_CODE = `def reverse(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`;

function reverseFrames(): Frame[] {
  const f = new Frames();
  const ids = ['r1', 'r2', 'r3'];
  const X = { noneL: 90, r1: 280, r2: 480, r3: 680, noneR: 880 } as Record<string, number>;
  const next: Record<string, string> = { r1: 'r2', r2: 'r3', r3: 'noneR' };
  const pic = (p: string | null, c: string | null, n?: string | null): Prim[] => {
    const out: Prim[] = [
      cell('noneL', X.noneL, 220, 'None', { w: 92, role: 'muted' }),
      cell('noneR', X.noneR, 220, 'None', { w: 92, role: 'muted' }),
      ...ids.map((id, i) => cell(id, X[id], 220, i + 1, { shape: 'node', role: id === c ? 'curr' : id === p ? 'second' : undefined })),
      ...ids.map((id) => edge(id, next[id], { curve: next[id] === 'noneL' || X[next[id]] < X[id] ? 0.35 : 0 })),
    ];
    out.push(ptr('prev', p ?? 'noneL', 'second', { side: 'bottom' }));
    if (c) out.push(ptr('curr', c, 'curr'));
    else out.push(ptr('curr', 'noneR', 'curr'));
    if (n !== undefined) out.push(ptr('nxt', n ?? 'noneR', 'new', { side: 'top', slot: 1 }));
    return out;
  };
  let prev: string | null = null;
  let curr: string | null = 'r1';
  f.add(pic(prev, curr), 'Reverse 1 → 2 → 3. prev starts at None, curr at the head.', { line: 3, vars: { prev: 'None', curr: 1 } });
  while (curr) {
    const n: string = next[curr];
    const nn = n === 'noneR' ? null : n;
    const val = (id: string | null) => (id ? ids.indexOf(id) + 1 : 'None');
    f.add(pic(prev, curr, nn), `Save the next node first: nxt is ${val(nn)}.`, { line: 5, vars: { prev: val(prev), curr: val(curr), nxt: val(nn) } });
    next[curr] = prev ?? 'noneL';
    f.add(pic(prev, curr, nn), `Flip curr’s arrow to point back at ${val(prev)}.`, { line: 6, vars: { prev: val(prev), curr: val(curr), nxt: val(nn) } });
    prev = curr;
    curr = nn;
    f.add(pic(prev, curr, nn), 'Step both pointers forward.', { line: 8, vars: { prev: val(prev), curr: val(curr), nxt: val(nn) } });
  }
  f.add([...pic(prev, null), ptr('head', 'r3', 'head', { slot: 1 })], 'curr fell off the end. prev is the new head: 3 → 2 → 1. One pass, O of 1 extra space.', { line: 9, vars: { 'return': 3 } });
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  ns: LLNode[];
}
const MAXN = 7;

const topic: Topic = {
  id: 'linked-lists',
  order: 5,
  title: 'Linked lists',
  short: 'Nodes joined by arrows. O(1) splicing, O(n) walking.',
  icon: '🔗',
  costs: [cost('access item k', 'O(n)'), cost('search', 'O(n)'), cost('insert after a node', 'O(1)'), cost('delete after a node', 'O(1)'), cost('push front', 'O(1)')],

  intro: {
    what: "A linked list stores items in separate nodes, each one pointing to the next, instead of in one block of memory.",
    why: "It trains you to think in pointers, which you need for trees and graphs. It is also the right tool when you insert and delete in the middle a lot.",
    builds: "Arrays from topic 2, so you can compare the trade-offs directly.",
    goals: ["Insert and delete by changing pointers, in the right order", "Reverse a list in one pass", "Use fast and slow pointers and dummy nodes", "Know when a linked list beats an array, and when it loses"],
  },

  hook: { frames: hook, lines: ['A linked list is a treasure hunt: each node only knows where the next one is.', 'You can’t jump ahead, but you can splice in a new node by changing one arrow.'] },

  watch: [
    { id: 'nodes', title: 'Nodes & arrows', frames: nodesClip },
    { id: 'walk', title: 'Walking the list', frames: walkClip, costs: [cost('find', 'O(n)')] },
    { id: 'insert', title: 'Insert after', frames: insertClip, code: INSERT_CODE, costs: [cost('insert after a node', 'O(1)', 'O(1)')] },
    { id: 'delete', title: 'Delete', frames: deleteClip, costs: [cost('delete after prev', 'O(1)')] },
    { id: 'reverse', title: 'Reverse', frames: reverseFrames, code: REVERSE_CODE, costs: [cost('reverse', 'O(n)', 'O(1)')] },
  ],

  lesson: linkedLessons({ hook, nodes: nodesClip, walk: walkClip, insert: insertClip, del: deleteClip, reverse: reverseFrames }),
  recall: {
    prompt: 'How do you insert a node after another node, and why does the order of the two steps matter?',
    model:
      'Make the new node, then point new.next at curr.next, then point curr.next at new. If you changed curr.next first, you would lose the only reference to the rest of the list. It costs O(1) because nothing shifts, only two arrows change.',
    keywords: [
      ['new.next', 'new node point', 'new’s arrow', "new's arrow", 'new points'],
      ['curr.next', 'point curr', 'current'],
      ['lose', 'lost', 'reference', 'rest of the list'],
      ['o(1)', 'constant', 'no shift', 'nothing shifts', 'two arrows'],
    ],
  },

  play: {
    intro: 'Your own linked list. Add, insert, delete and reverse, and see only arrows change.',
    init: (): S => ({ ns: [nd(4), nd(8), nd(15)] }),
    view: (s: S) => scene(view(s.ns)),
    ops: [
      {
        id: 'front',
        label: 'push front v',
        args: [{ name: 'v', kind: 'int', default: 1 }],
        run: (s: S, a) => {
          if (s.ns.length >= MAXN) return { state: s, frames: [{ scene: scene(view(s.ns)), say: 'This playground holds 7 nodes. Delete one first.' }] };
          const n = nd(Number(a.v));
          const after = [n, ...s.ns];
          return {
            state: { ns: after },
            frames: [
              { scene: scene([...view(s.ns), cell(n.id, 120, 380, n.v, { shape: 'node', role: 'new' })]), say: `New node ${n.v}.` },
              { scene: scene(view(after, { [n.id]: 'new' })), say: 'Point it at the old head, then move head. O of 1.' },
            ],
            cost: cost('push front', 'O(1)'),
          };
        },
      },
      {
        id: 'append',
        label: 'append v',
        args: [{ name: 'v', kind: 'int', default: 20 }],
        run: (s: S, a) => {
          if (s.ns.length >= MAXN) return { state: s, frames: [{ scene: scene(view(s.ns)), say: 'This playground holds 7 nodes. Delete one first.' }] };
          const n = nd(Number(a.v));
          const f = new Frames();
          s.ns.forEach((x, i) => f.add(view(s.ns, { [x.id]: 'curr' }, [ptr('curr', x.id, 'curr', { side: 'bottom' })]), i === s.ns.length - 1 ? 'Found the last node.' : 'Walk to the end…'));
          f.add(view([...s.ns, n], { [n.id]: 'new' }), `Link ${n.v} on. Without a tail pointer this walk makes append O of n.`);
          return { state: { ns: [...s.ns, n] }, frames: f.get(), cost: cost('append (no tail)', 'O(n)') };
        },
      },
      {
        id: 'insert',
        label: 'insert v after index i',
        args: [
          { name: 'i', kind: 'int', default: 0 },
          { name: 'v', kind: 'int', default: 6 },
        ],
        run: (s: S, a) => {
          const i = Number(a.i);
          if (i < 0 || i >= s.ns.length) return { state: s, frames: [{ scene: scene(view(s.ns)), say: `There’s no node at index ${i}.` }] };
          if (s.ns.length >= MAXN) return { state: s, frames: [{ scene: scene(view(s.ns)), say: 'This playground holds 7 nodes.' }] };
          const n = nd(Number(a.v));
          const f = new Frames();
          for (let k = 0; k <= i; k++) f.add(view(s.ns, { [s.ns[k].id]: 'curr' }, [ptr('curr', s.ns[k].id, 'curr', { side: 'bottom' })]), k === i ? `Stop at index ${i}.` : 'Walk…');
          const cur = s.ns[i];
          const nxt = s.ns[i + 1]?.id ?? 'none';
          const base = listPrims(s.ns, { skipEdge: [cur.id], roles: { [cur.id]: 'curr' } });
          const placed = base.find((p) => p.id === cur.id) as { x: number; y: number };
          f.add([...base, cell(n.id, placed.x + 90, 360, n.v, { shape: 'node', role: 'new' }), edge(cur.id, nxt, { dashed: true }), edge(n.id, nxt, { role: 'new' }), ptr('head', s.ns[0].id, 'head')], 'new.next = curr.next');
          f.add([...base, cell(n.id, placed.x + 90, 360, n.v, { shape: 'node', role: 'new' }), edge(cur.id, n.id, { role: 'new' }), edge(n.id, nxt), ptr('head', s.ns[0].id, 'head')], 'curr.next = new');
          const after = [...s.ns.slice(0, i + 1), n, ...s.ns.slice(i + 1)];
          f.add(view(after, { [n.id]: 'new' }), 'Spliced in. Only two arrows changed.');
          return { state: { ns: after }, frames: f.get(), cost: cost('insert after node', 'O(1)') };
        },
      },
      {
        id: 'delete',
        label: 'delete value v',
        args: [{ name: 'v', kind: 'int', default: 8 }],
        run: (s: S, a) => {
          const v = Number(a.v);
          const k = s.ns.findIndex((x) => x.v === v);
          const f = new Frames();
          for (let j = 0; j < (k < 0 ? s.ns.length : k + 1); j++) f.add(view(s.ns, { [s.ns[j].id]: j === k ? 'danger' : 'curr' }, [ptr('curr', s.ns[j].id, 'curr', { side: 'bottom' })]), j === k ? `Found ${v}.` : 'Not it…');
          if (k < 0) {
            f.add(view(s.ns), `${v} isn’t in the list.`);
            return { state: s, frames: f.get(), cost: cost('search', 'O(n)') };
          }
          const after = s.ns.filter((_, j) => j !== k);
          if (k > 0) {
            const prev = s.ns[k - 1];
            const to = s.ns[k + 1]?.id ?? 'none';
            f.add([...listPrims(s.ns, { roles: { [prev.id]: 'curr', [s.ns[k].id]: 'danger' }, skipEdge: [prev.id] }), edge(prev.id, to, { role: 'new', curve: -0.45 }), ptr('head', s.ns[0].id, 'head')], 'prev.next skips over it.');
          } else f.add(view(s.ns, { [s.ns[0].id]: 'danger' }), 'It’s the head: just move head to the next node.');
          f.add(view(after), 'Removed.');
          return { state: { ns: after }, frames: f.get(), cost: cost('delete (incl. search)', 'O(n)') };
        },
      },
      {
        id: 'reverse',
        label: 'reverse',
        run: (s: S) => {
          const after = [...s.ns].reverse();
          return {
            state: { ns: after },
            frames: [
              { scene: scene(view(s.ns)), say: 'Reverse: flip every arrow in one pass.' },
              { scene: scene(view(after, Object.fromEntries(after.map((x) => [x.id, 'second' as Role])))), say: 'Every arrow now points the other way, and head is the old tail.' },
            ],
            cost: cost('reverse', 'O(n)'),
          };
        },
      },
    ],
  },

  predict: [
    {
      id: 'hops',
      question: 'To read the 5th node (index 4) of a linked list, how many next-hops from head?',
      scene: scene(view([nd(2), nd(4), nd(6), nd(8), nd(10), nd(12)])),
      options: ['1: jump straight there', '4', '5', 'log₂ 6 ≈ 3'],
      answer: 1,
      frames: () => {
        const ns = [nd(2), nd(4), nd(6), nd(8), nd(10), nd(12)];
        return ns.slice(0, 5).map((x, i) => ({ scene: scene(view(ns, { [x.id]: i === 4 ? 'done' : 'curr' }, [ptr('curr', x.id, 'curr', { side: 'bottom' })])), say: i === 0 ? 'Start at head: index 0, zero hops.' : i === 4 ? 'Index 4 after four hops. No shortcuts in a linked list.' : `Hop ${i}.` }));
      },
      why: 'Index k needs k hops from head. There’s no address arithmetic like in arrays.',
    },
    {
      id: 'wrong-order',
      question: 'Inserting new after curr, someone writes curr.next = new FIRST. What happens next?',
      scene: scene([cell('a', 200, 200, 7, { shape: 'node', role: 'curr' }), cell('b', 600, 200, 12, { shape: 'node' }), cell('c', 820, 200, 'None', { w: 92, role: 'muted' }), edge('a', 'b'), edge('b', 'c'), cell('n', 400, 360, 9, { shape: 'node', role: 'new' }), ptr('curr', 'a', 'curr'), ptr('new', 'n', 'new', { side: 'bottom' })]),
      options: ['It works the same', 'The rest of the list (12 onwards) is lost', 'Python raises an error', 'The list gets reversed'],
      answer: 1,
      frames: () => [
        { scene: scene([cell('a', 200, 200, 7, { shape: 'node', role: 'curr' }), cell('b', 600, 200, 12, { shape: 'node' }), cell('c', 820, 200, 'None', { w: 92, role: 'muted' }), edge('a', 'n', { role: 'new' }), edge('b', 'c'), cell('n', 400, 360, 9, { shape: 'node', role: 'new' })]), say: 'curr now points at new. The only arrow to 12 is gone.' },
        { scene: scene([cell('a', 200, 200, 7, { shape: 'node', role: 'curr' }), cell('b', 600, 200, 12, { shape: 'node', role: 'danger' }), cell('c', 820, 200, 'None', { w: 92, role: 'muted' }), edge('a', 'n'), edge('b', 'c', { role: 'danger' }), cell('n', 400, 360, 9, { shape: 'node', role: 'new' }), { kind: 'path', id: 'selfloop', role: 'danger', points: [[440, 345], [500, 320], [490, 270], [400, 262], [345, 290], [352, 322]] }, txt('loop', 520, 262, 'points at itself', { size: 26, role: 'danger', anchor: 'start' })]), say: 'Then new.next = curr.next makes new point at itself. 12 and everything after it is unreachable.' },
      ],
      why: 'curr.next was the only reference to the rest of the list. Save it into new.next first.',
    },
    {
      id: 'after-reverse',
      question: 'After reversing 1 → 2 → 3 → None, what does the returned head point to?',
      scene: scene(view([nd(1), nd(2), nd(3)])),
      options: ['1', '2', '3', 'None'],
      answer: 2,
      frames: reverseFrames,
      why: 'The old tail becomes the new head: 3 → 2 → 1 → None.',
    },
  ],

  trace: { title: 'Reversing a list with three pointers', code: REVERSE_CODE, frames: reverseFrames },

  build: {
    intro: [
      'Build a singly linked list with head, tail and size. append must be O(1), so keep the tail pointer up to date instead of walking to the end.',
      'remove(v) deletes the first node with value v and returns True, or returns False if it isn’t there. Watch the head and tail cases.',
    ],
    starter: `class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


class LinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self.size = 0

    def __len__(self):
        return self.size

    def push_front(self, val):
        pass

    def append(self, val):
        pass

    def find(self, val):
        # return True if val is in the list
        pass

    def remove(self, val):
        pass

    def to_list(self):
        pass
`,
    solution: `class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next


class LinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self.size = 0

    def __len__(self):
        return self.size

    def push_front(self, val):
        self.head = Node(val, self.head)
        if self.tail is None:
            self.tail = self.head
        self.size += 1

    def append(self, val):
        node = Node(val)
        if self.tail is None:
            self.head = self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.size += 1

    def find(self, val):
        curr = self.head
        while curr:
            if curr.val == val:
                return True
            curr = curr.next
        return False

    def remove(self, val):
        prev, curr = None, self.head
        while curr:
            if curr.val == val:
                if prev is None:
                    self.head = curr.next
                else:
                    prev.next = curr.next
                if curr is self.tail:
                    self.tail = prev
                self.size -= 1
                return True
            prev, curr = curr, curr.next
        return False

    def to_list(self):
        out, curr = [], self.head
        while curr:
            out.append(curr.val)
            curr = curr.next
        return out
`,
    tests: [
      { code: 'll = LinkedList()\nll.push_front(2); ll.push_front(1); ll.append(3)\nresult = (ll.to_list(), len(ll))', show: 'push_front 2, 1 then append 3', expected: '([1, 2, 3], 3)' },
      { code: 'll = LinkedList()\nresult = (ll.to_list(), ll.find(1), ll.remove(1))', show: 'empty list', expected: '([], False, False)' },
      { code: 'll = LinkedList()\nfor v in [5, 6, 7]: ll.append(v)\nresult = (ll.remove(5), ll.to_list(), ll.head.val)', show: 'remove the head', expected: '(True, [6, 7], 6)' },
      { code: 'll = LinkedList()\nfor v in [5, 6, 7]: ll.append(v)\nll.remove(7)\nll.append(8)\nresult = ll.to_list()', show: 'remove the tail, then append', expected: '[5, 6, 8]' },
      { code: 'll = LinkedList()\nfor v in [1, 2, 2, 3]: ll.append(v)\nresult = (ll.remove(2), ll.to_list(), ll.find(2), len(ll))', show: 'remove first of duplicates', expected: '(True, [1, 2, 3], True, 3)' },
      { code: 'll = LinkedList()\nll.append(1)\nll.remove(1)\nll.append(2)\nresult = (ll.to_list(), ll.head is ll.tail)', show: 'remove only node, append again', expected: '([2], True)' },
      { code: 'll = LinkedList()\nfor v in range(1500): ll.append(v)\nresult = (len(ll), ll.tail.val, ll.tail.next)', show: '1,500 appends, tail is correct', expected: '(1500, 1499, None)' },
    ],
    builtin: {
      text: 'Python has no built-in singly linked list. collections.deque is a linked structure of blocks: O(1) at both ends, O(n) in the middle.',
      code: `from collections import deque
d = deque([1, 2, 3])
d.appendleft(0)   # O(1)
d.append(4)       # O(1)
d.popleft()       # O(1)`,
    },
  },

  fill: {
    intro: ['Reverse a list in place. Save next, flip the arrow, then step forward.', 'Write the line that flips curr’s arrow.'],
    code: `def reverse(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        ____
        prev = curr
        curr = nxt
    return prev`,
    answer: 'curr.next = prev',
    setup: LIST_SETUP,
    tests: [
      { call: 'to_list(reverse(build([1, 2, 3])))', expected: '[3, 2, 1]' },
      { call: 'to_list(reverse(build([])))', expected: '[]' },
      { call: 'to_list(reverse(build([7])))', expected: '[7]' },
      { call: 'to_list(reverse(build(list(range(1000)))))[:3]', expected: '[999, 998, 997]' },
    ],
  },

  wild: [
    { icon: '🗃️', title: 'LRU caches', text: 'Browsers and databases evict the least-recently-used item with a hash map plus a doubly linked list: O(1) to move an item to the front.' },
    { icon: '🐧', title: 'Operating systems', text: 'The Linux kernel links processes, timers and free memory blocks in lists, because they join and leave constantly.' },
    { icon: '🎵', title: 'Playlists & history', text: 'Previous/next in a music player and undo/redo chains are natural doubly linked lists.' },
    { icon: '⛓️', title: 'Blockchains', text: 'Each block stores the hash of the previous one: a linked list where tampering breaks every later link.' },
  ],

  problems: [
    {
      id: 'middle',
      title: 'Middle of the train',
      difficulty: 'easy',
      pattern: 'Fast & slow pointers',
      intro: ['Return the value of the middle node. With an even number of nodes, return the second of the two middles. Return None for an empty list.', 'Try one pass: a fast pointer moves two steps for every one step of a slow pointer.'],
      examples: [
        { input: 'middle_value(build([1, 2, 3, 4, 5]))', output: '3' },
        { input: 'middle_value(build([1, 2, 3, 4]))', output: '3' },
      ],
      setup: LIST_SETUP,
      starter: `def middle_value(head):
    pass
`,
      solution: `def middle_value(head):
    if head is None:
        return None
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow.val
`,
      tests: [
        { call: 'middle_value(build([1, 2, 3, 4, 5]))', expected: '3' },
        { call: 'middle_value(build([1, 2, 3, 4]))', expected: '3' },
        { call: 'middle_value(build([7]))', expected: '7' },
        { call: 'middle_value(build([]))', expected: 'None' },
        { call: 'middle_value(build([1, 2]))', expected: '2' },
      ],
      hints: ['Fast & slow pointers: when fast reaches the end, slow is halfway.', 'Start both at head. Move slow one step and fast two steps while fast and fast.next exist.', 'slow = fast = head → while fast and fast.next: slow = slow.next; fast = fast.next.next → return slow.val'],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'merge',
      title: 'Merge two sorted trains',
      difficulty: 'easy',
      pattern: 'Dummy head + splice',
      intro: ['a and b are sorted linked lists. Return the head of one sorted list containing all their nodes.', 'Reuse the existing nodes. A dummy starting node avoids special cases for the head.'],
      examples: [{ input: 'to_list(merge(build([1, 4, 6]), build([2, 3, 7])))', output: '[1, 2, 3, 4, 6, 7]' }],
      setup: LIST_SETUP,
      starter: `def merge(a, b):
    pass
`,
      solution: `def merge(a, b):
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a if a else b
    return dummy.next
`,
      tests: [
        { call: 'to_list(merge(build([1, 4, 6]), build([2, 3, 7])))', expected: '[1, 2, 3, 4, 6, 7]' },
        { call: 'to_list(merge(build([]), build([1, 2])))', expected: '[1, 2]' },
        { call: 'to_list(merge(build([]), build([])))', expected: '[]' },
        { call: 'to_list(merge(build([1, 1]), build([1])))', expected: '[1, 1, 1]' },
        { call: 'to_list(merge(build(list(range(0, 2000, 2))), build(list(range(1, 2000, 2)))))[-3:]', expected: '[1997, 1998, 1999]' },
      ],
      hints: ['Dummy head: build the answer after a fake first node, return dummy.next.', 'Keep a tail pointer. Repeatedly attach the smaller front node of a or b, then advance that list. When one runs out, attach the rest of the other.', 'dummy = tail = ListNode() → while a and b: attach smaller, advance it, tail = tail.next → tail.next = a or b → return dummy.next'],
      complexity: { time: 'O(n + m)', space: 'O(1)' },
    },
    {
      id: 'kth-end',
      title: 'Drop the k-th from the end',
      difficulty: 'medium',
      pattern: 'Two pointers with a gap',
      intro: ['Remove the k-th node counting from the end (k = 1 is the last node) and return the head. k is always valid.', 'Aim for one pass: send a leader pointer k steps ahead, then move both until the leader reaches the end.'],
      examples: [
        { input: 'to_list(drop_kth_from_end(build([1, 2, 3, 4, 5]), 2))', output: '[1, 2, 3, 5]' },
        { input: 'to_list(drop_kth_from_end(build([1]), 1))', output: '[]' },
      ],
      setup: LIST_SETUP,
      starter: `def drop_kth_from_end(head, k):
    pass
`,
      solution: `def drop_kth_from_end(head, k):
    dummy = ListNode(0, head)
    lead = trail = dummy
    for _ in range(k):
        lead = lead.next
    while lead.next:
        lead = lead.next
        trail = trail.next
    trail.next = trail.next.next
    return dummy.next
`,
      tests: [
        { call: 'to_list(drop_kth_from_end(build([1, 2, 3, 4, 5]), 2))', expected: '[1, 2, 3, 5]' },
        { call: 'to_list(drop_kth_from_end(build([1]), 1))', expected: '[]' },
        { call: 'to_list(drop_kth_from_end(build([1, 2]), 2))', expected: '[2]' },
        { call: 'to_list(drop_kth_from_end(build([1, 2]), 1))', expected: '[1]' },
        { call: 'to_list(drop_kth_from_end(build([4, 5, 6, 7]), 4))', expected: '[5, 6, 7]' },
      ],
      hints: ['Two pointers k apart: when the front one hits the end, the back one sits just before the target.', 'Use a dummy before head (handles removing the head). Move lead k steps. Then move lead and trail together until lead.next is None. trail.next is the node to drop.', 'dummy → lead = trail = dummy → k times: lead = lead.next → while lead.next: both step → trail.next = trail.next.next → return dummy.next'],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
  ],

  extra: [
    { name: 'Reverse Linked List', url: 'https://leetcode.com/problems/reverse-linked-list/', difficulty: 'easy' },
    { name: 'Merge Two Sorted Lists', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', difficulty: 'easy' },
    { name: 'Middle of the Linked List', url: 'https://leetcode.com/problems/middle-of-the-linked-list/', difficulty: 'easy' },
    { name: 'Linked List Cycle', url: 'https://leetcode.com/problems/linked-list-cycle/', difficulty: 'easy' },
    { name: 'Remove Nth Node From End of List', url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', difficulty: 'medium' },
    { name: 'LRU Cache', url: 'https://leetcode.com/problems/lru-cache/', difficulty: 'medium' },
  ],

  quiz: [
    { q: 'Why is inserting after a node you already hold O(1)?', options: ['Linked lists are sorted', 'Only two arrows change; nothing shifts', 'Python caches nodes', 'It isn’t: it’s O(n)'], answer: 1, why: 'new.next = curr.next, then curr.next = new.' },
    { q: 'Reading the item at index k costs…', options: ['O(1)', 'O(log n)', 'O(k), i.e. O(n) worst case', 'O(n²)'], answer: 2, why: 'You must hop k times from the head.' },
    { q: 'What does a dummy (sentinel) head node buy you?', options: ['Faster lookups', 'No special case when the real head changes', 'Less memory', 'Sorting for free'], answer: 1, why: 'Every real node then has a node before it, including the first one.' },
  ],
};

export default topic;

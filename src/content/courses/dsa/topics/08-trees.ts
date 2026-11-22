import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cell, cost, Frames, ptr, scene, spread, txt } from '../../../lib/viz';
import { binaryPrims, bnode, bstFrom, bstInsert, cloneB, heapPrims, height, inorder, layoutBinary, type BNode } from '../../../lib/tree';

const TREE_SETUP = `from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(values):
    """Build from level order, None = no child. [2, 1, 3] -> 2 with children 1 and 3."""
    if not values or values[0] is None:
        return None
    it = iter(values)
    root = TreeNode(next(it))
    q = deque([root])
    while q:
        node = q.popleft()
        for side in ("left", "right"):
            v = next(it, "END")
            if v == "END":
                return root
            if v is not None:
                child = TreeNode(v)
                setattr(node, side, child)
                q.append(child)
    return root`;

const T = (root: BNode | null, roles: Record<string, Role> = {}, extra: Prim[] = [], glow: string[] = []) => {
  const pos = layoutBinary(root, { y0: 60, dy: 86 });
  return [...binaryPrims(root, pos, { roles, glow }), ...extra];
};
const outRow = (vals: number[], y = 440, label = 'output') =>
  vals.length
    ? [...arrayRow(vals, { y, gap: 66, w: 54, prefix: `o_${label}_`, idx: false, roles: Object.fromEntries(vals.map((_, i) => [i, 'done' as Role])) }), txt(`ol_${label}`, spread(vals.length, 66)[0] - 70, y + 8, label, { size: 24, anchor: 'end' })]
    : [txt(`ol_${label}`, 500, y + 8, `${label}: (empty)`, { size: 24 })];

const BASE = [8, 4, 12, 2, 6, 10, 14];

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const root = bstFrom([50, 30, 70, 20, 40, 60, 80]);
  f.add(T(root), 'Your computer’s folders: one top folder, folders inside folders, files at the ends. That’s a tree.');
  f.add(T(root, { n50: 'head' }, [txt('r', 640, 60, '← root: the top', { size: 30, role: 'head', anchor: 'start' })], ['n50']), 'The top node is the root. Every node except the root has exactly one parent.');
  f.add(T(root, { n20: 'done', n40: 'done', n60: 'done', n80: 'done' }, [txt('l', 500, 360, 'leaves: nodes with no children', { size: 30, role: 'done' })]), 'Nodes with no children are leaves. In a binary tree each node has at most two children.');
  f.add(T(root, {}, [txt('h', 500, 360, 'height 3  →  ~log₂ n levels when balanced', { size: 30, role: 'curr' })]), 'If the tree is bushy and balanced, its height is only about log n. That’s where trees get their speed.');
  return f.get();
}

/* ---------------- traversals ---------------- */
function inorderFrames(): Frame[] {
  const root = bstFrom(BASE)!;
  const f = new Frames();
  const out: number[] = [];
  f.add([...T(root), ...outRow(out)], 'In-order traversal: left subtree, then the node, then the right subtree.');
  const go = (n: BNode | null) => {
    if (!n) return;
    f.add([...T(root, { [n.id]: 'curr' }, outRow(out)), ptr('at', n.id, 'curr', { id: 'pat' })], n.left ? `At ${n.v}: go left first.` : `At ${n.v}: no left child.`);
    go(n.left);
    out.push(n.v as number);
    f.add([...T(root, { [n.id]: 'done' }, outRow(out)), ptr('at', n.id, 'done', { id: 'pat' })], `Visit ${n.v}.`);
    go(n.right);
  };
  go(root);
  f.add([...T(root), ...outRow(out), txt('pre', 500, 380, 'pre-order: 8 4 2 6 12 10 14   ·   post-order: 2 6 4 10 14 12 8', { size: 24 })], 'In-order on a search tree comes out sorted! Pre-order visits the node first, post-order last. All three are O of n.');
  return f.get();
}

function levelFrames(): Frame[] {
  const root = bstFrom(BASE)!;
  const f = new Frames();
  const out: number[] = [];
  const q: BNode[] = [root];
  const qRow = (): Prim[] => (q.length ? [...arrayRow(q.map((n) => n.v), { y: 380, gap: 66, w: 54, prefix: 'q_', idx: false, roles: { 0: 'head' } }), txt('ql', spread(q.length, 66)[0] - 70, 388, 'queue', { size: 24, anchor: 'end' })] : [txt('ql', 500, 388, 'queue: (empty)', { size: 24 })]);
  f.add([...T(root), ...qRow(), ...outRow(out)], 'Level order visits row by row. It uses a queue, from topic 4.');
  while (q.length) {
    const n = q.shift()!;
    out.push(n.v as number);
    if (n.left) q.push(n.left);
    if (n.right) q.push(n.right);
    f.add([...T(root, { [n.id]: 'done', ...(n.left ? { [n.left.id]: 'new' } : {}), ...(n.right ? { [n.right.id]: 'new' } : {}) }), ...qRow(), ...outRow(out)], `Take ${n.v} from the front, visit it, queue its children.`);
  }
  f.add([...T(root), ...qRow(), ...outRow(out)], 'Level by level: 8, then 4 and 12, then the leaves. This is breadth-first search on a tree.');
  return f.get();
}

/* ---------------- BST search & insert ---------------- */
function searchPath(root: BNode | null, v: number): BNode[] {
  const path: BNode[] = [];
  let n = root;
  while (n) {
    path.push(n);
    if (v === n.v) break;
    n = v < (n.v as number) ? n.left : n.right;
  }
  return path;
}

const SEARCH_CODE = `def search(root, target):
    node = root
    while node:
        if target == node.val:
            return True
        if target < node.val:
            node = node.left
        else:
            node = node.right
    return False`;

function searchFrames(vals: number[], target: number, withLines = false): Frame[] {
  const root = bstFrom(vals);
  const f = new Frames();
  const L = (l: number) => (withLines ? { line: l } : {});
  f.add([...T(root), txt('t', 900, 60, `find ${target}`, { size: 32, role: 'curr' })], `Search for ${target}. Start at the root.`, { ...L(2), vars: { target } });
  const path = searchPath(root, target);
  path.forEach((n) => {
    const hit = n.v === target;
    const roles = Object.fromEntries(path.slice(0, path.indexOf(n)).map((x) => [x.id, 'muted' as Role]));
    roles[n.id] = hit ? 'done' : 'curr';
    f.add([...T(root, roles, [ptr('node', n.id, hit ? 'done' : 'curr', { id: 'pn' }), txt('t', 900, 60, `find ${target}`, { size: 32, role: 'curr' })])], hit ? `Found ${target}.` : `${target} ${target < (n.v as number) ? 'is less than' : 'is greater than'} ${n.v}: go ${target < (n.v as number) ? 'left' : 'right'}. Half the tree is ruled out.`, {
      ...L(hit ? 5 : target < (n.v as number) ? 7 : 9),
      vars: { target, 'node.val': n.v },
    });
  });
  if (path[path.length - 1]?.v !== target) f.add([...T(root)], `Fell off the tree: ${target} isn’t there.`, { ...L(10), vars: { target, node: 'None' } });
  f.add([...T(root), txt('t', 500, 400, `steps = height of the tree`, { size: 30, role: 'curr' })], 'Each step goes one level down, so search costs the height: O of log n if balanced.');
  return f.get();
}

function insertFrames(vals: number[], v: number): Frame[] {
  const before = bstFrom(vals);
  const f = new Frames();
  const path = searchPath(before, v);
  path.forEach((n) => f.add(T(before, { [n.id]: 'curr' }), `${v} vs ${n.v}: go ${v < (n.v as number) ? 'left' : 'right'}.`));
  const after = bstInsert(cloneB(before), v);
  f.add(T(after, { [`n${v}`]: 'new' }, [], [`n${v}`]), `Empty spot. ${v} becomes a new leaf there. Insert costs the height too.`);
  return f.get();
}

function balanceFrames(): Frame[] {
  const f = new Frames();
  let chain: BNode | null = null;
  for (const v of [1, 2, 3, 4, 5, 6]) {
    chain = bstInsert(chain, v);
    f.add(T(cloneB(chain), { [`n${v}`]: 'new' }), v === 1 ? 'Insert 1, 2, 3, 4, 5, 6 in sorted order…' : v === 6 ? 'It’s a linked list in disguise. Height 6: search is O of n.' : `${v} always goes right.`);
  }
  const bal = bstFrom([4, 2, 5, 1, 3, 6]);
  f.add([...T(bal), txt('h', 500, 380, 'height 3 → O(log n)', { size: 32, role: 'done' })], 'Same six values, rearranged so each side holds about half. Height 3.');
  f.add([...T(bal), txt('h', 500, 380, 'AVL & red-black trees re-balance with rotations after each insert', { size: 26 })], 'Self-balancing trees, like AVL and red-black trees, do this automatically with small rotations, keeping every operation O of log n.');
  return f.get();
}

/* ---------------- heap ---------------- */
interface HI {
  id: string;
  v: number;
}
let hid = 0;
const hmk = (vals: number[]): HI[] => vals.map((v) => ({ id: `h${hid++}`, v }));
const H = (arr: HI[], roles: Record<string, Role> = {}, extra: Prim[] = []): Prim[] => [
  ...heapPrims(arr, { roles, y0: 60, dy: 80 }),
  ...arrayRow(arr.map((x) => x.v), { y: 380, gap: 66, w: 54, prefix: 'ha', roles: Object.fromEntries(arr.map((x, i) => [i, roles[x.id] ?? 'default'])) }),
  txt('hal', spread(Math.max(arr.length, 1), 66)[0] - 70, 388, 'array', { size: 24, anchor: 'end' }),
  ...extra,
];

function heapPushFrames(start: number[], v: number): Frame[] {
  const a = hmk(start);
  const f = new Frames();
  f.add(H(a, { [a[0].id]: 'head' }), 'A min-heap: every parent is smaller than its children, so the smallest is always at the top. It’s stored as a plain array.');
  const n = { id: `h${hid++}`, v };
  a.push(n);
  f.add(H(a, { [n.id]: 'new' }), `Push ${v}: put it at the end of the array, the next free leaf.`);
  let i = a.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (a[p].v <= a[i].v) break;
    f.add(H(a, { [n.id]: 'new', [a[p].id]: 'danger' }), `${a[i].v} is smaller than its parent ${a[p].v}. Swap.`);
    [a[p], a[i]] = [a[i], a[p]];
    i = p;
    f.add(H(a, { [n.id]: 'new' }), 'Sift up.');
  }
  f.add(H(a, { [n.id]: 'done' }), 'Parent is smaller now, so stop. At most one swap per level: O of log n.', { cost: cost('push', 'O(log n)') });
  return f.get();
}

function heapPopFrames(start: number[]): Frame[] {
  const a = hmk(start);
  const f = new Frames();
  f.add(H(a, { [a[0].id]: 'danger' }), `pop removes the top: ${a[0].v}, the smallest.`);
  const last = a.pop()!;
  a[0] = last;
  f.add(H(a, { [last.id]: 'curr' }), `Move the last item, ${last.v}, into the top spot.`);
  let i = 0;
  for (;;) {
    const l = 2 * i + 1;
    const r = l + 1;
    let m = i;
    if (l < a.length && a[l].v < a[m].v) m = l;
    if (r < a.length && a[r].v < a[m].v) m = r;
    if (m === i) break;
    f.add(H(a, { [last.id]: 'curr', [a[m].id]: 'second' }), `${a[m].v} is the smaller child and beats ${last.v}. Swap.`);
    [a[i], a[m]] = [a[m], a[i]];
    i = m;
  }
  f.add(H(a, { [a[0].id]: 'head', [last.id]: 'done' }), 'Heap order restored. pop is O of log n, and peeking at the top is O of 1.', { cost: cost('pop', 'O(log n)') });
  return f.get();
}

/* ---------------- play: BST ---------------- */
interface S {
  root: BNode | null;
}
function bstDelete(root: BNode | null, v: number): BNode | null {
  if (!root) return null;
  if (v < (root.v as number)) root.left = bstDelete(root.left, v);
  else if (v > (root.v as number)) root.right = bstDelete(root.right, v);
  else {
    if (!root.left) return root.right;
    if (!root.right) return root.left;
    let s = root.right;
    while (s.left) s = s.left;
    const right = bstDelete(root.right, s.v as number);
    return { ...bnode(s.v as number), left: root.left, right };
  }
  return root;
}

const topic: Topic = {
  id: 'trees',
  order: 8,
  title: 'Trees & heaps',
  short: 'Traversals, search trees, balance, and priority queues.',
  icon: '🌳',
  costs: [cost('BST search/insert (balanced)', 'O(log n)'), cost('…unbalanced worst case', 'O(n)'), cost('traversal', 'O(n)'), cost('heap push / pop', 'O(log n)'), cost('heap peek min', 'O(1)')],

  intro: {
    what: "Trees store data as a hierarchy: one root with branches. Binary search trees keep data sorted; heaps always know the smallest item.",
    why: "Databases, file systems, web pages and priority schedulers are trees. Balanced trees give O(log n) for almost everything.",
    builds: "Recursion from topic 6, linked nodes from topic 5, and queues from topic 4 for level-order traversal.",
    goals: ["Traverse a tree in four orders", "Search and insert in a binary search tree", "Explain why balance matters", "Use a heap as a priority queue"],
  },

  hook: { frames: hook, lines: ['A tree is a hierarchy: one root, branches, and leaves at the ends.', 'Keep it balanced and you can reach any of a million nodes in about 20 steps.'] },

  watch: [
    { id: 'inorder', title: 'Depth-first traversals', frames: inorderFrames, costs: [cost('traverse', 'O(n)', 'O(h)')] },
    { id: 'level', title: 'Level order (BFS)', frames: levelFrames, costs: [cost('level order', 'O(n)', 'O(n)')] },
    { id: 'search', title: 'BST search', frames: () => searchFrames(BASE, 6), code: SEARCH_CODE, costs: [cost('search', 'O(log n)')] },
    { id: 'insert', title: 'BST insert', frames: () => insertFrames(BASE, 7), costs: [cost('insert', 'O(log n)')] },
    { id: 'balance', title: 'Why balance matters', frames: balanceFrames, costs: [cost('balanced', 'O(log n)'), cost('degenerate', 'O(n)')] },
    { id: 'heap-push', title: 'Heap push', frames: () => heapPushFrames([2, 5, 3, 9, 6, 8], 1), costs: [cost('push', 'O(log n)')] },
    { id: 'heap-pop', title: 'Heap pop', frames: () => heapPopFrames([1, 5, 2, 9, 6, 8, 3]), costs: [cost('pop min', 'O(log n)'), cost('peek', 'O(1)')] },
  ],

  recall: {
    prompt: 'In a binary search tree, where do smaller and bigger values go, and why can searching be fast? What is a heap good for?',
    model:
      'In a BST, everything in a node’s left subtree is smaller and everything in its right subtree is bigger. Each comparison picks one side and skips the other, so search costs the tree’s height: O(log n) when balanced, O(n) if it degenerates into a chain. A heap only keeps parents smaller than children, which makes getting the minimum O(1) and push/pop O(log n): perfect for a priority queue.',
    keywords: [
      ['left', 'smaller', 'less'],
      ['right', 'bigger', 'greater', 'larger'],
      ['height', 'log', 'half', 'balanced'],
      ['heap', 'priority', 'minimum', 'smallest', 'min'],
    ],
  },

  play: {
    intro: 'Your own binary search tree. Insert values (try them in sorted order!), search, delete, and walk it in order.',
    init: (): S => ({ root: bstFrom([8, 4, 12, 2, 6]) }),
    view: (s: S) => scene([...T(s.root), txt('ht', 900, 420, `height ${height(s.root)}`, { size: 28, role: 'curr' })]),
    ops: [
      {
        id: 'ins',
        label: 'insert v',
        args: [{ name: 'v', kind: 'int', default: 7 }],
        run: (s: S, a) => {
          const v = Number(a.v);
          if (inorder(s.root).length >= 15) return { state: s, frames: [{ scene: scene(T(s.root)), say: 'This playground holds 15 nodes. Delete some first.' }] };
          if (inorder(s.root).some((n) => n.v === v)) return { state: s, frames: [{ scene: scene(T(s.root, { [`n${v}`]: 'curr' })), say: `${v} is already in the tree.` }] };
          const f = new Frames();
          searchPath(s.root, v).forEach((n) => f.add(T(s.root, { [n.id]: 'curr' }), `${v} vs ${n.v}: ${v < (n.v as number) ? 'left' : 'right'}.`));
          const root = bstInsert(cloneB(s.root), v);
          f.add([...T(root, { [`n${v}`]: 'new' }), txt('ht', 900, 420, `height ${height(root)}`, { size: 28, role: 'curr' })], `New leaf. Height is now ${height(root)}.`);
          return { state: { root }, frames: f.get(), cost: cost('insert', 'O(h)') };
        },
      },
      {
        id: 'find',
        label: 'search v',
        args: [{ name: 'v', kind: 'int', default: 6 }],
        run: (s: S, a) => {
          const v = Number(a.v);
          const f = new Frames();
          const path = searchPath(s.root, v);
          path.forEach((n) => f.add(T(s.root, { [n.id]: n.v === v ? 'done' : 'curr' }), n.v === v ? `Found ${v} in ${path.length} steps.` : `${v} ${v < (n.v as number) ? '<' : '>'} ${n.v}`));
          if (!path.length || path[path.length - 1].v !== v) f.add(T(s.root), `${v} isn’t in the tree.`);
          return { state: s, frames: f.get(), cost: cost('search', 'O(h)') };
        },
      },
      {
        id: 'del',
        label: 'delete v',
        args: [{ name: 'v', kind: 'int', default: 4 }],
        run: (s: S, a) => {
          const v = Number(a.v);
          const target = inorder(s.root).find((n) => n.v === v);
          if (!target) return { state: s, frames: [{ scene: scene(T(s.root)), say: `${v} isn’t in the tree.` }] };
          const two = !!(target.left && target.right);
          const root = bstDelete(cloneB(s.root), v);
          let succ: BNode | null = null;
          if (two) {
            succ = target.right;
            while (succ!.left) succ = succ!.left;
          }
          const f = new Frames();
          f.add(T(s.root, { [target.id]: 'danger', ...(succ ? { [succ.id]: 'new' } : {}) }), two ? `${v} has two children. Replace it with the next bigger value, ${succ!.v}: the leftmost node of its right subtree.` : target.left || target.right ? `${v} has one child: the child takes its place.` : `${v} is a leaf: just remove it.`);
          f.add(T(root, succ ? { [succ.id]: 'new' } : {}), 'Done. The search-tree order still holds.');
          return { state: { root }, frames: f.get(), cost: cost('delete', 'O(h)') };
        },
      },
      {
        id: 'walk',
        label: 'in-order walk',
        run: (s: S) => {
          const f = new Frames();
          const out: number[] = [];
          for (const n of inorder(s.root)) {
            out.push(n.v as number);
            f.add([...T(s.root, { [n.id]: 'done' }), ...outRow(out)], `${n.v}`);
          }
          if (!out.length) f.add(T(s.root), 'Empty tree.');
          else f.add([...T(s.root), ...outRow(out)], 'Sorted order, always. That’s the BST promise.');
          return { state: s, frames: f.get(), cost: cost('in-order', 'O(n)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'where-7',
      question: 'Insert 7 into this search tree. Where does it go?',
      scene: scene(T(bstFrom([8, 4, 12, 2, 6]))),
      options: ['Left child of 2', 'Right child of 6', 'Left child of 12', 'Right child of 12'],
      answer: 1,
      frames: () => insertFrames([8, 4, 12, 2, 6], 7),
      why: '7 < 8 → left. 7 > 4 → right. 7 > 6 → right of 6.',
    },
    {
      id: 'inorder-q',
      question: 'You walk a binary search tree in-order (left, node, right). What comes out?',
      scene: scene(T(bstFrom(BASE))),
      options: ['Level by level', 'Values in sorted order', 'Root first, then leaves', 'Random order'],
      answer: 1,
      frames: inorderFrames,
      why: 'Everything smaller is visited before a node and everything bigger after it.',
    },
    {
      id: 'heap-1',
      question: 'Push 1 into this min-heap. Where does 1 end up?',
      scene: scene(H(hmk([2, 5, 3, 9, 6, 8]))),
      options: ['At the top (root)', 'As a leaf at the bottom', 'Halfway down', 'It depends on luck'],
      answer: 0,
      frames: () => heapPushFrames([2, 5, 3, 9, 6, 8], 1),
      why: '1 is smaller than everything, so it keeps swapping with its parent until it reaches the root.',
    },
  ],

  trace: { title: 'Searching a BST', code: SEARCH_CODE, frames: () => searchFrames([20, 10, 30, 5, 15, 25, 40, 12], 12, true) },

  build: {
    intro: [
      'Build a MinHeap on a Python list: push, pop (remove and return the smallest), peek, and len.',
      'For node i, children are 2i+1 and 2i+2, and the parent is (i−1)//2. push sifts up; pop moves the last item to the top and sifts down. Don’t use heapq.',
    ],
    starter: `class MinHeap:
    def __init__(self):
        self.a = []

    def __len__(self):
        return len(self.a)

    def peek(self):
        pass

    def push(self, x):
        pass

    def pop(self):
        pass
`,
    solution: `class MinHeap:
    def __init__(self):
        self.a = []

    def __len__(self):
        return len(self.a)

    def peek(self):
        return self.a[0]

    def push(self, x):
        a = self.a
        a.append(x)
        i = len(a) - 1
        while i > 0:
            p = (i - 1) // 2
            if a[p] <= a[i]:
                break
            a[p], a[i] = a[i], a[p]
            i = p

    def pop(self):
        a = self.a
        top = a[0]
        last = a.pop()
        if a:
            a[0] = last
            i = 0
            while True:
                l, r, m = 2 * i + 1, 2 * i + 2, i
                if l < len(a) and a[l] < a[m]:
                    m = l
                if r < len(a) and a[r] < a[m]:
                    m = r
                if m == i:
                    break
                a[i], a[m] = a[m], a[i]
                i = m
        return top
`,
    tests: [
      { code: 'h = MinHeap()\nfor x in [5, 2, 8, 1]: h.push(x)\nresult = (h.peek(), len(h))', show: 'push 5, 2, 8, 1 → peek', expected: '(1, 4)' },
      { code: 'h = MinHeap()\nfor x in [5, 2, 8, 1, 9, 3]: h.push(x)\nresult = [h.pop() for _ in range(6)]', show: 'pop everything', expected: '[1, 2, 3, 5, 8, 9]' },
      { code: 'h = MinHeap()\nh.push(4)\nresult = (h.pop(), len(h))', show: 'single item', expected: '(4, 0)' },
      { code: 'h = MinHeap()\nfor x in [3, 3, 1, 1]: h.push(x)\nresult = [h.pop() for _ in range(4)]', show: 'duplicates', expected: '[1, 1, 3, 3]' },
      { code: 'h = MinHeap()\nh.push((2, "write")); h.push((1, "read")); h.push((3, "sleep"))\nresult = h.pop()[1]', show: 'priority queue of (priority, task)', expected: '"read"' },
      { code: 'import random\nrandom.seed(4)\nxs = [random.randint(0, 10**6) for _ in range(20000)]\nh = MinHeap()\nfor x in xs: h.push(x)\nresult = [h.pop() for _ in range(20000)] == sorted(xs)', show: 'heap sort 20,000 numbers', expected: 'True' },
    ],
    builtin: {
      text: 'Python’s heapq turns a plain list into a min-heap. For a max-heap, push negated values. Balanced BSTs aren’t built in; sortedcontainers.SortedList is the usual library.',
      code: `import heapq
tasks = []
heapq.heappush(tasks, (2, "write"))
heapq.heappush(tasks, (1, "read"))
heapq.heappop(tasks)   # (1, 'read')
heapq.nsmallest(3, nums)`,
    },
  },

  fill: {
    intro: ['In-order traversal: left subtree, the node itself, then the right subtree.', 'Write the missing recursive call.'],
    code: `def inorder(node, out):
    if node is None:
        return
    ____
    out.append(node.val)
    inorder(node.right, out)`,
    answer: 'inorder(node.left, out)',
    setup: TREE_SETUP,
    tests: [
      { code: 'out = []\ninorder(build_tree([8, 4, 12, 2, 6, 10, 14]), out)\nresult = out', show: 'in-order of the BST [8,4,12,2,6,10,14]', expected: '[2, 4, 6, 8, 10, 12, 14]' },
      { code: 'out = []\ninorder(None, out)\nresult = out', show: 'empty tree', expected: '[]' },
      { code: 'out = []\ninorder(build_tree([1, None, 2, None, 3]), out)\nresult = out', show: 'right-leaning chain', expected: '[1, 2, 3]' },
    ],
  },

  wild: [
    { icon: '🗄️', title: 'Databases', text: 'Almost every database index is a B-tree: a wide, shallow, always-balanced tree. A billion rows are only about 4 levels deep.' },
    { icon: '🌐', title: 'Web pages', text: 'Every web page is a tree of elements (the DOM). Browsers traverse it to lay out and paint the page.' },
    { icon: '⏱️', title: 'Schedulers & simulations', text: 'Operating systems, game engines and event-driven simulations use heaps to always run the next-due event first.' },
    { icon: '🗺️', title: 'Maps & routing', text: 'Dijkstra’s shortest-path algorithm (topic 10) pulls the nearest unvisited place from a priority queue, millions of times per route.' },
  ],

  problems: [
    {
      id: 'height',
      title: 'How tall is the tree?',
      difficulty: 'easy',
      pattern: 'Recursive DFS',
      intro: ['Return the number of nodes on the longest path from the root down to a leaf. An empty tree has height 0.', 'A tree is its root plus two smaller trees.'],
      examples: [
        { input: 'height(build_tree([3, 9, 20, None, None, 15, 7]))', output: '3' },
        { input: 'height(None)', output: '0' },
      ],
      setup: TREE_SETUP,
      starter: `def height(root):
    pass
`,
      solution: `def height(root):
    if root is None:
        return 0
    return 1 + max(height(root.left), height(root.right))
`,
      tests: [
        { call: 'height(build_tree([3, 9, 20, None, None, 15, 7]))', expected: '3' },
        { call: 'height(None)', expected: '0' },
        { call: 'height(build_tree([1]))', expected: '1' },
        { call: 'height(build_tree([1, 2, None, 3, None, 4]))', expected: '4' },
        { call: 'height(build_tree(list(range(2000))))', expected: '11' },
      ],
      hints: ['Recursive DFS: the answer for a node comes from its children’s answers.', 'An empty tree is 0. Otherwise it’s 1 (this node) plus the taller of the left and right heights.', 'if root is None: return 0 → return 1 + max(height(left), height(right))'],
      complexity: { time: 'O(n)', space: 'O(h)' },
    },
    {
      id: 'level-sums',
      title: 'Sum each floor',
      difficulty: 'easy',
      pattern: 'Breadth-first (level order)',
      intro: ['Return a list with the sum of the values on each level, top to bottom.', 'Process the queue one level at a time: the queue length at the start of a level tells you how many nodes it has.'],
      examples: [{ input: 'level_sums(build_tree([1, 2, 3, 4, 5, None, 6]))', output: '[1, 5, 15]' }],
      setup: TREE_SETUP,
      starter: `def level_sums(root):
    pass
`,
      solution: `def level_sums(root):
    if root is None:
        return []
    out = []
    q = deque([root])
    while q:
        total = 0
        for _ in range(len(q)):
            node = q.popleft()
            total += node.val
            if node.left:
                q.append(node.left)
            if node.right:
                q.append(node.right)
        out.append(total)
    return out
`,
      tests: [
        { call: 'level_sums(build_tree([1, 2, 3, 4, 5, None, 6]))', expected: '[1, 5, 15]' },
        { call: 'level_sums(None)', expected: '[]' },
        { call: 'level_sums(build_tree([7]))', expected: '[7]' },
        { call: 'level_sums(build_tree([1, -2, 2, None, 5]))', expected: '[1, 0, 5]' },
        { call: 'len(level_sums(build_tree(list(range(5000)))))', expected: '13' },
      ],
      hints: ['Level order uses a queue (deque is already imported).', 'Start with the root in a queue. For each level, pop exactly len(queue) nodes, add their values, and push their children.', 'q = deque([root]) → while q: total = 0; repeat len(q) times: pop, add, push children → append total'],
      complexity: { time: 'O(n)', space: 'O(n)' },
    },
    {
      id: 'valid-bst',
      title: 'Is it really a search tree?',
      difficulty: 'medium',
      pattern: 'DFS with bounds',
      intro: [
        'Return True if the tree is a valid binary search tree: for every node, all values in its left subtree are strictly smaller and all in its right subtree strictly bigger.',
        'Checking only a node’s direct children is not enough. Pass down the allowed (low, high) range.',
      ],
      examples: [
        { input: 'is_bst(build_tree([5, 3, 8, 1, 4]))', output: 'True' },
        { input: 'is_bst(build_tree([5, 3, 8, 1, 6]))', output: 'False', why: '6 is in 5’s left subtree.' },
      ],
      setup: TREE_SETUP,
      starter: `def is_bst(root):
    pass
`,
      solution: `def is_bst(root):
    def ok(node, low, high):
        if node is None:
            return True
        if not (low < node.val < high):
            return False
        return ok(node.left, low, node.val) and ok(node.right, node.val, high)
    return ok(root, float("-inf"), float("inf"))
`,
      tests: [
        { call: 'is_bst(build_tree([5, 3, 8, 1, 4]))', expected: 'True' },
        { call: 'is_bst(build_tree([5, 3, 8, 1, 6]))', expected: 'False' },
        { call: 'is_bst(None)', expected: 'True' },
        { call: 'is_bst(build_tree([2, 2]))', expected: 'False' },
        { call: 'is_bst(build_tree([10, 5, 15, None, None, 12, 20]))', expected: 'True' },
        { call: 'is_bst(build_tree([10, 5, 15, None, None, 9, 20]))', expected: 'False' },
      ],
      hints: ['DFS with bounds: each node must fit inside a range set by its ancestors.', 'The root can be anything. Going left, the node’s value becomes the new upper bound; going right, it becomes the new lower bound.', 'ok(node, low, high): None → True; not low < val < high → False; return ok(left, low, val) and ok(right, val, high)'],
      complexity: { time: 'O(n)', space: 'O(h)' },
    },
  ],

  extra: [
    { name: 'Maximum Depth of Binary Tree', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', difficulty: 'easy' },
    { name: 'Invert Binary Tree', url: 'https://leetcode.com/problems/invert-binary-tree/', difficulty: 'easy' },
    { name: 'Binary Tree Level Order Traversal', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', difficulty: 'medium' },
    { name: 'Validate Binary Search Tree', url: 'https://leetcode.com/problems/validate-binary-search-tree/', difficulty: 'medium' },
    { name: 'Kth Smallest Element in a BST', url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/', difficulty: 'medium' },
    { name: 'Kth Largest Element in an Array', url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/', difficulty: 'medium' },
  ],

  quiz: [
    { q: 'You insert 1, 2, 3, …, 1000 in order into a plain (non-balancing) BST. Search now costs…', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 2, why: 'Every value goes right: the tree is a 1000-long chain.' },
    { q: 'What does a min-heap guarantee?', options: ['The whole array is sorted', 'Every parent ≤ its children, so the min is at the top', 'Left < node < right', 'All leaves are on one level'], answer: 1, why: 'Only parent–child order, which is cheap to maintain.' },
    { q: 'Which traversal uses a queue?', options: ['In-order', 'Pre-order', 'Post-order', 'Level order'], answer: 3, why: 'Level order is breadth-first: first in, first out.' },
  ],
};

export default topic;

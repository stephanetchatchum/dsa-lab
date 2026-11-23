import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cell, cost, Frames, line, region, scene, spread, txt } from '../../../lib/viz';
import type { DotP } from '../../../../types';
import { bitsLesson } from '../lessons/13-bits-spatial';

/* ---------------- bits ---------------- */
const bitsOf = (n: number, w = 8) => Array.from({ length: w }, (_, i) => (n >> (w - 1 - i)) & 1);
function bitRow(n: number, y: number, prefix: string, o: { label?: string; roles?: Record<number, Role>; w?: number; places?: boolean } = {}): Prim[] {
  const w = o.w ?? 8;
  const b = bitsOf(n, w);
  const xs = spread(w, 86, 560);
  const out: Prim[] = b.map((v, i) => cell(`${prefix}${i}`, xs[i], y, v, { w: 72, h: 62, role: o.roles?.[i] ?? (v ? 'curr' : 'muted'), sup: o.places ? String(2 ** (w - 1 - i)) : undefined }));
  if (o.label !== undefined) out.push(txt(`${prefix}L`, xs[0] - 70, y + 10, o.label, { size: 30, anchor: 'end' }));
  return out;
}

function hook(): Frame[] {
  const f = new Frames();
  f.add([...bitRow(0, 200, 'h', { places: true, label: '0' })], 'A row of eight light switches. Each one is a bit: off is 0, on is 1.');
  f.add([...bitRow(13, 200, 'h', { places: true, label: '13' })], 'Each switch is worth double the one to its right: 1, 2, 4, 8… Switches 8, 4 and 1 on make 13.');
  f.add([...bitRow(13, 200, 'h', { places: true, label: '13' }), txt('t', 560, 360, 'computers flip whole rows of switches in one step', { size: 30, role: 'new' })], 'Computers flip all the switches of a number in a single step. Bit tricks use that for speed and tiny memory.');
  return f.get();
}

function opsFrames(): Frame[] {
  const f = new Frames();
  const a = 12;
  const b = 10;
  const show = (op: string, r: number, say: string) =>
    f.add([...bitRow(a, 80, 'A', { label: String(a) }), ...bitRow(b, 170, 'B', { label: String(b) }), line('bar', 200, 222, 920, 222, { role: 'muted', width: 2 }), ...bitRow(r, 280, 'R', { label: `${op} → ${r}`, roles: Object.fromEntries(bitsOf(r).map((v, i) => [i, v ? 'done' : 'muted'])) })], say);
  show('&', a & b, 'AND keeps a 1 only where both rows have a 1. 12 and 10 gives 8.');
  show('|', a | b, 'OR keeps a 1 where either row has one: 14.');
  show('^', a ^ b, 'XOR keeps a 1 where they differ: 6. XOR twice with the same number undoes itself.');
  f.add([...bitRow(a, 80, 'A', { label: String(a) }), ...bitRow(a << 1, 280, 'R', { label: `<< 1 → ${a << 1}`, roles: Object.fromEntries(bitsOf(a << 1).map((v, i) => [i, v ? 'done' : 'muted'])) })], 'Shift left by one moves every bit up a place: it doubles the number. Shift right halves it.');
  const x = 44;
  f.add([...bitRow(x, 80, 'A', { label: String(x) }), ...bitRow(x - 1, 170, 'B', { label: String(x - 1) }), line('bar', 200, 222, 920, 222, { role: 'muted', width: 2 }), ...bitRow(x & (x - 1), 280, 'R', { label: `& → ${x & (x - 1)}`, roles: Object.fromEntries(bitsOf(x & (x - 1)).map((v, i) => [i, v ? 'done' : 'muted'])) })], 'A favourite trick: x AND x minus 1 switches off the lowest 1. Repeat until zero to count the ones.');
  return f.get();
}

function maskFrames(): Frame[] {
  const items = ['a', 'b', 'c'];
  const f = new Frames();
  for (let m = 0; m < 8; m++) {
    const chosen = items.filter((_, i) => (m >> (2 - i)) & 1);
    f.add(
      [...bitRow(m, 140, 'M', { w: 3, label: `mask ${m}` }), ...arrayRow(items, { y: 300, cx: 560, gap: 86, w: 72, prefix: 'it', idx: false, roles: Object.fromEntries(items.map((_, i) => [i, (m >> (2 - i)) & 1 ? 'done' : 'muted'])) }), txt('s', 560, 420, `{${chosen.join(', ')}}`, { size: 34, role: 'done' })],
      m === 0 ? 'Bitmasks: each bit says whether an item is in. Count from 0 to 7 and you list every subset of three items.' : m === 7 ? 'Mask 7 is all three. Eight masks, eight subsets, no recursion needed.' : `Mask ${m}: {${chosen.join(', ')}}.`,
    );
  }
  return f.get();
}

const COUNT_CODE = `def count_ones(x):
    count = 0
    while x:
        x &= x - 1
        count += 1
    return count`;

function countFrames(): Frame[] {
  const f = new Frames();
  let x = 44;
  let c = 0;
  f.add(bitRow(x, 200, 'C', { label: String(x) }), `Count the 1 bits in ${x}.`, { line: 2, vars: { x, count: c } });
  while (x) {
    const nx = x & (x - 1);
    f.add(bitRow(x, 200, 'C', { label: String(x), roles: { [7 - Math.log2(x & -x)]: 'danger' } }), `The lowest 1 in ${x} is about to switch off.`, { line: 4, vars: { x, count: c } });
    x = nx;
    c++;
    f.add(bitRow(x, 200, 'C', { label: String(x) }), `x is now ${x}. count is ${c}.`, { line: 5, vars: { x, count: c } });
  }
  f.add(bitRow(0, 200, 'C', { label: '0' }), `Zero: done. ${c} ones, and the loop ran only ${c} times, not 8.`, { line: 6, vars: { count: c } });
  return f.get();
}

/* ---------------- spatial: quadtree ---------------- */
type Pt = [number, number];
const SQ = { x: 330, y: 20, s: 400 };
const toScreen = ([x, y]: Pt): [number, number] => [SQ.x + x * 4, SQ.y + y * 4];
interface Quad {
  x: number;
  y: number;
  s: number;
  pts: Pt[];
  kids: Quad[];
}
function buildQuad(pts: Pt[], x = 0, y = 0, s = 100, depth = 0): Quad {
  const inside = pts.filter(([px, py]) => px >= x && px < x + s && py >= y && py < y + s);
  if (inside.length <= 1 || depth >= 4) return { x, y, s, pts: inside, kids: [] };
  const h = s / 2;
  return { x, y, s, pts: inside, kids: [buildQuad(inside, x, y, h, depth + 1), buildQuad(inside, x + h, y, h, depth + 1), buildQuad(inside, x, y + h, h, depth + 1), buildQuad(inside, x + h, y + h, h, depth + 1)] };
}
function quadPrims(q: Quad, o: { hl?: (q: Quad) => Role | undefined; maxDepth?: number } = {}, depth = 0, out: Prim[] = [], path = 'q'): Prim[] {
  const role = o.hl?.(q);
  out.push(region(path, SQ.x + (q.x + q.s / 2) * 4, SQ.y + (q.y + q.s / 2) * 4, q.s * 4, q.s * 4, { role: role ?? 'muted', dashed: depth > 0 }));
  if (o.maxDepth === undefined || depth < o.maxDepth) q.kids.forEach((k, i) => quadPrims(k, o, depth + 1, out, `${path}${i}`));
  return out;
}
const dots = (pts: Pt[], roles: Record<number, Role> = {}): DotP[] => pts.map((p, i) => ({ kind: 'dot', id: `p${i}`, x: toScreen(p)[0], y: toScreen(p)[1], r: 9, role: roles[i] ?? 'new' }));
const PTS: Pt[] = [
  [10, 12],
  [22, 30],
  [70, 15],
  [85, 40],
  [60, 70],
  [15, 80],
  [30, 65],
  [90, 90],
  [55, 52],
  [40, 20],
];

function quadFrames(): Frame[] {
  const f = new Frames();
  const root = buildQuad(PTS);
  f.add([...quadPrims({ ...root, kids: [] }), ...dots(PTS)], 'A map with ten points of interest. Checking all of them for every search is O of n.');
  for (let d = 0; d <= 3; d++) f.add([...quadPrims(root, { maxDepth: d + 1 }), ...dots(PTS)], d === 0 ? 'A quadtree splits a square into four quarters…' : d === 1 ? '…and keeps splitting any quarter that holds more than one point.' : 'Crowded areas get small squares, empty areas stay big.');
  const qx = [0, 0, 45, 45] as const;
  const inQ = (q: Quad) => !(q.x >= qx[2] || q.x + q.s <= qx[0] || q.y >= qx[3] || q.y + q.s <= qx[1]);
  const hits = Object.fromEntries(PTS.map((p, i) => [i, p[0] < 45 && p[1] < 45 ? ('done' as Role) : ('muted' as Role)]));
  f.add([...quadPrims(root, { hl: (q) => (inQ(q) ? 'curr' : undefined) }), ...dots(PTS, hits), region('query', SQ.x + 22.5 * 4, SQ.y + 22.5 * 4, 180, 180, { role: 'done', label: 'search here' })], 'Find points in the top-left box: only squares that touch it are opened. The rest of the map is skipped entirely.', {
    cost: cost('range query', 'O(log n + k)'),
  });
  f.add([...quadPrims(root), ...dots(PTS, hits), txt('t', 530, 470, 'games: collisions · maps: nearby places · physics: Barnes–Hut', { size: 24 })], 'Games use this for collisions, maps for nearby places, and galaxy simulations to group far-away stars.');
  return f.get();
}

/* ---------------- spatial: k-d tree ---------------- */
function kdFrames(): Frame[] {
  const f = new Frames();
  const lines: Prim[] = [];
  const build = (pts: Pt[], x0: number, y0: number, x1: number, y1: number, depth: number) => {
    if (pts.length <= 1 || depth > 3) return;
    const axis = depth % 2;
    const sorted = [...pts].sort((a, b) => a[axis] - b[axis]);
    const m = sorted[Math.floor(sorted.length / 2)];
    const id = `kd${lines.length}`;
    if (axis === 0) lines.push(line(id, toScreen([m[0], y0])[0], toScreen([m[0], y0])[1], toScreen([m[0], y1])[0], toScreen([m[0], y1])[1], { role: depth === 0 ? 'head' : 'second', width: 4 }));
    else lines.push(line(id, toScreen([x0, m[1]])[0], toScreen([x0, m[1]])[1], toScreen([x1, m[1]])[0], toScreen([x1, m[1]])[1], { role: 'curr', width: 4 }));
    f.add([region('box', SQ.x + 200, SQ.y + 200, 400, 400, { role: 'muted' }), ...lines, ...dots(PTS, { [PTS.indexOf(m)]: 'done' })], depth === 0 ? 'A k-d tree splits at the median point: first by x, a vertical line.' : axis === 1 ? 'Then each side splits by y, a horizontal line.' : 'Then x again, alternating.');
    const lo = sorted.slice(0, Math.floor(sorted.length / 2));
    const hi = sorted.slice(Math.floor(sorted.length / 2) + 1);
    if (axis === 0) {
      build(lo, x0, y0, m[0], y1, depth + 1);
      build(hi, m[0], y0, x1, y1, depth + 1);
    } else {
      build(lo, x0, y0, x1, m[1], depth + 1);
      build(hi, x0, m[1], x1, y1, depth + 1);
    }
  };
  f.add([region('box', SQ.x + 200, SQ.y + 200, 400, 400, { role: 'muted' }), ...dots(PTS)], 'Same ten points, another idea.');
  build(PTS, 0, 0, 100, 100, 0);
  f.add([region('box', SQ.x + 200, SQ.y + 200, 400, 400, { role: 'muted' }), ...lines, ...dots(PTS), txt('t', 530, 470, 'nearest neighbour ≈ O(log n) per query on typical data', { size: 24 })], 'Each line is a node of a balanced binary tree. A nearest-neighbour search walks down one side and only crosses a line when a closer point could be over there.');
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  pts: Pt[];
}

const topic: Topic = {
  id: 'bits-spatial',
  order: 13,
  title: 'Bits & spatial structures',
  short: 'Bit tricks, bitmasks, quadtrees and k-d trees.',
  icon: '🗺️',
  costs: [cost('AND / OR / XOR / shift', 'O(1)'), cost('count 1-bits (Kernighan)', 'O(k)'), cost('all subsets via masks', 'O(2ⁿ)'), cost('quadtree range query', 'O(log n + k)'), cost('k-d nearest (typical)', 'O(log n)')],

  intro: {
    what: "Two tools for speed. Bit manipulation treats a number as a row of on/off switches. Spatial structures divide space so you can find what is nearby without checking everything.",
    why: "Bits give speed and tiny memory use. Spatial structures run collision detection in games, “near me” searches in maps and large physics simulations.",
    builds: "Trees from topic 8 and the subsets idea from topic 6.",
    goals: ["Use AND, OR, XOR and shifts", "Count bits and list subsets with bitmasks", "Explain how a quadtree and a k-d tree split space", "Use spatial hashing to avoid O(n²) neighbour checks"],
  },

  hook: { frames: hook, lines: ['A number is a row of on/off switches called bits.', 'Spatial structures split space into regions so you can skip everything far away.'] },

  watch: [
    { id: 'ops', title: 'Bit operations', frames: opsFrames, costs: [cost('AND / OR / XOR / shift', 'O(1)')] },
    { id: 'count', title: 'Counting 1s', frames: countFrames, code: COUNT_CODE, costs: [cost('count ones', 'O(k)', 'O(1)')] },
    { id: 'masks', title: 'Bitmask subsets', frames: maskFrames, costs: [cost('all subsets', 'O(2ⁿ)')] },
    { id: 'quad', title: 'Quadtree', frames: quadFrames, costs: [cost('insert', 'O(log n)'), cost('range query', 'O(log n + k)')] },
    { id: 'kd', title: 'k-d tree', frames: kdFrames, costs: [cost('build', 'O(n log n)'), cost('nearest (typical)', 'O(log n)')] },
  ],

  lesson: bitsLesson({ hook, ops: opsFrames, count: countFrames, masks: maskFrames, quad: quadFrames, kd: kdFrames }),
  recall: {
    prompt: 'What does XOR do, and why is x & (x − 1) useful? Then: how does a quadtree make “what’s near me?” fast?',
    model:
      'XOR gives 1 where two bits differ, so XOR-ing the same number twice cancels out. x & (x − 1) switches off the lowest 1-bit, so repeating it counts the ones in as many steps as there are ones. A quadtree splits space into quarters, and keeps splitting busy areas, so a search only opens the squares that touch the area you care about and skips the rest.',
    keywords: [
      ['differ', 'different', 'cancel', 'undo'],
      ['lowest', 'clears', 'switches off', 'removes', 'rightmost'],
      ['quarter', 'four', 'split', 'divide'],
      ['skip', 'ignore', 'only', 'touch', 'nearby'],
    ],
  },

  play: {
    intro: 'Drop points on the map and watch the quadtree split. Or type numbers to see their bits.',
    init: (): S => ({ pts: PTS.slice(0, 5) }),
    view: (s: S) => scene([...quadPrims(buildQuad(s.pts)), ...dots(s.pts)]),
    ops: [
      {
        id: 'pt',
        label: 'add point (x, y 0–99)',
        args: [
          { name: 'x', kind: 'int', default: 75 },
          { name: 'y', kind: 'int', default: 75 },
        ],
        run: (s: S, a) => {
          const p: Pt = [Math.max(0, Math.min(99, Number(a.x))), Math.max(0, Math.min(99, Number(a.y)))];
          if (s.pts.length >= 24) return { state: s, frames: [{ scene: scene([...quadPrims(buildQuad(s.pts)), ...dots(s.pts)]), say: 'The map is full. Reset to start over.' }] };
          const pts = [...s.pts, p];
          return {
            state: { pts },
            frames: [
              { scene: scene([...quadPrims(buildQuad(s.pts)), ...dots(pts, { [pts.length - 1]: 'curr' })]), say: `New point at ${p[0]}, ${p[1]}.` },
              { scene: scene([...quadPrims(buildQuad(pts)), ...dots(pts, { [pts.length - 1]: 'curr' })]), say: 'Any square with more than one point splits into four.' },
            ],
            cost: cost('insert', 'O(log n)'),
          };
        },
      },
      {
        id: 'query',
        label: 'search box from (0,0) to (x,y)',
        args: [
          { name: 'x', kind: 'int', default: 50 },
          { name: 'y', kind: 'int', default: 50 },
        ],
        run: (s: S, a) => {
          const X = Math.max(1, Math.min(100, Number(a.x)));
          const Y = Math.max(1, Math.min(100, Number(a.y)));
          const root = buildQuad(s.pts);
          let opened = 0;
          let total = 0;
          const touch = (q: Quad) => {
            const t = !(q.x >= X || q.y >= Y);
            return t;
          };
          const count = (q: Quad) => {
            total++;
            if (touch(q)) opened++;
            q.kids.forEach(count);
          };
          count(root);
          const hits = Object.fromEntries(s.pts.map((p, i) => [i, p[0] < X && p[1] < Y ? ('done' as Role) : ('muted' as Role)]));
          return {
            state: s,
            frames: [{ scene: scene([...quadPrims(root, { hl: (q) => (touch(q) ? 'curr' : undefined) }), ...dots(s.pts, hits), region('query', SQ.x + (X / 2) * 4, SQ.y + (Y / 2) * 4, X * 4, Y * 4, { role: 'done' })]), say: `Opened ${opened} of ${total} squares. Found ${Object.values(hits).filter((r) => r === 'done').length} points.` }],
            cost: cost('range query', 'O(log n + k)'),
          };
        },
      },
      {
        id: 'bits',
        label: 'show bits of n (0–255)',
        args: [{ name: 'n', kind: 'int', default: 42 }],
        run: (s: S, a) => {
          const n = Math.max(0, Math.min(255, Number(a.n)));
          return { state: s, frames: [{ scene: scene(bitRow(n, 200, 'S', { places: true, label: String(n) })), say: `${n} in binary is ${n.toString(2)}.` }], cost: cost('read bits', 'O(1)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'and',
      question: 'What is 6 & 3?',
      scene: scene([...bitRow(6, 120, 'A', { label: '6', w: 4 }), ...bitRow(3, 220, 'B', { label: '3', w: 4 })]),
      options: ['9', '2', '7', '5'],
      answer: 1,
      frames: () => [{ scene: scene([...bitRow(6, 120, 'A', { label: '6', w: 4 }), ...bitRow(3, 220, 'B', { label: '3', w: 4 }), ...bitRow(2, 340, 'R', { label: '= 2', w: 4, roles: { 0: 'muted', 1: 'muted', 2: 'done', 3: 'muted' } })]), say: '0110 AND 0011: only the 2s place is on in both. The answer is 2.' }],
      why: '110 & 011 = 010 = 2. Only bits on in both survive.',
    },
    {
      id: 'ones-255',
      question: 'How many 1 bits are in 255?',
      scene: scene([txt('t', 500, 200, '255', { size: 70, role: 'curr' })]),
      options: ['2', '5', '8', '255'],
      answer: 2,
      frames: () => [{ scene: scene(bitRow(255, 200, 'S', { places: true, label: '255' })), say: '255 is 1 1 1 1 1 1 1 1: all eight bits on. 255 is 2 to the 8, minus 1.' }],
      why: '255 = 2⁸ − 1 = 11111111.',
    },
    {
      id: 'quad-skip',
      question: 'You search only the top-left quarter of the map. How many of the four top-level squares must the quadtree open?',
      scene: scene([...quadPrims(buildQuad(PTS), { maxDepth: 1 }), ...dots(PTS)]),
      options: ['1', '2', '4', 'All of them, every time'],
      answer: 0,
      frames: () => quadFrames().slice(-2),
      why: 'Only the top-left square touches the query box. The other three quarters, and all their points, are skipped.',
    },
  ],

  trace: { title: 'Counting 1-bits with x & (x − 1)', code: COUNT_CODE, frames: countFrames },

  build: {
    intro: [
      'Build a point Quadtree over the square [0, size) × [0, size). Each node holds up to capacity points; when full, it splits into four children and passes points down.',
      'query(x0, y0, x1, y1) returns every point with x0 ≤ x < x1 and y0 ≤ y < y1, skipping nodes whose square doesn’t overlap the box.',
    ],
    starter: `class Quadtree:
    def __init__(self, x, y, size, capacity=4):
        self.x, self.y, self.size = x, y, size
        self.capacity = capacity
        self.points = []
        self.children = None

    def contains(self, px, py):
        return self.x <= px < self.x + self.size and self.y <= py < self.y + self.size

    def insert(self, px, py):
        # return False if the point is outside this square
        pass

    def _split(self):
        pass

    def query(self, x0, y0, x1, y1, out=None):
        pass
`,
    solution: `class Quadtree:
    def __init__(self, x, y, size, capacity=4):
        self.x, self.y, self.size = x, y, size
        self.capacity = capacity
        self.points = []
        self.children = None

    def contains(self, px, py):
        return self.x <= px < self.x + self.size and self.y <= py < self.y + self.size

    def insert(self, px, py):
        if not self.contains(px, py):
            return False
        if self.children is None:
            if len(self.points) < self.capacity or self.size <= 1e-9:
                self.points.append((px, py))
                return True
            self._split()
        return any(c.insert(px, py) for c in self.children)

    def _split(self):
        h = self.size / 2
        self.children = [
            Quadtree(self.x, self.y, h, self.capacity),
            Quadtree(self.x + h, self.y, h, self.capacity),
            Quadtree(self.x, self.y + h, h, self.capacity),
            Quadtree(self.x + h, self.y + h, h, self.capacity),
        ]
        for p in self.points:
            any(c.insert(*p) for c in self.children)
        self.points = []

    def query(self, x0, y0, x1, y1, out=None):
        if out is None:
            out = []
        if x1 <= self.x or x0 >= self.x + self.size or y1 <= self.y or y0 >= self.y + self.size:
            return out
        for px, py in self.points:
            if x0 <= px < x1 and y0 <= py < y1:
                out.append((px, py))
        if self.children:
            for c in self.children:
                c.query(x0, y0, x1, y1, out)
        return out
`,
    tests: [
      { code: 'q = Quadtree(0, 0, 100)\nfor p in [(10, 10), (60, 60), (20, 80)]: q.insert(*p)\nresult = sorted(q.query(0, 0, 50, 50))', show: 'three points, query top-left', expected: '[(10, 10)]' },
      { code: 'q = Quadtree(0, 0, 100)\nresult = (q.insert(150, 5), q.query(0, 0, 100, 100))', show: 'point outside is rejected', expected: '(False, [])' },
      { code: 'q = Quadtree(0, 0, 100, capacity=1)\nfor p in [(1, 1), (2, 2), (3, 3)]: q.insert(*p)\nresult = (q.children is not None, sorted(q.query(0, 0, 100, 100)))', show: 'splits when full', expected: '(True, [(1, 1), (2, 2), (3, 3)])' },
      { code: 'import random\nrandom.seed(7)\npts = [(random.uniform(0, 1000), random.uniform(0, 1000)) for _ in range(3000)]\nq = Quadtree(0, 0, 1000)\nfor p in pts: q.insert(*p)\nbox = (200, 300, 450, 380)\nbrute = sorted(p for p in pts if 200 <= p[0] < 450 and 300 <= p[1] < 380)\nresult = sorted(q.query(*box)) == brute', show: '3,000 random points vs brute force', expected: 'True' },
    ],
    builtin: {
      text: 'For real work, scipy.spatial.KDTree (and cKDTree) answers nearest-neighbour and radius queries; games use quadtrees, octrees or BVHs for collisions.',
      code: `from scipy.spatial import KDTree
tree = KDTree(points)
dist, idx = tree.query([5.0, 3.2], k=3)   # 3 nearest
tree.query_ball_point([5, 3], r=2.0)`,
    },
  },

  fill: {
    intro: ['state is a row of lights stored as bits. Each switch number flips (toggles) one light.', 'Write the one line that flips light s.'],
    code: `def toggle_lights(state, switches):
    for s in switches:
        ____
    return state`,
    answer: 'state ^= 1 << s',
    tests: [
      { call: 'toggle_lights(0, [0, 2])', expected: '5' },
      { call: 'toggle_lights(5, [0])', expected: '4' },
      { call: 'toggle_lights(0, [3, 3])', expected: '0' },
      { call: 'toggle_lights(255, list(range(8)))', expected: '0' },
    ],
  },

  wild: [
    { icon: '🎮', title: 'Games & physics', text: 'Quadtrees, octrees and bounding-volume trees let engines test only nearby objects for collisions. Barnes–Hut uses an octree for gravity.' },
    { icon: '📍', title: 'Maps & “near me”', text: 'Finding the 5 closest cafés uses k-d trees, R-trees or geohashes over millions of places.' },
    { icon: '🌐', title: 'Networking', text: 'IP subnet masks are bit ANDs. Checksums and hashes are built from XORs and shifts.' },
    { icon: '♟️', title: 'Chess & databases', text: 'Chess engines store a board as 64-bit “bitboards” and compute moves with shifts. Databases use bitmap indexes and Bloom filters.' },
  ],

  problems: [
    {
      id: 'lone',
      title: 'The unpaired sensor',
      difficulty: 'easy',
      pattern: 'XOR cancels pairs',
      intro: ['Every sensor ID in ids appears exactly twice, except one that appears once. Return that one.', 'Aim for O(1) extra memory: XOR of a number with itself is 0.'],
      examples: [{ input: 'unpaired([4, 1, 2, 1, 2])', output: '4' }],
      starter: `def unpaired(ids):
    pass
`,
      solution: `def unpaired(ids):
    x = 0
    for v in ids:
        x ^= v
    return x
`,
      tests: [
        { call: 'unpaired([4, 1, 2, 1, 2])', expected: '4' },
        { call: 'unpaired([7])', expected: '7' },
        { call: 'unpaired([0, 5, 5])', expected: '0' },
        { call: 'unpaired([-3, 9, 9])', expected: '-3' },
        { call: 'unpaired(list(range(100000)) * 2 + [123456])', expected: '123456' },
      ],
      hints: ['XOR is its own undo: a ^ a = 0 and a ^ 0 = a, in any order.', 'XOR every ID together. Each pair cancels to 0, leaving the single one.', 'x = 0 → for v: x ^= v → return x'],
      complexity: { time: 'O(n)', space: 'O(1)' },
    },
    {
      id: 'ones-table',
      title: 'Ones for every number',
      difficulty: 'easy',
      pattern: 'Bits + DP',
      intro: ['Return a list where entry i is the number of 1 bits in i, for every i from 0 to n.', 'Reuse earlier answers: i has the same bits as i >> 1, plus its last bit.'],
      examples: [{ input: 'ones_table(5)', output: '[0, 1, 1, 2, 1, 2]' }],
      starter: `def ones_table(n):
    pass
`,
      solution: `def ones_table(n):
    out = [0] * (n + 1)
    for i in range(1, n + 1):
        out[i] = out[i >> 1] + (i & 1)
    return out
`,
      tests: [
        { call: 'ones_table(5)', expected: '[0, 1, 1, 2, 1, 2]' },
        { call: 'ones_table(0)', expected: '[0]' },
        { call: 'ones_table(8)[-1]', expected: '1' },
        { call: 'sum(ones_table(1023))', expected: '5120' },
        { call: 'ones_table(200000)[131071]', expected: '17' },
      ],
      hints: ['DP over numbers: shifting right drops the last bit, which you already counted.', 'ones(i) = ones(i >> 1) + (i & 1). Fill the list from 1 upward.', 'out = [0]*(n+1) → for i in 1..n: out[i] = out[i >> 1] + (i & 1) → return out'],
      complexity: { time: 'O(n)', space: 'O(n)' },
    },
    {
      id: 'close-pairs',
      title: 'Too-close particles',
      difficulty: 'medium',
      pattern: 'Spatial hashing (grid buckets)',
      intro: [
        'points is a list of (x, y) particles. Count the pairs whose distance is at most d.',
        'Checking every pair is O(n²) and too slow for 8,000 points. Put points into grid cells of size d: a close partner can only be in the same or a neighbouring cell.',
      ],
      examples: [{ input: 'close_pairs([(0, 0), (1, 0), (5, 5)], 1.5)', output: '1' }],
      starter: `def close_pairs(points, d):
    pass
`,
      solution: `def close_pairs(points, d):
    grid = {}
    for i, (x, y) in enumerate(points):
        grid.setdefault((int(x // d), int(y // d)), []).append(i)
    count = 0
    dd = d * d
    for (cx, cy), members in grid.items():
        for nx in (cx - 1, cx, cx + 1):
            for ny in (cy - 1, cy, cy + 1):
                others = grid.get((nx, ny))
                if not others:
                    continue
                for i in members:
                    xi, yi = points[i]
                    for j in others:
                        if j > i:
                            dx = points[j][0] - xi
                            dy = points[j][1] - yi
                            if dx * dx + dy * dy <= dd:
                                count += 1
    return count
`,
      tests: [
        { call: 'close_pairs([(0, 0), (1, 0), (5, 5)], 1.5)', expected: '1' },
        { call: 'close_pairs([], 1)', expected: '0' },
        { call: 'close_pairs([(0, 0), (0, 0), (0, 0)], 0.5)', expected: '3' },
        { call: 'close_pairs([(0, 0), (3, 4)], 5)', expected: '1' },
        { call: 'close_pairs([(-1, -1), (-1.5, -1.2), (10, 10)], 1)', expected: '1' },
        { code: 'import random\nrandom.seed(13)\npts = [(random.uniform(0, 1000), random.uniform(0, 1000)) for _ in range(8000)]\nresult = close_pairs(pts, 6.0)', show: '8,000 random particles, d = 6', expected: '3624' },
      ],
      hints: [
        'Spatial hashing: bucket points by (x // d, y // d). Anything within d is in the same or one of the 8 neighbouring buckets.',
        'Build a dict from cell to point indexes. For each cell, compare its points with points in the 9 cells around it, counting each pair once (only j > i).',
        'grid[(x//d, y//d)].append(i) → for each cell, for its 9 neighbours, for i in cell, j in neighbour, j > i: if dx² + dy² <= d²: count += 1',
      ],
      complexity: { time: 'O(n) typical', space: 'O(n)' },
    },
  ],

  extra: [
    { name: 'Single Number', url: 'https://leetcode.com/problems/single-number/', difficulty: 'easy' },
    { name: 'Number of 1 Bits', url: 'https://leetcode.com/problems/number-of-1-bits/', difficulty: 'easy' },
    { name: 'Counting Bits', url: 'https://leetcode.com/problems/counting-bits/', difficulty: 'easy' },
    { name: 'Power of Two', url: 'https://leetcode.com/problems/power-of-two/', difficulty: 'easy' },
    { name: 'Subsets (bitmask approach)', url: 'https://leetcode.com/problems/subsets/', difficulty: 'medium' },
    { name: 'K Closest Points to Origin', url: 'https://leetcode.com/problems/k-closest-points-to-origin/', difficulty: 'medium' },
  ],

  quiz: [
    { q: 'What does x ^ x equal, for any x?', options: ['x', '2x', '0', '1'], answer: 2, why: 'Every bit is the same as itself, so XOR gives all zeros.' },
    { q: 'x << 3 is the same as…', options: ['x + 3', 'x × 8', 'x ÷ 8', 'x³'], answer: 1, why: 'Each left shift doubles: three shifts multiply by 2³ = 8.' },
    { q: 'Why is a quadtree range query fast?', options: ['It sorts the points', 'It skips whole squares that don’t touch the search box', 'It uses hashing', 'It only stores four points'], answer: 1, why: 'Entire regions, and every point inside them, are ruled out at once.' },
  ],
};

export default topic;

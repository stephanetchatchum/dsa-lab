import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cell, cost, edge, Frames, scene, spread, txt } from '../../../lib/viz';
import { graphsLesson } from '../lessons/10-graphs';

/* ---------------- a fixed, readable graph ---------------- */
const P: Record<string, [number, number]> = {
  A: [110, 140],
  B: [320, 70],
  C: [320, 290],
  D: [540, 160],
  E: [540, 360],
  F: [770, 90],
  G: [790, 300],
};
type E3 = [string, string, number];
const EDGES: E3[] = [
  ['A', 'B', 4],
  ['A', 'C', 1],
  ['B', 'D', 1],
  ['C', 'D', 5],
  ['C', 'E', 8],
  ['D', 'F', 3],
  ['E', 'G', 2],
  ['F', 'G', 2],
];
const NODES = Object.keys(P);
const adj = (edges: E3[]) => {
  const g: Record<string, [string, number][]> = Object.fromEntries(NODES.map((n) => [n, []]));
  for (const [a, b, w] of edges) {
    g[a].push([b, w]);
    g[b].push([a, w]);
  }
  for (const k of NODES) g[k].sort((x, y) => x[0].localeCompare(y[0]));
  return g;
};
const ekey = (a: string, b: string) => (a < b ? `${a}${b}` : `${b}${a}`);

function G(
  o: { roles?: Record<string, Role>; sub?: Record<string, string>; edgeRoles?: Record<string, Role>; weights?: boolean; edges?: E3[]; glow?: string[]; extra?: Prim[] } = {},
): Prim[] {
  const edges = o.edges ?? EDGES;
  const out: Prim[] = NODES.map((n) => cell(n, P[n][0], P[n][1], n, { shape: 'circle', w: 64, role: o.roles?.[n], sub: o.sub?.[n], glow: o.glow?.includes(n) }));
  for (const [a, b, w] of edges) out.push(edge(a, b, { id: `g${ekey(a, b)}`, directed: false, role: o.edgeRoles?.[ekey(a, b)], label: o.weights ? String(w) : undefined }));
  return [...out, ...(o.extra ?? [])];
}
const row = (label: string, items: string[], y = 450, role: Role = 'second') => [
  txt(`rl${label}`, 70, y + 8, label, { size: 24, anchor: 'start' }),
  ...(items.length ? arrayRow(items, { y, gap: 74, w: 64, cx: 240 + (items.length * 74) / 2, prefix: `r${label}_`, idx: false, roles: { 0: role } }) : [txt(`re${label}`, 260, y + 8, '(empty)', { size: 24, anchor: 'start' })]),
];

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  f.add(G({ extra: [txt('t', 500, 450, 'places + roads', { size: 30 })] }), 'A map is places joined by roads. That’s a graph: nodes joined by edges.');
  f.add(G({ weights: true, extra: [txt('t', 500, 450, 'roads have lengths: weighted edges', { size: 30 })] }), 'Roads have lengths, so the edges get weights.');
  f.add(G({ weights: true, roles: { A: 'head', G: 'done' }, edgeRoles: { AB: 'curr', BD: 'curr', DF: 'curr', FG: 'curr' }, extra: [txt('t', 500, 450, 'A → G: shortest is 10', { size: 30, role: 'curr' })] }), 'Your GPS asks: what’s the shortest way from A to G? Friend suggestions, course prerequisites and the internet are graphs too.');
  return f.get();
}

/* ---------------- watch ---------------- */
function adjacencyFrames(): Frame[] {
  const g = adj(EDGES);
  const f = new Frames();
  const lines = (hl?: string) =>
    NODES.map((n, i) => txt(`adj${n}`, 900, 70 + i * 50, `${n}: ${g[n].map((x) => x[0]).join(' ')}`, { size: 28, anchor: 'start', role: n === hl ? 'curr' : undefined, hand: false }));
  f.add([...G(), ...lines()], 'In code we store a graph as an adjacency list: each node maps to its neighbours.');
  f.add([...G({ roles: { C: 'curr', A: 'new', D: 'new', E: 'new' }, edgeRoles: { AC: 'curr', CD: 'curr', CE: 'curr' } }), ...lines('C')], 'C’s list is A, D, E. Finding a node’s neighbours costs just the length of its list.');
  f.add([...G(), ...lines(), txt('sz', 500, 450, `V = ${NODES.length} nodes, E = ${EDGES.length} edges → memory O(V + E)`, { size: 28, role: 'curr' })], 'Memory is O of V plus E. Most graph algorithms visit each node and edge once: O of V plus E time.');
  return f.get();
}

const BFS_CODE = `from collections import deque

def bfs(graph, start):
    seen = {start}
    queue = deque([start])
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nb in graph[node]:
            if nb not in seen:
                seen.add(nb)
                queue.append(nb)
    return order`;

function bfsFrames(start = 'A', edges: E3[] = EDGES, withLines = false): Frame[] {
  const g = adj(edges);
  const f = new Frames();
  const dist: Record<string, number> = { [start]: 0 };
  const q = [start];
  const order: string[] = [];
  const L = (l: number) => (withLines ? { line: l } : {});
  const pic = (cur?: string) => {
    const roles: Record<string, Role> = {};
    for (const n of Object.keys(dist)) roles[n] = order.includes(n) ? 'done' : 'second';
    if (cur) roles[cur] = 'curr';
    return [...G({ roles, edges, sub: Object.fromEntries(Object.entries(dist).map(([k, v]) => [k, `d=${v}`])) }), ...row('queue', q, 450)];
  };
  f.add(pic(), `Breadth-first search from ${start}. It explores in rings: everything 1 step away, then 2 steps…`, { ...L(5), vars: { queue: `[${q.join(', ')}]` } });
  while (q.length) {
    const n = q.shift()!;
    order.push(n);
    const fresh = g[n].map((x) => x[0]).filter((x) => !(x in dist));
    for (const x of fresh) {
      dist[x] = dist[n] + 1;
      q.push(x);
    }
    f.add(pic(n), fresh.length ? `Take ${n} from the front. Queue its new neighbours ${fresh.join(', ')}, at distance ${dist[n] + 1}.` : `Take ${n}. No new neighbours.`, {
      ...L(fresh.length ? 13 : 8),
      vars: { node: n, queue: `[${q.join(', ')}]`, order: order.join('') },
    });
  }
  f.add(pic(), 'Every node got the fewest number of hops from the start. BFS finds shortest paths when all edges count the same. O of V plus E.', { ...L(14), vars: { order: order.join('') } });
  return f.get();
}

function dfsFrames(start = 'A'): Frame[] {
  const g = adj(EDGES);
  const f = new Frames();
  const seen = new Set<string>();
  const stack: string[] = [];
  const order: string[] = [];
  const treeEdges: Record<string, Role> = {};
  const pic = (cur?: string) => {
    const roles: Record<string, Role> = {};
    seen.forEach((n) => (roles[n] = 'done'));
    stack.forEach((n) => (roles[n] = 'second'));
    if (cur) roles[cur] = 'curr';
    return [...G({ roles, edgeRoles: treeEdges, sub: Object.fromEntries(order.map((n, i) => [n, `#${i + 1}`])) }), ...row('path', stack, 450)];
  };
  const go = (n: string, parent?: string) => {
    seen.add(n);
    stack.push(n);
    order.push(n);
    if (parent) treeEdges[ekey(parent, n)] = 'curr';
    f.add(pic(n), parent ? `From ${parent}, dive into ${n}.` : `Depth-first search from ${n}: go as deep as possible before backing up.`);
    for (const [nb] of g[n]) if (!seen.has(nb)) go(nb, n);
    stack.pop();
    if (stack.length) f.add(pic(stack[stack.length - 1]), `${n} has no unvisited neighbours. Back up to ${stack[stack.length - 1]}.`);
  };
  go(start);
  f.add(pic(), 'DFS uses recursion (a stack). It’s great for exploring every corner: mazes, connected regions, cycles. Also O of V plus E.');
  return f.get();
}

function dijkstraFrames(start = 'A'): Frame[] {
  const g = adj(EDGES);
  const f = new Frames();
  const dist: Record<string, number> = Object.fromEntries(NODES.map((n) => [n, Infinity]));
  dist[start] = 0;
  const done = new Set<string>();
  let pq: [number, string][] = [[0, start]];
  const via: Record<string, string> = {};
  const pic = (cur?: string, hot: string[] = []) => {
    const roles: Record<string, Role> = {};
    done.forEach((n) => (roles[n] = 'done'));
    if (cur) roles[cur] = 'curr';
    const edgeRoles: Record<string, Role> = Object.fromEntries(Object.entries(via).map(([n, p]) => [ekey(n, p), 'done' as Role]));
    hot.forEach((k) => (edgeRoles[k] = 'curr'));
    return [
      ...G({ roles, weights: true, edgeRoles, sub: Object.fromEntries(NODES.map((n) => [n, dist[n] === Infinity ? '∞' : String(dist[n])])) }),
      ...row(
        'heap',
        [...pq].sort((a, b) => a[0] - b[0]).map(([d, n]) => `${d}${n}`),
        460,
        'head',
      ),
    ];
  };
  f.add(pic(), 'Dijkstra: shortest paths with weights. Start at distance 0, everything else infinity. A min-heap always hands us the closest unfinished node.');
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, n] = pq.shift()!;
    if (done.has(n)) continue;
    done.add(n);
    const hot: string[] = [];
    const notes: string[] = [];
    for (const [nb, w] of g[n]) {
      if (done.has(nb)) continue;
      if (d + w < dist[nb]) {
        dist[nb] = d + w;
        via[nb] = n;
        pq.push([dist[nb], nb]);
        hot.push(ekey(n, nb));
        notes.push(`${nb} = ${d + w}`);
      }
    }
    f.add(pic(n, hot), `Pop ${n} at distance ${d}: it’s final. ${notes.length ? `Improve ${notes.join(', ')}.` : 'No improvements.'}`);
    pq = pq.filter(([, x]) => !done.has(x));
  }
  f.add(pic(), `Green edges form the shortest-path tree. A to G costs ${dist.G}. With a heap: O of E log V.`);
  return f.get();
}

function topoFrames(): Frame[] {
  const C: Record<string, [number, number]> = { Math: [120, 120], Code: [120, 320], Physics: [400, 120], DSA: [400, 320], Sim: [700, 200], Thesis: [900, 200] };
  const deps: [string, string][] = [
    ['Math', 'Physics'],
    ['Math', 'DSA'],
    ['Code', 'DSA'],
    ['Physics', 'Sim'],
    ['DSA', 'Sim'],
    ['Sim', 'Thesis'],
  ];
  const indeg: Record<string, number> = Object.fromEntries(Object.keys(C).map((k) => [k, 0]));
  deps.forEach(([, b]) => indeg[b]++);
  const f = new Frames();
  const out: string[] = [];
  const pic = (cur?: string, ready: string[] = []) => [
    ...Object.keys(C).map((k) => cell(k, C[k][0], C[k][1], k, { w: 140, h: 60, role: k === cur ? 'curr' : out.includes(k) ? 'done' : ready.includes(k) ? 'second' : undefined, sub: out.includes(k) ? undefined : `needs ${indeg[k]}` })),
    ...deps.map(([a, b]) => edge(a, b, { role: out.includes(a) ? 'muted' : undefined, dashed: out.includes(a) })),
    ...row('order', out, 450, 'done'),
  ];
  let ready = Object.keys(C).filter((k) => indeg[k] === 0);
  f.add(pic(undefined, ready), 'Topological sort: an order that respects every arrow. Count each course’s unmet prerequisites.');
  while (ready.length) {
    const n = ready.shift()!;
    out.push(n);
    const unlocked: string[] = [];
    deps.filter(([a]) => a === n).forEach(([, b]) => {
      indeg[b]--;
      if (indeg[b] === 0) unlocked.push(b);
    });
    ready = [...ready, ...unlocked];
    f.add(pic(n, ready), `Take ${n}: it needs nothing more. ${unlocked.length ? `That unlocks ${unlocked.join(' and ')}.` : ''}`);
  }
  f.add(pic(), 'Every course comes after its prerequisites. If some node never reaches zero, there’s a cycle and no order exists. O of V plus E.');
  return f.get();
}

function unionFindFrames(): Frame[] {
  const n = 8;
  const parent = Array.from({ length: n }, (_, i) => i);
  const xs = spread(n, 115);
  const f = new Frames();
  const depth = (i: number) => {
    let d = 0;
    while (parent[i] !== i) {
      i = parent[i];
      d++;
    }
    return d;
  };
  const find = (i: number): number => (parent[i] === i ? i : find(parent[i]));
  const pic = (hl: Record<number, Role> = {}) => {
    const out: Prim[] = [];
    for (let i = 0; i < n; i++) {
      const isRoot = parent[i] === i;
      out.push(cell(`u${i}`, xs[i], 330 - depth(i) * 120, i, { shape: 'circle', w: 60, role: hl[i] ?? (isRoot ? 'head' : undefined) }));
      if (!isRoot) out.push(edge(`u${i}`, `u${parent[i]}`, { id: `up${i}` }));
    }
    out.push(txt('k', 500, 440, `groups: ${new Set(Array.from({ length: n }, (_, i) => find(i))).size}`, { size: 30, role: 'curr' }));
    return out;
  };
  f.add(pic(), 'Union-find tracks groups. Each item points to a parent; a root (blue) names its group. At first, everyone is alone.');
  const unite = (a: number, b: number, say: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
    f.add(pic({ [a]: 'curr', [b]: 'curr' }), say);
  };
  unite(0, 1, 'union 0 and 1: point 1’s root at 0’s root.');
  unite(2, 3, 'union 2 and 3.');
  unite(4, 5, 'union 4 and 5.');
  unite(1, 3, 'union 1 and 3: their roots are 0 and 2, so 2 now points at 0. Two groups merged in one step.');
  f.add(pic({ 3: 'curr', 2: 'second', 0: 'done' }), 'find(3): follow parents up, 3 to 2 to 0. Root 0. Same root as 1, so 1 and 3 are connected.');
  parent[3] = 0;
  f.add(pic({ 3: 'new', 0: 'done' }), 'Path compression: on the way back, point 3 straight at the root. Future finds are instant.');
  f.add(pic(), 'With compression and union by size, each operation is almost O of 1: inverse Ackermann, α of n, which is under 5 for any real input.');
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  edges: E3[];
}

const topic: Topic = {
  id: 'graphs',
  order: 10,
  title: 'Graphs',
  short: 'BFS, DFS, shortest paths, topological order, union-find.',
  icon: '🕸️',
  costs: [cost('BFS / DFS', 'O(V + E)'), cost('Dijkstra (heap)', 'O(E log V)'), cost('topological sort', 'O(V + E)'), cost('union-find op', 'O(α(n))')],

  intro: {
    what: "A graph is a set of things connected by relationships: places and roads, people and friendships, tasks and their dependencies.",
    why: "Maps, social networks, the internet and build systems are graphs. A handful of algorithms, BFS, DFS, Dijkstra, topological sort and union-find, answer their core questions.",
    builds: "Queues and stacks from topic 4, heaps from topic 8, and recursion from topic 6.",
    goals: ["Store a graph as an adjacency list", "Explore with BFS and DFS, and know which to use", "Find shortest weighted paths with Dijkstra", "Order tasks with topological sort and track groups with union-find"],
  },

  hook: { frames: hook, lines: ['A graph is things (nodes) connected by relationships (edges).', 'Maps, social networks, the web and course prerequisites are all graphs.'] },

  watch: [
    { id: 'adj', title: 'Adjacency list', frames: adjacencyFrames },
    { id: 'bfs', title: 'BFS', frames: () => bfsFrames('A'), code: BFS_CODE, costs: [cost('BFS', 'O(V + E)', 'O(V)')] },
    { id: 'dfs', title: 'DFS', frames: () => dfsFrames('A'), costs: [cost('DFS', 'O(V + E)', 'O(V)')] },
    { id: 'dijkstra', title: 'Dijkstra', frames: () => dijkstraFrames('A'), costs: [cost('Dijkstra (heap)', 'O(E log V)', 'O(V)')] },
    { id: 'topo', title: 'Topological sort', frames: topoFrames, costs: [cost('Kahn’s algorithm', 'O(V + E)')] },
    { id: 'uf', title: 'Union-find', frames: unionFindFrames, costs: [cost('find / union', 'O(α(n))')] },
  ],

  lesson: graphsLesson({ hook, adj: adjacencyFrames, bfs: () => bfsFrames('A'), dfs: () => dfsFrames('A'), dijkstra: () => dijkstraFrames('A'), topo: topoFrames, uf: unionFindFrames }),
  recall: {
    prompt: 'What’s the difference between BFS and DFS, and when do you need Dijkstra instead of BFS?',
    model:
      'BFS explores in layers with a queue, so it finds the fewest-hops path. DFS dives as deep as it can with a stack or recursion, which is good for exploring everything, like finding regions or cycles. When edges have different weights, fewest hops isn’t cheapest, so Dijkstra uses a min-heap to always finalise the closest node next.',
    keywords: [
      ['queue', 'layer', 'level', 'ring', 'breadth'],
      ['stack', 'deep', 'recurs', 'depth'],
      ['weight', 'cost', 'length', 'distance'],
      ['heap', 'priority', 'closest', 'smallest'],
    ],
  },

  play: {
    intro: 'Run BFS, DFS or Dijkstra from any node, and add or remove roads to see how routes change.',
    init: (): S => ({ edges: [...EDGES] }),
    view: (s: S) => scene(G({ edges: s.edges, weights: true })),
    ops: [
      {
        id: 'bfs',
        label: 'BFS from',
        args: [{ name: 'start', kind: 'text', default: 'A' }],
        run: (s: S, a) => {
          const st = String(a.start).toUpperCase().trim();
          if (!NODES.includes(st)) return { state: s, frames: [{ scene: scene(G({ edges: s.edges })), say: `Pick a node from A to G.` }] };
          return { state: s, frames: bfsFrames(st, s.edges), cost: cost('BFS', 'O(V + E)') };
        },
      },
      {
        id: 'dfs',
        label: 'DFS from A',
        run: (s: S) => ({ state: s, frames: dfsFrames('A'), cost: cost('DFS', 'O(V + E)') }),
      },
      {
        id: 'dij',
        label: 'Dijkstra from A',
        run: (s: S) => ({ state: s, frames: dijkstraFrames('A'), cost: cost('Dijkstra', 'O(E log V)') }),
      },
      {
        id: 'toggle',
        label: 'add / remove road',
        args: [
          { name: 'from', kind: 'text', default: 'A' },
          { name: 'to', kind: 'text', default: 'D' },
        ],
        run: (s: S, a) => {
          const x = String(a.from).toUpperCase().trim();
          const y = String(a.to).toUpperCase().trim();
          if (!NODES.includes(x) || !NODES.includes(y) || x === y) return { state: s, frames: [{ scene: scene(G({ edges: s.edges })), say: 'Use two different nodes from A to G.' }] };
          const k = ekey(x, y);
          const has = s.edges.some(([p, q]) => ekey(p, q) === k);
          const edges: E3[] = has ? s.edges.filter(([p, q]) => ekey(p, q) !== k) : [...s.edges, [x, y, 3]];
          return {
            state: { edges },
            frames: [{ scene: scene(G({ edges, weights: true, edgeRoles: has ? {} : { [k]: 'new' }, roles: { [x]: 'curr', [y]: 'curr' } })), say: has ? `Road ${x}–${y} removed. Try BFS again.` : `New road ${x}–${y} with length 3. Try BFS again.` }],
            cost: cost(has ? 'remove edge' : 'add edge', 'O(1)'),
          };
        },
      },
    ],
  },

  predict: [
    {
      id: 'bfs-g',
      question: 'BFS from A. How many hops away is G?',
      scene: scene(G({ roles: { A: 'head', G: 'curr' } })),
      options: ['2', '3', '4', '5'],
      answer: 1,
      frames: () => bfsFrames('A'),
      why: 'A → C → E → G is 3 hops, the fewest. BFS discovers G in ring 3.',
    },
    {
      id: 'dij-d',
      question: 'With these road lengths, what is the shortest distance from A to D?',
      scene: scene(G({ weights: true, roles: { A: 'head', D: 'curr' } })),
      options: ['5 (A–B–D)', '6 (A–C–D)', '4', '1'],
      answer: 0,
      frames: () => dijkstraFrames('A'),
      why: 'A–B–D is 4 + 1 = 5; A–C–D is 1 + 5 = 6. Fewest hops are equal here, so only the weights decide.',
    },
    {
      id: 'uf-q',
      question: 'Start with 0…7 alone. union(0,1), union(2,3), union(1,3). Are 0 and 2 in the same group?',
      scene: scene(spread(8, 115).map((x, i) => cell(`u${i}`, x, 330, i, { shape: 'circle', w: 60, role: 'head' }))),
      options: ['Yes', 'No', 'Only if 0 < 2', 'Can’t tell'],
      answer: 0,
      frames: () => unionFindFrames().slice(0, 5),
      why: 'union(1,3) merged the {0,1} and {2,3} groups, so 0 and 2 share a root.',
    },
  ],

  trace: { title: 'Breadth-first search with a queue', code: BFS_CODE, frames: () => bfsFrames('A', EDGES, true) },

  build: {
    intro: [
      'Build UnionFind for items 0…n−1: find (with path compression), union (attach the smaller group under the bigger), connected, and groups (how many groups exist).',
      'union returns True if it merged two groups, False if they were already together.',
    ],
    starter: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.groups = n

    def find(self, x):
        pass

    def union(self, a, b):
        pass

    def connected(self, a, b):
        pass
`,
    solution: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.groups = n

    def find(self, x):
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.groups -= 1
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)
`,
    tests: [
      { code: 'u = UnionFind(5)\nresult = (u.connected(0, 1), u.groups)', show: 'fresh: nobody connected', expected: '(False, 5)' },
      { code: 'u = UnionFind(5)\nu.union(0, 1); u.union(1, 2)\nresult = (u.connected(0, 2), u.connected(0, 3), u.groups)', show: 'union 0-1, 1-2', expected: '(True, False, 3)' },
      { code: 'u = UnionFind(3)\nresult = (u.union(0, 1), u.union(1, 0), u.groups)', show: 'union twice returns False', expected: '(True, False, 2)' },
      { code: 'u = UnionFind(4)\nu.union(0, 1); u.union(2, 3); u.union(1, 3)\nresult = (u.find(0) == u.find(2), u.groups)', show: 'merge two groups', expected: '(True, 1)' },
      { code: 'u = UnionFind(200000)\nfor i in range(199999): u.union(i, i + 1)\nresult = (u.connected(0, 199999), u.groups)', show: '200,000-item chain', expected: '(True, 1)' },
    ],
    builtin: {
      text: 'Python has no built-in union-find, but the class above is short. networkx (a graph library) offers BFS, DFS, Dijkstra and topological sort ready-made.',
      code: `import networkx as nx
G = nx.Graph()
G.add_weighted_edges_from([("A", "B", 4), ("A", "C", 1)])
nx.shortest_path(G, "A", "B", weight="weight")
list(nx.topological_sort(dag))`,
    },
  },

  fill: {
    intro: ['Kahn’s algorithm for topological order. When a node’s last prerequisite is done (its count hits 0), it becomes ready.', 'Write that as one line.'],
    code: `from collections import deque

def topo_order(n, edges):
    graph = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in edges:
        graph[a].append(b)
        indeg[b] += 1
    queue = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nb in graph[node]:
            indeg[nb] -= 1
            ____
    return order if len(order) == n else []`,
    answer: 'if indeg[nb] == 0: queue.append(nb)',
    tests: [
      { call: 'topo_order(4, [(0, 1), (0, 2), (1, 3), (2, 3)])', expected: '[0, 1, 2, 3]' },
      { call: 'topo_order(3, [(0, 1), (1, 2), (2, 0)])', expected: '[]' },
      { call: 'topo_order(3, [])', expected: '[0, 1, 2]' },
      { call: 'topo_order(2, [(1, 0)])', expected: '[1, 0]' },
    ],
  },

  wild: [
    { icon: '🗺️', title: 'Maps & GPS', text: 'Route planners run Dijkstra and its faster cousin A* over road graphs with millions of nodes, plus precomputed shortcuts.' },
    { icon: '📦', title: 'Build tools & packages', text: 'make, pip, npm and CI pipelines topologically sort dependencies so everything is built after what it needs.' },
    { icon: '🌐', title: 'The internet', text: 'Routers share link costs and run shortest-path algorithms (OSPF uses Dijkstra). Web crawlers explore links breadth-first.' },
    { icon: '🧪', title: 'Physics & images', text: 'Union-find labels connected clusters: percolation simulations, and grouping pixels into objects in image segmentation.' },
  ],

  problems: [
    {
      id: 'islands',
      title: 'Count the lakes',
      difficulty: 'easy',
      pattern: 'Flood fill (BFS/DFS on a grid)',
      intro: ['grid is a list of strings of "~" (water) and "." (land). Water cells touching up, down, left or right form one lake. Return the number of lakes.', 'Use an explicit queue or stack: the big test is too deep for recursion.'],
      examples: [{ input: 'count_lakes(["~~..", "~...", "..~~"])', output: '2' }],
      starter: `def count_lakes(grid):
    pass
`,
      solution: `from collections import deque

def count_lakes(grid):
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    seen = set()
    lakes = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "~" and (r, c) not in seen:
                lakes += 1
                seen.add((r, c))
                q = deque([(r, c)])
                while q:
                    y, x = q.popleft()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < rows and 0 <= nx < cols and grid[ny][nx] == "~" and (ny, nx) not in seen:
                            seen.add((ny, nx))
                            q.append((ny, nx))
    return lakes
`,
      tests: [
        { call: 'count_lakes(["~~..", "~...", "..~~"])', expected: '2' },
        { call: 'count_lakes([])', expected: '0' },
        { call: 'count_lakes(["...."])', expected: '0' },
        { call: 'count_lakes(["~.~", ".~.", "~.~"])', expected: '5' },
        { call: 'count_lakes(["~" * 300] * 300)', expected: '1' },
      ],
      hints: ['Flood fill: when you find unvisited water, count one lake and mark all water connected to it.', 'Scan every cell. On unvisited water, add 1, then BFS from it marking every connected water cell as seen.', 'for each cell: if water and unseen: lakes += 1; BFS: pop, for 4 neighbours in bounds, water, unseen: mark, push → return lakes'],
      complexity: { time: 'O(rows × cols)', space: 'O(rows × cols)' },
    },
    {
      id: 'hops',
      title: 'Fewest hops',
      difficulty: 'easy',
      pattern: 'BFS shortest path (unweighted)',
      intro: ['graph maps each person to a list of friends (friendship goes both ways). Return the fewest friendship hops from a to b, 0 if a == b, or -1 if they aren’t connected.'],
      examples: [{ input: 'fewest_hops({"ana": ["bo"], "bo": ["ana", "cy"], "cy": ["bo"]}, "ana", "cy")', output: '2' }],
      starter: `def fewest_hops(graph, a, b):
    pass
`,
      solution: `from collections import deque

def fewest_hops(graph, a, b):
    if a == b:
        return 0
    dist = {a: 0}
    q = deque([a])
    while q:
        node = q.popleft()
        for nb in graph.get(node, []):
            if nb not in dist:
                dist[nb] = dist[node] + 1
                if nb == b:
                    return dist[nb]
                q.append(nb)
    return -1
`,
      tests: [
        { call: 'fewest_hops({"ana": ["bo"], "bo": ["ana", "cy"], "cy": ["bo"]}, "ana", "cy")', expected: '2' },
        { call: 'fewest_hops({"x": []}, "x", "x")', expected: '0' },
        { call: 'fewest_hops({"x": [], "y": []}, "x", "y")', expected: '-1' },
        { call: 'fewest_hops({1: [2, 3], 2: [1, 4], 3: [1, 4], 4: [2, 3, 5], 5: [4]}, 1, 5)', expected: '3' },
        { code: 'g = {i: [i - 1, i + 1] for i in range(1, 99999)}\ng[0] = [1]; g[99999] = [99998]\ng[0].append(99999); g[99999].append(0)\nresult = fewest_hops(g, 0, 50000)', show: 'ring of 100,000 people', expected: '50000' },
      ],
      hints: ['BFS finds the fewest hops when every edge counts the same.', 'BFS from a with a queue and a dist dict. The first time you reach b, its distance is the answer.', 'dist = {a: 0}; q = deque([a]) → while q: node = pop; for nb: if new: dist[nb] = dist[node] + 1; if nb == b: return; push → return −1'],
      complexity: { time: 'O(V + E)', space: 'O(V)' },
    },
    {
      id: 'cheapest',
      title: 'Cheapest delivery route',
      difficulty: 'medium',
      pattern: 'Dijkstra with a min-heap',
      intro: [
        'roads is a list of (a, b, cost) two-way roads between towns 0…n−1. Return the cheapest total cost from town 0 to every town, as a list. Unreachable towns get -1.',
        'Costs are non-negative. Use heapq as the priority queue.',
      ],
      examples: [{ input: 'cheapest(4, [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1)])', output: '[0, 3, 1, 4]' }],
      starter: `import heapq

def cheapest(n, roads):
    pass
`,
      solution: `import heapq

def cheapest(n, roads):
    graph = [[] for _ in range(n)]
    for a, b, c in roads:
        graph[a].append((b, c))
        graph[b].append((a, c))
    dist = [float("inf")] * n
    dist[0] = 0
    heap = [(0, 0)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:
            continue
        for nb, c in graph[node]:
            if d + c < dist[nb]:
                dist[nb] = d + c
                heapq.heappush(heap, (dist[nb], nb))
    return [x if x != float("inf") else -1 for x in dist]
`,
      tests: [
        { call: 'cheapest(4, [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1)])', expected: '[0, 3, 1, 4]' },
        { call: 'cheapest(3, [(0, 1, 5)])', expected: '[0, 5, -1]' },
        { call: 'cheapest(1, [])', expected: '[0]' },
        { call: 'cheapest(3, [(0, 1, 0), (1, 2, 0)])', expected: '[0, 0, 0]' },
        { code: 'n = 30000\nroads = [(i, i + 1, 2) for i in range(n - 1)] + [(0, n - 1, 1)]\nr = cheapest(n, roads)\nresult = (r[n - 1], r[n // 2])', show: '30,000 towns', expected: '(1, 29999)' },
      ],
      hints: ['Dijkstra: always expand the cheapest town you haven’t finalised, using a min-heap.', 'dist starts at infinity except town 0. Pop (d, town); if d is stale (bigger than dist[town]) skip it. Otherwise try every road and push improvements.', 'dist = [inf]*n; dist[0] = 0; heap = [(0, 0)] → while heap: d, u = pop; if d > dist[u]: continue; for v, c: if d + c < dist[v]: update, push'],
      complexity: { time: 'O(E log V)', space: 'O(V + E)' },
    },
  ],

  extra: [
    { name: 'Number of Islands', url: 'https://leetcode.com/problems/number-of-islands/', difficulty: 'medium' },
    { name: 'Rotting Oranges', url: 'https://leetcode.com/problems/rotting-oranges/', difficulty: 'medium' },
    { name: 'Course Schedule II', url: 'https://leetcode.com/problems/course-schedule-ii/', difficulty: 'medium' },
    { name: 'Network Delay Time', url: 'https://leetcode.com/problems/network-delay-time/', difficulty: 'medium' },
    { name: 'Redundant Connection', url: 'https://leetcode.com/problems/redundant-connection/', difficulty: 'medium' },
    { name: 'Word Ladder', url: 'https://leetcode.com/problems/word-ladder/', difficulty: 'hard' },
  ],

  quiz: [
    { q: 'All edges have the same cost. Which finds the shortest path?', options: ['DFS', 'BFS', 'Topological sort', 'Union-find'], answer: 1, why: 'BFS explores in rings of increasing hop count.' },
    { q: 'Why can’t Dijkstra handle negative edge weights?', options: ['Heaps can’t store negatives', 'It finalises a node early, assuming nothing later can make it cheaper', 'It’s too slow', 'It can: no problem'], answer: 1, why: 'A negative edge found later could undercut a “final” distance. Bellman-Ford handles negatives.' },
    { q: 'Topological sort is only possible when the graph…', options: ['Is connected', 'Has no cycles (is a DAG)', 'Has weights', 'Is a tree'], answer: 1, why: 'In a cycle, every node waits on another, so none can go first.' },
  ],
};

export default topic;

import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function graphsLesson(fig: { hook: F; adj: F; bfs: F; dfs: F; dijkstra: F; topo: F; uf: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Trees allow only one parent per node. Real connections are messier: roads form loops, friends have mutual friends, courses depend on several other courses, web pages link back and forth.' },
        { p: 'A **graph** is the most general way to model connections. Lists and trees are special cases of graphs. Many problems that look unrelated, like routing, scheduling or finding clusters, become standard graph algorithms once you see the graph inside them.' },
      ],
    },
    {
      title: 'What a graph is',
      blocks: [
        { p: 'A **graph** is a set of **vertices** (or nodes) and a set of **edges** connecting pairs of them. We write V for the number of vertices and E for the number of edges.' },
        {
          list: [
            '**Undirected** edges go both ways, like a two-way road or a friendship.',
            '**Directed** edges go one way, like a one-way street, a web link or a prerequisite.',
            '**Weighted** edges carry a number: a distance, a cost, a time.',
            'A **path** is a sequence of edges; a **cycle** is a path that returns to its start. A directed graph with no cycles is a **DAG**.',
          ],
        },
        { p: 'Picture a map.' },
        { figure: fig.hook, caption: 'Places joined by roads, roads with lengths, and a GPS asking for the shortest way.' },
      ],
    },
    {
      title: 'Storing a graph',
      blocks: [
        { figure: fig.adj, caption: 'An adjacency list maps each node to its neighbours.' },
        { p: 'An **adjacency list** stores, for each vertex, a list of its neighbours. It uses **O(V + E)** memory and lets you loop over a vertex’s neighbours in time proportional to how many it has. It is the default choice.' },
        { p: 'An **adjacency matrix** is a V × V grid where cell (u, v) says whether there is an edge. Checking one edge is O(1), but it always uses O(V²) memory. It suits small or very dense graphs.' },
        { code: 'graph = {\n    "A": ["B", "C"],\n    "B": ["A", "D"],\n    "C": ["A", "D", "E"],\n}', say: 'An adjacency list in Python: a dictionary from each node to a list of its neighbours.' },
      ],
    },
    {
      title: 'Breadth-first search',
      blocks: [
        { p: '**Breadth-first search** (BFS) explores outward in rings: first every vertex one edge away, then two edges away, and so on. It uses a **queue** and a **visited** set so no vertex is processed twice.' },
        { figure: fig.bfs, caption: 'BFS from A: each node gets its distance in hops the first time it is reached.' },
        { p: 'Because rings are explored in order, the first time BFS reaches a vertex is along a path with the **fewest edges**. So BFS finds shortest paths when every edge counts the same. It runs in **O(V + E)**: each vertex is queued once and each edge examined once or twice.' },
        { note: 'Mark a vertex as visited when you **add** it to the queue, not when you take it out. Otherwise the same vertex can be queued many times, wasting work.', kind: 'pitfall' },
      ],
    },
    {
      title: 'Depth-first search',
      breakAfter: 'watch',
      blocks: [
        { p: '**Depth-first search** (DFS) goes as deep as it can along one path, then backs up and tries the next branch. It uses recursion or an explicit **stack**, and is also **O(V + E)**.' },
        { figure: fig.dfs, caption: 'DFS dives from A as far as possible before backing up.' },
        { p: 'DFS doesn’t find shortest paths, but it is ideal for exploring everything reachable: counting connected regions, flood-filling an image, detecting cycles, and solving mazes.' },
        { p: 'Grids are graphs too. Each cell is a vertex, connected to its up, down, left and right neighbours. “Count the islands” is just “count the connected regions with DFS or BFS”.' },
      ],
    },
    {
      title: 'Shortest paths with weights: Dijkstra',
      blocks: [
        { p: 'When edges have different lengths, fewest hops isn’t cheapest. **Dijkstra’s algorithm** finds the cheapest path from one start to every vertex, as long as no weight is negative.' },
        { p: 'It keeps a best-known distance for every vertex, starting at 0 for the start and infinity elsewhere. It repeatedly takes the **closest unfinished** vertex from a **min-heap**, declares its distance final, and tries to improve its neighbours through it.' },
        { figure: fig.dijkstra, caption: 'Pop the closest node, finalise it, relax its edges. Green edges form the shortest-path tree.' },
        { note: 'When a vertex is the closest unfinished one, no route through other unfinished vertices can be shorter, because they are all at least as far away and edges can only add distance. That argument breaks with negative edges, which is why Dijkstra forbids them. Bellman–Ford handles negative weights, more slowly, in O(V × E).', kind: 'why' },
        { p: 'With a binary heap Dijkstra runs in **O((V + E) log V)**. In Python, `heapq` is the heap; the common trick is to push duplicates and skip stale entries when they are popped.' },
      ],
    },
    {
      title: 'Ordering dependencies: topological sort',
      blocks: [
        { p: 'In a DAG of dependencies, a **topological order** lists the vertices so that every edge points forward: each task comes after everything it depends on. Build systems, course plans and spreadsheet recalculation all need one.' },
        { figure: fig.topo, caption: 'Kahn’s algorithm: repeatedly take a node with no unmet prerequisites.' },
        { p: '**Kahn’s algorithm** counts each vertex’s incoming edges. Vertices with zero go in a queue. Taking one “completes” it and lowers its neighbours’ counts, releasing any that reach zero. If some vertices are never released, the graph has a **cycle** and no valid order exists. O(V + E).' },
      ],
    },
    {
      title: 'Grouping: union-find',
      breakAfter: 'play',
      blocks: [
        { p: 'Sometimes edges arrive one at a time and you keep asking, “are these two already connected?” Running a fresh BFS for each question is wasteful. **Union-find** (the disjoint-set structure) answers it almost instantly.' },
        { p: 'Each item points to a parent; following parents leads to a **root**, which names the group. **find** follows parents to the root. **union** points one root at the other, merging two groups in one step.' },
        { figure: fig.uf, caption: 'Union merges groups by linking roots. Path compression flattens the tree during find.' },
        { p: 'Two tricks make it fast: **union by size** (hang the smaller tree under the larger) and **path compression** (point every node visited during find straight at the root). Together, each operation costs **O(α(n))**, the inverse Ackermann function, which is below 5 for any input you will ever have.' },
      ],
    },
    {
      title: 'Which algorithm when',
      blocks: [
        {
          table: [
            ['Question', 'Algorithm', 'Cost'],
            ['reachable? connected regions?', 'BFS or DFS', 'O(V + E)'],
            ['fewest hops (unweighted)', 'BFS', 'O(V + E)'],
            ['cheapest path, weights ≥ 0', 'Dijkstra', 'O((V + E) log V)'],
            ['cheapest path, negative weights', 'Bellman–Ford', 'O(V · E)'],
            ['order with dependencies', 'topological sort', 'O(V + E)'],
            ['connected yet? (edges arriving)', 'union-find', 'O(α(n)) per op'],
          ],
        },
        { note: 'For bigger graph work in Python, the `networkx` library implements all of these. Writing them yourself first is how you learn when each one applies.', kind: 'python' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Meshes used in physics simulations are graphs of connected cells; partitioning them across processors is a graph problem. Molecules are graphs of atoms and bonds. Epidemic models spread infection along contact networks.', kind: 'science' },
        { note: 'Percolation, how fluid or electricity crosses a random material, is answered with union-find: add open sites one at a time and check whether the top and bottom are connected yet.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'A graph is vertices plus edges: directed or not, weighted or not. Store it as an adjacency list, O(V + E).',
            'BFS explores in rings with a queue: shortest paths by hop count.',
            'DFS dives deep with a stack or recursion: regions, cycles, mazes.',
            'Dijkstra: always finalise the closest node with a heap. Weights must be non-negative.',
            'Topological sort orders a DAG; leftover nodes mean a cycle.',
            'Union-find answers “connected?” in nearly O(1) with union by size and path compression.',
          ],
        },
      ],
    },
  ];
}

import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function treesLesson(fig: { hook: F; inorder: F; level: F; search: F; insert: F; balance: F; heapPush: F; heapPop: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Arrays and lists are **linear**: one item after another. Much real data is **hierarchical** instead: folders inside folders, a company’s org chart, the structure of a web page, an equation’s nested parts.' },
        { p: 'Trees model that hierarchy. And with one extra rule about order, a tree becomes a **search tree**: a structure that keeps data sorted while still allowing fast inserts, something neither a sorted array nor a hash map can do.' },
      ],
    },
    {
      title: 'What a tree is',
      blocks: [
        { p: 'A **tree** is a set of **nodes** connected by **edges**, with one special node at the top, the **root**. Every other node has exactly one **parent**. Nodes below a node are its **children**; nodes with no children are **leaves**.' },
        { p: 'A **binary tree** allows at most two children per node: a **left** and a **right** child. The **depth** of a node is its distance from the root; the **height** of the tree is the longest root-to-leaf path.' },
        { p: 'Trees are **recursive**: every node is the root of its own smaller tree, called a **subtree**. That is why almost every tree algorithm is a short recursive function.' },
        { p: 'Picture your computer’s folders.' },
        { figure: fig.hook, caption: 'One root, branches, and leaves at the ends. Balanced, a million nodes are only about 20 levels deep.' },
      ],
    },
    {
      title: 'Visiting every node: traversals',
      blocks: [
        { p: 'A **traversal** visits every node once: O(n). Depth-first traversals go down one branch fully before the next, and differ only in **when** they visit the node itself.' },
        {
          list: [
            '**Pre-order**: node, then left subtree, then right. Good for copying a tree.',
            '**In-order**: left subtree, node, right subtree. On a search tree, this outputs values in sorted order.',
            '**Post-order**: left, right, then node. Good for deleting a tree or computing sizes, where children must be done first.',
          ],
        },
        { figure: fig.inorder, caption: 'In-order: left, node, right. On a search tree the output comes out sorted.' },
        { p: '**Level-order** (breadth-first) visits the tree row by row using a queue. It is how you find the shallowest node with some property.' },
        { figure: fig.level, caption: 'Level order: take the front of the queue, visit it, queue its children.' },
      ],
    },
    {
      title: 'Binary search trees',
      breakAfter: 'watch',
      blocks: [
        { p: 'A **binary search tree** (BST) adds one rule: for every node, all values in its left subtree are **smaller**, and all values in its right subtree are **larger**.' },
        { figure: fig.search, caption: 'Each comparison picks one side and rules out the other.' },
        { p: 'To **search**, compare with the current node and go left or right; each step goes one level down. To **insert**, search for the value and put a new leaf where the search fell off the tree. Both cost the tree’s **height**, written O(h).' },
        { figure: fig.insert, caption: 'Insert walks the search path and attaches a new leaf.' },
        { p: '**Deleting** a node with two children is the trickiest case: replace its value with the next larger value, its **successor** (the leftmost node of its right subtree), then delete that successor, which has at most one child.' },
      ],
    },
    {
      title: 'Why balance matters',
      blocks: [
        { p: 'O(h) is only fast if h is small. If you insert values in sorted order into a plain BST, each goes to the right of the last, and the tree becomes a chain. Then h = n, and every operation is **O(n)**, no better than a list.' },
        { figure: fig.balance, caption: 'The same six values: a chain of height 6, or a balanced tree of height 3.' },
        { p: '**Self-balancing** trees fix this automatically. After each insert or delete they perform small local **rotations** that keep the height at **O(log n)**. AVL trees keep the two subtrees of every node within one level of each other; red-black trees use a colouring rule that keeps every path within twice the shortest.' },
        { note: 'A rotation re-hangs a few nodes, like lifting a child above its parent, while keeping the left-smaller, right-larger rule intact. Each one is O(1), and only O(log n) are needed per update.', kind: 'why' },
        { note: 'Databases use **B-trees**: balanced trees where each node holds hundreds of keys. With so many children per node, a billion rows are only about four levels deep, which matters when each level is a slow disk read.', kind: 'science' },
      ],
    },
    {
      title: 'Heaps and priority queues',
      breakAfter: 'play',
      blocks: [
        { p: 'Sometimes you don’t need everything sorted. You only need the **smallest** (or largest) item, again and again, while new items keep arriving. That is a **priority queue**, and it is built from a **heap**.' },
        { p: 'A **min-heap** is a binary tree with a weaker rule than a BST: every parent is **smaller than or equal to** its children. So the smallest item is always at the root, and peeking at it is **O(1)**.' },
        { p: 'A heap is always a **complete** tree, filled level by level, left to right. That means it fits perfectly in a plain array: the children of index i are at 2i + 1 and 2i + 2, and its parent at (i − 1) // 2. No pointers needed.' },
        { figure: fig.heapPush, caption: 'Push: add at the end, then sift up while smaller than the parent.' },
        { figure: fig.heapPop, caption: 'Pop: move the last item to the root, then sift down towards the smaller child.' },
        { p: 'Push and pop each walk at most one root-to-leaf path in a tree of height log n, so both cost **O(log n)**.' },
      ],
    },
    {
      title: 'Choosing between them',
      blocks: [
        {
          table: [
            ['Need', 'Use', 'Cost'],
            ['lookup by key only', 'hash map', 'O(1) average'],
            ['sorted order, ranges, floor/ceiling, with inserts', 'balanced BST', 'O(log n)'],
            ['always the smallest / largest next', 'heap', 'O(1) peek, O(log n) push/pop'],
            ['data that never changes, searched often', 'sorted array', 'O(log n) search'],
          ],
        },
        { note: 'Python’s `heapq` turns a list into a min-heap: `heappush`, `heappop`, and `heapify`, which builds a heap from a list in O(n). For a max-heap, push negated values. Python has no built-in balanced BST; the `sortedcontainers` library is the usual choice.', kind: 'python' },
        { note: 'Recursive tree code uses one stack frame per level. On a balanced tree that’s tiny, but on a degenerate chain of thousands of nodes it can hit Python’s recursion limit. Use an explicit stack or queue for very deep trees.', kind: 'pitfall' },
      ],
    },
    {
      title: 'Thinking recursively about trees',
      blocks: [
        { p: 'Most tree questions have the same shape: answer for a node by combining the answers from its left and right subtrees, with an empty tree as the base case.' },
        { code: 'def height(node):\n    if node is None:\n        return 0\n    return 1 + max(height(node.left), height(node.right))', say: 'Height: an empty tree has height zero; otherwise one plus the larger of the left and right heights.' },
        { p: 'Height, size, sum, “is this a valid BST?”, “are these two trees mirror images?”: each is three or four lines once you ask, what do I need from each child, and how do I combine it?' },
        { note: 'Checking a BST by comparing each node only with its direct children is a classic bug. A node deep in the left subtree must be smaller than **every** ancestor it is left of. Pass down an allowed range (low, high) instead.', kind: 'pitfall' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Event-driven simulations, like particle collisions or queueing models, keep upcoming events in a priority queue and always process the earliest next. Dijkstra’s shortest paths and A* route planning, in topic 10, run on heaps.', kind: 'science' },
        { note: 'Space-partitioning trees, like the quadtrees, octrees and k-d trees in topic 13, let simulations find nearby particles without checking every pair. Decision trees and random forests in machine learning are trees too.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'A tree has a root, parents and children; every node roots its own subtree, so tree code is recursive.',
            'Traversals visit all n nodes: pre-order, in-order, post-order (DFS) and level-order (BFS with a queue).',
            'BST rule: left smaller, right larger. Search, insert and delete cost the height, O(h).',
            'Balanced trees keep h = O(log n) with rotations. Sorted inserts into a plain BST make a chain: O(n).',
            'A heap keeps the minimum at the root, stored in an array. Peek O(1), push/pop O(log n).',
            'In-order on a BST gives sorted output; check BST validity with ranges, not just children.',
          ],
        },
      ],
    },
  ];
}

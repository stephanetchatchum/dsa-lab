import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function recursionLesson(fig: { hook: F; stack: F; tree: F; subsets: F; queens: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Some problems are made of smaller copies of themselves. A folder contains folders. A tree is a node plus smaller trees. Sorting a list can be done by sorting its two halves. Loops handle these awkwardly; **recursion** handles them naturally.' },
        { p: 'Recursion is the foundation for trees, graph search, divide-and-conquer sorting and dynamic programming. And **backtracking**, recursion that explores choices, is how computers solve puzzles and search through possibilities.' },
      ],
    },
    {
      title: 'What recursion is',
      blocks: [
        { p: 'A **recursive function** is one that calls itself on a smaller version of the same problem. Every recursive function needs two parts.' },
        {
          list: [
            'A **base case**: an input small enough to answer directly, without recursing.',
            'A **recursive case**: answer the problem by calling the function on a smaller input, and combining the result.',
          ],
          ordered: true,
        },
        { p: 'Every recursive call must move closer to the base case. If it doesn’t, the calls never stop.' },
        { code: 'def fact(n):\n    if n <= 1:          # base case\n        return 1\n    return n * fact(n - 1)   # smaller problem', say: 'Factorial: if n is at most 1, return 1. Otherwise return n times fact of n minus 1.' },
        { p: 'Picture a dark cinema.' },
        { figure: fig.hook, caption: 'To find your row, ask the person in front. The front row just knows. Answers flow back, each adding one.' },
      ],
    },
    {
      title: 'The call stack',
      breakAfter: 'watch',
      blocks: [
        { p: 'How does a function “wait” for its own result? Each call gets a **frame** on the **call stack** holding its own variables. The newest call runs; older calls wait underneath until it returns. This is the stack from the previous topic.' },
        { figure: fig.stack, caption: 'fact(4) waits for fact(3), which waits for fact(2)… then results flow back up.' },
        { p: 'The deepest the stack gets is the **recursion depth**. Each frame takes memory, so recursion n levels deep uses **O(n) space** even if your code allocates nothing.' },
        { note: 'Python stops recursion at about 1,000 levels by default and raises RecursionError. You can raise the limit with `sys.setrecursionlimit`, but for very deep problems it is safer to rewrite the recursion as a loop with your own stack.', kind: 'python' },
        { note: 'To trust a recursive function, don’t trace every call. Check that the base case is right, and assume the smaller call works (the “leap of faith”). If both hold, the whole thing works. This is proof by induction, used informally.', kind: 'why' },
      ],
    },
    {
      title: 'Recursion trees and their cost',
      blocks: [
        { p: 'When a function calls itself more than once, the calls form a **recursion tree**. The total work is the work done at every node of that tree.' },
        { figure: fig.tree, caption: 'Naive fib makes two calls each time, and the tree roughly doubles in size with every n.' },
        { p: 'Count it like this: (number of calls) × (work per call). fact makes n calls doing O(1) each: O(n). Naive fib makes about 2ⁿ calls: **O(2ⁿ)**. Merge sort makes calls on halves, with log n levels each doing n work: O(n log n).' },
        { note: 'In fib, the same subproblems are solved again and again: fib(2) is computed three times inside fib(5). Remembering answers instead of recomputing them is exactly what dynamic programming does, in topic 12.', kind: 'remember' },
      ],
    },
    {
      title: 'Divide and conquer',
      breakAfter: 'play',
      blocks: [
        { p: '**Divide and conquer** is a recursive strategy in three steps: **split** the problem into smaller parts, **solve** each part recursively, then **combine** their answers.' },
        { p: 'Merge sort splits a list in half, sorts each half, and merges them. Binary search splits in half and recurses into only one side. Fast power computes x to the n from x to the n over 2, squared. Halving at each level is what produces the log n factors you keep seeing.' },
        { code: 'def power(x, n):\n    if n == 0:\n        return 1\n    half = power(x, n // 2)\n    return half * half if n % 2 == 0 else half * half * x', say: 'Fast power: base case n equals 0 returns 1. Otherwise compute half once, then square it, multiplying by x once more if n is odd.' },
        { p: 'Fast power makes only log n calls, so it is O(log n) instead of the O(n) of multiplying n times. The key detail: compute `half` once. Calling `power(x, n // 2)` twice would bring back exponential work.' },
      ],
    },
    {
      title: 'Backtracking: exploring choices',
      blocks: [
        { p: '**Backtracking** builds a solution one choice at a time. At each step it **chooses** an option, **explores** everything that follows recursively, then **un-chooses** it and tries the next option. The recursion tree is the tree of all possible decisions.' },
        { figure: fig.subsets, caption: 'For each item: skip it or take it. The leaves are all 2ⁿ subsets.' },
        { code: 'def go(i):\n    if i == len(items):\n        out.append(path[:])      # record a copy\n        return\n    go(i + 1)                    # skip items[i]\n    path.append(items[i])        # choose\n    go(i + 1)                    # explore\n    path.pop()                   # un-choose', say: 'Backtracking template: at the end, record a copy of path. Otherwise explore skipping the item, then choose it, explore, and un-choose it with pop.' },
        { note: 'Record `path[:]`, a copy, not `path` itself. The path list keeps changing as the search continues, so storing the list itself would leave you with many references to the same, finally empty, list.', kind: 'pitfall' },
      ],
    },
    {
      title: 'Pruning',
      blocks: [
        { p: 'Backtracking can explore an enormous number of possibilities: 2ⁿ subsets, n! orderings. Its real power comes from **pruning**: abandoning a branch as soon as it cannot possibly lead to a valid answer.' },
        { figure: fig.queens, caption: 'N-queens backtracks the moment a placement is attacked, never exploring boards that are already broken.' },
        { p: 'Typical pruning rules: stop when a partial sum already exceeds the target; skip a choice that breaks a constraint; sort the options first so you can stop the loop early. The worst case stays exponential, but real searches become fast enough to use.' },
      ],
    },
    {
      title: 'Recursion or a loop?',
      blocks: [
        { p: 'Anything recursive can be written with a loop and an explicit stack, and simple recursion, like factorial, is just a loop in disguise. Prefer recursion when the data is naturally nested (trees, folders, JSON) or when you are exploring choices. Prefer loops when the depth could be huge.' },
        {
          table: [
            ['Pattern', 'Calls', 'Typical cost'],
            ['one call, input − 1 (fact)', 'n', 'O(n)'],
            ['one call, input / 2 (binary search, fast power)', 'log n', 'O(log n)'],
            ['two calls on halves + linear combine (merge sort)', 'about 2n', 'O(n log n)'],
            ['two calls, input − 1 (naive fib)', 'about 2ⁿ', 'O(2ⁿ)'],
            ['all subsets / all orderings', '2ⁿ / n!', 'O(2ⁿ) / O(n!)'],
          ],
        },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Adaptive mesh refinement recursively subdivides a simulation grid only where things change fast. Quadtrees and octrees, in topic 13, are built recursively. Numerical integration can recursively split an interval until each piece is accurate enough.', kind: 'science' },
        { note: 'Constraint solvers for scheduling, chip layout and protein folding are, at heart, backtracking searches with very clever pruning.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'Recursion = base case + recursive case on a smaller input.',
            'Each pending call is a frame on the call stack: depth costs O(depth) memory. Python’s limit is about 1,000.',
            'Total cost = number of calls × work per call. Draw the recursion tree.',
            'Divide and conquer: split, solve recursively, combine. Halving gives log factors.',
            'Backtracking: choose, explore, un-choose. Record copies of the path.',
            'Pruning cuts branches that can’t succeed, making exponential searches practical.',
          ],
        },
      ],
    },
  ];
}

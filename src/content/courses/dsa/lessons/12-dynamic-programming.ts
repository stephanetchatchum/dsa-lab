import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function dpLesson(fig: { hook: F; memo: F; coins: F; grid: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Backtracking tries every possibility: correct, but exponential. Greedy commits to one choice: fast, but only sometimes correct. **Dynamic programming** (DP) sits between them. It considers every choice, like backtracking, but avoids repeating work, so it is both correct and efficient.' },
        { p: 'DP solves an enormous range of optimisation and counting problems: fewest coins, best route through a grid, how similar two DNA strands are, how to spell-correct a word. It is one of the most powerful ideas in computing.' },
      ],
    },
    {
      title: 'What dynamic programming is',
      blocks: [
        { p: '**Dynamic programming** solves a problem by combining the answers to **smaller subproblems**, solving each subproblem **only once** and saving its answer for reuse.' },
        { p: 'It works when a problem has two properties.' },
        {
          list: [
            '**Optimal substructure**: the best answer is built from the best answers to smaller versions of the problem.',
            '**Overlapping subproblems**: the same smaller problems come up again and again.',
          ],
          ordered: true,
        },
        { p: 'Without overlap, plain recursion is enough. With overlap, saving answers turns exponential work into polynomial work.' },
        { p: 'Picture climbing stairs, one or two steps at a time.' },
        { figure: fig.hook, caption: 'Ways to reach step 5 = ways to reach step 4 + ways to reach step 3. Each answer is written down once.' },
      ],
    },
    {
      title: 'Top-down: memoisation',
      blocks: [
        { p: 'The quickest way into DP is to write the plain recursive solution, then add a **memo**: a dictionary from the subproblem’s inputs to its answer. Before computing, check the memo; after computing, store the result.' },
        { figure: fig.memo, caption: 'With a memo, fib(6) makes 7 calls instead of 25. Every repeat becomes a lookup.' },
        { code: 'from functools import cache\n\n@cache\ndef ways(n):\n    if n <= 1:\n        return 1\n    return ways(n - 1) + ways(n - 2)', say: 'Memoised stairs: the cache decorator saves every answer. Base case n at most 1 gives 1; otherwise ways of n minus 1 plus ways of n minus 2.' },
        { p: 'The cost becomes (number of distinct subproblems) × (work per subproblem). For stairs or fib that is n subproblems × O(1): **O(n)** instead of O(2ⁿ).' },
      ],
    },
    {
      title: 'Bottom-up: filling a table',
      breakAfter: 'watch',
      blocks: [
        { p: 'Bottom-up DP removes the recursion. You create a table with one cell per subproblem, fill in the base cases, then fill the rest **in an order where every cell’s ingredients are already done**.' },
        { figure: fig.coins, caption: 'dp[a] is the fewest coins for amount a. Each cell tries every coin as the last one.' },
        { code: 'dp = [0] + [INF] * amount\nfor a in range(1, amount + 1):\n    for c in coins:\n        if c <= a:\n            dp[a] = min(dp[a], dp[a - c] + 1)', say: 'Bottom-up coin change: dp of zero is zero, the rest start at infinity. For each amount and each coin that fits, keep the smaller of the current value and dp of a minus c, plus one.' },
        { p: 'This is exactly the coin problem that fooled greedy. DP can’t be fooled, because it tries every possible last coin and keeps the best. Cost: O(amount × number of coins).' },
        { note: 'Top-down is easier to write and only solves the subproblems you actually need. Bottom-up avoids recursion limits and is often faster, and it makes saving memory easier. Both give the same answers.', kind: 'remember' },
      ],
    },
    {
      title: 'Designing a DP: four questions',
      blocks: [
        { p: 'Every DP solution answers the same four questions. Answer them in words before writing any code.' },
        {
          list: [
            '**State**: what does one cell mean? For example, dp[a] = fewest coins to make amount a.',
            '**Transition**: how is a cell built from smaller cells? dp[a] = 1 + the minimum of dp[a − c] over coins c.',
            '**Base cases**: which cells are known directly? dp[0] = 0.',
            '**Order and answer**: which order fills ingredients first, and which cell holds the final answer? Increasing a; the answer is dp[amount].',
          ],
          ordered: true,
        },
        { note: 'Most DP mistakes come from a vague state. If you can’t say in one sentence what dp[i] means, the transition will be wrong. Write that sentence first.', kind: 'pitfall' },
      ],
    },
    {
      title: 'Two-dimensional DP',
      breakAfter: 'play',
      blocks: [
        { p: 'When the subproblem needs two numbers to describe it, the table becomes a grid. Counting paths for a robot that moves only right or down: the paths into a cell are the paths from the cell above plus the paths from the cell on its left.' },
        { figure: fig.grid, caption: 'Each cell = above + left. A blocked cell has 0 paths.' },
        { p: 'Comparing two strings works the same way. Let dp[i][j] be the answer for the first i letters of one string and the first j of the other. The **longest common subsequence** and **edit distance** both fill this kind of table in O(n × m).' },
        { note: 'If each row only depends on the row before it, you only need to keep two rows, or even one. That cuts memory from O(n × m) to O(m), which matters for long DNA sequences.', kind: 'python' },
      ],
    },
    {
      title: 'Common shapes of DP problems',
      blocks: [
        {
          table: [
            ['Shape', 'State', 'Example'],
            ['take or skip each item', 'best using the first i items', 'no two neighbours, 0/1 knapsack'],
            ['reach a target', 'best way to make amount a', 'coin change, climbing stairs'],
            ['grid paths', 'best/count to reach cell (r, c)', 'robot paths, minimum path sum'],
            ['two sequences', 'answer for prefixes i and j', 'LCS, edit distance'],
            ['intervals', 'answer for the slice i..j', 'matrix-chain order, palindromes'],
          ],
        },
        { p: 'Recognising the shape is half the work. When you meet a new problem, ask which of these it most resembles, and start from that state.' },
      ],
    },
    {
      title: 'Costs and limits',
      blocks: [
        { p: 'The cost of a DP is (number of states) × (work per state). Memory is the number of states you keep. That makes it easy to predict before you code: a 1,000 by 1,000 table is a million states, fine; a 100,000 by 100,000 table is ten billion, impossible.' },
        { note: 'The 0/1 knapsack DP runs in O(n × W), where W is the capacity number itself, not the size of the input. Double the number of digits in W and the work squares. That is why it is called pseudo-polynomial, and why huge capacities still defeat it.', kind: 'cost' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'DNA and protein alignment (Needleman–Wunsch and Smith–Waterman) are 2D DP tables, the backbone of bioinformatics. The Viterbi algorithm decodes speech and GPS tracks with DP over time steps. Reinforcement learning rests on the Bellman equation, a DP recurrence.', kind: 'science' },
        { note: 'Numerical methods use the same idea, building each new value from saved earlier ones. Time-stepping a simulation is a bottom-up table over time where each state depends only on the previous one.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'DP = optimal substructure + overlapping subproblems: solve each subproblem once.',
            'Top-down: recursion + memo (functools.cache). Bottom-up: fill a table in dependency order.',
            'Design with four questions: state, transition, base cases, order and answer.',
            'Cost = states × work per state; memory can often shrink to one or two rows.',
            'DP beats greedy where greedy has no proof, like coins 1, 3, 4.',
            'Common shapes: take/skip, reach a target, grids, two sequences, intervals.',
          ],
        },
      ],
    },
  ];
}

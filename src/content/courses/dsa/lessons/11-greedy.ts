import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function greedyLesson(fig: { coins: F; trap: F; meetings: F; wrongRule: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Many problems ask for the **best** answer: the fewest coins, the most meetings, the cheapest network. Trying every possibility is exponential, as you saw with backtracking. Two strategies do far better when they apply: **greedy algorithms**, in this topic, and **dynamic programming**, in the next.' },
        { p: 'Greedy algorithms are the simplest of the two, and often the fastest. But they come with a catch that every engineer must understand: they are only correct for some problems.' },
      ],
    },
    {
      title: 'What a greedy algorithm is',
      blocks: [
        { p: 'A **greedy algorithm** builds a solution step by step, and at each step makes the choice that looks **best right now**, by some simple rule. It never reconsiders a choice once made.' },
        { p: 'Because it never backtracks, a greedy algorithm is usually just “sort by the right key, then make one pass”: **O(n log n)**, sometimes with a heap to keep picking the current best.' },
        { p: 'The hard part isn’t the code. It is choosing the right rule, and **proving** that following it can never lead you away from an optimal answer.' },
      ],
    },
    {
      title: 'When greedy works',
      blocks: [
        { p: 'Paying an amount with the fewest coins, using standard coins like 25, 10, 5 and 1, the obvious rule works: always take the biggest coin that fits.' },
        { figure: fig.coins, caption: 'Biggest coin first: 25, 25, 10, 1, 1, 1 makes 63 with six coins.' },
        { p: 'For these coin values, taking the biggest coin is provably safe. Any optimal answer can be rearranged to use that coin too, so committing to it never hurts.' },
      ],
    },
    {
      title: 'When greedy fails',
      breakAfter: 'watch',
      blocks: [
        { p: 'Now change the coins to 1, 3 and 4, and pay 6.' },
        { figure: fig.trap, caption: 'Greedy grabs the 4 and is stuck with 4 + 1 + 1. The best answer is 3 + 3.' },
        { p: 'The locally best choice, the biggest coin, blocked the globally best answer. Nothing about the code looks wrong; the **rule** is wrong for this input. That is the danger of greedy algorithms.' },
        { note: 'A greedy algorithm that seems to work on your examples can still be wrong. Before trusting one, either prove it or hunt hard for a counterexample, especially small, awkward inputs like the one above.', kind: 'pitfall' },
      ],
    },
    {
      title: 'A classic that works: scheduling meetings',
      blocks: [
        { p: 'One room, many meeting requests with start and end times. Book the **most** meetings with no overlaps. Several rules sound reasonable: earliest start, shortest meeting, fewest clashes. Only one is always optimal: **earliest finish first**.' },
        { figure: fig.meetings, caption: 'Sort by end time; book every meeting that starts after the room becomes free.' },
        { figure: fig.wrongRule, caption: '“Shortest first” books one meeting here. Earliest finish would book two.' },
        { code: 'def max_meetings(meetings):\n    count, free_at = 0, float("-inf")\n    for start, end in sorted(meetings, key=lambda m: m[1]):\n        if start >= free_at:\n            count += 1\n            free_at = end\n    return count', say: 'Sort meetings by end time. Keep the time the room is free. Book each meeting that starts at or after that time, and update free at to its end.' },
      ],
    },
    {
      title: 'How to prove a greedy rule',
      breakAfter: 'play',
      blocks: [
        { p: 'The standard argument is called **exchange**. Take any optimal solution. Show you can swap its first choice for the greedy choice without making it worse. Repeat for every step, and the optimal solution turns into the greedy one, which must therefore be optimal too.' },
        { note: 'For meetings: let the optimal schedule start with meeting X. The greedy choice G finishes no later than X, so swapping X for G can’t create a clash with anything after it. The count stays the same. Repeating this on the rest proves earliest-finish is optimal.', kind: 'why' },
        { p: 'The coin system 1, 3, 4 fails exactly here: swapping 3 + 3 for a 4 doesn’t keep the solution as good. When no exchange argument exists, reach for dynamic programming instead.' },
        { p: 'Two properties signal that greedy may work. The **greedy-choice property**: some optimal solution starts with the greedy choice. And **optimal substructure**: after making it, what remains is a smaller copy of the same problem.' },
      ],
    },
    {
      title: 'Greedy with a heap',
      blocks: [
        { p: 'Many greedy algorithms need the current best item repeatedly, while new items appear. A heap provides that in O(log n). For example, the fewest meeting **rooms** needed: sort meetings by start; keep a min-heap of end times of rooms in use; reuse the room that frees up first, or open a new one.' },
        { p: 'Dijkstra’s shortest paths from topic 10 is greedy in exactly this way: it always finalises the closest unfinished node, and the non-negative-weights rule is what makes that safe.' },
      ],
    },
    {
      title: 'Famous greedy algorithms',
      blocks: [
        {
          table: [
            ['Algorithm', 'Greedy rule', 'Used for'],
            ['Activity selection', 'earliest finish', 'scheduling'],
            ['Huffman coding', 'merge the two rarest symbols', 'compression (ZIP, JPEG)'],
            ['Kruskal / Prim', 'add the cheapest safe edge', 'minimum-cost networks'],
            ['Dijkstra', 'finalise the closest node', 'shortest paths'],
            ['Fractional knapsack', 'best value per kilogram', 'loading, budgeting'],
          ],
        },
        { note: 'The **0/1 knapsack**, where items can’t be split, is not solved by greedy. Taking the best value-per-kilogram item first can waste space. It needs dynamic programming.', kind: 'pitfall' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Greedy heuristics are everywhere in engineering when exact answers are too slow: greedy graph colouring for scheduling parallel computations, greedy load balancing across processors, and greedy feature selection in statistics. They don’t always give the optimum, but they give a good answer fast, and sometimes provably close to optimal.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'Greedy: make the locally best choice by a simple rule, never undo it.',
            'Usually sort + one pass, O(n log n); sometimes with a heap.',
            'It is only correct when you can prove it, usually with an exchange argument.',
            'Biggest-coin-first works for standard coins but fails for 1, 3, 4.',
            'Meetings: earliest finish first is optimal; shortest-first and earliest-start are not.',
            'When no proof exists, use dynamic programming.',
          ],
        },
      ],
    },
  ];
}

import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cost, Frames, line, scene, txt } from '../../../lib/viz';
import { greedyLesson } from '../lessons/11-greedy';

/* ---------------- coins ---------------- */
function coinFrames(amount: number, coins: number[], best?: number[]): Frame[] {
  const f = new Frames();
  const sorted = [...coins].sort((a, b) => b - a);
  const taken: number[] = [];
  let left = amount;
  const tray = (role: Role = 'curr') =>
    taken.length ? arrayRow(taken, { y: 300, gap: 84, w: 70, prefix: 'c', idx: false, roles: Object.fromEntries(taken.map((_, i) => [i, role])) }) : [];
  const head = (hl?: number) => [
    ...arrayRow(sorted, { y: 110, gap: 110, w: 90, prefix: 'k', idx: false, roles: hl !== undefined ? { [sorted.indexOf(hl)]: 'curr' } : {} }),
    txt('lbl', 500, 40, `coins available: ${sorted.join(', ')}`, { size: 26 }),
  ];
  f.add([...head(), txt('left', 500, 420, `still to pay: ${left}`, { size: 34, role: 'curr' })], `Pay ${amount} with as few coins as possible. Greedy rule: always grab the biggest coin that fits.`);
  while (left > 0) {
    const c = sorted.find((x) => x <= left)!;
    taken.push(c);
    left -= c;
    f.add([...head(c), ...tray(), txt('left', 500, 420, `still to pay: ${left}`, { size: 34, role: 'curr' })], `${c} fits. Take it. ${left} left.`);
  }
  if (best && best.length < taken.length) {
    f.add([...head(), ...tray('danger'), txt('left', 500, 420, `greedy: ${taken.length} coins`, { size: 34, role: 'danger' })], `Greedy used ${taken.length} coins…`);
    f.add(
      [...head(), ...arrayRow(best, { y: 300, gap: 84, w: 70, prefix: 'b', idx: false, roles: Object.fromEntries(best.map((_, i) => [i, 'done' as Role])) }), txt('left', 500, 420, `best: ${best.length} coins (${best.join(' + ')})`, { size: 34, role: 'done' })],
      `…but ${best.join(' plus ')} needs only ${best.length}. Grabbing the biggest coin first was a trap. Greedy only works when you can prove it does.`,
    );
  } else f.add([...head(), ...tray('done'), txt('left', 500, 420, `${taken.length} coins`, { size: 34, role: 'done' })], `${taken.length} coins. For these coin values the greedy choice is always safe, which can be proven.`);
  return f.get();
}

/* ---------------- intervals ---------------- */
type Mtg = [number, number];
const X0 = 90;
const UNIT = 52;
function timeline(ms: Mtg[], roles: Record<number, Role> = {}, extra: Prim[] = [], label = true): Prim[] {
  const out: Prim[] = [];
  const maxT = Math.max(...ms.map((m) => m[1]), 10);
  out.push(line('axis', X0, 30, X0 + maxT * UNIT, 30, { role: 'muted', width: 2 }));
  for (let t = 0; t <= maxT; t += 2) out.push(txt(`tk${t}`, X0 + t * UNIT, 22, String(t), { size: 18, hand: false }));
  ms.forEach(([s, e], i) => {
    const y = 60 + i * 34;
    out.push(line(`m${i}`, X0 + s * UNIT, y, X0 + e * UNIT, y, { role: roles[i] ?? 'default', width: 20 }));
    if (label) out.push(txt(`ml${i}`, X0 + s * UNIT - 10, y + 7, `${s}–${e}`, { size: 18, anchor: 'end', hand: false, role: roles[i] }));
  });
  return [...out, ...extra];
}

function scheduleFrames(ms: Mtg[], by: 'end' | 'start' | 'short' = 'end'): Frame[] {
  const f = new Frames();
  const idx = ms.map((_, i) => i);
  const key = (i: number) => (by === 'end' ? ms[i][1] : by === 'start' ? ms[i][0] : ms[i][1] - ms[i][0]);
  idx.sort((a, b) => key(a) - key(b) || ms[a][1] - ms[b][1]);
  const roles: Record<number, Role> = {};
  const rule = by === 'end' ? 'earliest finish' : by === 'start' ? 'earliest start' : 'shortest';
  f.add(timeline(ms), `One room, many meeting requests. Fit in as many as possible. Rule: pick the ${rule} first.`);
  const chosen: Mtg[] = [];
  for (const i of idx) {
    const [s, e] = ms[i];
    const clash = chosen.some(([cs, ce]) => s < ce && cs < e);
    roles[i] = clash ? 'danger' : 'done';
    if (!clash) chosen.push(ms[i]);
    f.add(timeline(ms, { ...roles, [i]: clash ? 'danger' : 'curr' }), clash ? `${s}–${e} overlaps something already booked. Skip.` : `${s}–${e} fits. Book it.`);
  }
  f.add(
    timeline(ms, Object.fromEntries(Object.entries(roles).map(([k, v]) => [k, v === 'danger' ? 'muted' : v]))),
    by === 'end' ? `${chosen.length} meetings: the maximum possible. Finishing early always leaves the most room for the rest.` : `${chosen.length} meeting${chosen.length === 1 ? '' : 's'} with the ${rule} rule. Compare that with the earliest-finish rule.`,
  );
  return f.get();
}

const CLASSIC: Mtg[] = [
  [1, 4],
  [3, 5],
  [0, 6],
  [5, 7],
  [3, 9],
  [5, 9],
  [6, 10],
  [8, 11],
  [8, 12],
  [2, 14],
  [12, 16],
];

const TRACE_CODE = `def max_meetings(meetings):
    count = 0
    free_at = float("-inf")
    for start, end in sorted(meetings, key=lambda m: m[1]):
        if start >= free_at:
            count += 1
            free_at = end
    return count`;

function traceFrames(): Frame[] {
  const ms: Mtg[] = [
    [1, 3],
    [2, 5],
    [4, 7],
    [6, 8],
    [8, 10],
  ];
  const f = new Frames();
  let freeAt = -Infinity;
  let count = 0;
  const roles: Record<number, Role> = {};
  const free = () => (freeAt === -Infinity ? [] : [line('free', X0 + freeAt * UNIT, 40, X0 + freeAt * UNIT, 240, { role: 'second', dashed: true, label: 'free at' })]);
  f.add(timeline(ms, roles), 'Sorted by end time already. free_at is when the room becomes free.', { line: 3, vars: { count, free_at: '-inf' } });
  ms.forEach(([s, e], i) => {
    const ok = s >= freeAt;
    f.add(timeline(ms, { ...roles, [i]: 'curr' }, free()), `Meeting ${s}–${e}: does it start at or after ${freeAt === -Infinity ? 'minus infinity' : freeAt}? ${ok ? 'Yes.' : 'No.'}`, { line: 5, vars: { start: s, end: e, count, free_at: freeAt === -Infinity ? '-inf' : freeAt } });
    if (ok) {
      count++;
      freeAt = e;
      roles[i] = 'done';
      f.add(timeline(ms, roles, free()), `Book it. Room is free again at ${e}.`, { line: 7, vars: { count, free_at: freeAt } });
    } else roles[i] = 'danger';
  });
  f.add(timeline(ms, roles, free()), `${count} meetings. Sorting costs O of n log n, the scan is O of n.`, { line: 8, vars: { count } });
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  ms: Mtg[];
}

const topic: Topic = {
  id: 'greedy',
  order: 11,
  title: 'Greedy algorithms',
  short: 'Take the best-looking step now. Know when that’s safe.',
  icon: '🪙',
  costs: [cost('sort + one pass', 'O(n log n)'), cost('greedy with a heap', 'O(n log n)'), cost('the pass itself', 'O(n)')],

  intro: {
    what: "A greedy algorithm builds an answer by always taking the choice that looks best right now, and never going back.",
    why: "When it works, it is the simplest and fastest solution there is. Knowing when it fails is just as important, and leads straight into dynamic programming.",
    builds: "Sorting from topic 7 and heaps from topic 8: most greedy algorithms sort first or keep a heap.",
    goals: ["Recognise a greedy algorithm", "Prove a greedy rule works, or find a counterexample", "Schedule the most meetings", "Use a heap to make greedy choices fast"],
  },

  hook: { frames: () => coinFrames(6, [1, 3, 4], [3, 3]), lines: ['A greedy algorithm makes the choice that looks best right now and never looks back.', 'It’s fast and simple, but only correct when you can prove the local choice can’t hurt later.'] },

  watch: [
    { id: 'coins', title: 'Making change', frames: () => coinFrames(63, [1, 5, 10, 25]) },
    { id: 'trap', title: 'When greedy fails', frames: () => coinFrames(6, [1, 3, 4], [3, 3]) },
    { id: 'meetings', title: 'Earliest finish wins', frames: () => scheduleFrames(CLASSIC, 'end'), costs: [cost('schedule meetings', 'O(n log n)', 'O(1)')] },
    { id: 'shortest', title: 'A wrong rule', frames: () => scheduleFrames([[0, 5], [4, 6], [5, 10]], 'short') },
  ],

  lesson: greedyLesson({ coins: () => coinFrames(63, [1, 5, 10, 25]), trap: () => coinFrames(6, [1, 3, 4], [3, 3]), meetings: () => scheduleFrames(CLASSIC, 'end'), wrongRule: () => scheduleFrames([[0, 5], [4, 6], [5, 10]], 'short') }),
  recall: {
    prompt: 'What does a greedy algorithm do, and why must you be careful before trusting one? Give the rule that works for booking the most meetings.',
    model:
      'A greedy algorithm repeatedly takes the choice that looks best right now and never undoes it. That’s fast, but a locally best choice can block a better overall answer, like grabbing the 4 coin when paying 6 with coins 1, 3 and 4. You need a proof (or a counterexample search). For meetings, picking the one that finishes earliest is provably optimal because it leaves the most time for everything else.',
    keywords: [
      ['best', 'locally', 'right now', 'immediate'],
      ['never', 'no going back', 'doesn’t reconsider', "doesn't reconsider", 'commit'],
      ['proof', 'prove', 'counterexample', 'not always', 'fail', 'trap'],
      ['earliest finish', 'earliest end', 'finishes first', 'ends first', 'end time'],
    ],
  },

  play: {
    intro: 'Add meeting requests, then try three different greedy rules. Only one is always optimal: find it.',
    init: (): S => ({ ms: [[1, 4], [3, 5], [0, 6], [5, 7], [8, 11], [2, 14], [12, 16]] }),
    view: (s: S) => scene(timeline(s.ms)),
    ops: [
      {
        id: 'add',
        label: 'add meeting',
        args: [
          { name: 'start', kind: 'int', default: 9 },
          { name: 'end', kind: 'int', default: 12 },
        ],
        run: (s: S, a) => {
          const st = Math.max(0, Math.min(15, Number(a.start)));
          const en = Math.max(st + 1, Math.min(16, Number(a.end)));
          if (s.ms.length >= 10) return { state: s, frames: [{ scene: scene(timeline(s.ms)), say: 'Ten meetings is the limit here. Reset to start over.' }] };
          const ms: Mtg[] = [...s.ms, [st, en]];
          return { state: { ms }, frames: [{ scene: scene(timeline(ms, { [ms.length - 1]: 'new' })), say: `Added ${st}–${en}.` }] };
        },
      },
      { id: 'end', label: 'greedy: earliest finish', run: (s: S) => ({ state: s, frames: scheduleFrames(s.ms, 'end'), cost: cost('sort + scan', 'O(n log n)') }) },
      { id: 'start', label: 'greedy: earliest start', run: (s: S) => ({ state: s, frames: scheduleFrames(s.ms, 'start'), cost: cost('sort + scan', 'O(n log n)') }) },
      { id: 'short', label: 'greedy: shortest first', run: (s: S) => ({ state: s, frames: scheduleFrames(s.ms, 'short'), cost: cost('sort + scan', 'O(n log n)') }) },
    ],
  },

  predict: [
    {
      id: 'coins-146',
      question: 'Coins are 1, 3 and 4. Greedy (biggest first) pays 6 with how many coins?',
      scene: scene(arrayRow([4, 3, 1], { y: 200, gap: 110, w: 90, idx: false })),
      options: ['2', '3', '4', '6'],
      answer: 1,
      frames: () => coinFrames(6, [1, 3, 4], [3, 3]),
      why: 'Greedy takes 4, then 1, then 1: three coins. The best answer, 3 + 3, uses two.',
    },
    {
      id: 'meetings-count',
      question: 'Using “earliest finish first”, how many of these meetings fit in one room?',
      scene: scene(timeline(CLASSIC)),
      options: ['3', '4', '5', '6'],
      answer: 1,
      frames: () => scheduleFrames(CLASSIC, 'end'),
      why: 'It books 1–4, 5–7, 8–11 and 12–16: four, which is the maximum.',
    },
    {
      id: 'shortest-q',
      question: 'Meetings 0–5, 4–6 and 5–10. If you always book the SHORTEST meeting first, how many do you get?',
      scene: scene(timeline([[0, 5], [4, 6], [5, 10]])),
      options: ['1', '2', '3', '0'],
      answer: 0,
      frames: () => scheduleFrames([[0, 5], [4, 6], [5, 10]], 'short'),
      why: '4–6 is shortest, but it clashes with both others. Earliest-finish would book 0–5 and 5–10: two.',
    },
  ],

  trace: { title: 'Booking the most meetings', code: TRACE_CODE, frames: traceFrames },

  build: {
    intro: [
      'Build two greedy tools. pick_meetings returns the booked meetings (as (start, end) tuples) using the earliest-finish rule.',
      'make_change returns the coins greedy picks (biggest first). One test shows greedy giving a non-optimal answer on purpose.',
    ],
    starter: `def pick_meetings(meetings):
    # sort by end time, book each one that starts at or after the room is free
    pass


def make_change(amount, coins):
    # biggest coin that fits, repeatedly; return the list of coins
    pass
`,
    solution: `def pick_meetings(meetings):
    booked = []
    free_at = float("-inf")
    for start, end in sorted(meetings, key=lambda m: m[1]):
        if start >= free_at:
            booked.append((start, end))
            free_at = end
    return booked


def make_change(amount, coins):
    out = []
    for c in sorted(coins, reverse=True):
        while amount >= c:
            amount -= c
            out.append(c)
    return out
`,
    tests: [
      { call: 'pick_meetings([(1, 4), (3, 5), (0, 6), (5, 7), (8, 11), (12, 16)])', expected: '[(1, 4), (5, 7), (8, 11), (12, 16)]' },
      { call: 'pick_meetings([])', expected: '[]' },
      { call: 'pick_meetings([(0, 5), (4, 6), (5, 10)])', expected: '[(0, 5), (5, 10)]' },
      { call: 'make_change(63, [1, 5, 10, 25])', expected: '[25, 25, 10, 1, 1, 1]' },
      { call: 'make_change(0, [1, 2])', expected: '[]' },
      { call: 'make_change(6, [1, 3, 4])', show: 'greedy isn’t always optimal: make_change(6, [1, 3, 4])', expected: '[4, 1, 1]' },
    ],
    builtin: {
      text: 'Greedy algorithms are usually “sort, then one pass”, often with heapq to keep picking the current best. Python’s sorted(key=…) does the heavy lifting.',
      code: `sorted(meetings, key=lambda m: m[1])   # by end time
import heapq
heapq.nsmallest(3, jobs, key=lambda j: j.cost)`,
    },
  },

  fill: {
    intro: ['jumps[i] is how far you can jump forward from square i. Can you reach the last square?', 'Track the furthest square reachable so far. Write the line that updates it from square i.'],
    code: `def can_reach_end(jumps):
    furthest = 0
    for i, j in enumerate(jumps):
        if i > furthest:
            return False
        ____
    return True`,
    answer: 'furthest = max(furthest, i + j)',
    tests: [
      { call: 'can_reach_end([2, 3, 1, 1, 4])', expected: 'True' },
      { call: 'can_reach_end([3, 2, 1, 0, 4])', expected: 'False' },
      { call: 'can_reach_end([0])', expected: 'True' },
      { call: 'can_reach_end([1, 0, 1])', expected: 'False' },
    ],
  },

  wild: [
    { icon: '🗜️', title: 'Compression', text: 'Huffman coding greedily merges the two rarest symbols first. It’s inside ZIP, PNG and JPEG.' },
    { icon: '🔌', title: 'Network design', text: 'Kruskal’s and Prim’s algorithms greedily add the cheapest safe link to build minimum-cost cable, pipe or power networks.' },
    { icon: '🖥️', title: 'Scheduling', text: 'Operating systems and cloud schedulers use greedy rules like “shortest job next” or “earliest deadline first”.' },
    { icon: '📡', title: 'Routing', text: 'Dijkstra (topic 10) is greedy too: it always finalises the closest unvisited node, which is provably safe with non-negative weights.' },
  ],

  problems: [
    {
      id: 'batteries',
      title: 'Power the devices',
      difficulty: 'easy',
      pattern: 'Sort both, match smallest-that-fits',
      intro: ['needs[i] is the charge a device needs; packs[j] is a battery pack’s charge. A pack can power one device if its charge is at least the need.', 'Return the most devices you can power.'],
      examples: [{ input: 'max_powered([3, 1, 2], [1, 1, 4])', output: '2' }],
      starter: `def max_powered(needs, packs):
    pass
`,
      solution: `def max_powered(needs, packs):
    needs = sorted(needs)
    packs = sorted(packs)
    i = 0
    for p in packs:
        if i < len(needs) and p >= needs[i]:
            i += 1
    return i
`,
      tests: [
        { call: 'max_powered([3, 1, 2], [1, 1, 4])', expected: '2' },
        { call: 'max_powered([1, 2], [1, 2, 3])', expected: '2' },
        { call: 'max_powered([], [5])', expected: '0' },
        { call: 'max_powered([5], [1, 2])', expected: '0' },
        { call: 'max_powered([2, 2, 2], [2, 2])', expected: '2' },
        { call: 'max_powered(list(range(100000)), list(range(100000)))', expected: '100000' },
      ],
      hints: ['Greedy: give the smallest pack that works to the least needy device.', 'Sort both lists. Walk the packs from small to big; if the current pack covers the smallest need not yet served, serve it and move on.', 'sort both; i = 0 → for p in packs: if i < len(needs) and p >= needs[i]: i += 1 → return i'],
      complexity: { time: 'O(n log n)', space: 'O(n)' },
    },
    {
      id: 'budget',
      title: 'Most items on a budget',
      difficulty: 'easy',
      pattern: 'Cheapest first',
      intro: ['Return the largest number of items you can buy from prices without spending more than budget. Each item can be bought once.'],
      examples: [{ input: 'most_items([20, 5, 15, 10], 30)', output: '3', why: '5 + 10 + 15 = 30.' }],
      starter: `def most_items(prices, budget):
    pass
`,
      solution: `def most_items(prices, budget):
    count = 0
    for p in sorted(prices):
        if p > budget:
            break
        budget -= p
        count += 1
    return count
`,
      tests: [
        { call: 'most_items([20, 5, 15, 10], 30)', expected: '3' },
        { call: 'most_items([], 10)', expected: '0' },
        { call: 'most_items([50], 10)', expected: '0' },
        { call: 'most_items([1, 1, 1], 2)', expected: '2' },
        { call: 'most_items([3] * 100000, 300000)', expected: '100000' },
      ],
      hints: ['Cheapest first can’t be beaten: swapping any chosen item for a pricier one never lets you buy more.', 'Sort ascending and keep buying until the next item doesn’t fit.', 'for p in sorted(prices): if p > budget: break; budget −= p; count += 1 → return count'],
      complexity: { time: 'O(n log n)', space: 'O(n)' },
    },
    {
      id: 'rooms',
      title: 'How many rooms?',
      difficulty: 'medium',
      pattern: 'Greedy with a min-heap of end times',
      intro: ['meetings is a list of (start, end) with end exclusive. Return the fewest rooms needed so no two meetings in one room overlap.', 'Sort by start. Keep a min-heap of end times of rooms in use: reuse the room that frees up earliest.'],
      examples: [{ input: 'min_rooms([(0, 30), (5, 10), (15, 20)])', output: '2' }],
      starter: `import heapq

def min_rooms(meetings):
    pass
`,
      solution: `import heapq

def min_rooms(meetings):
    ends = []
    for start, end in sorted(meetings):
        if ends and ends[0] <= start:
            heapq.heapreplace(ends, end)
        else:
            heapq.heappush(ends, end)
    return len(ends)
`,
      tests: [
        { call: 'min_rooms([(0, 30), (5, 10), (15, 20)])', expected: '2' },
        { call: 'min_rooms([(7, 10), (2, 4)])', expected: '1' },
        { call: 'min_rooms([])', expected: '0' },
        { call: 'min_rooms([(1, 5), (5, 10)])', expected: '1' },
        { call: 'min_rooms([(1, 10), (2, 9), (3, 8)])', expected: '3' },
        { call: 'min_rooms([(i, i + 3) for i in range(100000)])', expected: '3' },
      ],
      hints: ['Greedy + heap: when a meeting starts, the best room to reuse is the one that frees up earliest.', 'Sort by start time. The heap holds each room’s end time. If the earliest end ≤ this start, reuse that room (replace its end). Otherwise open a new room.', 'for s, e in sorted: if heap and heap[0] <= s: heapreplace(heap, e) else heappush(heap, e) → return len(heap)'],
      complexity: { time: 'O(n log n)', space: 'O(n)' },
    },
  ],

  extra: [
    { name: 'Assign Cookies', url: 'https://leetcode.com/problems/assign-cookies/', difficulty: 'easy' },
    { name: 'Lemonade Change', url: 'https://leetcode.com/problems/lemonade-change/', difficulty: 'easy' },
    { name: 'Jump Game', url: 'https://leetcode.com/problems/jump-game/', difficulty: 'medium' },
    { name: 'Non-overlapping Intervals', url: 'https://leetcode.com/problems/non-overlapping-intervals/', difficulty: 'medium' },
    { name: 'Minimum Number of Arrows to Burst Balloons', url: 'https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/', difficulty: 'medium' },
    { name: 'Gas Station', url: 'https://leetcode.com/problems/gas-station/', difficulty: 'medium' },
  ],

  quiz: [
    { q: 'What makes an algorithm “greedy”?', options: ['It uses lots of memory', 'It commits to the locally best choice at each step', 'It tries every possibility', 'It sorts the input'], answer: 1, why: 'It never revisits a choice once made.' },
    { q: 'For booking the most meetings in one room, which rule is optimal?', options: ['Shortest meeting first', 'Earliest start first', 'Earliest finish first', 'Longest meeting first'], answer: 2, why: 'Finishing earliest leaves the most room for later meetings.' },
    { q: 'Greedy coin change with coins [1, 3, 4] for amount 6 gives 3 coins, but 2 is possible. What does that show?', options: ['Greedy is always wrong', 'A greedy rule needs a proof for each problem', 'Coins must be sorted', 'Use smaller coins first'], answer: 1, why: 'Greedy works for standard coins but not all coin systems. Dynamic programming (next topic) always finds the minimum.' },
  ],
};

export default topic;

import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function bitsLesson(fig: { hook: F; ops: F; count: F; masks: F; quad: F; kd: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'This last topic has two parts that share one idea: **represent data in the shape the computer handles best**. Bits are how the machine really stores numbers. Spatial structures organise points in space so you can ignore everything far away.' },
        { p: 'Both show up constantly in systems and in scientific computing: compact flags and fast arithmetic tricks on one side, collision detection and nearest-neighbour search on the other.' },
      ],
    },
    {
      title: 'What bits are',
      blocks: [
        { p: 'Computers store every integer in **binary**: a row of **bits**, each 0 or 1. Each bit is worth twice the one to its right: 1, 2, 4, 8, and so on. So 13 is 8 + 4 + 1, written 1101.' },
        { p: 'The processor can change every bit of a number in a single step. **Bit manipulation** uses that to pack many yes/no flags into one number and to do certain calculations in O(1).' },
        { p: 'Picture a row of light switches.' },
        { figure: fig.hook, caption: 'Eight switches are eight bits. Switches 8, 4 and 1 on make 13.' },
      ],
    },
    {
      title: 'The bit operators',
      blocks: [
        { figure: fig.ops, caption: 'AND, OR, XOR and shifts act on every bit at once.' },
        {
          table: [
            ['Operator', 'Meaning', 'Example'],
            ['`a & b`', 'AND: 1 where both are 1', '12 & 10 = 8'],
            ['`a | b`', 'OR: 1 where either is 1', '12 | 10 = 14'],
            ['`a ^ b`', 'XOR: 1 where they differ', '12 ^ 10 = 6'],
            ['`~a`', 'NOT: flip every bit', '~5 = −6 in Python'],
            ['`a << k`', 'shift left: multiply by 2ᵏ', '3 << 2 = 12'],
            ['`a >> k`', 'shift right: divide by 2ᵏ, rounding down', '13 >> 1 = 6'],
          ],
        },
        { p: 'Single bits are handled with a **mask**, a number with just one bit set: `1 << i`. Test bit i with `x >> i & 1`, set it with `x | (1 << i)`, clear it with `x & ~(1 << i)`, and flip it with `x ^ (1 << i)`.' },
      ],
    },
    {
      title: 'Useful tricks',
      breakAfter: 'watch',
      blocks: [
        { figure: fig.count, caption: 'x & (x − 1) switches off the lowest 1-bit. Repeat until zero to count the ones.' },
        {
          list: [
            '**x & (x − 1)** clears the lowest set bit. x is a power of two exactly when x > 0 and this gives 0.',
            '**x & −x** keeps only the lowest set bit.',
            '**XOR cancels pairs**: a ^ a = 0 and a ^ 0 = a, in any order. XOR-ing a list where everything appears twice except one item leaves that item.',
            'Shifts double or halve, which is why indexes in heaps and binary trees use them.',
          ],
        },
        { note: 'Python integers never overflow; they grow as large as needed. Negative numbers behave as if they had infinitely many 1-bits on the left, which is why `~5` is −6. For a count of ones use `bin(x).count("1")`, or `x.bit_count()` in Python 3.10 and later.', kind: 'python' },
      ],
    },
    {
      title: 'Bitmasks as sets',
      blocks: [
        { p: 'A number with n bits can represent any **subset** of n items: bit i is 1 when item i is in. Union is OR, intersection is AND, and adding an item is setting a bit. Each costs O(1) for up to 64 items on a typical processor.' },
        { figure: fig.masks, caption: 'Counting from 0 to 2ⁿ − 1 lists every subset, without recursion.' },
        { p: 'This powers “bitmask DP”: dynamic programming whose state is a subset of items, such as visiting cities in the travelling salesperson problem. It is still exponential, O(2ⁿ × n²), but practical up to about 20 items.' },
      ],
    },
    {
      title: 'Spatial structures: the problem',
      blocks: [
        { p: 'Now the second idea. You have many points in space: stars, particles, restaurants, game objects. The questions are spatial. What is near this point? What is inside this box? Which pairs are colliding?' },
        { p: 'Checking every point for every question is O(n), and checking every pair is O(n²). With a million particles, that is a trillion pair checks per time step. Spatial structures divide space into regions so that whole regions far away can be skipped at once.' },
      ],
    },
    {
      title: 'Quadtrees',
      blocks: [
        { p: 'A **quadtree** splits a square into four quarters, and keeps splitting any quarter that holds too many points. Crowded areas end up with small squares, empty areas with big ones. In 3D, the same idea with eight children is an **octree**.' },
        { figure: fig.quad, caption: 'A range search opens only the squares that touch the search box.' },
        { p: 'A range query starts at the root and only descends into squares that overlap the query box. For reasonably spread-out points, this costs about **O(log n + k)**, where k is the number of points found.' },
      ],
    },
    {
      title: 'k-d trees',
      breakAfter: 'play',
      blocks: [
        { p: 'A **k-d tree** is a binary tree over points in k dimensions. Each level splits the points at the **median** along one axis, alternating x, y, x, y… so the tree stays balanced and has height log n.' },
        { figure: fig.kd, caption: 'Alternate vertical and horizontal splits at the median.' },
        { p: 'To find the **nearest neighbour**, walk down to the region containing the query point, then back up, crossing a splitting line only if a closer point could lie on the other side. On typical data that is about O(log n) per query.' },
        { note: 'k-d trees work well in 2 or 3 dimensions but lose their advantage in high dimensions, where almost every region must be checked. This is part of the “curse of dimensionality” in data science.', kind: 'pitfall' },
      ],
    },
    {
      title: 'Uniform grids and spatial hashing',
      blocks: [
        { p: 'The simplest spatial structure is a uniform **grid**: divide space into equal cells of size d, and bucket each point by `(x // d, y // d)`. Any two points within distance d must be in the same or neighbouring cells.' },
        { p: 'Storing the grid in a hash map, called **spatial hashing**, means empty cells cost nothing. Finding all close pairs then costs about O(n) when points are spread evenly, instead of O(n²). Many games and particle simulations use exactly this.' },
        {
          table: [
            ['Structure', 'Best when', 'Typical query'],
            ['uniform grid / spatial hash', 'points evenly spread, fixed radius', 'O(1) cells per query'],
            ['quadtree / octree', 'uneven density, dynamic points', 'O(log n + k)'],
            ['k-d tree', 'static points, nearest neighbour', 'O(log n) typical'],
          ],
        },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'The Barnes–Hut algorithm builds an octree over stars and treats a distant group as a single mass at its centre, cutting gravity from O(n²) to O(n log n) per step. Molecular dynamics uses cell lists, a uniform grid, to find interacting atoms. Adaptive mesh refinement is a quadtree or octree over the simulation domain.', kind: 'science' },
        { note: 'Bits matter in science too: random number generators are built from shifts and XORs, and bitsets store huge yes/no grids, like which cells are occupied, in a fraction of the memory.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'Integers are bits; AND, OR, XOR, NOT and shifts act on all bits in O(1).',
            'Masks test, set, clear and flip single bits. x & (x − 1) clears the lowest set bit; XOR cancels pairs.',
            'A bitmask can represent a subset; counting 0 to 2ⁿ − 1 lists all subsets.',
            'Spatial structures skip whole regions far away from the query.',
            'Quadtrees and octrees adapt to density; k-d trees split at medians and find nearest neighbours fast in low dimensions.',
            'Uniform grids with spatial hashing find close pairs in about O(n).',
          ],
        },
      ],
    },
  ];
}

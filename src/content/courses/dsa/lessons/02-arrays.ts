import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function arraysLesson(fig: { hook: F; addresses: F; insertShift: F; twoPointers: F; window: F; prefix: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Almost every program stores a collection of things: readings from a sensor, letters in a word, pixels in an image. The simplest and most important way to store a collection is the **array**.' },
        { p: 'Every other structure in this course is either built on top of arrays, or exists because arrays are bad at something. So understanding exactly what arrays are good and bad at is the foundation for everything after this.' },
        { p: 'This topic also introduces three techniques you will use constantly: **two pointers**, the **sliding window** and **prefix sums**. They turn many slow O(n²) solutions into fast O(n) ones.' },
      ],
    },
    {
      title: 'What an array is',
      blocks: [
        { p: 'An **array** is a sequence of items stored **side by side in one continuous block of memory**, each slot the same size, numbered from 0. The number of a slot is its **index**.' },
        { p: 'Because the slots are equal-sized and back to back, the computer can work out where any slot is with one calculation: start address plus index times slot size. No searching is needed.' },
        { p: 'A **string** is an array of characters. In Python strings are **immutable**: you can read any character instantly, but “changing” a string always builds a new one.' },
        { p: 'Picture a row of numbered cinema seats.' },
        { figure: fig.hook, caption: 'Jumping to seat 5 is instant. Squeezing someone into seat 1 makes everyone after them shuffle along.' },
      ],
    },
    {
      title: 'Reading is instant',
      blocks: [
        { figure: fig.addresses, caption: 'The address of a[3] is computed directly: 100 + 3 × 4 = 112.' },
        { p: 'Reading or writing `a[i]` costs **O(1)**, whatever i is and however long the array is. This is called **random access**: any position is as cheap as any other.' },
        { p: 'This is the array’s superpower. Many algorithms, like binary search and every table in dynamic programming, depend on being able to jump straight to position i.' },
        { note: 'Python’s list doesn’t store your numbers themselves side by side. It stores **references** (addresses) to number objects, side by side. Indexing is still O(1). For truly packed numbers, scientific code uses NumPy arrays, which are much faster for maths.', kind: 'python' },
      ],
    },
    {
      title: 'Inserting and deleting means shifting',
      breakAfter: 'watch',
      blocks: [
        { p: 'The same property that makes reading fast makes inserting slow. Items must stay side by side with no gaps, so putting something in the middle means moving everything after it one slot to the right.' },
        { figure: fig.insertShift, caption: 'Inserting at index 1 shifts four items. Appending at the end shifts nothing.' },
        { p: 'Inserting or deleting at position i moves n − i items, so in the worst case, at the front, it costs **O(n)**. At the end it moves nothing, so appending and popping from the end are cheap.' },
        { p: 'Searching for a value in an unsorted array is also O(n): without order, you have no choice but to look at each item.' },
        { note: 'Arrays are great when you mostly **read** and **add at the end**. They are a poor choice when you constantly insert or remove at the front or middle.', kind: 'remember' },
      ],
    },
    {
      title: 'Growing: the dynamic array',
      blocks: [
        { p: 'A raw array has a fixed size. But Python lists grow. How? A **dynamic array** reserves more slots than it needs. Appending fills a spare slot. When the spare slots run out, it allocates a bigger block and copies everything across.' },
        { p: 'That copy costs O(n), but because the block grows by a multiplying factor, copies become rare. Averaged over all appends, each append costs **O(1) amortised**. You saw why in the Big-O topic.' },
        { note: 'If you know the final size in advance, building the list in one go, like `[0] * n` or a list comprehension, avoids the repeated growing.', kind: 'python' },
      ],
    },
    {
      title: 'Technique 1: two pointers',
      blocks: [
        { p: 'Many array problems ask about **pairs** of items. Checking every pair is O(n²). The **two pointers** technique often does it in O(n) by moving two indexes in a coordinated way, so each step rules something out for good.' },
        { figure: fig.twoPointers, caption: 'On sorted data, if the sum is too small only the left pointer can help; if too big, only the right one can.' },
        { p: 'Why is it correct? On sorted data, when the sum is too small, the left item cannot be part of any answer, because pairing it with anything smaller than the current right item only makes the sum smaller. So discarding it loses nothing.' },
        { p: 'Two pointers come in two common shapes: **from both ends inward** (pair sums, palindromes, reversing) and **both moving forward** at different speeds (removing duplicates in place, merging two sorted lists).' },
      ],
    },
    {
      title: 'Technique 2: the sliding window',
      blocks: [
        { p: 'Many problems ask about **contiguous runs**: the best sum of k neighbours, the longest stretch that satisfies a rule. A **sliding window** keeps a running summary of the current run and updates it as the window moves, instead of recomputing from scratch.' },
        { figure: fig.window, caption: 'Each slide adds the new item and removes the old one: two operations, whatever the window size.' },
        { p: 'With a **fixed-size** window, you add the item entering on the right and subtract the one leaving on the left. With a **variable-size** window, you grow the right edge and shrink the left edge whenever the window breaks the rule.' },
        { note: 'Each index enters the window once and leaves at most once. So even with the inner shrinking loop, a variable window does O(n) total work. Count the moves of each pointer, not the nesting of the loops.', kind: 'why' },
      ],
    },
    {
      title: 'Technique 3: prefix sums',
      breakAfter: 'play',
      blocks: [
        { p: 'If you will ask many questions like “what is the sum from index i to j?”, precompute a **prefix sum** array P, where P[k] is the total of the first k items. Building it is one pass: O(n).' },
        { figure: fig.prefix, caption: 'Any range sum becomes one subtraction: sum of a[i..j] = P[j+1] − P[i].' },
        { p: 'After that, every range sum costs **O(1)**. This trade of O(n) setup for instant queries appears everywhere: cumulative rainfall, running totals in finance, and integral images in computer vision.' },
        { p: 'Combined with a hash map, prefix sums also count subarrays with a given sum in O(n), which you will meet in the next topic.' },
      ],
    },
    {
      title: 'Strings are arrays too',
      blocks: [
        { p: 'Everything above applies to strings: indexing is O(1), and two pointers and sliding windows work on characters exactly as on numbers. Palindrome checks, longest-unique-substring and anagram windows are all array techniques in disguise.' },
        { note: 'Because Python strings are immutable, `s = s + c` inside a loop may copy the whole string each time, which is O(n²) overall. Build a list of pieces and use `"".join(pieces)`, which is O(n).', kind: 'pitfall' },
        { note: 'Slicing, `s[i:j]` or `a[i:j]`, makes a **copy** of length j − i. Slicing inside a loop can quietly turn O(n) into O(n²). Pass indexes around instead of slices when it matters.', kind: 'pitfall' },
      ],
    },
    {
      title: 'Costs at a glance',
      blocks: [
        {
          table: [
            ['Operation', 'Cost', 'Why'],
            ['read / write `a[i]`', 'O(1)', 'address = start + i × size'],
            ['append / pop at end', 'O(1) amortised', 'spare capacity, rare copies'],
            ['insert / delete at i', 'O(n − i)', 'later items shift'],
            ['search unsorted', 'O(n)', 'must check each item'],
            ['search sorted', 'O(log n)', 'binary search (topic 7)'],
            ['range sum with prefix array', 'O(1)', 'one subtraction after O(n) setup'],
          ],
        },
        { p: 'There is one more hidden advantage. Arrays are **cache friendly**: the processor loads neighbouring memory together, so walking an array in order is far faster in practice than following pointers around memory, even when both are O(n).' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Almost every simulation stores its state in arrays: positions and velocities of particles, temperatures on a grid, the pixels of an image. NumPy and similar libraries are built on packed arrays so that whole-array operations run in fast compiled loops.', kind: 'science' },
        { note: 'Sliding windows give moving averages and smoothing filters for noisy signals. Prefix sums give cumulative quantities, and their 2D version, the integral image, makes box filters cost the same for any box size.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'An array is one contiguous block of equal-sized slots, so `a[i]` is O(1).',
            'Inserting or deleting in the middle shifts items: O(n). Appending is O(1) amortised.',
            'Two pointers replace many O(n²) pair searches with O(n) scans.',
            'A sliding window keeps a running summary of a contiguous run: O(n).',
            'Prefix sums trade O(n) setup for O(1) range-sum queries.',
            'Strings are immutable arrays: join pieces instead of concatenating in a loop.',
          ],
        },
      ],
    },
  ];
}

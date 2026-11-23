import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function sortingLesson(fig: { hook: F; insertion: F; merge: F; quick: F; binary: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Order is information. Once data is sorted, finding things, spotting duplicates, merging lists, and answering “everything between A and B” all become dramatically cheaper.' },
        { p: 'That is why sorting is one of the most studied problems in computing, and why **binary search**, which only works on sorted data, is one of the most useful algorithms you will ever learn.' },
      ],
    },
    {
      title: 'What sorting and binary search are',
      blocks: [
        { p: '**Sorting** rearranges items into order: smallest to largest, alphabetical, by date. Most sorts are **comparison sorts**: they only learn about the data by asking “is a less than b?”' },
        { p: '**Binary search** finds a target in sorted data by checking the middle item, then throwing away the half that can’t contain the target, and repeating. Each check halves the problem, so it takes **O(log n)** steps.' },
        { p: 'Picture a hand of cards and a dictionary.' },
        { figure: fig.hook, caption: 'Each new card slides into place in your hand. Once sorted, you can find any card by halving.' },
      ],
    },
    {
      title: 'Insertion sort: simple, and quadratic',
      blocks: [
        { p: '**Insertion sort** grows a sorted section on the left. It takes the next item and slides it left past every bigger item until it fits, exactly like sorting a hand of cards.' },
        { figure: fig.insertion, caption: 'Each new item slides left until the item before it is smaller.' },
        { p: 'In the worst case, reversed input, item k slides past all k items before it, so the total is about n²/2: **O(n²)**. On already sorted input nothing slides: **O(n)**. On nearly sorted data it is excellent.' },
        { p: 'It is also **stable** (equal items keep their original order) and **in place** (O(1) extra memory). That is why real-world sorts use it for small pieces.' },
      ],
    },
    {
      title: 'Merge sort: divide and conquer',
      breakAfter: 'watch',
      blocks: [
        { p: '**Merge sort** splits the list in half, sorts each half recursively, then **merges** the two sorted halves by repeatedly taking the smaller front item.' },
        { figure: fig.merge, caption: 'Sorted runs double in size at every level until one run holds everything.' },
        { p: 'There are log n levels of halving, and merging at each level touches every item once, so merge sort is **O(n log n)** in every case: best, average and worst. It is stable, but needs **O(n) extra memory** for the merging.' },
        { note: 'Merging works because both halves are already sorted. The smallest remaining item overall must be at the front of one of them, so one comparison finds it. That turns combining two sorted lists into a single linear pass.', kind: 'why' },
      ],
    },
    {
      title: 'Quick sort: partition around a pivot',
      blocks: [
        { p: '**Quick sort** picks a **pivot**, then **partitions**: it moves everything smaller to the left and everything larger to the right. The pivot is now in its final position. Then it sorts each side recursively.' },
        { figure: fig.quick, caption: 'After one partition, the pivot never moves again.' },
        { p: 'With good pivots the sides are roughly equal, giving **O(n log n)** on average, in place, and very fast in practice. With terrible pivots, like always picking the smallest item, one side is empty every time and it degrades to **O(n²)**.' },
        { note: 'Real implementations choose pivots randomly or by a median-of-three rule, which makes the O(n²) case vanishingly unlikely.', kind: 'remember' },
      ],
    },
    {
      title: 'Why n log n is the limit',
      breakAfter: 'play',
      blocks: [
        { p: 'Can a comparison sort beat O(n log n)? No. There are n! possible orderings of n items, and each yes-or-no comparison can at best halve the possibilities. So you need at least log₂(n!) comparisons, which grows like **n log n**.' },
        { p: 'Algorithms that don’t compare can go faster. **Counting sort** and **radix sort** sort integers in a limited range in O(n + k), by using the values themselves as positions. They trade generality for speed.' },
        {
          table: [
            ['Algorithm', 'Best', 'Average', 'Worst', 'Extra memory', 'Stable'],
            ['Insertion sort', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'yes'],
            ['Merge sort', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'yes'],
            ['Quick sort', 'O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'no'],
            ['Python’s sorted (Timsort)', 'O(n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'yes'],
          ],
        },
      ],
    },
    {
      title: 'Binary search in depth',
      blocks: [
        { figure: fig.binary, caption: 'lo and hi bracket the only region that can still contain the target.' },
        { p: 'Binary search keeps an **invariant**: if the target exists, it lies between lo and hi. Each step compares with the middle and moves lo or hi past it, keeping the invariant while halving the region. When lo passes hi, the region is empty and the target isn’t there.' },
        { p: 'Most bugs come from the boundaries: is hi inclusive or exclusive? Do you set lo = mid or lo = mid + 1? Pick one convention, and check that every update strictly shrinks the region, otherwise the loop can run forever.' },
        { p: 'A very useful variant is the **lower bound**: the first index whose value is at least x. It answers “where would x go?” and works even when x isn’t present or appears many times.' },
      ],
    },
    {
      title: 'Binary search on the answer',
      blocks: [
        { p: 'Binary search isn’t only for arrays. If a question has a yes-or-no answer that flips **once**, say “can I finish with speed k?” is false for small k and true for every k beyond some point, then you can binary-search for that flipping point.' },
        { p: 'The search space is the range of possible answers, not an array. Each check costs whatever testing one candidate costs. This turns many optimisation problems into a sequence of simple yes-or-no checks: O(check × log range).' },
      ],
    },
    {
      title: 'In Python',
      blocks: [
        { note: '`sorted(x)` returns a new list; `x.sort()` sorts in place. Both use **Timsort**, which detects runs that are already ordered, merges them, and uses insertion sort on small pieces. It is stable, so you can sort by one key and then another.', kind: 'python' },
        { code: 'people.sort(key=lambda p: p.age)            # by age\npeople.sort(key=lambda p: (p.city, -p.age))  # city, then oldest first\nimport bisect\ni = bisect.bisect_left(sorted_nums, x)      # lower bound', say: 'Sort with a key function, or a tuple of keys for tie-breaking. bisect dot bisect left gives the lower bound in a sorted list.' },
        { note: 'Binary search only works on sorted data. Searching unsorted data with it returns wrong answers silently, with no error.', kind: 'pitfall' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Finding a root of an equation by bisection is binary search on real numbers: keep an interval where the function changes sign, and halve it. Each step gains one binary digit of accuracy.', kind: 'science' },
        { note: 'Sorting particles by grid cell puts neighbours next to each other in memory, which speeds up simulations. Sorted event times drive discrete-event simulations, and sorted data makes medians and percentiles cheap.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'Insertion sort: simple, stable, O(n²) worst, O(n) when nearly sorted.',
            'Merge sort: split, sort halves, merge. Always O(n log n), O(n) extra memory.',
            'Quick sort: partition around a pivot. O(n log n) average, in place; random pivots avoid O(n²).',
            'Comparison sorts can’t beat O(n log n); counting and radix sort can for limited integers.',
            'Binary search: keep the invariant, shrink the region every step. O(log n).',
            'Binary search on the answer works whenever a yes/no question flips once.',
          ],
        },
      ],
    },
  ];
}

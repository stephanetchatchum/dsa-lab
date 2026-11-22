import type { Frame, LessonSection } from '../../../../types';

/** The Big-O deep dive. Figures come from the topic file so the same animations are reused. */
export function bigOLesson(fig: { hook: () => Frame[]; race: () => Frame[]; nested: () => Frame[]; halving: () => Frame[]; space: () => Frame[]; linear: () => Frame[] }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'An **algorithm** is a precise, step-by-step method for solving a problem: sorting a list, finding a route, searching for a name. A **data structure** is a way of organising data so that those steps are possible and quick.' },
        { p: 'Almost every problem can be solved by several different algorithms. They all give the right answer. What separates them is how much **work** they do to get there, and how much **memory** they need while doing it.' },
        { p: 'For small inputs, the difference rarely matters. Every method finishes in a blink. The difference shows up when the input gets big: thousands, millions or billions of items. That is exactly when real software and scientific simulations live.' },
        { p: 'So before learning any data structure, you need a way to measure and compare that work. This topic gives you that measuring tool. Every topic after this one uses it.' },
      ],
    },
    {
      title: 'What Big-O is',
      blocks: [
        { p: '**Big-O notation** describes how the amount of work an algorithm does **grows** as its input grows. We call the size of the input **n**: the number of items in a list, the number of people in a network, the number of cells in a grid.' },
        { p: 'Big-O does not give you seconds. Seconds depend on your computer, your language and what else is running. Instead, Big-O gives you the **shape** of the growth: if n doubles, does the work stay the same, double, quadruple, or explode?' },
        { p: 'We write it like **O(n)**, read as “order n” or “big O of n”. O(n) means the work grows in step with n. O(n²) means it grows with n times n. O(1) means it doesn’t grow at all.' },
        { p: 'Picture it with something familiar. You need to find one name, Maya, among many names. Here are two ways the names could be stored, and how the work grows for each.' },
        { figure: fig.hook, caption: 'A shuffled pile needs a check per card, so the work grows with n. A sorted book lets you halve the search each time, so the work grows with log n.' },
        { p: 'Both methods find Maya. But double the names, and the pile doubles its work while the book adds only one step. That difference in growth is exactly what Big-O describes.' },
        { note: 'Say a program takes 2 seconds on 1,000 items. If it is O(n), a million items take about 2,000 seconds: half an hour. If it is O(n²), a million items take about 2 million seconds: over three weeks. Same machine, same programmer. Only the growth rate changed.', kind: 'example' },
        { figure: fig.race, caption: 'Five growth rates racing as n doubles. Watch how quickly n² leaves the chart while log n barely moves.' },
      ],
    },
    {
      title: 'Counting steps',
      blocks: [
        { p: 'A **step** is any basic operation that takes a fixed amount of time: an addition, a comparison, reading `a[i]`, assigning a variable. We never ask exactly how long a step takes. We only count how many steps there are.' },
        { code: 'def total(nums):\n    s = 0\n    for x in nums:\n        s += x\n    return s', say: 'A function total that sets s to zero, loops over every x in nums adding it to s, then returns s.' },
        { p: 'Count it line by line. `s = 0` runs once. The loop body runs once for every item, so n times. `return s` runs once. That is about n + 2 steps in total.' },
        { p: 'As n grows, the extra 2 stops mattering. A million and two is basically a million. So we say total is **O(n)**: linear time.' },
        { figure: fig.linear, caption: 'One step per item: n items, n steps.' },
        { p: 'Five rules cover almost every piece of code you will analyse:' },
        {
          list: [
            '**Sequences add.** An O(n) loop followed by another O(n) loop is O(2n), which is still O(n).',
            '**Nesting multiplies.** A loop over n items inside a loop over n items is O(n × n) = O(n²).',
            '**Drop constants and smaller terms.** O(3n) is O(n). O(n² + n) is O(n²), because n² dwarfs n.',
            '**Halving gives a logarithm.** A loop that halves (or doubles) its counter runs about log₂ n times.',
            '**A call costs what the function costs.** One line that calls an O(n) function is O(n), not one step.',
          ],
          ordered: true,
        },
        { note: 'The fifth rule is the classic trap. `if x in my_list:` inside a loop looks like a single line, but `in` on a list scans the whole list. A loop around it makes the code O(n²).', kind: 'pitfall' },
        { figure: fig.nested, caption: 'Nested loops: every row checks every column, so the work is n times n.' },
      ],
    },
    {
      title: 'The precise definition',
      blocks: [
        { p: 'Formally, a function f(n) is **O(g(n))** if there are constants c and n₀ such that f(n) ≤ c · g(n) for every n ≥ n₀. In words: past some point, f never grows faster than a constant multiple of g.' },
        { note: '3n + 5 is O(n). Choose c = 4 and n₀ = 5. For every n of at least 5, 3n + 5 is at most 3n + n, which is 4n. The definition is satisfied.', kind: 'example' },
        { p: 'This is exactly why constants and small terms disappear. They get absorbed into the constant c, and n₀ lets us ignore small inputs.' },
        { p: 'Big-O is an **upper bound**. Strictly speaking, an O(n) algorithm is also O(n²), because n ≤ n². In practice people quote the tightest bound they can prove.' },
        { p: 'Two relatives complete the picture. **Ω** (big omega) is a lower bound: the growth is at least this. **Θ** (big theta) means both at once: the growth is exactly this, up to constants. When engineers say binary search is O(log n), they usually mean Θ(log n) in the worst case.' },
      ],
    },
    {
      title: 'The growth classes you will meet',
      blocks: [
        {
          table: [
            ['Class', 'Name', 'Typical example', 'n = 1,000', 'n = 1,000,000'],
            ['O(1)', 'constant', 'read `a[i]`, dict lookup', '1', '1'],
            ['O(log n)', 'logarithmic', 'binary search', '≈ 10', '≈ 20'],
            ['O(n)', 'linear', 'scan a list once', '1,000', '1,000,000'],
            ['O(n log n)', 'linearithmic', 'merge sort, `sorted()`', '≈ 10,000', '≈ 20,000,000'],
            ['O(n²)', 'quadratic', 'compare all pairs', '1,000,000', '10¹²'],
            ['O(2ⁿ)', 'exponential', 'try every subset', '≈ 10³⁰¹', 'astronomical'],
          ],
          caption: 'Approximate step counts. The last two rows explain why some programs never finish.',
        },
        { p: 'A rough rule for Python: it manages somewhere between ten and a hundred million simple steps per second. At a million items, n log n is about twenty million steps, around a second. n² is a trillion steps: hours, or days.' },
        { note: 'When n can be large, aim for O(n log n) or better. O(n²) is usually fine up to a few thousand items. O(2ⁿ) is only practical for tiny inputs, roughly n under 25.', kind: 'remember' },
      ],
    },
    {
      title: 'Why logarithms show up',
      blocks: [
        { p: 'log₂ n answers a simple question: how many times can I halve n before I reach 1? Sixteen halves to eight, four, two, one. That is four halvings, and log₂ 16 = 4.' },
        { figure: fig.halving, caption: 'Each step throws away half of what is left. Sixteen items need four steps.' },
        { p: 'Any algorithm that throws away a constant fraction of the remaining work at each step takes O(log n) steps. Binary search does this. So does walking down a balanced tree, where each level holds twice as many nodes as the one above.' },
        { p: 'The base of the logarithm does not matter in Big-O. log₂ n and log₁₀ n differ by a constant factor of about 3.32, so both are simply O(log n).' },
        { p: '**n log n** usually means log n rounds, each touching all n items. Merge sort is the classic case: it has log n levels of merging, and every level does n work.' },
      ],
    },
    {
      title: 'Best, worst and average case',
      blocks: [
        { p: 'One algorithm can behave very differently on different inputs of the same size. Searching a list for x takes 1 step if x is first, and n steps if x is last or missing.' },
        { p: 'The **worst case** is what we usually quote, because it is a guarantee. The **average case** matters when bad cases are rare. Hash tables are O(1) on average, but O(n) in the unlucky case where every key collides.' },
        { note: 'Insertion sort is O(n²) in the worst case, which is reversed input. On input that is already sorted it is only O(n), because nothing moves. That is why Python’s own sort uses it on small, nearly sorted pieces.', kind: 'example' },
      ],
    },
    {
      title: 'Amortised cost: cheap on average',
      blocks: [
        { p: 'Some operations are usually cheap but occasionally expensive. Appending to a Python list normally takes one step. But when the list’s hidden array is full, Python must allocate a bigger array and copy everything over: O(n) for that one append.' },
        { p: 'Because the array grows by a multiplying factor, those copies get rarer and rarer. Spread the occasional big copy across all the cheap appends, and each append averages out to a constant. We call that **amortised O(1)**.' },
        { note: 'Suppose the array doubles whenever it is full. Then n appends trigger copies of 1, 2, 4, 8 … up to n items. That sum is less than 2n. So the copying adds at most about two steps per append, however large n gets.', kind: 'why' },
        { note: 'CPython actually grows lists by about 12.5% plus a little, not by doubling. Any constant growth factor above 1 still gives amortised O(1). Growing by a fixed amount, like 10 slots at a time, would not: it makes n appends cost O(n²) in total.', kind: 'python' },
      ],
    },
    {
      title: 'Space complexity',
      blocks: [
        { p: 'Memory grows too, and we measure it the same way: the extra memory an algorithm needs, as a function of n. We usually don’t count the input itself.' },
        { figure: fig.space, caption: 'Reversing into a new list costs O(n) extra space. Swapping in place costs O(1).' },
        { p: 'Recursion uses memory you can’t see. Every call that is still waiting sits on the call stack as a frame. So recursion n levels deep costs O(n) space, even if it allocates nothing else. Python stops you at about 1,000 levels by default with a RecursionError.' },
        { p: 'Time and space can often be traded. A hash set spends O(n) extra memory to turn an O(n²) duplicate check into an O(n) one. That trade is one of the most common moves in algorithm design.' },
      ],
    },
    {
      title: 'Hidden costs in Python',
      blocks: [
        { p: 'Python hides loops inside innocent-looking operations. Knowing these costs is half of writing fast Python.' },
        {
          table: [
            ['Operation', 'Cost', 'Why'],
            ['`len(x)`', 'O(1)', 'the length is stored, not counted'],
            ['`a[i]`, `a[i] = v`', 'O(1)', 'address arithmetic'],
            ['`a.append(v)`, `a.pop()`', 'O(1) amortised', 'works at the end of the array'],
            ['`a.insert(0, v)`, `a.pop(0)`', 'O(n)', 'every other item shifts'],
            ['`x in some_list`', 'O(n)', 'scans the list'],
            ['`x in some_set`, `x in some_dict`', 'O(1) average', 'hashing'],
            ['`a[i:j]`', 'O(j − i)', 'a slice is a copy'],
            ['`sorted(a)`, `a.sort()`', 'O(n log n)', 'Timsort'],
            ['`min(a)`, `max(a)`, `sum(a)`', 'O(n)', 'must look at every item'],
          ],
        },
        { note: 'Building a string with `s += piece` inside a loop can cost O(n²) in total, because strings can’t be changed in place and each step may copy everything so far. Collect the pieces in a list and call `"".join(pieces)` once at the end.', kind: 'pitfall' },
        { note: 'Removing items from the front of a list in a loop, with `pop(0)`, is O(n²) in total. Use `collections.deque`, whose `popleft()` is O(1).', kind: 'pitfall' },
      ],
    },
    {
      title: 'When constants do matter',
      blocks: [
        { p: 'Big-O describes behaviour for large n. On small inputs, the constants we dropped can dominate. A simple O(n²) insertion sort beats merge sort on ten items, which is why real sorting code switches to insertion sort for small pieces.' },
        { p: 'How data sits in memory matters too. Scanning an array is much faster than following pointers through a linked list, even though both are O(n). The processor loads neighbouring memory in advance, and arrays keep neighbours together.' },
        { p: 'So the professional workflow is: use Big-O to choose the right shape of algorithm, then **measure** with realistic data to tune it.' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Simulating gravity by checking every pair of n stars is O(n²) per time step. The Barnes–Hut method groups distant stars together and needs only O(n log n), which is what makes million-star galaxy simulations feasible.', kind: 'science' },
        { note: 'The fast Fourier transform computes exactly the same result as the direct Fourier transform, but in O(n log n) instead of O(n²). It sits underneath audio processing, image compression and many physics solvers.', kind: 'science' },
        { note: 'Grids grow with dimension. With 100 points per side, a grid has ten thousand cells in 2D and a million in 3D. Doubling the resolution of a 3D simulation multiplies its cells by 8. Complexity tells you, before you run anything, whether a simulation can finish.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'Big-O describes how work grows with input size n, ignoring constant factors.',
            'Sequences add, nested loops multiply, halving gives log n, and calls cost what they do.',
            'Formally, f is O(g) when f ≤ c·g for all large n. Ω is a lower bound, Θ is both.',
            'Quote the worst case, but know the average and amortised costs too.',
            'Count memory as well, including the call stack used by recursion.',
            'Choose algorithms by growth rate, then measure to tune them.',
          ],
        },
      ],
    },
  ];
}

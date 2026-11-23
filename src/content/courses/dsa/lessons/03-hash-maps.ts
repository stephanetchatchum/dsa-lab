import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function hashLesson(fig: { hook: F; keyToBucket: F; collisions: F; lookup: F; resize: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Arrays find things fast only if you know the **index**. But usually you know something else: a username, a word, a product code. You want to go from that **key** straight to its data.' },
        { p: 'Searching an array for a key is O(n). Keeping it sorted and using binary search is O(log n), but inserting stays O(n). A **hash map** gets lookup, insert and delete down to **O(1) on average**. It is probably the most used data structure in real software.' },
      ],
    },
    {
      title: 'What a hash map is',
      blocks: [
        { p: 'A **hash map** (Python’s `dict`) stores **key → value** pairs. A **hash set** (Python’s `set`) stores keys only, to answer “is this in here?”. Both work the same way inside.' },
        { p: 'Inside, there is an array of slots called **buckets**. A **hash function** turns any key into a number, and that number, modulo the number of buckets, picks a bucket. The key and its value are stored there.' },
        { p: 'To look a key up later, you hash it again, land on the same bucket, and find it. One calculation instead of a search: that is the whole trick.' },
        { p: 'Picture a coat check.' },
        { figure: fig.hook, caption: 'Your ticket number tells the attendant exactly which hook. A hash function is the machine that turns any key into a ticket number.' },
      ],
    },
    {
      title: 'The hash function',
      blocks: [
        { p: 'A good hash function has three properties. It is **deterministic**: the same key always gives the same number. It is **fast** to compute. And it **spreads keys evenly** over the buckets, so no bucket gets crowded.' },
        { figure: fig.keyToBucket, caption: 'Our teaching hash: add up the letter codes, then take the remainder after dividing by the number of buckets.' },
        { p: 'Our teaching hash, summing letter codes, is simple enough to do by hand, but it is a poor hash: “cat” and “act” have the same letters, so they always collide. Real hash functions mix in each character’s position, so tiny changes in the key scatter it to a completely different bucket.' },
        { note: 'Equal keys **must** have equal hashes, or a lookup would search the wrong bucket. That is why Python refuses to hash a list: a list can change after you put it in a dict, and its hash would no longer match its bucket. Use tuples, which can’t change, as keys instead.', kind: 'python' },
      ],
    },
    {
      title: 'Collisions',
      breakAfter: 'watch',
      blocks: [
        { p: 'There are infinitely many possible keys but only so many buckets, so two different keys will sometimes land in the same bucket. That is a **collision**. Collisions are normal; a hash map is designed to handle them.' },
        { figure: fig.collisions, caption: 'With chaining, each bucket holds a short list, and colliding keys join it.' },
        { p: '**Chaining** keeps a small list in each bucket. **Open addressing**, which Python’s dict uses, instead tries other buckets in a fixed pattern until it finds a free one. Both work well as long as the table isn’t too full.' },
        { figure: fig.lookup, caption: 'A lookup hashes to one bucket, then compares keys in that bucket until it finds a match.' },
        { p: 'That is why keys need **equality** as well as a hash: the hash gets you to the right bucket, and equality picks the right item inside it.' },
      ],
    },
    {
      title: 'Load factor and resizing',
      blocks: [
        { p: 'The **load factor** is items divided by buckets. As it rises, collisions pile up and lookups slow down. So when the load factor passes a threshold, the map allocates a bigger array of buckets, typically double, and **rehashes** every key into it.' },
        { figure: fig.resize, caption: 'Seven keys in eight buckets is too crowded. Double to sixteen, and every key gets re-hashed with % 16.' },
        { p: 'A resize costs O(n), but like a dynamic array it happens rarely, so insertion stays **O(1) amortised**.' },
        { note: 'CPython’s dict grows when it is about two-thirds full. Since Python 3.7 dicts also remember insertion order, using a compact array of entries plus a separate index table.', kind: 'python' },
      ],
    },
    {
      title: 'Why it’s O(1), and when it isn’t',
      breakAfter: 'play',
      blocks: [
        { p: 'If the hash spreads keys evenly and the load factor stays below a constant, each bucket holds a constant number of keys on average. Hashing is O(1), checking a constant number of keys is O(1), so lookup is **O(1) on average**.' },
        { p: 'The worst case is different. If every key lands in the same bucket, a lookup walks through all of them: **O(n)**. This can happen with a bad hash function, or deliberately, when an attacker crafts keys that collide.' },
        { note: 'To block such “hash flooding” attacks, Python randomises string hashes each time it starts. That is why `hash("cat")` gives a different number in every new Python session. Integers, by contrast, simply hash to themselves.', kind: 'python' },
      ],
    },
    {
      title: 'Patterns that use hash maps',
      blocks: [
        { p: 'A few patterns cover most uses. **Counting**: map each item to how often it appears. **Seen-before**: a set of things already met, turning duplicate checks from O(n²) into O(n). **Grouping**: map a signature, like sorted letters, to a list of items that share it.' },
        { p: '**Complement lookup**: to find two numbers adding to a target, for each number check whether target minus it is already in the map. That turns an O(n²) pair search into one O(n) pass.' },
        { p: '**Prefix sums plus a map**: store how often each running total has appeared. Two equal running totals mean the stretch between them sums to zero, which counts zero-sum subarrays in O(n).' },
        { code: 'from collections import Counter, defaultdict\nCounter("banana")            # counts\ngroups = defaultdict(list)\nfor w in words:\n    groups["".join(sorted(w))].append(w)   # anagram groups', say: 'Counter counts items. defaultdict of list groups words by their sorted letters.' },
      ],
    },
    {
      title: 'What hash maps are bad at',
      blocks: [
        { p: 'Hashing scatters keys on purpose, so a hash map has **no useful order**. Finding the smallest key, listing keys in sorted order, or asking for every key between 10 and 20 all require looking at everything: O(n), or O(n log n) to sort.' },
        { p: 'For ordered questions, use a sorted array, a heap or a balanced search tree instead (topic 8). Hash maps also use more memory than a plain array, because they keep spare empty buckets to stay fast.' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: '**Spatial hashing** divides space into grid cells and hashes each cell’s coordinates. Particle and molecular simulations use it to find neighbours within a radius without comparing every pair.', kind: 'science' },
        { note: 'Memoisation, which you will meet in dynamic programming, is a hash map from the inputs of a calculation to its result. Caching expensive simulation results works the same way.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'A hash function turns a key into a bucket index; lookup goes straight there.',
            'Collisions are normal. Chaining or open addressing handle them; keys need both a hash and equality.',
            'Keeping the load factor low by resizing keeps operations O(1) on average, O(1) amortised for inserts.',
            'Worst case is O(n), so Python randomises string hashes.',
            'Common patterns: counting, seen-before, grouping, complement lookup, prefix sums + map.',
            'No order: use other structures for min, max, sorted output and ranges.',
          ],
        },
      ],
    },
  ];
}

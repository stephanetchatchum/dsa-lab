import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function triesLesson(fig: { hook: F; build: F; search: F; prefix: F; complete: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'A hash set can tell you instantly whether “planet” is a word. But it can’t answer a different, very common question: **which words start with “pla”?** Hashing scatters words, so words sharing a beginning end up nowhere near each other.' },
        { p: 'Search boxes, phone keyboards, code editors and spell checkers ask prefix questions constantly. The **trie** is the tree built for them.' },
      ],
    },
    {
      title: 'What a trie is',
      blocks: [
        { p: 'A **trie** (from re**trie**val, often said “try”) stores words letter by letter. Each node represents one letter, and the path from the root to a node spells a **prefix**. Each node’s children are the letters that can come next.' },
        { p: 'Words that share a beginning share the same path, so the prefix is stored once. A flag on each node, often called **is_word** or **end**, marks where a complete word finishes.' },
        { p: 'Picture typing on your phone.' },
        { figure: fig.hook, caption: 'Type c, then a: every word below that point starts with “ca”, and the phone reads them straight off the tree.' },
      ],
    },
    {
      title: 'Building one',
      blocks: [
        { p: 'To **insert** a word, start at the root. For each letter, follow the child for that letter, creating it if it doesn’t exist. At the last letter, set the end flag.' },
        { figure: fig.build, caption: 'car, cat and cart share the c-a path. Only new letters create new nodes.' },
        { code: 'class TrieNode:\n    def __init__(self):\n        self.children = {}     # letter -> TrieNode\n        self.is_word = False', say: 'A trie node has a children dictionary from letter to node, and an is word flag.' },
        { p: 'Inserting a word of length L visits or creates L nodes: **O(L)**. Notice that the cost depends on the word, not on how many words are already stored.' },
      ],
    },
    {
      title: 'Searching: words vs prefixes',
      breakAfter: 'watch',
      blocks: [
        { p: 'To **search** for a word, walk its letters from the root. If a letter is missing, the word isn’t there. If you reach the end, the word exists only if that node’s end flag is set.' },
        { figure: fig.search, caption: 'Following c, a, r, t. The final node is marked as a word end.' },
        { figure: fig.prefix, caption: 'The path c-a-r exists inside “cart”, but “car” was never inserted, so its node has no end mark.' },
        { p: '**starts_with(prefix)** is the same walk, but succeeds whenever the path exists, flag or not. Both cost **O(L)** for a query of length L, whether the trie holds ten words or ten million.' },
        { note: 'Forgetting the end flag is the most common trie bug: without it, every prefix of a stored word looks like a word.', kind: 'pitfall' },
      ],
    },
    {
      title: 'Autocomplete',
      blocks: [
        { p: 'To list every word with a given prefix, walk down to the prefix’s node, then explore everything below it with a depth-first search, collecting each node marked as a word end.' },
        { figure: fig.complete, caption: 'Everything below the “car” node starts with car.' },
        { p: 'The cost is O(L) to reach the prefix plus the size of the part of the tree below it. Real autocomplete also stores a popularity count on nodes, so it can return the best few suggestions without visiting every completion.' },
      ],
    },
    {
      title: 'Storing extra information on nodes',
      breakAfter: 'play',
      blocks: [
        { p: 'Because every word passing through a node shares that prefix, nodes are a natural place to store **summaries** about all those words.' },
        {
          list: [
            'A **count** of how many words pass through, to answer “how many words start with this?” in O(L).',
            'The **best** or most frequent word below, for instant top suggestions.',
            'A **value**, turning the trie into a map from strings to data.',
          ],
        },
        { p: 'Updating those summaries during insert costs nothing extra in Big-O: you visit those nodes anyway.' },
      ],
    },
    {
      title: 'Costs and trade-offs',
      blocks: [
        {
          table: [
            ['Operation', 'Trie', 'Hash set', 'Sorted list'],
            ['insert word', 'O(L)', 'O(L) average', 'O(n)'],
            ['is it a word?', 'O(L)', 'O(L) average', 'O(L log n)'],
            ['any word with this prefix?', 'O(L)', 'O(n · L)', 'O(L log n)'],
            ['list words with prefix', 'O(L + output)', 'O(n · L)', 'O(L log n + output)'],
          ],
          caption: 'L is the word length, n the number of words. Hashing a word also reads all L letters.',
        },
        { p: 'The price is **memory**. Each node holds its own small dictionary of children, so a trie of words that share few prefixes uses much more memory than storing the words in a set.' },
        { p: '**Compressed** tries, also called radix trees, fix much of this by merging chains of single-child nodes into one edge labelled with several letters.' },
        { note: 'If you only ever ask “is this exact word present?”, a set is simpler and usually faster. Reach for a trie when prefixes matter.', kind: 'remember' },
      ],
    },
    {
      title: 'Beyond words',
      blocks: [
        { p: 'A trie works over any alphabet. Over the bits 0 and 1, a **binary trie** stores numbers or network addresses. Routers use one to find the **longest matching prefix** of an IP address in their routing table, millions of times a second.' },
        { note: 'Bioinformatics uses tries over the letters A, C, G and T. A suffix tree, a compressed trie of every suffix of a genome, finds any pattern in time proportional to the pattern’s length, independent of the genome’s size.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'A trie stores strings letter by letter; shared prefixes share paths.',
            'An end-of-word flag separates real words from prefixes.',
            'Insert, search and starts_with all cost O(L), independent of how many words are stored.',
            'Autocomplete: walk to the prefix, then DFS below it.',
            'Nodes can carry counts or values for richer prefix queries.',
            'Trade-off: tries use more memory; compressed tries reduce it. Use a set when prefixes don’t matter.',
          ],
        },
      ],
    },
  ];
}

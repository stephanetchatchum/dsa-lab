import type { Course } from '../../../types';

const course: Course = {
  id: 'dsa',
  title: 'Data Structures & Algorithms',
  short: 'Thirteen topics, from counting steps to spatial trees. Each one: watch, write, build, solve.',
  steps: ['hook', 'watch', 'recall', 'play', 'predict', 'trace', 'build', 'fill', 'wild', 'problems', 'recap'],
  compare: {
    ops: ['Access by index', 'Search', 'Insert', 'Delete', 'Min / max'],
    rows: [
      {
        structure: 'Array (dynamic)',
        topic: 'arrays',
        costs: { 'Access by index': 'O(1)', Search: 'O(n)', Insert: 'O(n)', Delete: 'O(n)', 'Min / max': 'O(n)' },
        goodFor: 'Fast index access, appending at the end (amortised O(1)), cache-friendly scans.',
        badFor: 'Inserting or deleting in the middle shifts everything after it.',
      },
      {
        structure: 'Sorted array',
        topic: 'sorting',
        costs: { 'Access by index': 'O(1)', Search: 'O(log n)', Insert: 'O(n)', Delete: 'O(n)', 'Min / max': 'O(1)' },
        goodFor: 'Read-heavy data you search often: binary search.',
        badFor: 'Frequent inserts: each one shifts elements to keep order.',
      },
      {
        structure: 'Hash map / set',
        topic: 'hash-maps',
        costs: { Search: 'O(1)', Insert: 'O(1)', Delete: 'O(1)', 'Min / max': 'O(n)' },
        goodFor: 'Lookup by key, counting, “have I seen this?” Average O(1).',
        badFor: 'Anything ordered: min, max, ranges, sorted output.',
      },
      {
        structure: 'Stack / queue',
        topic: 'stacks-queues',
        costs: { Search: 'O(n)', Insert: 'O(1)', Delete: 'O(1)', 'Min / max': 'O(n)' },
        goodFor: 'Undo, matching brackets (stack); fair processing order, BFS (queue).',
        badFor: 'Looking at anything except the ends.',
      },
      {
        structure: 'Linked list',
        topic: 'linked-lists',
        costs: { 'Access by index': 'O(n)', Search: 'O(n)', Insert: 'O(1)', Delete: 'O(1)', 'Min / max': 'O(n)' },
        goodFor: 'Insert/delete at a node you already hold (O(1)). LRU caches, schedulers.',
        badFor: 'Random access: you must walk from the head.',
      },
      {
        structure: 'Balanced BST',
        topic: 'trees',
        costs: { Search: 'O(log n)', Insert: 'O(log n)', Delete: 'O(log n)', 'Min / max': 'O(log n)' },
        goodFor: 'Sorted data that changes: ordered iteration, ranges, floor/ceiling.',
        badFor: 'Pure key lookup (a hash map is simpler and faster).',
      },
      {
        structure: 'Heap (priority queue)',
        topic: 'trees',
        costs: { Search: 'O(n)', Insert: 'O(log n)', Delete: 'O(log n)', 'Min / max': 'O(1)' },
        goodFor: 'Always grabbing the smallest/largest next: scheduling, Dijkstra, top-k.',
        badFor: 'Searching for an arbitrary value.',
      },
      {
        structure: 'Trie',
        topic: 'tries',
        costs: { Search: 'O(L)', Insert: 'O(L)', Delete: 'O(L)' },
        goodFor: 'Prefix search and autocomplete. Cost depends on word length L, not on how many words.',
        badFor: 'Memory: many nodes when words share few prefixes.',
      },
    ],
    scenarios: [
      {
        q: 'You need to check, millions of times, whether a username is already taken.',
        options: ['Sorted array', 'Hash set', 'Linked list', 'Stack'],
        answer: 1,
        why: 'Membership by key is the hash set’s home turf: average O(1) per check.',
      },
      {
        q: 'A hospital triage system must always treat the most urgent patient next, while new patients keep arriving.',
        options: ['Queue', 'Heap / priority queue', 'Hash map', 'Array'],
        answer: 1,
        why: 'A heap gives the top priority in O(1) and handles each arrival in O(log n).',
      },
      {
        q: 'A search box should suggest words as you type the first few letters.',
        options: ['Trie', 'Hash map', 'Queue', 'Heap'],
        answer: 0,
        why: 'A trie walks the prefix once, then everything below that node shares it.',
      },
      {
        q: 'An editor needs Undo: reverse the most recent action first.',
        options: ['Queue', 'Stack', 'Heap', 'Hash set'],
        answer: 1,
        why: 'Last in, first out. The newest action is on top.',
      },
      {
        q: 'You store sensor readings and often ask: “all readings between 20°C and 25°C”, while new readings arrive.',
        options: ['Hash map', 'Balanced BST', 'Stack', 'Unsorted array'],
        answer: 1,
        why: 'A balanced BST keeps order under inserts, so range queries cost O(log n + k).',
      },
    ],
  },
};

export default course;

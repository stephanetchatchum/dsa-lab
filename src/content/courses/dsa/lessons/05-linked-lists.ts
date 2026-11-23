import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function linkedLessons(fig: { hook: F; nodes: F; walk: F; insert: F; del: F; reverse: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'Arrays have one big weakness: inserting or removing in the middle shifts everything after it, which is O(n). A **linked list** removes that weakness by giving up the thing arrays are best at, instant access by index.' },
        { p: 'Linked lists matter less as standalone containers in Python than in languages like C, but the **idea**, items connected by references, is everywhere: trees, graphs, caches and the internals of Python’s own deque.' },
      ],
    },
    {
      title: 'What a linked list is',
      blocks: [
        { p: 'A **linked list** is a chain of **nodes**. Each node holds a **value** and a **reference** (a pointer) to the next node. The last node points to None. The list itself only remembers the first node, called the **head**.' },
        { p: 'Unlike an array, the nodes do not sit side by side in memory. They can be anywhere. The order exists only in the arrows.' },
        { code: 'class Node:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next', say: 'A Node class with a value and a next reference, which defaults to None.' },
        { p: 'Picture a treasure hunt.' },
        { figure: fig.hook, caption: 'Each clue only says where the next clue is. You can’t skip ahead, but adding a clue means rewriting just one note.' },
      ],
    },
    {
      title: 'Walking the list',
      blocks: [
        { figure: fig.nodes, caption: 'Nodes linked one by one. Only the arrows keep them in order.' },
        { p: 'To reach the k-th node you must start at head and follow k arrows. There is no address arithmetic, so access by position and search are both **O(n)**.' },
        { figure: fig.walk, caption: 'Finding 12 means walking from the head, one hop at a time.' },
        { code: 'curr = head\nwhile curr is not None:\n    print(curr.val)\n    curr = curr.next', say: 'The standard walk: start at head, and while curr is not None, use it and move to curr.next.' },
      ],
    },
    {
      title: 'Splicing: insert and delete',
      breakAfter: 'watch',
      blocks: [
        { p: 'Here is where linked lists shine. If you already **hold** a node, you can insert after it, or delete the node after it, by changing **two arrows**. Nothing shifts. That is **O(1)**.' },
        { figure: fig.insert, caption: 'Insert after curr: first new.next = curr.next, then curr.next = new.' },
        { note: 'The order of those two lines matters. If you set curr.next = new first, you lose the only reference to the rest of the list, and it is gone for good. Always connect the new node to what follows before redirecting anything to it.', kind: 'pitfall' },
        { figure: fig.del, caption: 'Delete: point prev.next past the node. It becomes unreachable and Python frees it.' },
        { p: 'Notice the catch: O(1) splicing assumes you are already standing at the right node. If you first have to **find** the spot, that walk is O(n), so “insert at position k” is O(n) overall.' },
      ],
    },
    {
      title: 'Head, tail and sentinels',
      blocks: [
        { p: 'Adding at the front is always O(1): make a node pointing at the old head, then move head. Adding at the end needs the last node; walking there is O(n), so implementations keep a **tail** reference to make append O(1).' },
        { p: 'Special cases cause most linked-list bugs: an empty list, removing the head, removing the tail. A **dummy** (or sentinel) node placed before the real head means every real node has a node before it, so the head is no longer special.' },
        { code: 'dummy = Node(0, head)\nprev = dummy\n# ... remove nodes using prev.next ...\nreturn dummy.next', say: 'Create a dummy node pointing at head, work using prev dot next, and return dummy dot next as the new head.' },
      ],
    },
    {
      title: 'Doubly linked lists',
      blocks: [
        { p: 'In a **doubly linked list** each node also points to its **previous** node. That costs an extra reference per node, but lets you walk backwards and delete a node you hold in O(1), without needing the one before it.' },
        { note: 'An **LRU cache**, which keeps the most recently used items and evicts the oldest, combines a hash map (key → node) with a doubly linked list in usage order. Lookup, move-to-front and evict are all O(1). Python’s `functools.lru_cache` works this way.', kind: 'example' },
      ],
    },
    {
      title: 'Pointer patterns',
      breakAfter: 'play',
      blocks: [
        { p: '**Reversing** uses three pointers: prev, curr and nxt. Save the next node, flip curr’s arrow back to prev, then step both forward. One pass, O(1) extra space.' },
        { figure: fig.reverse, caption: 'Save next, flip the arrow, step forward. At the end, prev is the new head.' },
        { p: '**Fast and slow pointers**: move one pointer two steps for every one step of the other. When the fast one reaches the end, the slow one is at the middle. If the list has a loop, the fast pointer eventually laps the slow one and they meet. That is Floyd’s cycle detection, with O(1) memory.' },
        { p: '**Pointers with a gap**: send one pointer k steps ahead, then move both together. When the leader hits the end, the follower is k from the end.' },
      ],
    },
    {
      title: 'Arrays vs linked lists',
      blocks: [
        {
          table: [
            ['Operation', 'Array', 'Linked list'],
            ['access item k', 'O(1)', 'O(k)'],
            ['search', 'O(n)', 'O(n)'],
            ['insert/delete at front', 'O(n)', 'O(1)'],
            ['insert/delete next to a node you hold', 'O(n)', 'O(1)'],
            ['append at end', 'O(1) amortised', 'O(1) with a tail'],
            ['extra memory per item', 'none', 'one or two references'],
          ],
        },
        { p: 'On paper, linked lists win at insertion. In practice, arrays often win anyway, because walking contiguous memory is much faster for the processor than chasing pointers scattered around memory. Choose a linked list when you genuinely splice at known positions a lot.' },
        { note: 'Python has no built-in singly linked list. Use a list for most needs, `collections.deque` for fast work at both ends, and write your own nodes when an algorithm needs splicing.', kind: 'python' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Operating systems keep free memory blocks, timers and runnable processes in linked lists because they join and leave constantly. Sparse matrices in scientific computing are often stored as linked structures of their non-zero entries, so you don’t waste memory on zeros.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'A linked list is nodes joined by references; the list remembers the head.',
            'Access and search are O(n): you must walk from the head.',
            'Insert or delete next to a node you hold is O(1): two arrows change, nothing shifts.',
            'Connect the new node first, then redirect: never lose the rest of the list.',
            'Dummy nodes remove head special-cases. Tail pointers make append O(1).',
            'Key patterns: reverse with three pointers, fast & slow pointers, pointers with a gap.',
          ],
        },
      ],
    },
  ];
}

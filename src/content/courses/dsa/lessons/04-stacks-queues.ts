import type { Frame, LessonSection } from '../../../../types';

type F = () => Frame[];
export function stacksLesson(fig: { hook: F; stack: F; queue: F; brackets: F; mono: F }): LessonSection[] {
  return [
    {
      title: 'Where this fits',
      blocks: [
        { p: 'So far, arrays and hash maps let you reach **any** item. Often, though, you don’t need that freedom. You only ever need the **next** item, according to some rule about order.' },
        { p: 'Stacks and queues are collections that deliberately restrict access to one end or two ends. Because they promise less, they can make their few operations very cheap and very simple to reason about.' },
      ],
    },
    {
      title: 'What stacks and queues are',
      blocks: [
        { p: 'A **stack** is **last in, first out** (LIFO). You **push** items onto the top and **pop** them off the top. The most recent item always leaves first.' },
        { p: 'A **queue** is **first in, first out** (FIFO). You **enqueue** at the back and **dequeue** from the front. The oldest item always leaves first.' },
        { p: 'Both also let you **peek** at the next item without removing it. Pushing, popping, enqueuing, dequeuing and peeking all cost **O(1)**.' },
        { p: 'Picture a pile of plates and a line at a café.' },
        { figure: fig.hook, caption: 'The last plate added is the first one taken. The first person in line is the first served.' },
      ],
    },
    {
      title: 'How a stack works',
      blocks: [
        { figure: fig.stack, caption: 'push adds on top; pop takes the top.' },
        { p: 'A stack fits perfectly on the end of a dynamic array. Push is `append`, pop is `pop()`, peek is `a[-1]`. All three work at the end of the array, where nothing shifts, so all are O(1) (amortised for push).' },
        { p: 'Use a stack whenever the **most recent** unfinished thing must be handled first: undo, the back button, nested brackets, and the call stack of a running program.' },
      ],
    },
    {
      title: 'How a queue works',
      breakAfter: 'watch',
      blocks: [
        { figure: fig.queue, caption: 'Items join at the back and leave from the front.' },
        { p: 'A queue needs fast removal from the **front**. A plain array is bad at that, because removing index 0 shifts everything: O(n). Real queues avoid this with a **circular buffer** (an array where front and back wrap around) or a **linked structure**.' },
        { note: 'Use `collections.deque` for queues: `append` to enqueue and `popleft` to dequeue, both O(1). `list.pop(0)` looks the same but is O(n), and in a loop it quietly makes your whole algorithm O(n²). `deque` is built from linked blocks of 64 slots.', kind: 'python' },
        { p: 'Use a queue whenever things should be handled **fairly, in arrival order**: print jobs, web requests, messages between programs, and breadth-first search, which explores a graph ring by ring.' },
      ],
    },
    {
      title: 'Pattern: matching with a stack',
      blocks: [
        { p: 'Nested structures, like brackets, HTML tags or function calls, close in the reverse order they open. The innermost opened thing must close first. That is exactly last in, first out.' },
        { figure: fig.brackets, caption: 'Push each opener. A closer must match the opener on top; then pop it.' },
        { p: 'The rule is: push openers; on a closer, the top of the stack must be its partner, so pop and compare. At the end the stack must be empty, otherwise something was never closed. One pass, O(n) time, up to O(n) space for deep nesting.' },
      ],
    },
    {
      title: 'Pattern: the monotonic stack',
      breakAfter: 'play',
      blocks: [
        { p: 'A whole family of problems asks: for each item, what is the **next bigger** (or smaller) item? Checking every later item is O(n²). A **monotonic stack**, kept in decreasing order, answers all of them in O(n).' },
        { figure: fig.mono, caption: 'The stack holds items still waiting for a bigger number. Each new item pops everyone it beats.' },
        { p: 'When a new item arrives, it is the answer for every waiting item smaller than it, so we pop those and record the answer. Then the new item starts waiting. The stack stays sorted, which is where the name comes from.' },
        { note: 'The inner while loop looks like it makes this O(n²), but each item is pushed once and popped at most once. That is at most 2n stack operations in total: O(n).', kind: 'why' },
      ],
    },
    {
      title: 'Building one from the other',
      blocks: [
        { p: 'You can build a queue out of two stacks. Push into an “inbox” stack. To dequeue, take from an “outbox” stack; when the outbox is empty, pour the whole inbox into it, which reverses the order so the oldest item ends up on top.' },
        { p: 'A single pour can cost O(n), but each item is poured only once in its life, so every operation is **O(1) amortised**. It’s the same accounting trick as the dynamic array, and you will build it yourself in this topic.' },
      ],
    },
    {
      title: 'The call stack and recursion',
      blocks: [
        { p: 'Every running program uses a stack you never see: the **call stack**. Calling a function pushes a frame holding its local variables; returning pops it. The function on top is the one running.' },
        { p: 'This is why recursion, in the next topics, “remembers” where it was: each pending call waits in its own frame. It is also why very deep recursion fails with a **stack overflow**, or in Python a RecursionError: the call stack has a limited size.' },
        { p: 'Any recursive algorithm can be rewritten with an explicit stack of your own instead. That is a useful trick when recursion would go too deep.' },
      ],
    },
    {
      title: 'Variations worth knowing',
      blocks: [
        { p: 'A **deque** (double-ended queue) allows O(1) adds and removes at both ends. It can act as a stack, a queue, or both, and powers the sliding-window-maximum trick.' },
        { p: 'A **priority queue** always releases the item with the highest priority instead of the oldest. It is built from a heap and costs O(log n) per operation; you will build one in topic 8.' },
        { note: 'Hospital triage is a priority queue, not a queue: the most urgent patient goes first, not the one who arrived first.', kind: 'example' },
      ],
    },
    {
      title: 'In computational science',
      blocks: [
        { note: 'Event-driven simulations keep a queue (or priority queue) of upcoming events. Flood-fill and region-labelling in images use a stack or queue of cells still to visit. Expression evaluators in calculators and compilers use stacks of operators and values.', kind: 'science' },
      ],
    },
    {
      title: 'Summary',
      blocks: [
        {
          list: [
            'Stack: last in, first out. push, pop, peek are O(1). Use a list.',
            'Queue: first in, first out. enqueue, dequeue are O(1). Use collections.deque, never list.pop(0).',
            'Matching brackets and nesting: a stack.',
            'Next bigger / smaller element: a monotonic stack, O(n) because each item is pushed and popped once.',
            'The call stack is why recursion works, and why it can overflow.',
            'Two stacks make a queue with amortised O(1) operations.',
          ],
        },
      ],
    },
  ];
}

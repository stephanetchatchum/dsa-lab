/*
  TOPIC TEMPLATE
  --------------
  Copy this file to src/content/courses/<course>/topics/NN-your-topic.ts
  (anything in courses/<course>/topics/ is picked up automatically).
  Then run:  npm run verify -- your-topic

  Rules of thumb (from the learning research behind this app):
  - Keep every text chunk to 1–2 sentences. Narration (`say`) is one short sentence per frame.
  - Put labels ON the things they label (pointers), not in a legend.
  - Use roles for meaning: head (blue), curr (yellow), new (pink), second (purple), done (green), danger (red), muted.
  - Keep ids stable across frames so items slide instead of popping.
  - Every step is optional except id/order/title/short/icon. Missing steps are skipped.
*/
import type { Topic } from '../../types';
import { arrayRow, cost, Frames, ptr, scene, txt } from '../lib/viz';

function watchFrames() {
  const f = new Frames();
  const nums = [4, 8, 15];
  f.add(arrayRow(nums), 'One short sentence of narration per frame.');
  f.add([...arrayRow(nums, { roles: { 1: 'curr' } }), ptr('i', 'a1', 'curr')], 'The pointer moved to index 1.', { line: 2, vars: { i: 1 } });
  return f.get();
}

const topic: Topic = {
  id: 'your-topic', // used in URLs and progress; never change once people have progress
  order: 99, // position on the map
  title: 'Your topic',
  short: 'One line shown on the map tile.',
  icon: '✨',
  costs: [cost('main operation', 'O(1)')],

  hook: { frames: watchFrames, lines: ['A real-world analogy in one sentence.', 'Why it matters, in one more.'] },

  watch: [{ id: 'basics', title: 'Basics', frames: watchFrames, code: 'def f(nums):\n    i = 1\n    return nums[i]' }],

  recall: {
    prompt: 'Explain … in your own words.',
    model: 'A short model answer.',
    keywords: [['first idea', 'synonym'], ['second idea']],
  },

  play: {
    intro: 'What the learner can do here.',
    init: () => ({ n: 3 }),
    view: (s: { n: number }) => scene([txt('t', 500, 200, `n = ${s.n}`, { size: 48 })]),
    ops: [
      {
        id: 'inc',
        label: 'add 1',
        run: (s: { n: number }) => ({
          state: { n: s.n + 1 },
          frames: [{ scene: scene([txt('t', 500, 200, `n = ${s.n + 1}`, { size: 48, role: 'new' })]), say: 'Added one.' }],
          cost: cost('add 1', 'O(1)'),
        }),
      },
    ],
  },

  // predict, trace, build, fill, wild, problems, extra, quiz: see any file in courses/dsa/topics for full examples.
  quiz: [{ q: 'A question?', options: ['Right', 'Wrong'], answer: 0, why: 'Because…' }],
};

export default topic;

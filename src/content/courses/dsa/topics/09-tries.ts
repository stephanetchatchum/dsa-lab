import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cost, Frames, scene, txt } from '../../../lib/viz';
import { layoutTree, treePrims, type GNode } from '../../../lib/tree';
import { triesLesson } from '../lessons/09-tries';

/* ---------------- trie model (pure) ---------------- */
interface TN {
  id: string;
  ch: string;
  end: boolean;
  kids: Map<string, TN>;
}
const root = (): TN => ({ id: 't', ch: '•', end: false, kids: new Map() });
const cloneT = (n: TN): TN => ({ ...n, kids: new Map([...n.kids].map(([k, v]) => [k, cloneT(v)])) });
function insert(r: TN, w: string): { added: string[]; path: string[] } {
  let n = r;
  const added: string[] = [];
  const path: string[] = [r.id];
  for (const ch of w) {
    if (!n.kids.has(ch)) {
      const id = `${n.id}${ch}`;
      n.kids.set(ch, { id, ch, end: false, kids: new Map() });
      added.push(id);
    }
    n = n.kids.get(ch)!;
    path.push(n.id);
  }
  n.end = true;
  return { added, path };
}
const build = (words: string[]) => {
  const r = root();
  words.forEach((w) => insert(r, w));
  return r;
};
const toG = (n: TN): GNode => ({ id: n.id, v: n.ch, kids: [...n.kids.values()].sort((a, b) => a.ch.localeCompare(b.ch)).map(toG) });
function countNodes(n: TN): number {
  let c = 1;
  n.kids.forEach((k) => (c += countNodes(k)));
  return c;
}
function ends(n: TN, acc: Record<string, Role> = {}): Record<string, Role> {
  if (n.end) acc[n.id] = 'done';
  n.kids.forEach((k) => ends(k, acc));
  return acc;
}
function wordsBelow(n: TN, prefix: string, out: string[] = []): string[] {
  if (n.end) out.push(prefix);
  [...n.kids.values()].sort((a, b) => a.ch.localeCompare(b.ch)).forEach((k) => wordsBelow(k, prefix + k.ch, out));
  return out;
}

/** draw: word-end nodes are green (done); extra roles override */
function draw(r: TN, roles: Record<string, Role> = {}, extra: Prim[] = [], glow: string[] = []): Prim[] {
  const g = toG(r);
  const pos = layoutTree(g, { dy: 78, y0: 50 });
  return [...treePrims(g, pos, { roles: { ...ends(r), [r.id]: 'head', ...roles }, glow, r: 54 }), ...extra];
}
const legend = () => txt('lg', 980, 430, 'green = end of a word', { size: 22, role: 'done', anchor: 'end' });
const chips = (words: string[], y = 450) =>
  words.length ? arrayRow(words, { y, gap: 110, w: 100, prefix: 'w_', idx: false, roles: Object.fromEntries(words.map((_, i) => [i, 'done' as Role])) }) : [txt('w_none', 500, y, '(no words)', { size: 26 })];

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const r = build(['car', 'cat', 'cave']);
  f.add([...draw(r), txt('q', 500, 420, 'you type: c', { size: 34, role: 'curr' })], 'Your phone suggests words as you type. Type c…', {});
  f.add([...draw(r, { tc: 'curr' }, [txt('q', 500, 420, 'you type: ca', { size: 34, role: 'curr' })]), ...chips(['car', 'cat', 'cave'], 470)], '…then a. Every word below this point starts with c a. The phone reads them straight off the tree.');
  f.add([...draw(r), legend()], 'Words that share a start share a path. That’s a trie, from the word retrieval.');
  return f.get();
}

/* ---------------- watch ---------------- */
function buildFrames(words = ['car', 'cat', 'cart', 'dog']): Frame[] {
  const r = root();
  const f = new Frames();
  f.add(draw(r), 'A trie starts with an empty root.');
  for (const w of words) {
    const before = cloneT(r);
    const { added, path } = insert(r, w);
    const shared = path.length - 1 - added.length;
    f.add(draw(before, Object.fromEntries(path.slice(0, shared + 1).map((id) => [id, 'curr' as Role]))), shared ? `Insert ${w}: the first ${shared} letter${shared > 1 ? 's' : ''} already exist. Walk them.` : `Insert ${w}: nothing to share yet.`);
    f.add([...draw(r, Object.fromEntries(added.map((id) => [id, 'new' as Role])), [legend()], added)], added.length ? `Add ${added.length} new node${added.length > 1 ? 's' : ''}, and mark the last letter as a word end.` : `No new nodes: just mark the end of ${w}.`);
  }
  f.add([...draw(r), legend()], 'car, cat and cart share c a. Shared prefixes are stored once.');
  return f.get();
}

const SEARCH_CODE = `def search(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            return False
        node = node.children[ch]
    return node.is_word`;

function searchFrames(words: string[], q: string, withLines = false): Frame[] {
  const r = build(words);
  const f = new Frames();
  const L = (l: number) => (withLines ? { line: l } : {});
  f.add([...draw(r), legend(), txt('q', 80, 430, `search("${q}")`, { size: 30, role: 'curr', anchor: 'start' })], `Search for ${q}, one letter at a time.`, { ...L(2), vars: { word: q } });
  let n = r;
  const seen: string[] = [r.id];
  for (const ch of q) {
    const nx = n.kids.get(ch);
    if (!nx) {
      f.add([...draw(r, Object.fromEntries(seen.map((id) => [id, 'curr' as Role])), [legend()])], `No child ${ch} here. ${q} is not in the trie.`, { ...L(5), vars: { ch, node: n.ch } });
      return f.get();
    }
    n = nx;
    seen.push(n.id);
    f.add([...draw(r, Object.fromEntries(seen.map((id) => [id, 'curr' as Role])), [legend()])], `Follow ${ch}.`, { ...L(6), vars: { ch, node: n.ch } });
  }
  f.add(
    [...draw(r, { ...Object.fromEntries(seen.map((id) => [id, 'curr' as Role])), [n.id]: n.end ? 'done' : 'danger' }, [legend()], [n.id])],
    n.end ? `All letters matched and this node is marked as a word end. ${q} is a word.` : `All letters matched, but this node isn’t a word end. ${q} is only a prefix.`,
    { ...L(7), vars: { is_word: n.end ? 'True' : 'False' } },
  );
  f.add([...draw(r), legend(), txt('c', 500, 440, `cost: ${q.length} steps = length of the word, not the number of words`, { size: 26, role: 'curr' })], 'The cost depends only on the word’s length L. A trie with a million words searches just as fast.');
  return f.get();
}

function completeFrames(words: string[], prefix: string): Frame[] {
  const r = build(words);
  const f = new Frames();
  let n: TN | undefined = r;
  const path = [r.id];
  for (const ch of prefix) {
    n = n?.kids.get(ch);
    if (n) path.push(n.id);
  }
  f.add([...draw(r, Object.fromEntries(path.map((id) => [id, 'curr' as Role]))), legend()], `Autocomplete ${prefix}: walk down the prefix first.`);
  if (!n) {
    f.add(draw(r), 'No such prefix, so no suggestions.');
    return f.get();
  }
  const out: string[] = [];
  const visit = (x: TN, pre: string) => {
    if (x.end) {
      out.push(pre);
      f.add([...draw(r, { [x.id]: 'new' }, [legend()], [x.id]), ...chips(out)], `${pre} is a word. Collect it.`);
    }
    [...x.kids.values()].sort((a, b) => a.ch.localeCompare(b.ch)).forEach((k) => visit(k, pre + k.ch));
  };
  visit(n, prefix);
  f.add([...draw(r), legend(), ...chips(out)], `Everything under the prefix node starts with ${prefix}. Cost: walk L letters, plus the size of the answer.`);
  return f.get();
}

/* ---------------- play ---------------- */
interface S {
  r: TN;
}

const topic: Topic = {
  id: 'tries',
  order: 9,
  title: 'Tries',
  short: 'Prefix trees for autocomplete and fast word lookup.',
  icon: '🔤',
  costs: [cost('insert word', 'O(L)'), cost('search word', 'O(L)'), cost('starts with prefix', 'O(L)'), cost('list k completions', 'O(L + k)')],

  intro: {
    what: "A trie is a tree that stores words letter by letter, so words that share a beginning share a path.",
    why: "It is how autocomplete, spell checkers and internet routers search by prefix, in time that depends on the word’s length, not on how many words exist.",
    builds: "Trees from topic 8 and dictionaries from topic 3.",
    goals: ["Build a trie and mark word endings", "Tell a word apart from a prefix", "Autocomplete from a prefix", "Know when a trie beats a hash set"],
  },

  hook: { frames: hook, lines: ['A trie stores words letter by letter, so words with the same start share one path.', 'That makes “what words start with ca?” instant, which is how autocomplete works.'] },

  watch: [
    { id: 'build', title: 'Building', frames: () => buildFrames(), costs: [cost('insert', 'O(L)')] },
    { id: 'search', title: 'Search', frames: () => searchFrames(['car', 'cat', 'cart', 'dog'], 'cart'), code: SEARCH_CODE, costs: [cost('search', 'O(L)')] },
    { id: 'prefix', title: 'Word vs prefix', frames: () => searchFrames(['cart', 'cat', 'dog'], 'car'), costs: [cost('search', 'O(L)')] },
    { id: 'complete', title: 'Autocomplete', frames: () => completeFrames(['car', 'cat', 'cart', 'care', 'dog', 'dot'], 'car'), costs: [cost('completions', 'O(L + k)')] },
  ],

  lesson: triesLesson({ hook, build: () => buildFrames(), search: () => searchFrames(['car', 'cat', 'cart', 'dog'], 'cart'), prefix: () => searchFrames(['cart', 'cat', 'dog'], 'car'), complete: () => completeFrames(['car', 'cat', 'cart', 'care', 'dog', 'dot'], 'car') }),
  recall: {
    prompt: 'How does a trie store words, and why does search cost depend on the word’s length instead of how many words there are?',
    model:
      'Each node is one letter, and a path from the root spells a word; words with the same start share the same first nodes. A flag marks where a real word ends, so a prefix isn’t mistaken for a word. Searching walks one node per letter, so it costs O(L) for a word of length L, no matter how many words are stored.',
    keywords: [
      ['letter', 'character', 'char'],
      ['share', 'prefix', 'same start', 'common'],
      ['end', 'flag', 'mark', 'is_word'],
      ['length', 'o(l)', 'per letter', 'one node per'],
    ],
  },

  play: {
    intro: 'Your own trie. Add words that share beginnings, then search and autocomplete.',
    init: (): S => ({ r: build(['tea', 'ten', 'to']) }),
    view: (s: S) => scene([...draw(s.r), legend()]),
    ops: [
      {
        id: 'add',
        label: 'insert word',
        args: [{ name: 'word', kind: 'text', default: 'tent' }],
        run: (s: S, a) => {
          const w = String(a.word).toLowerCase().replace(/[^a-z]/g, '').slice(0, 7);
          if (!w) return { state: s, frames: [{ scene: scene(draw(s.r)), say: 'Type a word using letters a to z.' }] };
          const r = cloneT(s.r);
          const { added, path } = insert(r, w);
          if (countNodes(r) > 28) return { state: s, frames: [{ scene: scene(draw(s.r)), say: 'The playground is full. Reset to start over.' }] };
          const f = new Frames();
          f.add(draw(s.r, Object.fromEntries(path.filter((id) => !added.includes(id)).map((id) => [id, 'curr' as Role]))), added.length < w.length ? `${w.length - added.length} letter${w.length - added.length > 1 ? 's' : ''} already there: reuse them.` : 'No shared prefix.');
          f.add([...draw(r, Object.fromEntries(added.map((id) => [id, 'new' as Role])), [], added), legend()], added.length ? `${added.length} new node${added.length > 1 ? 's' : ''}. End of ${w} marked.` : `${w} was a prefix: now it’s marked as a word too.`);
          return { state: { r }, frames: f.get(), cost: cost('insert', 'O(L)') };
        },
      },
      {
        id: 'search',
        label: 'search word',
        args: [{ name: 'word', kind: 'text', default: 'te' }],
        run: (s: S, a) => {
          const w = String(a.word).toLowerCase().replace(/[^a-z]/g, '');
          return { state: s, frames: searchFrames(wordsBelow(s.r, ''), w || 'a'), cost: cost('search', 'O(L)') };
        },
      },
      {
        id: 'complete',
        label: 'autocomplete prefix',
        args: [{ name: 'prefix', kind: 'text', default: 'te' }],
        run: (s: S, a) => {
          const p = String(a.prefix).toLowerCase().replace(/[^a-z]/g, '');
          return { state: s, frames: completeFrames(wordsBelow(s.r, ''), p), cost: cost('completions', 'O(L + k)') };
        },
      },
    ],
  },

  predict: [
    {
      id: 'care',
      question: 'The trie already holds “car”. You insert “care”. How many new nodes are created?',
      scene: scene([...draw(build(['car'])), legend()]),
      options: ['0', '1', '3', '4'],
      answer: 1,
      frames: () => buildFrames(['car', 'care']).slice(3),
      why: 'c, a, r already exist; only e is new (and it gets the word-end mark).',
    },
    {
      id: 'prefix-not-word',
      question: 'The trie holds “cart” only. Does search("car") return True?',
      scene: scene([...draw(build(['cart'])), legend()]),
      options: ['Yes: c, a, r are all there', 'No: r isn’t marked as a word end', 'It raises an error', 'Only if you search twice'],
      answer: 1,
      frames: () => searchFrames(['cart'], 'car'),
      why: 'The path exists, but “car” was never inserted, so its last node has no end mark. starts_with("car") would be True.',
    },
    {
      id: 'cost',
      question: 'A trie holds 1,000,000 words. What does searching for “planet” cost?',
      scene: scene([txt('t', 500, 200, '1,000,000 words', { size: 48, role: 'curr' })]),
      options: ['O(1,000,000)', 'O(log 1,000,000) ≈ 20', 'About 6 steps: one per letter', 'O(1)'],
      answer: 2,
      frames: () => searchFrames(['planet', 'plan', 'plane', 'play'], 'planet').slice(0, -1),
      why: 'One node per letter: O(L) with L = 6. The number of stored words doesn’t matter.',
    },
  ],

  trace: { title: 'Searching a trie', code: SEARCH_CODE, frames: () => searchFrames(['tea', 'ten', 'tent', 'to'], 'tent', true) },

  build: {
    intro: [
      'Build a Trie with insert, search (whole word), starts_with (any word with this prefix) and words_with_prefix (all such words, sorted).',
      'Each TrieNode has a children dict (letter → node) and an is_word flag.',
    ],
    starter: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        pass

    def _walk(self, s):
        # return the node at the end of s, or None
        pass

    def search(self, word):
        pass

    def starts_with(self, prefix):
        pass

    def words_with_prefix(self, prefix):
        pass
`,
    solution: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_word = True

    def _walk(self, s):
        node = self.root
        for ch in s:
            node = node.children.get(ch)
            if node is None:
                return None
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.is_word

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

    def words_with_prefix(self, prefix):
        out = []
        def collect(node, path):
            if node.is_word:
                out.append(path)
            for ch in sorted(node.children):
                collect(node.children[ch], path + ch)
        start = self._walk(prefix)
        if start:
            collect(start, prefix)
        return out
`,
    tests: [
      { code: 't = Trie()\nfor w in ["car", "cat", "cart"]: t.insert(w)\nresult = (t.search("car"), t.search("ca"), t.search("cart"), t.search("dog"))', show: 'search words vs prefixes', expected: '(True, False, True, False)' },
      { code: 't = Trie()\nt.insert("cart")\nresult = (t.starts_with("car"), t.search("car"), t.starts_with("cb"))', show: 'starts_with', expected: '(True, False, False)' },
      { code: 't = Trie()\nfor w in ["car", "cat", "cart", "care", "dog"]: t.insert(w)\nresult = t.words_with_prefix("car")', show: 'words_with_prefix("car")', expected: '["car", "care", "cart"]' },
      { code: 't = Trie()\nresult = (t.search(""), t.starts_with(""), t.words_with_prefix("x"))', show: 'empty trie', expected: '(False, True, [])' },
      { code: 't = Trie()\nt.insert("")\nresult = t.search("")', show: 'the empty word', expected: 'True' },
      { code: 'import itertools\nt = Trie()\nfor p in itertools.product("abcd", repeat=6): t.insert("".join(p))\nresult = (t.search("abcdab"), len(t.words_with_prefix("abcd")))', show: '4,096 words', expected: '(True, 16)' },
    ],
    builtin: {
      text: 'Python has no built-in trie. Small ones are often written as nested dicts; for big word lists, libraries like marisa-trie compress them.',
      code: `trie = {}
for w in ["car", "cat"]:
    node = trie
    for ch in w:
        node = node.setdefault(ch, {})
    node["$"] = True     # end of word`,
    },
  },

  fill: {
    intro: ['Insert a word: create missing children as you go.', 'After making sure the child exists, step down into it. Write that line.'],
    code: `def insert(root, word):
    node = root
    for ch in word:
        if ch not in node.children:
            node.children[ch] = TrieNode()
        ____
    node.is_word = True`,
    answer: 'node = node.children[ch]',
    setup: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_word = False

def words(node, path=""):
    out = [path] if node.is_word else []
    for ch in sorted(node.children):
        out += words(node.children[ch], path + ch)
    return out`,
    tests: [
      { code: 'r = TrieNode()\nfor w in ["to", "tea", "ten"]: insert(r, w)\nresult = words(r)', show: 'insert to, tea, ten', expected: '["tea", "ten", "to"]' },
      { code: 'r = TrieNode()\ninsert(r, "a")\nresult = (len(r.children), r.children["a"].is_word)', show: 'one-letter word', expected: '(1, True)' },
    ],
  },

  wild: [
    { icon: '⌨️', title: 'Autocomplete', text: 'Search boxes, phone keyboards and code editors suggest completions by walking a prefix tree of known words or identifiers.' },
    { icon: '📡', title: 'Internet routing', text: 'Routers pick the longest matching prefix of an IP address from their table, using bitwise tries, millions of times per second.' },
    { icon: '✍️', title: 'Spell checkers', text: 'Checking a word, or finding close words, walks a trie of the dictionary instead of comparing against every word.' },
    { icon: '🧬', title: 'Genomics', text: 'Suffix trees, a trie of every suffix of a DNA sequence, let biologists search a genome for patterns in time proportional to the pattern.' },
  ],

  problems: [
    {
      id: 'common-prefix',
      title: 'Shared beginning',
      difficulty: 'easy',
      pattern: 'Walk a single trie path',
      intro: ['Return the longest prefix that every word in words shares. Return "" if they share none or the list is empty.'],
      examples: [
        { input: 'shared_prefix(["flower", "flow", "flight"])', output: '"fl"' },
        { input: 'shared_prefix(["dog", "racecar"])', output: '""' },
      ],
      starter: `def shared_prefix(words):
    pass
`,
      solution: `def shared_prefix(words):
    if not words:
        return ""
    prefix = words[0]
    for w in words[1:]:
        i = 0
        while i < len(prefix) and i < len(w) and prefix[i] == w[i]:
            i += 1
        prefix = prefix[:i]
    return prefix
`,
      tests: [
        { call: 'shared_prefix(["flower", "flow", "flight"])', expected: '"fl"' },
        { call: 'shared_prefix(["dog", "racecar"])', expected: '""' },
        { call: 'shared_prefix([])', expected: '""' },
        { call: 'shared_prefix(["solo"])', expected: '"solo"' },
        { call: 'shared_prefix(["ab", "a", "abc"])', expected: '"a"' },
      ],
      hints: ['In a trie of these words, the answer is the path from the root while each node has exactly one child and isn’t a word end. A simpler equivalent: shrink a candidate prefix.', 'Start with the first word as the candidate. For each other word, cut the candidate down to the part both share.', 'prefix = words[0] → for w: i = matching length; prefix = prefix[:i] → return prefix'],
      complexity: { time: 'O(total letters)', space: 'O(1)' },
    },
    {
      id: 'prefix-counts',
      title: 'How many start with…',
      difficulty: 'easy',
      pattern: 'Trie with counts',
      intro: [
        'For each prefix in prefixes, count how many words in words start with it. Return the list of counts.',
        'The last test has 20,000 words and 20,000 prefixes: comparing every pair is too slow. Store a count on each trie node.',
      ],
      examples: [{ input: 'prefix_counts(["apple", "app", "apt", "bat"], ["ap", "app", "b", "c"])', output: '[3, 2, 1, 0]' }],
      starter: `def prefix_counts(words, prefixes):
    pass
`,
      solution: `def prefix_counts(words, prefixes):
    root = {}
    for w in words:
        node = root
        for ch in w:
            node = node.setdefault(ch, {"#": 0})
            node["#"] += 1
    out = []
    for p in prefixes:
        node = root
        for ch in p:
            node = node.get(ch)
            if node is None:
                break
        out.append(len(words) if p == "" else (node["#"] if node else 0))
    return out
`,
      tests: [
        { call: 'prefix_counts(["apple", "app", "apt", "bat"], ["ap", "app", "b", "c"])', expected: '[3, 2, 1, 0]' },
        { call: 'prefix_counts([], ["a"])', expected: '[0]' },
        { call: 'prefix_counts(["a", "a"], ["a", "aa"])', expected: '[2, 0]' },
        { call: 'prefix_counts(["x", "y"], [""])', expected: '[2]' },
        { code: 'import itertools\nws = ["".join(p) for p in itertools.product("abcdefghij", repeat=4)][:20000]\nps = ["".join(p) for p in itertools.product("abcdefghij", repeat=2)] * 200\nresult = sum(prefix_counts(ws, ps))', show: '20,000 words × 20,000 prefixes', expected: '2000000' },
      ],
      hints: ['Trie with counts: each node remembers how many words pass through it.', 'Insert every word; on the way down, add 1 to each node’s count. A prefix’s answer is the count on the node where it ends (0 if the path breaks).', 'for w: walk/create nodes, count += 1 → for p: walk; if missing: 0 else node.count'],
      complexity: { time: 'O(total letters)', space: 'O(total letters)' },
    },
    {
      id: 'roots',
      title: 'Shorten to roots',
      difficulty: 'medium',
      pattern: 'Trie lookup per word',
      intro: [
        'roots is a list of word roots. In sentence, replace each word that starts with a root by the shortest such root. Words with no root stay as they are.',
        'Return the new sentence. Words are separated by single spaces.',
      ],
      examples: [{ input: 'shorten(["cat", "bat", "rat"], "the cattle was rattled by the battery")', output: '"the cat was rat by the bat"' }],
      starter: `def shorten(roots, sentence):
    pass
`,
      solution: `def shorten(roots, sentence):
    trie = {}
    for r in roots:
        node = trie
        for ch in r:
            node = node.setdefault(ch, {})
        node["$"] = True
    out = []
    for word in sentence.split(" "):
        node = trie
        replacement = word
        for i, ch in enumerate(word):
            if ch not in node:
                break
            node = node[ch]
            if "$" in node:
                replacement = word[: i + 1]
                break
        out.append(replacement)
    return " ".join(out)
`,
      tests: [
        { call: 'shorten(["cat", "bat", "rat"], "the cattle was rattled by the battery")', expected: '"the cat was rat by the bat"' },
        { call: 'shorten(["a", "aa"], "aaa bbb")', expected: '"a bbb"' },
        { call: 'shorten([], "hello world")', expected: '"hello world"' },
        { call: 'shorten(["go"], "go gone ago")', expected: '"go go ago"' },
        { call: 'shorten(["ab", "abc"], "abcd")', expected: '"ab"' },
      ],
      hints: ['Put the roots in a trie; then each word needs one walk down it.', 'Build a trie of roots with an end mark. For each word, walk letter by letter; the first end mark you hit gives the shortest root. If the walk breaks, keep the word.', 'build trie → for word: walk; at first "$" use word[:i+1]; if char missing, stop and keep word → join'],
      complexity: { time: 'O(total letters)', space: 'O(root letters)' },
    },
  ],

  extra: [
    { name: 'Implement Trie (Prefix Tree)', url: 'https://leetcode.com/problems/implement-trie-prefix-tree/', difficulty: 'medium' },
    { name: 'Longest Common Prefix', url: 'https://leetcode.com/problems/longest-common-prefix/', difficulty: 'easy' },
    { name: 'Replace Words', url: 'https://leetcode.com/problems/replace-words/', difficulty: 'medium' },
    { name: 'Design Add and Search Words Data Structure', url: 'https://leetcode.com/problems/design-add-and-search-words-data-structure/', difficulty: 'medium' },
    { name: 'Search Suggestions System', url: 'https://leetcode.com/problems/search-suggestions-system/', difficulty: 'medium' },
    { name: 'Word Search II', url: 'https://leetcode.com/problems/word-search-ii/', difficulty: 'hard' },
  ],

  quiz: [
    { q: 'Why does each trie node need an “end of word” flag?', options: ['To save memory', 'So a prefix like “car” isn’t mistaken for a word when only “cart” was added', 'To keep children sorted', 'Python requires it'], answer: 1, why: 'The path c-a-r exists inside “cart”; the flag says whether “car” itself was inserted.' },
    { q: 'Searching a word of length L in a trie costs…', options: ['O(number of words)', 'O(log n)', 'O(L)', 'O(1)'], answer: 2, why: 'One step per letter.' },
    { q: 'When is a hash set better than a trie?', options: ['For prefix searches', 'For autocomplete', 'For exact-word lookups only, where its simplicity wins', 'Never'], answer: 2, why: 'If you never ask about prefixes, a hash set is simpler and very fast.' },
  ],
};

export default topic;

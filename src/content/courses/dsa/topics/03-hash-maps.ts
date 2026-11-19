import type { Frame, Prim, Role, Topic } from '../../../../types';
import { arrayRow, cell, cost, edge, Frames, ptr, region, scene, spread, txt } from '../../../lib/viz';

/* A teaching hash: sum of character codes mod m. Simple enough to do by hand. */
export const hsum = (k: string) => [...k].reduce((a, c) => a + c.charCodeAt(0), 0);

interface Entry {
  id: string;
  k: string;
  v: number;
}
interface HM {
  m: number;
  b: Entry[][];
}
let uid = 0;
const newMap = (m = 8): HM => ({ m, b: Array.from({ length: m }, () => []) });
const size = (h: HM) => h.b.reduce((a, c) => a + c.length, 0);
function putRaw(h: HM, k: string, v: number, id = `e${uid++}`): Entry {
  const i = hsum(k) % h.m;
  const found = h.b[i].find((e) => e.k === k);
  if (found) {
    found.v = v;
    return found;
  }
  const e = { id, k, v };
  h.b[i].push(e);
  return e;
}
const clone = (h: HM): HM => ({ m: h.m, b: h.b.map((c) => c.map((e) => ({ ...e }))) });
function rehash(h: HM, m: number): HM {
  const n = newMap(m);
  for (const c of h.b) for (const e of c) n.b[hsum(e.k) % m].push({ ...e });
  return n;
}

function mapPrims(h: HM, o: { roles?: Record<string, Role>; glow?: string[]; bucketRole?: Record<number, Role>; showV?: boolean } = {}): Prim[] {
  const gap = h.m > 8 ? 60 : 112;
  const xs = spread(h.m, gap);
  const out: Prim[] = [];
  for (let i = 0; i < h.m; i++) {
    out.push(cell(`b${i}`, xs[i], 120, '', { w: gap - 12, h: 44, role: o.bucketRole?.[i] ?? 'muted', sub: undefined, sup: String(i) }));
    h.b[i].forEach((e, j) => {
      out.push(
        cell(e.id, xs[i], 205 + j * 74, o.showV === false || h.m > 8 ? e.k : `${e.k}:${e.v}`, {
          w: gap - 8,
          h: 52,
          role: o.roles?.[e.id] ?? 'head',
          glow: o.glow?.includes(e.id),
        }),
      );
      out.push(edge(j === 0 ? `b${i}` : h.b[i][j - 1].id, e.id, { id: `ch:${e.id}` }));
    });
  }
  return out;
}

const calc = (k: string, m: number, y = 400) => {
  const codes = [...k].map((c) => c.charCodeAt(0));
  return txt('calc', 500, y, `h("${k}") = ${codes.join(' + ')} = ${hsum(k)}  →  ${hsum(k)} % ${m} = ${hsum(k) % m}`, { size: 30, role: 'curr' });
};

/* ---------------- hook ---------------- */
function hook(): Frame[] {
  const f = new Frames();
  const hooks = (hl?: number, coat?: number): Prim[] =>
    spread(6, 140).flatMap((x, i) => [
      cell(`h${i}`, x, 170, String(i + 1), { w: 100, h: 70, role: i === hl ? 'curr' : 'muted', glow: i === hl }),
      ...(coat !== undefined && i === coat ? [txt('coat', x, 290, '🧥', { size: 70, hand: false })] : []),
    ]);
  f.add([...hooks(), txt('who', 500, 400, 'Coat check: 300 coats, one attendant.', { size: 32 })], 'At a coat check you hand over your coat and get a ticket number.');
  f.add([...hooks(3, 3), txt('who', 500, 400, 'ticket 4  →  hook 4', { size: 36, role: 'curr' })], 'The ticket tells the attendant exactly which hook. No searching through 300 coats.');
  f.add([...hooks(3, 3), txt('who', 500, 400, 'name  →  hash function  →  hook number', { size: 36, role: 'new' })], 'A hash map does the same with any key: a hash function turns the key into a hook number.');
  return f.get();
}

/* ---------------- watch ---------------- */
function keyToBucket(): Frame[] {
  const h = newMap();
  const f = new Frames();
  f.add([...mapPrims(h), txt('t', 500, 400, '8 empty buckets', { size: 32 })], 'A hash map is an array of buckets. Here we have 8.');
  f.add([...mapPrims(h), txt('k', 500, 40, 'put("cat", 3)', { size: 36, role: 'new' }), calc('cat', 8)], 'To store cat, hash it: add up the letter codes, then take the remainder after dividing by 8.');
  const e = putRaw(h, 'cat', 3);
  f.add([...mapPrims(h, { roles: { [e.id]: 'new' }, bucketRole: { 0: 'curr' } }), calc('cat', 8)], 'The remainder is 0, so cat goes in bucket 0. One calculation, no search.', { cost: cost('put', 'O(1)') });
  const d = putRaw(h, 'dog', 5);
  f.add([...mapPrims(h, { roles: { [d.id]: 'new' }, bucketRole: { 2: 'curr' } }), calc('dog', 8)], 'dog hashes to bucket 2.');
  return f.get();
}

function collisions(): Frame[] {
  const h = newMap();
  putRaw(h, 'cat', 3);
  putRaw(h, 'dog', 5);
  const f = new Frames();
  f.add([...mapPrims(h), txt('k', 500, 40, 'put("act", 9)', { size: 36, role: 'new' }), calc('act', 8)], 'Now act. Same letters as cat, so the same sum: 312.');
  const e = putRaw(h, 'act', 9);
  f.add([...mapPrims(h, { roles: { [e.id]: 'danger' }, bucketRole: { 0: 'danger' } }), calc('act', 8)], 'Bucket 0 is taken. That is a collision: two keys, one bucket.');
  f.add([...mapPrims(h, { roles: { [e.id]: 'new' }, bucketRole: { 0: 'curr' } }), txt('t', 500, 400, 'chaining: each bucket holds a small list', { size: 32, role: 'new' })], 'Chaining: the bucket keeps a short list, and act joins the end of it.');
  f.add([...mapPrims(h), txt('t', 500, 400, 'good hash + enough buckets → lists stay ~1 long', { size: 32, role: 'done' })], 'With a good hash and enough buckets, these lists stay tiny. So operations stay O of 1 on average.');
  return f.get();
}

function lookup(): Frame[] {
  const h = newMap();
  const cat = putRaw(h, 'cat', 3);
  putRaw(h, 'dog', 5);
  const act = putRaw(h, 'act', 9);
  const f = new Frames();
  f.add([...mapPrims(h), txt('k', 500, 40, 'get("act")', { size: 36, role: 'curr' }), calc('act', 8)], 'get act: hash it the same way. Bucket 0.');
  f.add([...mapPrims(h, { roles: { [cat.id]: 'curr' }, bucketRole: { 0: 'curr' } }), ptr('check', cat.id, 'curr', { side: 'bottom' }), txt('k', 500, 40, '"cat" == "act"?  no', { size: 36, role: 'curr' })], 'Walk the short list. Is this key act? No, it’s cat.');
  f.add([...mapPrims(h, { roles: { [act.id]: 'done' }, glow: [act.id], bucketRole: { 0: 'curr' } }), ptr('check', act.id, 'done', { side: 'bottom' }), txt('k', 500, 40, 'found: 9', { size: 36, role: 'done' })], 'Next one is act. Return 9. We compared keys, which is why keys must support equality.', {
    cost: cost('get', 'O(1)'),
  });
  return f.get();
}

function resize(): Frame[] {
  let h = newMap();
  const keys = ['cat', 'dog', 'ant', 'bee', 'owl', 'yak'];
  keys.forEach((k, i) => putRaw(h, k, i + 1, `r_${k}`));
  const f = new Frames();
  f.add([...mapPrims(h), txt('lf', 500, 400, 'load factor = 6 / 8 = 0.75', { size: 34, role: 'curr' })], 'Six items in eight buckets. Load factor is items divided by buckets: 0.75.');
  putRaw(h, 'emu', 7, 'r_emu');
  f.add([...mapPrims(h, { roles: { r_emu: 'new' } }), txt('lf', 500, 400, 'load factor = 7 / 8 = 0.875 > 0.75', { size: 34, role: 'danger' })], 'Add emu. Now 7 over 8 is too crowded. Collisions would start piling up.');
  h = rehash(h, 16);
  f.add([...mapPrims(h), txt('lf', 500, 400, '16 buckets: every key re-hashed with % 16', { size: 34, role: 'new' })], 'So the map doubles to 16 buckets and re-hashes every key. Watch them move.', { cost: cost('resize', 'O(n)') });
  f.add([...mapPrims(h), txt('lf', 500, 400, 'load = 7/16 ≈ 0.44 · resizing is rare → O(1) amortised', { size: 32, role: 'done' })], 'Resizing costs O of n, but it happens so rarely that each put is still O of 1 on average. That’s called amortised.');
  return f.get();
}

/* ---------------- trace ---------------- */
const TRACE_CODE = `def first_repeat(words):
    seen = set()
    for w in words:
        if w in seen:
            return w
        seen.add(w)
    return None`;

function trace(): Frame[] {
  const words = ['red', 'blue', 'green', 'blue', 'red'];
  const f = new Frames();
  const seen: string[] = [];
  const pic = (i: number, hit = false): Prim[] => [
    ...arrayRow(words, { y: 120, w: 110, gap: 130, roles: i >= 0 ? { [i]: hit ? 'done' : 'curr' } : {} }),
    ...(i >= 0 ? [ptr('w', `a${i}`, hit ? 'done' : 'curr')] : []),
    region('set', 500, 320, 640, 120, { role: 'second', label: 'seen (a set)', dashed: true }),
    ...spread(Math.max(seen.length, 1), 140).slice(0, seen.length).map((x, k) => cell(`s_${seen[k]}`, x, 330, seen[k], { w: 116, role: 'second' })),
  ];
  f.add(pic(-1), 'Find the first word that appears twice. Start with an empty set.', { line: 2, vars: { seen: '{}' } });
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (seen.includes(w)) {
      f.add(pic(i, true), `${w} is already in the set. That check was one hash: O of 1. Return ${w}.`, { line: 5, vars: { w, seen: `{${seen.join(', ')}}` } });
      break;
    }
    f.add(pic(i), `Is ${w} in seen? No.`, { line: 4, vars: { w, seen: `{${seen.join(', ')}}` } });
    seen.push(w);
    f.add(pic(i), `Add ${w} to the set.`, { line: 6, vars: { w, seen: `{${seen.join(', ')}}` } });
  }
  f.add(pic(-1), 'One pass, constant-time checks: O of n total. Without the set we’d compare every pair: O of n squared.', { line: 7 });
  return f.get();
}

/* ---------------- play ---------------- */
type S = HM;
const tooMany = (h: HM) => size(h) >= 14;

const topic: Topic = {
  id: 'hash-maps',
  order: 3,
  title: 'Hash maps & sets',
  short: 'Key → bucket in one jump. Collisions, chaining, resizing.',
  icon: '🗝️',
  costs: [cost('get / put / delete', 'O(1)'), cost('…worst case (all collide)', 'O(n)'), cost('resize', 'O(n)'), cost('min / max / sorted', 'O(n)')],

  hook: {
    frames: hook,
    lines: ['A hash map turns a key into a slot number, like a coat-check ticket.', 'So finding a value by its key takes one jump, not a search.'],
  },

  watch: [
    { id: 'bucket', title: 'Key → bucket', frames: keyToBucket },
    { id: 'collide', title: 'Collisions', frames: collisions },
    { id: 'lookup', title: 'Lookup', frames: lookup },
    { id: 'resize', title: 'Resizing', frames: resize, costs: [cost('put (amortised)', 'O(1)'), cost('one resize', 'O(n)')] },
  ],

  recall: {
    prompt: 'Explain how a hash map finds a value by key. What happens when two keys land in the same bucket?',
    model:
      'The hash function turns the key into a number, and the remainder after dividing by the bucket count picks a bucket. Two keys in one bucket is a collision: the bucket keeps a small list and we compare keys to find the right one. The map grows and re-hashes when it gets too full, so the lists stay short and lookups stay O(1) on average.',
    keywords: [
      ['hash'],
      ['bucket', 'slot', 'index'],
      ['collision', 'same bucket', 'clash'],
      ['list', 'chain', 'compare'],
      ['resize', 'grow', 'double', 'load'],
    ],
  },

  play: {
    intro: 'Your own hash map with h(key) = sum of letter codes % buckets. Put keys and watch where they land. It doubles when load goes over 0.75.',
    init: (): S => newMap(),
    view: (s: S) => scene([...mapPrims(s), txt('lf', 500, 410, `${size(s)} items / ${s.m} buckets = load ${(size(s) / s.m).toFixed(2)}`, { size: 28 })]),
    ops: [
      {
        id: 'put',
        label: 'put(key, value)',
        args: [
          { name: 'key', kind: 'text', default: 'fox' },
          { name: 'value', kind: 'int', default: 1 },
        ],
        run: (s: S, a) => {
          const k = String(a.key).trim().slice(0, 5) || 'x';
          if (tooMany(s)) return { state: s, frames: [{ scene: scene(mapPrims(s)), say: 'This playground holds 14 keys. Delete some first.' }] };
          const h = clone(s);
          const f = new Frames();
          f.add([...mapPrims(h), calc(k, h.m)], `Hash ${k}: bucket ${hsum(k) % h.m}.`);
          const existed = h.b[hsum(k) % h.m].some((e) => e.k === k);
          const e = putRaw(h, k, Number(a.value));
          const collided = h.b[hsum(k) % h.m].length > 1 && !existed;
          f.add([...mapPrims(h, { roles: { [e.id]: existed ? 'curr' : collided ? 'danger' : 'new' }, bucketRole: { [hsum(k) % h.m]: 'curr' } }), calc(k, h.m)], existed ? `${k} was already there: value replaced.` : collided ? `Collision! ${k} joins the bucket's list.` : `${k} stored.`);
          let out = h;
          if (size(h) / h.m > 0.75 && h.m < 16) {
            out = rehash(h, h.m * 2);
            f.add(mapPrims(out), `Load went over 0.75, so the map doubled to ${out.m} buckets and re-hashed everything.`);
          }
          return { state: out, frames: f.get(), cost: cost(existed ? 'put (update)' : 'put', 'O(1)') };
        },
      },
      {
        id: 'get',
        label: 'get(key)',
        args: [{ name: 'key', kind: 'text', default: 'fox' }],
        run: (s: S, a) => {
          const k = String(a.key).trim();
          const i = hsum(k) % s.m;
          const f = new Frames();
          f.add([...mapPrims(s, { bucketRole: { [i]: 'curr' } }), calc(k, s.m)], `Hash ${k}: bucket ${i}.`);
          for (const e of s.b[i]) {
            const hit = e.k === k;
            f.add([...mapPrims(s, { roles: { [e.id]: hit ? 'done' : 'curr' }, glow: hit ? [e.id] : [], bucketRole: { [i]: 'curr' } })], hit ? `Found ${k}: ${e.v}.` : `${e.k} is not ${k}. Next.`);
            if (hit) return { state: s, frames: f.get(), cost: cost('get', 'O(1)') };
          }
          f.add(mapPrims(s, { bucketRole: { [i]: 'danger' } }), `${k} is not in the map. get would return None.`);
          return { state: s, frames: f.get(), cost: cost('get', 'O(1)') };
        },
      },
      {
        id: 'del',
        label: 'delete(key)',
        args: [{ name: 'key', kind: 'text', default: 'fox' }],
        run: (s: S, a) => {
          const k = String(a.key).trim();
          const i = hsum(k) % s.m;
          const e = s.b[i].find((x) => x.k === k);
          if (!e) return { state: s, frames: [{ scene: scene(mapPrims(s, { bucketRole: { [i]: 'danger' } })), say: `${k} isn't here.` }] };
          const h = clone(s);
          h.b[i] = h.b[i].filter((x) => x.k !== k);
          return {
            state: h,
            frames: [
              { scene: scene(mapPrims(s, { roles: { [e.id]: 'danger' }, bucketRole: { [i]: 'curr' } })), say: `Bucket ${i}: found ${k}.` },
              { scene: scene(mapPrims(h)), say: 'Unlinked from the list. Done.' },
            ],
            cost: cost('delete', 'O(1)'),
          };
        },
      },
    ],
  },

  predict: [
    {
      id: 'anagram-bucket',
      question: 'Our hash adds letter codes, then % 8. "cat" went to bucket 0. Where does "act" go?',
      scene: scene((() => {
        const h = newMap();
        putRaw(h, 'cat', 3, 'pc');
        return mapPrims(h);
      })()),
      options: ['Bucket 0', 'Bucket 3', 'Bucket 7', 'Random each time'],
      answer: 0,
      frames: () => {
        const h = newMap();
        putRaw(h, 'cat', 3, 'pc');
        const f = new Frames();
        f.add([...mapPrims(h), calc('act', 8)], 'Same letters in a different order give the same sum.');
        putRaw(h, 'act', 1, 'pa');
        f.add([...mapPrims(h, { roles: { pa: 'danger' } }), calc('act', 8)], 'So act lands in bucket 0 too. A real hash mixes in letter positions to avoid this.');
        return f.get();
      },
      why: 'A sum ignores order, so anagrams collide. Real hash functions (like Python’s) mix positions too, and the same key always gives the same hash.',
    },
    {
      id: 'worst-case',
      question: 'A bad hash sends all 6 keys into one bucket. How long does get take now?',
      scene: scene((() => {
        const h: HM = newMap();
        ['a1', 'a2', 'a3', 'a4'].forEach((k, i) => h.b[3].push({ id: `w${i}`, k, v: i }));
        return mapPrims(h);
      })()),
      options: ['Still O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
      answer: 2,
      frames: () => {
        const h: HM = newMap();
        ['a1', 'a2', 'a3', 'a4'].forEach((k, i) => h.b[3].push({ id: `w${i}`, k, v: i }));
        return [0, 1, 2, 3].map((i) => ({
          scene: scene(mapPrims(h, { roles: { [`w${i}`]: i === 3 ? 'done' : 'curr' }, bucketRole: { 3: 'danger' } })),
          say: i === 3 ? 'Found it at the end: we walked the whole list. That’s O of n.' : `Compare with key ${i + 1}…`,
        }));
      },
      why: 'Everything is in one list, so a lookup walks it: O(n). That’s why hash quality and resizing matter.',
    },
    {
      id: 'resize-q',
      question: '8 buckets, 6 keys, and the map resizes when load goes over 0.75. You add a 7th key. What happens?',
      scene: scene((() => {
        const h = newMap();
        ['cat', 'dog', 'ant', 'bee', 'owl', 'yak'].forEach((k, i) => putRaw(h, k, i, `r_${k}`));
        return mapPrims(h);
      })()),
      options: ['Nothing special', 'It doubles to 16 buckets and re-hashes every key', 'It throws an error', 'It removes the oldest key'],
      answer: 1,
      frames: resize,
      why: '7/8 = 0.875 is over the limit, so it grows and every key gets a new bucket with % 16.',
    },
  ],

  trace: { title: 'Finding the first repeat with a set', code: TRACE_CODE, frames: trace },

  build: {
    intro: [
      'Build MyHashMap with chaining. self.buckets is a list of lists of [key, value] pairs. Use hash(key) % len(self.buckets) to pick a bucket.',
      'After a put adds a new key, if size / number of buckets > 0.75, double the buckets and re-insert every pair. Don’t use a dict.',
    ],
    starter: `class MyHashMap:
    def __init__(self):
        self.buckets = [[] for _ in range(8)]
        self.size = 0

    def _index(self, key):
        return hash(key) % len(self.buckets)

    def put(self, key, value):
        pass

    def get(self, key, default=None):
        pass

    def remove(self, key):
        # do nothing if the key is missing
        pass

    def __len__(self):
        return self.size
`,
    solution: `class MyHashMap:
    def __init__(self):
        self.buckets = [[] for _ in range(8)]
        self.size = 0

    def _index(self, key):
        return hash(key) % len(self.buckets)

    def put(self, key, value):
        bucket = self.buckets[self._index(key)]
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])
        self.size += 1
        if self.size / len(self.buckets) > 0.75:
            self._resize()

    def _resize(self):
        old = self.buckets
        self.buckets = [[] for _ in range(len(old) * 2)]
        for bucket in old:
            for key, value in bucket:
                self.buckets[self._index(key)].append([key, value])

    def get(self, key, default=None):
        for k, v in self.buckets[self._index(key)]:
            if k == key:
                return v
        return default

    def remove(self, key):
        bucket = self.buckets[self._index(key)]
        for i, pair in enumerate(bucket):
            if pair[0] == key:
                bucket.pop(i)
                self.size -= 1
                return

    def __len__(self):
        return self.size
`,
    tests: [
      { code: 'm = MyHashMap()\nm.put("cat", 3)\nm.put("dog", 5)\nresult = (m.get("cat"), m.get("dog"))', show: 'put two, get both', expected: '(3, 5)' },
      { code: 'm = MyHashMap()\nm.put("cat", 3)\nm.put("cat", 7)\nresult = (m.get("cat"), len(m))', show: 'put same key twice', expected: '(7, 1)' },
      { code: 'm = MyHashMap()\nresult = (m.get("nope"), m.get("nope", 0))', show: 'missing key', expected: '(None, 0)' },
      { code: 'm = MyHashMap()\nm.put(1, "a")\nm.remove(1)\nm.remove(99)\nresult = (m.get(1), len(m))', show: 'remove', expected: '(None, 0)' },
      { code: 'm = MyHashMap()\nfor i in range(13): m.put(i, i * i)\nresult = (len(m.buckets), m.get(12), len(m))', show: '13 puts → resized twice', expected: '(32, 144, 13)' },
      { code: 'm = MyHashMap()\nfor i in range(0, 64, 8): m.put(i, i)\nresult = [m.get(i) for i in range(0, 64, 8)]', show: 'many collisions (multiples of 8)', expected: '[0, 8, 16, 24, 32, 40, 48, 56]' },
    ],
    builtin: {
      text: 'Python’s dict and set are hash tables (with a smarter scheme called open addressing). collections.Counter and defaultdict build on dict.',
      code: `ages = {"ada": 36}
ages["alan"] = 41          # O(1) average
"ada" in ages              # O(1) average
from collections import Counter
Counter("banana")          # {'a': 3, 'n': 2, 'b': 1}`,
    },
  },

  fill: {
    intro: ['Count how many times each word appears, using a plain dict.', 'Write the one line that adds 1 to the word’s count, starting from 0 if it’s new.'],
    code: `def word_counts(words):
    counts = {}
    for w in words:
        ____
    return counts`,
    answer: 'counts[w] = counts.get(w, 0) + 1',
    tests: [
      { call: 'word_counts(["a", "b", "a"])', expected: '{"a": 2, "b": 1}' },
      { call: 'word_counts([])', expected: '{}' },
      { call: 'word_counts(["x"] * 5)', expected: '{"x": 5}' },
    ],
  },

  wild: [
    { icon: '🐍', title: 'Python itself', text: 'Every object’s attributes, every module’s names and every keyword argument live in dicts. Python runs on hash tables.' },
    { icon: '🗄️', title: 'Databases', text: 'Hash joins match rows from two tables by hashing the join key. Many key-value stores are giant distributed hash maps.' },
    { icon: '⚡', title: 'Caches', text: 'Redis and Memcached keep recent results in hash tables, so a repeated request is answered in microseconds.' },
    { icon: '🌳', title: 'Git', text: 'Git stores every file by the hash of its contents. Same content, same hash: duplicates are stored once.' },
  ],

  problems: [
    {
      id: 'first-single',
      title: 'First one-off sample',
      difficulty: 'easy',
      pattern: 'Count with a hash map, then scan',
      intro: ['samples is a list of labels. Return the first label (in list order) that appears exactly once.', 'Return None if every label repeats.'],
      examples: [
        { input: 'first_single(["b", "a", "b", "c", "a"])', output: '"c"' },
        { input: 'first_single(["x", "x"])', output: 'None' },
      ],
      starter: `def first_single(samples):
    pass
`,
      solution: `def first_single(samples):
    counts = {}
    for s in samples:
        counts[s] = counts.get(s, 0) + 1
    for s in samples:
        if counts[s] == 1:
            return s
    return None
`,
      tests: [
        { call: 'first_single(["b", "a", "b", "c", "a"])', expected: '"c"' },
        { call: 'first_single(["x", "x"])', expected: 'None' },
        { call: 'first_single([])', expected: 'None' },
        { call: 'first_single(["solo"])', expected: '"solo"' },
        { call: 'first_single([1, 2, 1, 3, 2, 4])', expected: '3' },
        { call: 'first_single(list(range(50000)) * 2 + [7])', expected: 'None' },
        { call: 'first_single(list(range(50000)) * 2 + [-1])', expected: '-1' },
      ],
      hints: [
        'Two passes with a hash map: count first, then look.',
        'Pass 1: count every label in a dict. Pass 2: walk the list in order and return the first label whose count is 1.',
        'counts = {} → for s: counts[s] = counts.get(s, 0) + 1 → for s: if counts[s] == 1: return s → return None',
      ],
      complexity: { time: 'O(n)', space: 'O(n)' },
    },
    {
      id: 'can-build',
      title: 'Build it from the tiles',
      difficulty: 'easy',
      pattern: 'Frequency counting',
      intro: ['You have letter tiles. Return True if word can be spelled using each tile at most once.', 'Upper and lower case are different tiles.'],
      examples: [
        { input: 'can_build("tree", "retx")', output: 'False', why: 'Only one e tile.' },
        { input: 'can_build("tree", "eertx")', output: 'True' },
      ],
      starter: `def can_build(word, tiles):
    pass
`,
      solution: `def can_build(word, tiles):
    have = {}
    for t in tiles:
        have[t] = have.get(t, 0) + 1
    for ch in word:
        if have.get(ch, 0) == 0:
            return False
        have[ch] -= 1
    return True
`,
      tests: [
        { call: 'can_build("tree", "retx")', expected: 'False' },
        { call: 'can_build("tree", "eertx")', expected: 'True' },
        { call: 'can_build("", "abc")', expected: 'True' },
        { call: 'can_build("a", "")', expected: 'False' },
        { call: 'can_build("Aa", "aa")', expected: 'False' },
        { call: 'can_build("ab" * 20000, "ba" * 20000)', expected: 'True' },
      ],
      hints: [
        'Count what you have in a hash map, then spend from it.',
        'Count each tile. For each letter of the word, if its count is 0 you can’t build it; otherwise use one tile.',
        'have = counts of tiles → for ch in word: if have.get(ch, 0) == 0: return False; have[ch] −= 1 → return True',
      ],
      complexity: { time: 'O(n + m)', space: 'O(k)' },
    },
    {
      id: 'zero-runs',
      title: 'Balanced stretches',
      difficulty: 'medium',
      pattern: 'Prefix sums + hash map',
      intro: [
        'changes is a list of daily gains and losses. Count the contiguous stretches whose total is exactly 0.',
        'Checking every stretch is O(n²). Hint from Topic 2: two equal prefix sums mean the stretch between them sums to 0.',
      ],
      examples: [
        { input: 'count_zero_runs([1, -1, 2, -2])', output: '3', why: '[1,−1], [2,−2] and the whole list.' },
        { input: 'count_zero_runs([0, 0])', output: '3' },
      ],
      starter: `def count_zero_runs(changes):
    pass
`,
      solution: `def count_zero_runs(changes):
    seen = {0: 1}
    total = 0
    count = 0
    for x in changes:
        total += x
        count += seen.get(total, 0)
        seen[total] = seen.get(total, 0) + 1
    return count
`,
      tests: [
        { call: 'count_zero_runs([1, -1, 2, -2])', expected: '3' },
        { call: 'count_zero_runs([0, 0])', expected: '3' },
        { call: 'count_zero_runs([])', expected: '0' },
        { call: 'count_zero_runs([3, 4, -7, 1])', expected: '1' },
        { call: 'count_zero_runs([1, 2, 3])', expected: '0' },
        { call: 'count_zero_runs([1, -1] * 50000)', expected: '2500000000' },
      ],
      hints: [
        'Prefix sums + hash map: count how often each running total has appeared.',
        'Keep a running total and a dict of how many times each total has been seen (start with {0: 1}). At each step, every earlier equal total marks a zero-sum stretch ending here.',
        'seen = {0: 1}; total = count = 0 → for x: total += x; count += seen.get(total, 0); seen[total] += 1 → return count',
      ],
      complexity: { time: 'O(n)', space: 'O(n)' },
    },
  ],

  extra: [
    { name: 'Two Sum', url: 'https://leetcode.com/problems/two-sum/', difficulty: 'easy' },
    { name: 'Valid Anagram', url: 'https://leetcode.com/problems/valid-anagram/', difficulty: 'easy' },
    { name: 'Ransom Note', url: 'https://leetcode.com/problems/ransom-note/', difficulty: 'easy' },
    { name: 'Group Anagrams', url: 'https://leetcode.com/problems/group-anagrams/', difficulty: 'medium' },
    { name: 'Subarray Sum Equals K', url: 'https://leetcode.com/problems/subarray-sum-equals-k/', difficulty: 'medium' },
    { name: 'Longest Consecutive Sequence', url: 'https://leetcode.com/problems/longest-consecutive-sequence/', difficulty: 'medium' },
  ],

  quiz: [
    {
      q: 'What does the hash function do?',
      options: ['Sorts the keys', 'Turns a key into a bucket number', 'Encrypts the value', 'Counts the items'],
      answer: 1,
      why: 'hash(key) % number_of_buckets gives the slot.',
    },
    {
      q: 'Two different keys land in the same bucket. With chaining, the map…',
      options: ['Overwrites the old key', 'Throws an error', 'Keeps both in that bucket’s list', 'Moves one to a random bucket'],
      answer: 2,
      why: 'The bucket holds a short list; lookups compare keys.',
    },
    {
      q: 'You need the smallest key quickly and often. Is a hash map a good fit?',
      options: ['Yes, O(1)', 'No: hash maps have no order, finding min is O(n)', 'Yes, keys are sorted', 'Only for string keys'],
      answer: 1,
      why: 'Hashing scatters keys. For ordered queries use a heap or balanced BST.',
    },
  ],
};

export default topic;

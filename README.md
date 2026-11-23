# DSA Lab

A visual, interactive site for learning data structures and algorithms by **watching, listening, writing and building**.
Every topic runs the same 11-step loop, one step on screen at a time:

| # | Step | What you do |
|---|------|-------------|
| 1 | Hook | 20-second real-world analogy, animated |
| 2 | Watch it | Narrated animation with Play / Step / Back / Speed |
| 3 | Write it back | Explain from memory, then compare with a model answer |
| 4 | Play with it | Operate the structure yourself, every operation animated |
| 5 | Predict | Guess first, then see the animated answer |
| 6 | Trace the code | Python with the current line highlighted, synced to the picture, live variables |
| 7 | Build it | Implement the structure yourself, tests run in the browser |
| 8 | Fill the gap | One missing line, tests run |
| 9 | In the wild | Real software that depends on it |
| 10 | Problems | 3 original problems (easy, easy, medium), tests, 3-level hints, LeetCode extra practice |
| 11 | Recap | Explain it in your own words (saved) + 3-question quiz |

Also: read-aloud on every text chunk, three themes (Mix / Chalk / Blocks), focus mode, a cost meter on every
operation, a “when to use which” comparison page, spaced review at 1, 3 and 7 days with mixed-topic practice,
and progress export/import.

---

## Run it locally

Requirements: **Node.js 20+** (22 recommended).

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build
npm run verify       # run every reference solution against its tests in Pyodide + validate all animations
npm run verify -- arrays hash-maps   # only some topics
```

Python runs **in your browser** with [Pyodide](https://pyodide.org), bundled with the site (no CDN). Code runs
in a Web Worker, and anything that runs longer than 8 seconds is stopped, so an infinite loop can't freeze the page.

### Works offline

The site is a Progressive Web App. On your first online visit it saves everything on the device (about 15 MB,
mostly Python): pages, lessons, animations, fonts, read-aloud and the Python runtime. After that it opens and works
with no internet. **Settings → Offline** shows when the offline copy is ready. New versions download automatically
the next time you're online. On a phone, use “Add to Home Screen” to install it like an app.
Only LeetCode links and Supabase sync need a connection. Read-aloud offline uses your device's built-in voices.
(The dev server, `npm run dev`, doesn't register the offline worker; use `npm run build && npm run preview` to try it.)

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repo.
3. Vercel detects Vite. Build command `npm run build`, output `dist` (already set in `vercel.json`).
4. Deploy. The app uses hash URLs (`/#/learn/...`), so no rewrite rules are needed.

Any static host works the same way (Netlify, GitHub Pages, Cloudflare Pages): upload `dist/`.

## Progress storage

By default progress is saved in the browser (`localStorage`). **Settings → Export** downloads a JSON file;
**Import** merges one back in (nothing is lost from either side).

### Optional: sync across devices with Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run:

   ```sql
   create table if not exists public.progress (
     user_id    uuid primary key references auth.users(id) on delete cascade,
     data       jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now()
   );

   alter table public.progress enable row level security;

   create policy "read own progress"   on public.progress for select using (auth.uid() = user_id);
   create policy "insert own progress" on public.progress for insert with check (auth.uid() = user_id);
   create policy "update own progress" on public.progress for update using (auth.uid() = user_id)
                                                               with check (auth.uid() = user_id);
   ```

3. **Authentication → URL Configuration**: set *Site URL* to your Vercel URL and add
   `http://localhost:5173` to *Redirect URLs*. Email sign-in (magic link) is on by default.
4. **Project Settings → API**: copy the *Project URL* and the *anon public* key.
5. Locally, copy `.env.example` to `.env` and fill in:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

   On Vercel, add the same two variables under **Project → Settings → Environment Variables**, then redeploy.
6. In the app, open **Settings → Sync across devices**, enter your email, click the link you receive.

With keys present and a signed-in user, progress is merged from both places on load and saved to both.
Without keys, the app silently uses localStorage only. The storage code lives in `src/storage/` behind a small
`ProgressStore` interface, so another backend is one new file.

---

## Project layout

```
src/
  types.ts                 the content contract (Topic, Course, Frame, Scene, Problem…)
  content/
    registry.ts            auto-discovers courses and topics (no manual registration)
    lib/viz.ts             helpers for building animation frames
    courses/
      dsa/
        course.ts          course settings, step order, comparison table
        topics/01-big-o.ts one file per topic
  viz/                     renderer (Stage), tweening, Player, code view, cost meter
  steps/                   one component per step kind
  pages/                   dashboard, topic page, compare, review, settings
  speech/                  read-aloud (Web Speech API)
  python/                  Pyodide worker + shared test harness
  storage/                 localStorage + Supabase
scripts/verify.ts          content verifier
```

## Add a topic

Create **one file** in `src/content/courses/<course>/topics/`, e.g. `14-segment-trees.ts`, that
`export default`s a `Topic` (see `src/types.ts`; `src/content/templates/topic-template.ts` is a commented
starting point). It appears on the map automatically, ordered by its `order` field.

Every field except `id`, `order`, `title`, `short` and `icon` is optional: a topic without `build` simply skips
that step. Then run:

```bash
npm run verify -- segment-trees
```

which proves every reference solution passes its tests, that the starter code doesn't, and that every
animation frame is well-formed.

### Lessons and spacing

`lesson` is a list of sections. Mark a section with `breakAfter: 'watch'` (or `'play'`, `'predict'`…) to end a
lesson part there and slot that step in as a break. Big-O, for example, runs:
Learn part 1 → Watch → Learn part 2 → Play → Learn part 3 → Write it back → … Keep parts to about 4–5 sections.

### How animations work

An animation is a list of **frames**. Each frame is a `Scene` (a list of primitives: `cell`, `edge`,
`pointer`, `text`, `bar`, `region`, `line`, `dot`, `icon`, `path`), plus one sentence of narration and,
optionally, the highlighted code line and variable values. The player tweens between frames by matching
primitive **ids**: keep an item's id the same and it slides to its new position; a new id fades in; a missing
id fades out. Colours come from **roles** (`head`, `curr`, `new`, `second`, `done`, `danger`, `muted`) so the
same meaning has the same colour in every theme.

## Add a course

Create `src/content/courses/<course-id>/course.ts` exporting a `Course`, and put topic files in
`src/content/courses/<course-id>/topics/`. Choose which steps the course uses via `steps` (for example a
linear algebra course might drop `problems` and keep `watch`, `play`, `predict`, `recall`, `recap`).

The scene primitives are generic. For a Linear Algebra course, a vector is a `line` with `arrow: true`, a
point is a `dot`, a transformed grid is a set of `path`s, and a matrix is a grid of `cell`s. A matrix
transformation is two frames with the same ids and moved coordinates; the player animates the motion.

```ts
// a vector v = (2, 1) drawn from the origin, then transformed by [[1,1],[0,1]]
const O = { x: 500, y: 300 }, s = 60;
const vec = (x: number, y: number) => line('v', O.x, O.y, O.x + x * s, O.y - y * s, { arrow: true, role: 'curr', label: 'v' });
frames: () => [
  { scene: scene([vec(2, 1)]), say: 'v is two right, one up.' },
  { scene: scene([vec(3, 1)]), say: 'The shear pushes it right by its height.' },
]
```

## Accessibility & comfort

- Read-aloud for every text chunk (Listen bar, per-chunk 🔈 buttons, word highlighting, speed, voice, skip code).
- Narration of each animation step, with auto-play waiting for the voice to finish.
- Respects *Reduce motion* in your OS settings. Visible keyboard focus everywhere.
- Text size control, focus mode, and a setting to make writing steps optional.

# Progress

If a session gets cut off, say **"continue"** and work resumes from the first unchecked item.
"Verified" means `npm run verify <topic-id>` passes: every reference solution passes its tests in Pyodide,
starter code does not, and every animation frame is valid.

## Engine
- [x] Vite + React + TypeScript scaffold, Vercel config
- [x] Three themes (Mix / Chalk / Blocks) via CSS variables
- [x] Scene renderer + tweened animation player (play / step / back / speed / scrub)
- [x] Auto-zoom diagrams to their content
- [x] Read-aloud (Web Speech API): per-chunk buttons, Listen bar, word highlight, speed, voice, skip code
- [x] Narration synced to animation steps
- [x] Pyodide in a Web Worker with an 8 s kill switch for infinite loops
- [x] Storage interface: localStorage + optional Supabase; export / import JSON
- [x] Pages: map dashboard, topic flow (11 steps), compare, review (1/3/7 days + mixed practice), settings
- [x] Focus mode
- [x] `scripts/verify.ts` content verifier

## Topics (DSA course)
- [x] 1. Big-O and complexity basics — verified
- [x] 2. Arrays and strings — verified
- [x] 3. Hash maps and sets — verified
- [x] 4. Stacks and queues — verified
- [x] 5. Linked lists — verified
- [x] 6. Recursion and backtracking — verified
- [x] 7. Sorting and binary search — verified
- [x] 8. Trees (traversals, BST, balancing, heaps) — verified
- [x] 9. Tries — verified
- [x] 10. Graphs (BFS, DFS, shortest paths, topo sort, union-find) — verified
- [x] 11. Greedy algorithms — verified
- [x] 12. Dynamic programming — verified
- [x] 13. Bit manipulation and spatial structures — verified

## Finish
- [x] Browser test: all 13 topics × 11 steps load with zero console errors; every build, fill-the-gap and
      problem reference solution passes when run through the real in-browser Pyodide worker
- [x] Infinite-loop kill + automatic Python restart tested
- [x] Spaced review flow tested (due badge, review card, saved review mark)

## Round 2: depth + continuous listening
- [x] New reader: reads the whole step line by line, line box + word highlight, pause/resume, Line X of Y, Space / ← → / Esc, double-click to start
- [x] New "Deep dive" step (long-form narrated lesson with embedded animations)
- [x] Audio engine rewritten for cross-browser reliability (Chrome no-onend bug, Safari cancel quirks, iOS tap rule,
      no word-boundary events, no voices). All audio controls tested against simulations of each; Settings has “Test my voice”
- [x] Concept-first order: “Learn the concept” is step 1 and opens with context; analogy moved inside the lesson
- [x] Spaced-out flow: lessons split into parts of ≤ 5 sections, with Watch / Play breaks in between
      (Learn 1 → Watch → Learn 2 → Play → Learn 3 → write it back → …). Set with `breakAfter` on a section.
- [x] Lesson: 1. Big-O (sample, awaiting approval)
- [ ] Lessons for topics 2–13 (same structure: where this fits → what it is → picture it → how it works → why → costs → Python → pitfalls → science → summary)
- [x] README (setup, run, deploy, Supabase, adding topics/courses)

**Status: complete.** 13 topics, 39 problems, 351 reference tests passing.

## Ideas for later
- A second course (e.g. Linear Algebra) using the same engine: see README → Add a course.
- Sound effects for correct / wrong answers (kept off for now to avoid distraction).
- Supabase is untested against a live project from here (no network access to Supabase during the build).

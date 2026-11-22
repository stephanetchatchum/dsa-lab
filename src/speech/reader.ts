/*
  Read-aloud engine. Designed to survive every browser's Web Speech quirks:

  - Chrome:  sometimes never fires `onend` (garbage-collected utterances, long text)
             -> we keep a live reference AND poll `speechSynthesis.speaking`, plus a hard time cap.
  - Safari:  `cancel()` can fire `onend` of the old line; `speak()` right after `cancel()` can be dropped
             -> every callback carries a token and stale ones are ignored; we wait 80 ms after cancel.
  - iOS:     the first `speak()` must happen synchronously inside the tap
             -> if nothing is playing we speak immediately, no timeout.
  - Firefox / Android / online voices: often no word-boundary events
             -> we fall back to a timed word highlight.
  - pause()/resume() are unreliable everywhere
             -> Pause cancels and remembers the line; Resume replays that line.
  - No voices / speech blocked -> after repeated failures we stop and say why, instead of racing ahead.

  Long paragraphs are split into short lines (< 160 chars) so no single utterance is long.
*/

export interface ReaderState {
  playing: boolean;
  idx: number;
  total: number;
  narrating: boolean;
  error: string | null;
}
type Listener = (s: ReaderState) => void;

interface Item {
  el: HTMLElement;
  text: string;
  start: number;
  map: { text: string; nodes: { node: Text; off: number }[] } | null;
}
type Done = 'end' | 'cancel' | 'error';

const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;
export const readerSupported = () => !!synth && typeof SpeechSynthesisUtterance !== 'undefined';

const R = {
  items: [] as Item[],
  idx: 0,
  playing: false,
  narrating: false,
  error: null as string | null,
  rate: 1,
  voice: '',
  skipCode: true,
  /** consecutive failed lines */
  fails: 0,
};
const listeners = new Set<Listener>();
const snapshot = (): ReaderState => ({ playing: R.playing, idx: R.idx, total: R.items.length, narrating: R.narrating, error: R.error });
const emit = () => listeners.forEach((l) => l(snapshot()));

/* ------------------------------------------------------------------ text */

function normMap(el: HTMLElement) {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('.no-tts, button, .saybtn') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let text = '';
  const nodes: { node: Text; off: number }[] = [];
  let n: Node | null;
  while ((n = w.nextNode())) {
    const s = n.nodeValue ?? '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (/\s/.test(ch)) {
        if (!text.length || text[text.length - 1] === ' ') continue;
        text += ' ';
      } else text += ch;
      nodes.push({ node: n as Text, off: i });
    }
  }
  if (text.endsWith(' ')) {
    text = text.slice(0, -1);
    nodes.pop();
  }
  return { text, nodes };
}

/** Split text into short lines at sentence (then comma) boundaries. */
export function chunkText(t: string, max = 160): { s: number; t: string }[] {
  if (t.length <= max) return [{ s: 0, t }];
  const out: { s: number; t: string }[] = [];
  const re = /[^.!?;:,]*[.!?;:,]+\s*|[^.!?;:,]+/g;
  let cur = '';
  let cs = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    if (cur && (cur + m[0]).length > max) {
      out.push({ s: cs, t: cur.trimEnd() });
      cur = m[0];
      cs = m.index;
    } else {
      if (!cur) cs = m.index;
      cur += m[0];
    }
  }
  if (cur) out.push({ s: cs, t: cur.trimEnd() });
  return out.filter((c) => c.t.trim());
}

/** Pronounceable text with the same length (keeps word-highlight offsets aligned). */
const speakable = (t: string) => t.replace(/[_`*]/g, ' ');

function collect() {
  const items: Item[] = [];
  document.querySelectorAll<HTMLElement>('.page [data-tts]').forEach((el) => {
    if (el.closest('.no-tts') || el.offsetParent === null) return;
    if (el.dataset.tts === 'code') {
      if (!R.skipCode && el.dataset.say) chunkText(el.dataset.say).forEach((c) => items.push({ el, text: c.t, start: 0, map: null }));
      return;
    }
    const map = normMap(el);
    if (!map.text) return;
    chunkText(map.text).forEach((c) => items.push({ el, text: c.t, start: c.s, map }));
  });
  R.items = items;
}

/* ------------------------------------------------------------------ highlight */

function clearMarks() {
  document.querySelectorAll('.tts-active').forEach((x) => x.classList.remove('tts-active'));
  try {
    (CSS as any).highlights?.delete('tts-word');
  } catch {
    /* unsupported */
  }
}

function setActive(el: HTMLElement | null) {
  clearMarks();
  if (!el) return;
  el.classList.add('tts-active');
  const r = el.getBoundingClientRect();
  if (r.top < 80 || r.bottom > window.innerHeight - 150) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function highlightWord(it: Item, ci: number) {
  try {
    const H = (window as any).Highlight;
    if (!it.map || !(CSS as any).highlights || !H) return;
    const t = it.map.text;
    const g = Math.min(it.start + Math.max(0, Math.floor(ci)), it.start + it.text.length - 1);
    if (g < 0 || g >= t.length) return;
    let s = g;
    while (s > 0 && t[s - 1] !== ' ') s--;
    let e = g;
    while (e < t.length && t[e] !== ' ') e++;
    const a = it.map.nodes[s];
    const b = it.map.nodes[e - 1];
    if (!a || !b) return;
    const r = new Range();
    r.setStart(a.node, a.off);
    r.setEnd(b.node, b.off + 1);
    (CSS as any).highlights.set('tts-word', new H(r));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ engine */

function pickVoice(): SpeechSynthesisVoice | undefined {
  if (!synth) return undefined;
  const vs = reader.voices();
  return (
    vs.find((v) => v.voiceURI === R.voice) ??
    vs.find((v) => /natural|neural/i.test(v.name)) ??
    vs.find((v) => /google us|samantha|aria|jenny|daniel/i.test(v.name)) ??
    vs.find((v) => v.default) ??
    vs[0]
  );
}

let engineToken = 0;
/** Chrome may garbage-collect an utterance mid-speech and never fire onend: keep a reference. */
let live: SpeechSynthesisUtterance | null = null;
const timers = new Set<number>();
const clearTimers = () => {
  timers.forEach((t) => {
    window.clearTimeout(t);
    window.clearInterval(t);
  });
  timers.clear();
};

/** Speak one line. onDone fires exactly once (unless superseded by a newer speak/stop). */
function engineSpeak(text: string, onWord: ((ci: number) => void) | null, onDone: (d: Done) => void) {
  if (!synth) {
    onDone('error');
    return;
  }
  const my = ++engineToken;
  clearTimers();
  const run = () => {
    if (my !== engineToken) return;
    const u = new SpeechSynthesisUtterance(speakable(text));
    live = u;
    u.lang = 'en-US';
    u.rate = R.rate;
    const v = pickVoice();
    if (v) u.voice = v;

    let ended = false;
    let gotBoundary = false;
    let sawSpeaking = false;
    let t0 = performance.now();
    const finish = (d: Done) => {
      if (ended) return;
      ended = true;
      clearTimers();
      if (my === engineToken) onDone(d);
    };
    u.onstart = () => {
      sawSpeaking = true;
      t0 = performance.now();
    };
    u.onboundary = (e) => {
      if (my !== engineToken || (e.name && e.name !== 'word')) return;
      gotBoundary = true;
      onWord?.(e.charIndex);
    };
    u.onend = () => finish(performance.now() - t0 < 120 && !sawSpeaking ? 'error' : 'end');
    u.onerror = (e) => finish(e.error === 'interrupted' || e.error === 'canceled' ? 'cancel' : 'error');

    // 1) the engine stopped without telling us (Chrome)
    const poll = window.setInterval(() => {
      if (synth.speaking || synth.pending) {
        if (synth.speaking) sawSpeaking = true;
        return;
      }
      const dt = performance.now() - t0;
      if (sawSpeaking && dt > 250) finish('end');
      else if (!sawSpeaking && dt > 2500) finish('error'); // never started: blocked or no voice
    }, 200);
    timers.add(poll);
    // 2) hard cap, in case `speaking` lies
    const words = text.split(/\s+/).length;
    timers.add(window.setTimeout(() => finish('end'), ((words / 1.6) * 1000) / R.rate + 6000));
    // 3) timed word highlight when the browser gives no boundary events
    if (onWord) {
      const cps = 14.5 * R.rate;
      const fake = window.setInterval(() => {
        if (gotBoundary || !sawSpeaking) return;
        onWord(((performance.now() - t0) / 1000) * cps);
      }, 140);
      timers.add(fake);
    }
    synth.speak(u);
    if (synth.paused) synth.resume();
  };
  if (synth.speaking || synth.pending) {
    synth.cancel();
    timers.add(window.setTimeout(run, 80));
  } else run(); // synchronous: keeps the tap "gesture" on iOS
}

function engineStop() {
  engineToken++;
  clearTimers();
  synth?.cancel();
  live = null;
}

/* ------------------------------------------------------------------ continuous reading */

function speakItem(i: number) {
  if (i < 0) i = 0;
  if (i >= R.items.length) {
    reader.stop();
    return;
  }
  R.idx = i;
  R.error = null;
  const it = R.items[i];
  setActive(it.el);
  emit();
  engineSpeak(
    it.text,
    (ci) => highlightWord(it, ci),
    (d) => {
      if (!R.playing) return;
      if (d === 'cancel') return;
      if (d === 'error') {
        R.fails++;
        if (R.fails >= 2) {
          R.playing = false;
          R.error = 'Your browser isn’t producing speech. Check the volume, pick another voice in the list, or try Chrome, Edge or Safari.';
          emit();
          return;
        }
      } else R.fails = 0;
      speakItem(i + 1);
    },
  );
}

export const reader = {
  subscribe(l: Listener) {
    listeners.add(l);
    l(snapshot());
    return () => void listeners.delete(l);
  },
  configure(o: { rate?: number; voice?: string; skipCode?: boolean }) {
    const restart = R.playing && ((o.rate !== undefined && o.rate !== R.rate) || (o.voice !== undefined && o.voice !== R.voice));
    if (o.rate !== undefined) R.rate = o.rate;
    if (o.voice !== undefined) R.voice = o.voice;
    if (o.skipCode !== undefined && o.skipCode !== R.skipCode) {
      R.skipCode = o.skipCode;
      if (!R.playing) R.items = [];
    }
    if (restart) speakItem(R.idx);
  },
  voices(): SpeechSynthesisVoice[] {
    if (!synth) return [];
    const all = synth.getVoices();
    const en = all.filter((v) => /^en/i.test(v.lang));
    return en.length ? en : all;
  },
  get playing() {
    return R.playing;
  },
  play(from?: number) {
    if (!readerSupported()) {
      R.error = 'This browser has no read-aloud support. Try Chrome, Edge or Safari.';
      emit();
      return;
    }
    const keepEl = R.items[R.idx]?.el;
    collect();
    if (!R.items.length) return;
    let i = from ?? Math.max(0, keepEl ? R.items.findIndex((x) => x.el === keepEl) : R.idx);
    if (i < 0 || i >= R.items.length) i = 0;
    R.playing = true;
    R.narrating = false;
    R.fails = 0;
    speakItem(i);
  },
  pause() {
    R.playing = false;
    engineStop();
    emit();
  },
  stop() {
    R.playing = false;
    R.narrating = false;
    engineStop();
    R.idx = 0;
    setActive(null);
    emit();
  },
  toggle() {
    if (R.playing) reader.pause();
    else reader.play();
  },
  /** previous / next paragraph */
  jump(d: 1 | -1) {
    if (!R.items.length) collect();
    if (!R.items.length) return;
    const cur = R.items[Math.min(R.idx, R.items.length - 1)].el;
    let i = Math.min(R.idx, R.items.length - 1);
    if (d > 0) {
      while (i < R.items.length - 1 && R.items[i].el === cur) i++;
    } else {
      while (i > 0 && R.items[i].el === cur) i--;
      const t = R.items[i].el;
      while (i > 0 && R.items[i - 1].el === t) i--;
    }
    if (R.playing) speakItem(i);
    else {
      R.idx = i;
      setActive(R.items[i].el);
      emit();
    }
  },
  /** start continuous reading from an element */
  fromElement(el: HTMLElement) {
    if (!readerSupported()) return reader.play();
    collect();
    const i = R.items.findIndex((it) => it.el === el || it.el.contains(el) || el.contains(it.el));
    if (i >= 0) {
      R.playing = true;
      R.narrating = false;
      R.fails = 0;
      speakItem(i);
    }
  },
  /** speak one caption (animation narration); resolves when done. Never blocks the animation for long. */
  narrate(el: HTMLElement | null, text: string): Promise<boolean> {
    if (!readerSupported() || !text.trim()) return Promise.resolve(true);
    if (R.playing) R.playing = false;
    R.narrating = true;
    emit();
    const map = el ? normMap(el) : null;
    const it: Item | null = el && map ? { el, text: map.text, start: 0, map } : null;
    if (el) setActive(el);
    return new Promise((resolve) => {
      engineSpeak(
        text,
        it ? (ci) => highlightWord(it, ci) : null,
        (d) => {
          R.narrating = false;
          if (el) setActive(null);
          emit();
          resolve(d === 'end');
        },
      );
    });
  },
  cancelNarration() {
    if (R.narrating) {
      R.narrating = false;
      engineStop();
      setActive(null);
      emit();
    }
  },
  /** page change */
  reset() {
    reader.stop();
    R.items = [];
    R.error = null;
    emit();
  },
  /** a quick test sentence (Settings) */
  test(): Promise<boolean> {
    return new Promise((resolve) => engineSpeak('Hello! This is how I will read your lessons.', null, (d) => resolve(d === 'end')));
  },
};

if (synth) {
  // voices arrive asynchronously in Chrome and Firefox
  synth.addEventListener?.('voiceschanged', () => emit());
  synth.getVoices();
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => synth?.cancel());
  window.addEventListener('hashchange', () => reader.reset());
  document.addEventListener('visibilitychange', () => {
    // some mobile browsers kill speech in background tabs: pause cleanly instead of desyncing
    if (document.hidden && R.playing) reader.pause();
  });
  document.addEventListener('dblclick', (e) => {
    const el = (e.target as HTMLElement)?.closest?.('[data-tts]') as HTMLElement | null;
    if (!el || el.closest('.no-tts') || !el.closest('.page')) return;
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      /* ignore */
    }
    reader.fromElement(el);
  });
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    const tag = (t?.tagName || '').toLowerCase();
    // never steal keys while typing
    if (['input', 'select', 'textarea'].includes(tag) || t?.isContentEditable || t?.closest?.('.cm-editor')) return;
    // Space on a focused button/link should press that button, not toggle reading
    if (e.code === 'Space' && ['button', 'a'].includes(tag)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      reader.toggle();
    } else if (e.key === 'ArrowRight') reader.jump(1);
    else if (e.key === 'ArrowLeft') reader.jump(-1);
    else if (e.key === 'Escape') reader.stop();
  });
}

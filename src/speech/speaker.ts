/* Thin wrapper around the Web Speech API with word-boundary tracking. */

export interface SpeechState {
  speaking: boolean;
  chunkId: string | null;
  charIndex: number;
}
type Listener = (s: SpeechState) => void;

const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

let state: SpeechState = { speaking: false, chunkId: null, charIndex: -1 };
const listeners = new Set<Listener>();
let opts = { rate: 1, voice: '' };
let token = 0;

function emit(patch: Partial<SpeechState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export const speaker = {
  supported: !!synth,
  get state() {
    return state;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  configure(o: Partial<typeof opts>) {
    opts = { ...opts, ...o };
  },
  voices(): SpeechSynthesisVoice[] {
    if (!synth) return [];
    return synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  },
  /** Speak one chunk. Resolves when finished OR cancelled (returns false if cancelled). */
  speak(text: string, chunkId: string | null = null): Promise<boolean> {
    if (!synth || !text.trim()) return Promise.resolve(true);
    synth.cancel();
    const my = ++token;
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(clean(text));
      u.rate = opts.rate;
      const v = synth.getVoices().find((x) => x.voiceURI === opts.voice) ?? pickDefault();
      if (v) u.voice = v;
      u.onstart = () => my === token && emit({ speaking: true, chunkId, charIndex: 0 });
      u.onboundary = (e) => {
        if (my === token && e.name !== 'sentence') emit({ charIndex: e.charIndex });
      };
      const done = (ok: boolean) => {
        if (my === token) emit({ speaking: false, chunkId: null, charIndex: -1 });
        resolve(ok && my === token);
      };
      u.onend = () => done(true);
      u.onerror = () => done(false);
      synth.speak(u);
      // Chrome sometimes starts paused
      if (synth.paused) synth.resume();
    });
  },
  cancel() {
    token++;
    synth?.cancel();
    emit({ speaking: false, chunkId: null, charIndex: -1 });
  },
};

/** Make code-ish text pronounceable. Length is preserved so boundary indexes still line up. */
function clean(t: string) {
  return t.replace(/_/g, ' ').replace(/[`*]/g, ' ');
}

function pickDefault(): SpeechSynthesisVoice | undefined {
  const vs = speaker.voices();
  return (
    vs.find((v) => /natural|neural|google us|samantha|aria|jenny/i.test(v.name)) ??
    vs.find((v) => v.default) ??
    vs[0]
  );
}

// voices load async in Chrome
if (synth) synth.onvoiceschanged = () => emit({});

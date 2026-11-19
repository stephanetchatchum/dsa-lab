import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../state/settings';
import { speaker } from './speaker';
import { useSpeech } from './Say';

/** Bottom read-aloud bar: reads every [data-say] chunk on the current step, in order. */
export function ReaderBar() {
  const st = useSettings();
  const s = useSpeech();
  const [reading, setReading] = useState(false);
  const idx = useRef(0);
  const run = useRef(0);
  const [, force] = useState(0);

  useEffect(() => {
    speaker.configure({ rate: st.rate, voice: st.voice });
  }, [st.rate, st.voice]);

  // stop reading when the page/step changes
  useEffect(() => {
    const stop = () => {
      run.current++;
      setReading(false);
      idx.current = 0;
    };
    window.addEventListener('hashchange', stop);
    return () => window.removeEventListener('hashchange', stop);
  }, []);

  const chunks = () =>
    Array.from(document.querySelectorAll<HTMLElement>('.page [data-say]')).filter(
      (el) => !(st.skipCode && el.dataset.code) && el.offsetParent !== null,
    );

  async function readFrom(i: number) {
    const my = ++run.current;
    setReading(true);
    const list = chunks();
    for (let k = Math.max(0, i); k < list.length; k++) {
      if (my !== run.current) return;
      idx.current = k;
      const el = list[k];
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const ok = await speaker.speak(el.dataset.say || '', el.dataset.sayId || null);
      if (!ok || my !== run.current) return;
    }
    setReading(false);
    idx.current = 0;
  }

  function stop() {
    run.current++;
    speaker.cancel();
    setReading(false);
  }

  if (!speaker.supported) {
    return <div className="reader dim">Read-aloud needs a browser with speech support (Chrome, Edge or Safari).</div>;
  }
  const voices = speaker.voices();
  return (
    <div className="reader" role="toolbar" aria-label="Read aloud">
      {reading || s.speaking ? (
        <button className="btn sm on" onClick={stop}>
          ❚❚ Stop
        </button>
      ) : (
        <button className="btn sm" onClick={() => readFrom(idx.current)}>
          ▶ Listen
        </button>
      )}
      <button className="btn sm opt-desktop" aria-label="Previous chunk" onClick={() => readFrom(idx.current - 1)}>
        ⏮
      </button>
      <button className="btn sm opt-desktop" aria-label="Next chunk" onClick={() => readFrom(idx.current + 1)}>
        ⏭
      </button>
      {(reading || s.speaking) && (
        <span className="wave" aria-hidden>
          <i /> <i /> <i /> <i />
        </span>
      )}
      <select className="opt-desktop" aria-label="Reading speed" value={st.rate} onChange={(e) => st.set({ rate: Number(e.target.value) })}>
        {[0.8, 0.9, 1, 1.15, 1.3, 1.5].map((r) => (
          <option key={r} value={r}>
            {r}× voice
          </option>
        ))}
      </select>
      <select
        className="opt-desktop"
        aria-label="Voice"
        value={st.voice}
        onFocus={() => force((n) => n + 1)}
        onChange={(e) => st.set({ voice: e.target.value })}
      >
        <option value="">Auto voice</option>
        {voices.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name}
          </option>
        ))}
      </select>
      <button className={`btn sm opt-desktop ${st.skipCode ? 'on' : ''}`} onClick={() => st.set({ skipCode: !st.skipCode })}>
        Skip code
      </button>
      <button className={`btn sm ${st.narrate ? 'on' : ''}`} onClick={() => st.set({ narrate: !st.narrate })} title="Speak each animation step">
        🔊 Narrate
      </button>
      <button className="btn sm opt-desktop" aria-label="Smaller text" onClick={() => st.set({ scale: Math.max(0.85, +(st.scale - 0.05).toFixed(2)) })}>
        A−
      </button>
      <button className="btn sm opt-desktop" aria-label="Bigger text" onClick={() => st.set({ scale: Math.min(1.4, +(st.scale + 0.05).toFixed(2)) })}>
        A+
      </button>
    </div>
  );
}

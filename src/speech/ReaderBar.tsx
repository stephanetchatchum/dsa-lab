import { useEffect, useState } from 'react';
import { useSettings } from '../state/settings';
import { reader, readerSupported } from './reader';
import { useReader } from './Say';

/** Bottom read-aloud bar: reads the whole step, line by line. */
export function ReaderBar() {
  const st = useSettings();
  const s = useReader();
  const [, force] = useState(0);

  useEffect(() => {
    reader.configure({ rate: st.rate, voice: st.voice, skipCode: st.skipCode });
  }, [st.rate, st.voice, st.skipCode]);

  if (!readerSupported()) {
    return <div className="reader dim">Read-aloud needs Chrome, Edge or Safari.</div>;
  }
  const voices = reader.voices();
  const label = s.playing ? '❚❚ Pause' : s.idx > 0 ? '▶ Resume' : '▶ Listen';
  return (
    <div className="reader" role="toolbar" aria-label="Read aloud">
      <button className={`btn sm ${s.playing ? 'on' : ''}`} onClick={() => reader.toggle()} title="Play / pause (Space)">
        {label}
      </button>
      <button className="btn sm opt-desktop" aria-label="Previous line" title="Previous line (←)" onClick={() => reader.jump(-1)}>
        ⏮
      </button>
      <button className="btn sm opt-desktop" aria-label="Next line" title="Next line (→)" onClick={() => reader.jump(1)}>
        ⏭
      </button>
      <button className="btn sm opt-desktop" aria-label="Stop" title="Stop (Esc)" onClick={() => reader.stop()}>
        ⏹
      </button>
      {(s.playing || s.narrating) && (
        <span className="wave" aria-hidden>
          <i /> <i /> <i /> <i />
        </span>
      )}
      <span className={`rstatus ${s.error ? 'rerr' : 'opt-desktop'}`} role="status">
        {s.error ? s.error : s.total && (s.playing || s.idx > 0) ? `Line ${s.idx + 1} of ${s.total}` : 'Ready'}
      </span>
      <select className="opt-desktop" aria-label="Reading speed" value={st.rate} onChange={(e) => st.set({ rate: Number(e.target.value) })}>
        {[0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75].map((r) => (
          <option key={r} value={r}>
            {r}×
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
      <button className={`btn sm opt-desktop ${st.skipCode ? 'on' : ''}`} onClick={() => st.set({ skipCode: !st.skipCode })} title="Skip code blocks while listening">
        Skip code
      </button>
      <button className={`btn sm ${st.narrate ? 'on' : ''}`} onClick={() => st.set({ narrate: !st.narrate })} title="Speak each animation step">
        🔊 Narrate
      </button>
      <button className="btn sm opt-desktop" aria-label="Smaller text" onClick={() => st.set({ scale: Math.max(0.85, +(st.scale - 0.05).toFixed(2)) })}>
        A−
      </button>
      <button className="btn sm opt-desktop" aria-label="Bigger text" onClick={() => st.set({ scale: Math.min(1.5, +(st.scale + 0.05).toFixed(2)) })}>
        A+
      </button>
    </div>
  );
}

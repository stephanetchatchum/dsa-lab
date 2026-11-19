import { useEffect, useId, useMemo, useState, type ElementType } from 'react';
import { speaker, type SpeechState } from './speaker';

export function useSpeech(): SpeechState {
  const [s, setS] = useState(speaker.state);
  useEffect(() => {
    const off = speaker.subscribe(setS);
    return () => {
      off();
    };
  }, []);
  return s;
}

/**
 * A readable text chunk. Every chunk:
 *  - is collected by the bottom "Listen" bar (data-say),
 *  - highlights the word being spoken,
 *  - can be read on its own with the small speaker button.
 */
export function Say({
  text,
  as: Tag = 'p',
  className = '',
  btn = true,
  code = false,
  id: fixedId,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  btn?: boolean;
  /** contains code: skipped when "Skip code" is on */
  code?: boolean;
  id?: string;
}) {
  const auto = useId();
  const id = fixedId ?? auto;
  const s = useSpeech();
  const active = s.chunkId === id;
  const words = useMemo(() => {
    const out: { w: string; start: number }[] = [];
    const re = /\S+\s*/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) out.push({ w: m[0], start: m.index });
    return out;
  }, [text]);
  let cur = -1;
  if (active) for (let i = 0; i < words.length; i++) if (words[i].start <= s.charIndex) cur = i;
  return (
    <Tag className={`say ${active ? 'speaking' : ''} ${className}`} data-say={text} data-say-id={id} data-code={code || undefined}>
      {words.map((w, i) => (
        <span key={i} className={`w ${i === cur ? 'on' : ''}`}>
          {w.w}
        </span>
      ))}
      {btn && speaker.supported && (
        <button className="saybtn" aria-label="Read this aloud" onClick={() => speaker.speak(text, id)}>
          🔈
        </button>
      )}
    </Tag>
  );
}

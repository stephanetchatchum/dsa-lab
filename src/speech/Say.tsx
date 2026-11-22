import { useEffect, useRef, useState, type ElementType } from 'react';
import { reader, readerSupported, type ReaderState } from './reader';
import { md } from './md';

export function useReader(): ReaderState {
  const [s, setS] = useState<ReaderState>({ playing: false, idx: 0, total: 0, narrating: false, error: null });
  useEffect(() => reader.subscribe(setS), []);
  return s;
}

/**
 * A readable text chunk. The bottom Listen bar reads every [data-tts] element in order,
 * boxing the current one and highlighting the current word.
 * The small speaker button starts continuous reading from here.
 * Supports **bold** and `code` inline.
 */
export function Say({
  text,
  as: Tag = 'p',
  className = '',
  btn = true,
  code = false,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  btn?: boolean;
  /** contains code: skipped when "Skip code" is on */
  code?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  return (
    <Tag ref={ref} className={`say ${className}`} data-tts={code ? 'code' : ''} data-say={code ? text : undefined}>
      {md(text)}
      {btn && readerSupported() && (
        <button className="saybtn no-tts" aria-label="Read aloud from here" onClick={() => ref.current && reader.fromElement(ref.current)} />
      )}
    </Tag>
  );
}

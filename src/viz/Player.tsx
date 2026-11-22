import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fitBox } from './bounds';
import type { Cost, Frame } from '../types';
import { useSettings } from '../state/settings';
import { reader } from '../speech/reader';
import { Stage } from './Stage';
import { CodeView, CostMeter, Vars } from './CodeView';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Plays a list of frames with Play / Step / Back / Speed.
 * When narration is on, each frame is spoken and auto-play waits for the voice.
 */
export function Player({
  frames,
  code,
  costs,
  autoPlay = false,
  side,
  onEnd,
  compact = false,
}: {
  frames: Frame[];
  code?: string;
  costs?: Cost[];
  autoPlay?: boolean;
  side?: ReactNode;
  onEnd?: () => void;
  compact?: boolean;
}) {
  const st = useSettings();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const capRef = useRef<HTMLDivElement>(null);
  const f = frames[Math.min(i, frames.length - 1)];
  const box = useMemo(() => fitBox(frames.map((x) => x.scene)), [frames]);
  const prev = i > 0 ? frames[i - 1] : undefined;
  const run = useRef(0);
  const endedRef = useRef(false);
  const touched = useRef(false);

  // new frames => restart
  useEffect(() => {
    setI(0);
    endedRef.current = false;
    setPlaying(autoPlay);
  }, [frames, autoPlay]);

  // narrate + auto-advance
  useEffect(() => {
    const my = ++run.current;
    const tween = 650 / st.speed;
    (async () => {
      const speech = st.narrate && f && (playing || touched.current) ? reader.narrate(capRef.current, f.caption ?? f.say) : Promise.resolve(true);
      if (!playing) return;
      await Promise.all([speech, sleep(tween + 700 / st.speed)]);
      if (my !== run.current) return;
      if (i < frames.length - 1) setI(i + 1);
      else {
        setPlaying(false);
        if (!endedRef.current) {
          endedRef.current = true;
          onEnd?.();
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, playing, frames]);

  // stop voice on unmount
  useEffect(() => () => reader.cancelNarration(), []);

  if (!f) return null;
  const go = (n: number) => {
    touched.current = true;
    setPlaying(false);
    setI(Math.max(0, Math.min(frames.length - 1, n)));
  };

  const stage = (
    <div>
      <Stage scene={f.scene} ms={650 / st.speed} label={f.say} box={box} />
      <div className="caption" ref={capRef} data-tts="">
        {f.caption ?? f.say}
      </div>
      <div className="controls">
        <button className="btn" aria-label="Restart" onClick={() => go(0)}>⏮</button>
        <button className="btn" aria-label="Step back" onClick={() => go(i - 1)} disabled={i === 0}>◀</button>
        {playing ? (
          <button className="btn primary" aria-label="Pause" onClick={() => setPlaying(false)}>❚❚</button>
        ) : (
          <button
            className="btn primary"
            aria-label="Play"
            onClick={() => {
              touched.current = true;
              if (i >= frames.length - 1) setI(0);
              setPlaying(true);
            }}
          >
            ▶
          </button>
        )}
        <button className="btn" aria-label="Step forward" onClick={() => go(i + 1)} disabled={i >= frames.length - 1}>▶|</button>
        <div
          className="scrub"
          role="slider"
          aria-valuemin={1}
          aria-valuemax={frames.length}
          aria-valuenow={i + 1}
          aria-label="Animation position"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            go(Math.round(((e.clientX - r.left) / r.width) * (frames.length - 1)));
          }}
        >
          <div style={{ width: `${frames.length > 1 ? (i / (frames.length - 1)) * 100 : 100}%` }} />
        </div>
        <span className="count">
          {i + 1} / {frames.length}
        </span>
        <button
          className="btn sm"
          aria-label="Animation speed"
          onClick={() => st.set({ speed: st.speed >= 2 ? 0.5 : st.speed === 0.5 ? 1 : st.speed === 1 ? 1.5 : 2 })}
        >
          {st.speed}× speed
        </button>
      </div>
    </div>
  );

  if (compact || (!code && !costs && !side && !f.vars)) return stage;
  return (
    <div className="twocol">
      {stage}
      <div className="side">
        {code && (
          <div>
            <div className="panel-title">The code</div>
            <CodeView code={code} line={f.line} />
          </div>
        )}
        {f.vars && <Vars vars={f.vars} prev={prev?.vars} />}
        {(f.cost || costs) && <CostMeter costs={f.cost ? [f.cost] : costs!} />}
        {side}
      </div>
    </div>
  );
}

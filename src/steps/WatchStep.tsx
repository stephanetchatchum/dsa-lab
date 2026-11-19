import { useMemo, useState } from 'react';
import { Player } from '../viz/Player';
import type { StepProps } from './common';

export function WatchStep({ topic }: StepProps) {
  const clips = topic.watch!;
  const [ci, setCi] = useState(0);
  const clip = clips[ci];
  const frames = useMemo(() => clip.frames(), [clip]);
  return (
    <div>
      {clips.length > 1 && (
        <div className="cliptabs" role="tablist">
          {clips.map((c, i) => (
            <button key={c.id} role="tab" aria-selected={i === ci} className={`btn sm ${i === ci ? 'on' : ''}`} onClick={() => setCi(i)}>
              {i + 1}. {c.title}
            </button>
          ))}
        </div>
      )}
      <Player key={clip.id} frames={frames} code={clip.code} costs={clip.costs ?? topic.costs} />
    </div>
  );
}

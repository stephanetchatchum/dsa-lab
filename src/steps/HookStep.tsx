import { useMemo } from 'react';
import { Player } from '../viz/Player';
import { Lines, type StepProps } from './common';

export function HookStep({ topic }: StepProps) {
  const h = topic.hook!;
  const frames = useMemo(() => h.frames(), [h]);
  return (
    <div className="twocol">
      <Player frames={frames} autoPlay compact />
      <div className="side">
        <div className="panel-title">Think of it like this</div>
        <Lines lines={h.lines} lead />
      </div>
    </div>
  );
}

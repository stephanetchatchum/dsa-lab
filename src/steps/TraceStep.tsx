import { useMemo } from 'react';
import { Player } from '../viz/Player';
import { Say } from '../speech/Say';
import type { StepProps } from './common';

export function TraceStep({ topic }: StepProps) {
  const t = topic.trace!;
  const frames = useMemo(() => t.frames(), [t]);
  return (
    <div className="col gap-lg">
      <Say text={`${t.title}. Step through and watch the highlighted line and the variables change together.`} className="lead" />
      <Player frames={frames} code={t.code} />
    </div>
  );
}

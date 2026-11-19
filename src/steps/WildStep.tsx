import { Say } from '../speech/Say';
import type { StepProps } from './common';

export function WildStep({ topic }: StepProps) {
  return (
    <div className="col gap-lg">
      <Say text="Where this shows up in real software." className="lead" />
      <div className="wild">
        {topic.wild!.map((w) => (
          <div key={w.title} className="panel col">
            <span className="ic" aria-hidden>
              {w.icon}
            </span>
            <div className="panel-title" style={{ marginBottom: 0 }}>
              {w.title}
            </div>
            <Say text={w.text} />
          </div>
        ))}
      </div>
    </div>
  );
}

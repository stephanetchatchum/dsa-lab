import { useMemo, useState } from 'react';
import { Player } from '../viz/Player';
import { Stage } from '../viz/Stage';
import { Say } from '../speech/Say';
import { Choice, type StepProps } from './common';

export function PredictStep({ topic }: StepProps) {
  const qs = topic.predict!;
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = qs[qi];
  const frames = useMemo(() => (picked !== null ? q.frames() : []), [q, picked]);

  return (
    <div className="col gap-lg">
      <div className="row">
        <span className="count">
          Prediction {qi + 1} of {qs.length}
        </span>
        <span className="spacer" />
        <span className="dim">Right so far: {score}</span>
      </div>
      <div className="twocol">
        {picked === null ? <Stage scene={q.scene} /> : <Player key={q.id} frames={frames} autoPlay compact />}
        <div className="side">
          <Say text={q.question} className="lead" />
          <Choice
            options={q.options}
            answer={q.answer}
            picked={picked}
            onPick={(i) => {
              setPicked(i);
              if (i === q.answer) setScore((s) => s + 1);
            }}
          />
          {picked !== null && (
            <>
              <div className={`feedback ${picked === q.answer ? 'ok' : 'no'}`}>
                <Say text={(picked === q.answer ? 'Yes! ' : 'Not quite. ') + q.why} />
              </div>
              {qi < qs.length - 1 && (
                <button
                  className="btn primary"
                  onClick={() => {
                    setQi(qi + 1);
                    setPicked(null);
                  }}
                >
                  Next prediction
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

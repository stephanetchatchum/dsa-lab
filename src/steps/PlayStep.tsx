import { useState } from 'react';
import type { Cost, Frame } from '../types';
import { Player } from '../viz/Player';
import { Stage } from '../viz/Stage';
import { CostMeter } from '../viz/CodeView';
import { Say } from '../speech/Say';
import type { StepProps } from './common';

export function PlayStep({ topic }: StepProps) {
  const pg = topic.play!;
  const [state, setState] = useState(() => pg.init());
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [cost, setCost] = useState<Cost | null>(null);
  const [args, setArgs] = useState<Record<string, Record<string, string | number>>>(() =>
    Object.fromEntries(pg.ops.map((o) => [o.id, Object.fromEntries((o.args ?? []).map((a) => [a.name, a.default]))])),
  );

  function run(opId: string) {
    const op = pg.ops.find((o) => o.id === opId)!;
    const a = { ...args[opId] };
    for (const d of op.args ?? []) if (d.kind === 'int') a[d.name] = Number(a[d.name]) || 0;
    const r = op.run(state, a);
    setState(r.state);
    setFrames(r.frames.length ? r.frames : [{ scene: pg.view(r.state), say: 'Done.' }]);
    setCost(r.cost ?? null);
  }

  const panel = (
    <div className="col">
      <div className="panel-title">Your controls</div>
      {pg.ops.map((op) => (
        <div key={op.id} className="row">
          {(op.args ?? []).map((a) => (
            <input
              key={a.name}
              type={a.kind === 'int' ? 'number' : 'text'}
              aria-label={a.name}
              placeholder={a.name}
              style={{ width: a.kind === 'int' ? '5.5em' : '8em' }}
              value={args[op.id][a.name]}
              onChange={(e) => setArgs((o) => ({ ...o, [op.id]: { ...o[op.id], [a.name]: e.target.value } }))}
              onKeyDown={(e) => e.key === 'Enter' && run(op.id)}
            />
          ))}
          <button className="btn" onClick={() => run(op.id)}>
            {op.label}
          </button>
        </div>
      ))}
      <button
        className="btn ghost"
        onClick={() => {
          setState(pg.init());
          setFrames(null);
          setCost(null);
        }}
      >
        ↺ Reset
      </button>
      {cost && <CostMeter costs={[cost]} title="That operation cost" />}
    </div>
  );

  return (
    <div className="col gap-lg">
      <Say text={pg.intro} className="lead" />
      {frames ? (
        <Player frames={frames} autoPlay side={panel} />
      ) : (
        <div className="twocol">
          <Stage scene={pg.view(state)} />
          <div className="side">{panel}</div>
        </div>
      )}
    </div>
  );
}

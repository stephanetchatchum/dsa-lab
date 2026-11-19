import { useEffect, useState } from 'react';
import { ensureTopic, useProgress } from '../state/progress';
import { useSettings } from '../state/settings';
import { Say } from '../speech/Say';
import type { StepProps } from './common';

/** Pure helper: which key-idea groups appear in the text. */
export function coveredGroups(text: string, groups: string[][]) {
  const t = text.toLowerCase();
  return groups.map((g) => g.some((k) => t.includes(k.toLowerCase())));
}

export function RecallStep({ topic, pkey, setCanNext }: StepProps) {
  const r = topic.recall!;
  const { topic: tp, update } = useProgress();
  const { requireWriting } = useSettings();
  const saved = tp(pkey).recall ?? '';
  const [text, setText] = useState(saved);
  const [shown, setShown] = useState(!!saved);
  const enough = text.trim().length >= 15;

  useEffect(() => setCanNext(!requireWriting || shown), [shown, requireWriting, setCanNext]);

  const cov = coveredGroups(text, r.keywords);
  return (
    <div className="twocol">
      <div className="col gap-lg">
        <Say text="The picture is hidden on purpose. Pulling it from memory is what makes it stick." className="dim" />
        <Say text={r.prompt} className="lead" />
        <textarea
          className="lined"
          aria-label="Your explanation"
          placeholder="Write it in your own words…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row">
          <button
            className="btn primary"
            disabled={!enough}
            onClick={() => {
              setShown(true);
              update((d) => void (ensureTopic(d, pkey).recall = text));
            }}
          >
            Compare with mine
          </button>
          {!enough && <span className="dim">Write at least a sentence first.</span>}
        </div>
      </div>
      <div className="side">
        {shown ? (
          <>
            <div className="panel-title">One way to say it</div>
            <Say text={r.model} className="model" />
            <div className="panel-title" style={{ marginTop: '.6rem' }}>Key ideas you mentioned</div>
            <div className="kw-list">
              {r.keywords.map((g, i) => (
                <span key={i} className={`chip ${cov[i] ? 'r-done' : ''}`}>
                  {cov[i] ? '✓' : '○'} {g[0]}
                </span>
              ))}
            </div>
            <Say
              className="dim"
              text={
                cov.every(Boolean)
                  ? 'You hit every key idea. Nice recall.'
                  : 'Missed ideas are normal. Read the model once, then move on.'
              }
            />
          </>
        ) : (
          <div className="dim hand" style={{ fontSize: '1.6rem' }}>
            Your answer first. Then you'll see one way to say it.
          </div>
        )}
      </div>
    </div>
  );
}

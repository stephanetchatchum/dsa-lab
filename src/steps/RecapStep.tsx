import { useEffect, useState } from 'react';
import { ensureTopic, useProgress } from '../state/progress';
import { useSettings } from '../state/settings';
import { Say } from '../speech/Say';
import { CostMeter } from '../viz/CodeView';
import { Choice, type StepProps } from './common';

export function RecapStep({ topic, pkey, setCanNext }: StepProps) {
  const { topic: tp, update } = useProgress();
  const { requireWriting } = useSettings();
  const [text, setText] = useState(tp(pkey).explain ?? '');
  const [saved, setSaved] = useState(!!tp(pkey).explain);
  const quiz = topic.quiz ?? [];
  const [picked, setPicked] = useState<(number | null)[]>(quiz.map(() => null));
  const answered = picked.every((p) => p !== null);
  const score = picked.filter((p, i) => p === quiz[i].answer).length;

  useEffect(() => setCanNext(!requireWriting || (saved && answered)), [saved, answered, requireWriting, setCanNext]);

  return (
    <div className="twocol">
      <div className="col gap-lg">
        <Say text="Explain it in your own words, like you're teaching a friend. This gets saved, and your review days will ask you to rewrite it from memory." className="lead" />
        <textarea className="lined" aria-label="Explain it in your own words" value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} placeholder="What is it, when do you use it, what does it cost?" />
        <div className="row">
          <button
            className="btn primary"
            disabled={text.trim().length < 20}
            onClick={() => {
              update((d) => void (ensureTopic(d, pkey).explain = text));
              setSaved(true);
            }}
          >
            {saved ? 'Saved ✓' : 'Save my explanation'}
          </button>
        </div>
        {topic.costs && <CostMeter costs={topic.costs} title="Cheat sheet" />}
      </div>
      <div className="side">
        <div className="panel-title">Quick quiz</div>
        {quiz.map((q, qi) => (
          <div key={qi} className="col">
            <Say text={`${qi + 1}. ${q.q}`} />
            <Choice
              options={q.options}
              answer={q.answer}
              picked={picked[qi]}
              onPick={(i) => {
                const next = picked.map((v, k) => (k === qi ? i : v));
                setPicked(next);
                if (next.every((v) => v !== null)) {
                  const s = next.filter((v, k) => v === quiz[k].answer).length;
                  update((d) => void (ensureTopic(d, pkey).quizScore = s));
                }
              }}
            />
            {picked[qi] !== null && <Say className="dim" text={q.why} />}
          </div>
        ))}
        {answered && <Say className="lead" text={`You got ${score} of ${quiz.length}. ${score === quiz.length ? 'Solid.' : 'Worth one more look at the Watch step later.'}`} />}
      </div>
    </div>
  );
}

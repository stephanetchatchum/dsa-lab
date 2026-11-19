import { useCallback, useEffect, useState, type ComponentType } from 'react';
import type { StepKind } from '../types';
import { getCourse, getTopic, STEP_LABEL, stepsFor, topicKey } from '../content/registry';
import { ensureTopic, useProgress } from '../state/progress';
import { useSettings } from '../state/settings';
import { go, href } from '../router';
import { speaker } from '../speech/speaker';
import { ReaderBar } from '../speech/ReaderBar';
import type { StepProps } from '../steps/common';
import { HookStep } from '../steps/HookStep';
import { WatchStep } from '../steps/WatchStep';
import { RecallStep } from '../steps/RecallStep';
import { PlayStep } from '../steps/PlayStep';
import { PredictStep } from '../steps/PredictStep';
import { TraceStep } from '../steps/TraceStep';
import { BuildStep } from '../steps/BuildStep';
import { FillStep } from '../steps/FillStep';
import { WildStep } from '../steps/WildStep';
import { ProblemsStep } from '../steps/ProblemsStep';
import { RecapStep } from '../steps/RecapStep';

/** Step kind -> component. A new step kind = one entry here + one component. */
const STEP_VIEW: Record<StepKind, ComponentType<StepProps>> = {
  hook: HookStep,
  watch: WatchStep,
  recall: RecallStep,
  play: PlayStep,
  predict: PredictStep,
  trace: TraceStep,
  build: BuildStep,
  fill: FillStep,
  wild: WildStep,
  problems: ProblemsStep,
  recap: RecapStep,
};

export function TopicPage({ cid, tid, stepParam }: { cid: string; tid: string; stepParam?: string }) {
  const lc = getCourse(cid);
  const topic = getTopic(cid, tid);
  const { topic: tp, update } = useProgress();
  const st = useSettings();
  const [canNext, setCanNextRaw] = useState(true);
  const setCanNext = useCallback((b: boolean) => setCanNextRaw(b), []);

  const pkey = topicKey(cid, tid);
  const steps = lc && topic ? stepsFor(lc.course, topic) : [];
  const saved = tp(pkey);
  const idx = Math.max(0, Math.min(steps.length - 1, stepParam !== undefined ? Number(stepParam) - 1 : saved.step));

  // remember where you are
  useEffect(() => {
    if (!topic) return;
    if (saved.step !== idx) update((d) => void (ensureTopic(d, pkey).step = idx));
    setCanNextRaw(true);
    speaker.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, pkey]);

  if (!lc || !topic) {
    return (
      <div className="page">
        <h1 className="title">Topic not found</h1>
        <a href={href('')}>Back home</a>
      </div>
    );
  }
  const kind = steps[idx];
  const View = STEP_VIEW[kind];
  const last = idx === steps.length - 1;
  const ti = lc.topics.findIndex((t) => t.id === tid);
  const nextTopic = lc.topics[ti + 1];

  function next() {
    update((d) => {
      const t = ensureTopic(d, pkey);
      if (!t.done.includes(kind)) t.done.push(kind);
      if (last && !t.completedAt) t.completedAt = Date.now();
    });
    if (last) go(nextTopic ? `learn/${cid}/${nextTopic.id}/1` : '');
    else go(`learn/${cid}/${tid}/${idx + 2}`);
  }

  return (
    <>
      <div className="page">
        <header className="thead">
          <div>
            <div className="crumb hide-in-focus">
              <a href={href('')}>{lc.course.title}</a> · Topic {ti + 1} of {lc.topics.length}
            </div>
            <h1>{topic.title}</h1>
          </div>
          <div className="sp" />
          <nav className="prog" aria-label="Steps">
            {steps.map((k, i) => (
              <button
                key={k}
                title={`${i + 1}. ${STEP_LABEL[k]}`}
                aria-label={`Step ${i + 1}: ${STEP_LABEL[k]}`}
                aria-current={i === idx ? 'step' : undefined}
                onClick={() => go(`learn/${cid}/${tid}/${i + 1}`)}
              >
                <span
                  className={`${st.theme === 'blocks' ? 'brick' : 'tally'} ${i === idx ? 'now' : saved.done.includes(k) ? 'done' : ''}`}
                />
              </button>
            ))}
          </nav>
          <div className="steplabel">
            step <b>{idx + 1}</b> of {steps.length} — {STEP_LABEL[kind]}
          </div>
          <button className={`btn sm ${st.focus ? 'on' : ''}`} onClick={() => st.set({ focus: !st.focus })} title="Hide everything except this step">
            ◎ Focus
          </button>
        </header>
        <section className="step" key={`${pkey}/${idx}`}>
          <View course={lc.course} topic={topic} pkey={pkey} setCanNext={setCanNext} />
        </section>
      </div>
      <footer className="footer">
        <ReaderBar />
        {idx > 0 && (
          <button className="btn hide-in-focus opt-desktop" onClick={() => go(`learn/${cid}/${tid}/${idx}`)}>
            Back
          </button>
        )}
        <button className="btn primary big" onClick={next} disabled={!canNext} title={canNext ? undefined : 'Finish this step first'}>
          {last ? (nextTopic ? `Finish · next: ${nextTopic.title}` : 'Finish course') : 'Next step'}
        </button>
      </footer>
    </>
  );
}

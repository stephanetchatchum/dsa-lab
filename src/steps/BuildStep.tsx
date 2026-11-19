import { useState } from 'react';
import { CodeView } from '../viz/CodeView';
import { Say } from '../speech/Say';
import { CodeTaskView, Lines, type StepProps } from './common';

export function BuildStep({ topic, pkey }: StepProps) {
  const b = topic.build!;
  const [passed, setPassed] = useState(false);
  return (
    <div className="twocol">
      <CodeTaskView id={`${pkey}/build`} starter={b.starter} tests={b.tests} setup={b.setup} solution={b.solution} revealAfter={2} onPass={() => setPassed(true)} />
      <div className="side">
        <div className="panel-title">Build your own</div>
        <Lines lines={b.intro} />
        {b.setup && (
          <details>
            <summary className="dim">Helpers already loaded for you</summary>
            <CodeView code={b.setup} />
          </details>
        )}
        <div style={{ opacity: passed ? 1 : 0.55 }}>
          <div className="panel-title">{passed ? 'Now the built-in version' : 'After it passes: the built-in version'}</div>
          <Say text={b.builtin.text} />
          <div style={{ marginTop: '.6rem' }}>
            <CodeView code={b.builtin.code} />
          </div>
        </div>
      </div>
    </div>
  );
}

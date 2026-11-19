import { useRef, useState } from 'react';
import { useSettings, type Theme } from '../state/settings';
import { useProgress } from '../state/progress';
import { mergeDocs, type ProgressDoc } from '../storage/types';
import { signIn, signOut, supabaseConfigured } from '../storage/supabase';
import { Say } from '../speech/Say';

const THEMES: { id: Theme; name: string; text: string }[] = [
  { id: 'mix', name: 'Mix', text: 'Chalkboard with solid blocks. The default.' },
  { id: 'chalk', name: 'Chalk', text: 'Everything hand-drawn. Calmest.' },
  { id: 'blocks', name: 'Blocks', text: 'Chunky, bold, saturated. Most energy.' },
];

export function exportProgress(doc: ProgressDoc) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `dsa-lab-progress-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function Settings() {
  const st = useSettings();
  const { doc, replace, sync, syncEmail, reloadRemote } = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [email, setEmail] = useState('');

  async function onImport(f: File) {
    try {
      const incoming = JSON.parse(await f.text()) as ProgressDoc;
      if (incoming?.v !== 1 || typeof incoming.topics !== 'object') throw new Error('Not a DSA Lab progress file');
      replace(mergeDocs(doc, incoming));
      setMsg('Imported and merged with your current progress.');
    } catch (e: any) {
      setMsg(`Import failed: ${e.message}`);
    }
  }

  return (
    <div className="page settings-grid">
      <h1 className="title" style={{ fontSize: '3rem' }}>Settings</h1>

      <section className="panel col">
        <div className="panel-title">Theme</div>
        <div className="seg" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button key={t.id} role="radio" aria-checked={st.theme === t.id} className={`btn ${st.theme === t.id ? 'on' : ''}`} onClick={() => st.set({ theme: t.id })}>
              {t.name}
            </button>
          ))}
        </div>
        <Say className="dim" text={THEMES.find((t) => t.id === st.theme)!.text} />
      </section>

      <section className="panel col">
        <div className="panel-title">Listening</div>
        <label className="row">
          <input type="checkbox" checked={st.narrate} onChange={(e) => st.set({ narrate: e.target.checked })} /> Speak each animation step
        </label>
        <label className="row">
          <input type="checkbox" checked={st.skipCode} onChange={(e) => st.set({ skipCode: e.target.checked })} /> Skip code when reading a page aloud
        </label>
        <label className="row">
          Voice speed
          <input type="range" min={0.7} max={1.6} step={0.05} value={st.rate} onChange={(e) => st.set({ rate: Number(e.target.value) })} />
          <span>{st.rate.toFixed(2)}×</span>
        </label>
      </section>

      <section className="panel col">
        <div className="panel-title">Focus</div>
        <label className="row">
          <input type="checkbox" checked={st.focus} onChange={(e) => st.set({ focus: e.target.checked })} /> Focus mode (hide navigation)
        </label>
        <label className="row">
          <input type="checkbox" checked={st.requireWriting} onChange={(e) => st.set({ requireWriting: e.target.checked })} /> Writing steps must be done before Next
        </label>
        <label className="row">
          Text size
          <input type="range" min={0.85} max={1.4} step={0.05} value={st.scale} onChange={(e) => st.set({ scale: Number(e.target.value) })} />
          <span>{Math.round(st.scale * 100)}%</span>
        </label>
      </section>

      <section className="panel col">
        <div className="panel-title">Your progress</div>
        <div className="row">
          <button className="btn" onClick={() => exportProgress(doc)}>⬇ Export (JSON)</button>
          <button className="btn" onClick={() => file.current?.click()}>⬆ Import (JSON)</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </div>
        {msg && <div role="status">{msg}</div>}
        {supabaseConfigured ? (
          syncEmail ? (
            <div className="row">
              <span>Synced as {syncEmail} · {sync}</span>
              <button className="btn sm" onClick={async () => { await signOut(); location.reload(); }}>Sign out</button>
            </div>
          ) : (
            <form
              className="row"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await signIn(email);
                  setMsg('Check your email for a sign-in link.');
                } catch (err: any) {
                  setMsg(err.message);
                }
              }}
            >
              <input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
              <button className="btn">Sync across devices</button>
              <button type="button" className="btn ghost" onClick={reloadRemote}>Refresh</button>
            </form>
          )
        ) : (
          <Say className="dim" text="Progress is saved in this browser. To sync across devices, add Supabase keys (see the README)." />
        )}
      </section>
    </div>
  );
}

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { localStore } from '../storage/local';
import { currentUser, supabaseConfigured, supabaseStore } from '../storage/supabase';
import { emptyDoc, mergeDocs, type ProgressDoc, type TopicProgress } from '../storage/types';

export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type Sync = 'local' | 'synced' | 'syncing' | 'error';

interface Ctx {
  doc: ProgressDoc;
  sync: Sync;
  syncEmail: string | null;
  update: (fn: (d: ProgressDoc) => void) => void;
  topic: (key: string) => TopicProgress;
  replace: (d: ProgressDoc) => void;
  reloadRemote: () => Promise<void>;
}
const ProgressCtx = createContext<Ctx>(null as unknown as Ctx);

const blankTopic = (): TopicProgress => ({ step: 0, done: [] });

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<ProgressDoc>(emptyDoc);
  const [sync, setSync] = useState<Sync>('local');
  const [syncEmail, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const remoteOn = useRef(false);

  const reloadRemote = useCallback(async () => {
    const local = (await localStore.load()) ?? emptyDoc();
    let merged = local;
    if (supabaseConfigured) {
      try {
        const user = await currentUser();
        if (user) {
          setSync('syncing');
          remoteOn.current = true;
          setEmail(user.email ?? 'signed in');
          const remote = await supabaseStore.load();
          if (remote) merged = mergeDocs(local, remote);
          setSync('synced');
        }
      } catch {
        setSync('error');
      }
    }
    loaded.current = true;
    setDoc(merged);
    setReady(true);
  }, []);

  useEffect(() => {
    reloadRemote();
  }, [reloadRemote]);

  // debounced save
  useEffect(() => {
    if (!loaded.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      await localStore.save(doc);
      if (remoteOn.current) {
        try {
          setSync('syncing');
          await supabaseStore.save(doc);
          setSync('synced');
        } catch {
          setSync('error');
        }
      }
    }, 800);
  }, [doc]);

  const update = useCallback((fn: (d: ProgressDoc) => void) => {
    setDoc((old) => {
      const d: ProgressDoc = structuredClone(old);
      fn(d);
      const t = today();
      if (!d.days.includes(t)) d.days.push(t);
      d.updatedAt = Date.now();
      return d;
    });
  }, []);

  const topic = useCallback((key: string) => doc.topics[key] ?? blankTopic(), [doc]);

  return (
    <ProgressCtx.Provider
      value={{ doc, sync, syncEmail, update, topic, replace: (d) => setDoc({ ...d, updatedAt: Date.now() }), reloadRemote }}
    >
      {ready ? children : <div className="page dim" role="status">Loading your progress…</div>}
    </ProgressCtx.Provider>
  );
}

export const useProgress = () => useContext(ProgressCtx);

export function ensureTopic(d: ProgressDoc, key: string): TopicProgress {
  if (!d.topics[key]) d.topics[key] = blankTopic();
  return d.topics[key];
}

/** consecutive active days ending today (or yesterday, so the streak survives until tonight) */
export function streak(days: string[]): number {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(today(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(today(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

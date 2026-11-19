import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProgressDoc, ProgressStore } from './types';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both env keys are set at build time. */
export const supabaseConfigured = !!(URL && KEY);

let client: SupabaseClient | null = null;
export async function getClient(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return null;
  if (!client) {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(URL!, KEY!);
  }
  return client;
}

export async function currentUser() {
  const c = await getClient();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  return data.session?.user ?? null;
}

export async function signIn(email: string) {
  const c = await getClient();
  if (!c) throw new Error('Supabase is not configured');
  const { error } = await c.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function signOut() {
  const c = await getClient();
  await c?.auth.signOut();
}

/** One row per user: progress(user_id, data jsonb, updated_at). See README for SQL. */
export const supabaseStore: ProgressStore = {
  kind: 'supabase',
  async load() {
    const c = await getClient();
    const user = await currentUser();
    if (!c || !user) return null;
    const { data, error } = await c.from('progress').select('data').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return (data?.data as ProgressDoc) ?? null;
  },
  async save(doc) {
    const c = await getClient();
    const user = await currentUser();
    if (!c || !user) return;
    const { error } = await c
      .from('progress')
      .upsert({ user_id: user.id, data: doc, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
};

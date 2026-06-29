// Cloud save backed by Supabase (email + password accounts). A signed-in account
// is REQUIRED to play; once in, the save auto-mirrors to the cloud so it survives
// a reinstall or moves between machines. Offline play still works from the cached
// session (see currentSession). Every call degrades gracefully to a no-op when the
// client can't be created or the user isn't signed in.
import { createClient } from '@supabase/supabase-js';

// Public project credentials. The publishable key is safe to ship in the client:
// Row-Level Security on `deskpet_saves` ensures each account only ever reads or
// writes its own row.
const SUPABASE_URL = 'https://gmyzkpokdtympsrnljoz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D_OLnQZsE-0Um8IQ-IrfTA_V-DXHdUH';
const TABLE = 'deskpet_saves';

let supa = null;
try {
  supa = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
} catch (e) {
  supa = null;
}

export function cloudEnabled() {
  return !!supa;
}

export async function currentUser() {
  if (!supa) return null;
  try {
    const { data } = await supa.auth.getUser();
    return (data && data.user) || null;
  } catch (e) {
    return null;
  }
}

// The cached session, read from local storage WITHOUT a network call — so a
// previously-signed-in pet still resolves its user while offline. Returns the
// session (with .user) or null.
export async function currentSession() {
  if (!supa) return null;
  try {
    const { data } = await supa.auth.getSession();
    return (data && data.session) || null;
  } catch (e) {
    return null;
  }
}

// Subscribe to sign-in / sign-out. Returns an unsubscribe function.
export function onAuth(cb) {
  if (!supa) return () => {};
  const { data } = supa.auth.onAuthStateChange((_event, session) => {
    cb((session && session.user) || null);
  });
  return () => { try { data.subscription.unsubscribe(); } catch (e) { /* ignore */ } };
}

export async function signUp(email, password) {
  if (!supa) throw new Error('云同步不可用');
  const { data, error } = await supa.auth.signUp({ email, password });
  if (error) throw error;
  return data; // data.session is null when email confirmation is required
}

export async function signIn(email, password) {
  if (!supa) throw new Error('云同步不可用');
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supa) return;
  try { await supa.auth.signOut(); } catch (e) { /* ignore */ }
}

// Fetch this user's saved pet blob (or null if they have no cloud save yet).
export async function pullCloud() {
  if (!supa) return null;
  const u = await currentUser();
  if (!u) return null;
  const { data, error } = await supa
    .from(TABLE)
    .select('state')
    .eq('user_id', u.id)
    .maybeSingle();
  if (error) throw error;
  return data ? data.state : null;
}

// Upsert this user's pet blob.
export async function pushCloud(state) {
  if (!supa) return;
  const u = await currentUser();
  if (!u) return;
  const { error } = await supa
    .from(TABLE)
    .upsert({ user_id: u.id, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw error;
}

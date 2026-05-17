import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('[supabase] Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY');
}

// Admin client — bypasses RLS (server-side only)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Anon client — respects RLS
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getUserClient(req) {
  const token = extractToken(req);
  if (!token) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

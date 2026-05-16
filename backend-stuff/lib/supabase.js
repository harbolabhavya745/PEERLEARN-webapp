import { createClient } from '@supabase/supabase-js';

// Admin client – bypasses RLS (use only in server-side API routes)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Anon client – respects RLS (for passing user JWT through)
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Returns an admin client (service role).
 * Useful for operations that need to bypass RLS.
 */
export function getAdminClient() {
  return supabaseAdmin;
}

/**
 * Returns a user-scoped client using their JWT from the
 * Authorization header. Respects RLS policies.
 */
export function getUserClient(req) {
  const token = extractToken(req);
  if (!token) return null;

  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
}

/**
 * Extracts JWT from Authorization header.
 */
export function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

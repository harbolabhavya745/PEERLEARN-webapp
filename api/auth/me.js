import { supabaseAdmin, supabaseAnon } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET  /api/auth/me             → returns current user's profile
 * POST /api/auth/me/refresh     → refreshes access token
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // ── POST /api/auth/me → refresh token ────────────────────────────
  if (req.method === 'POST') {
    const { refresh_token } = req.body;
    if (!refresh_token) return json(res, 400, { error: 'refresh_token is required' });

    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });
    if (error) return json(res, 401, { error: 'Could not refresh session' });

    return json(res, 200, {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
    });
  }

  // ── GET /api/auth/me → current user profile ──────────────────────
  if (req.method === 'GET') {
    const ok = await requireAuth(req, res);
    if (!ok) return;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        followers:follows!following_id(count),
        following:follows!follower_id(count)
      `)
      .eq('id', req.user.id)
      .single();

    return json(res, 200, { profile });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

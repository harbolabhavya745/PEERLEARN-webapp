import { supabaseAnon, supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json } from '../../lib/middleware.js';

/**
 * GET  /api/auth/google        → returns the OAuth URL to redirect to
 * POST /api/auth/google        → exchanges code for session (PKCE callback)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // ── GET: generate OAuth redirect URL ──────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAnon.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.SITE_URL}/api/auth/google/callback`,
        scopes: 'email profile',
      },
    });

    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { url: data.url });
  }

  // ── POST: exchange code for session ──────────────────────────────
  if (req.method === 'POST') {
    const { code } = req.body;
    if (!code) return json(res, 400, { error: 'code is required' });

    const { data, error } = await supabaseAnon.auth.exchangeCodeForSession(code);
    if (error) return json(res, 400, { error: error.message });

    // Ensure profile exists with Google display name
    const user = data.user;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';

    await supabaseAdmin
      .from('profiles')
      .upsert({
        id:        user.id,
        email:     user.email,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || null,
      }, { onConflict: 'id', ignoreDuplicates: false });

    // Grant default skin if not already owned
    await supabaseAdmin
      .from('user_skins')
      .insert({ user_id: user.id, skin_key: 'default' })
      .onConflict(['user_id', 'skin_key']).ignore();

    return json(res, 200, {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
      user: {
        id:        user.id,
        email:     user.email,
        full_name: fullName,
      },
    });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

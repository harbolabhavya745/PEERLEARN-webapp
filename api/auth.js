import { supabaseAdmin, supabaseAnon } from '../lib/supabase.js';
import { handleCors, json, requireAuth } from '../lib/middleware.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const url = req.url.split('?')[0];

  // ── POST /api/auth/signup ─────────────────────────────────────────
  if (url === '/api/auth/signup' && req.method === 'POST') {
    const { email, password, full_name, college, course } = req.body;
    if (!email || !password || !full_name) {
      return json(res, 400, { error: 'email, password and full_name are required' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name, college, course },
    });

    if (error) return json(res, 400, { error: error.message });

    await supabaseAdmin
      .from('profiles')
      .update({ full_name, college, course })
      .eq('id', data.user.id);

    await supabaseAdmin
      .from('user_skins')
      .insert({ user_id: data.user.id, skin_key: 'default' })
      .onConflict(['user_id', 'skin_key']).ignore();

    return json(res, 201, {
      message: 'Account created! Please verify your email before signing in.',
      user_id: data.user.id,
    });
  }

  // ── POST /api/auth/login ──────────────────────────────────────────
  if (url === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = req.body;
    if (!email || !password) {
      return json(res, 400, { error: 'email and password are required' });
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return json(res, 403, { error: 'Please verify your email first. Check your inbox.' });
      }
      return json(res, 401, { error: 'Invalid email or password' });
    }

    return json(res, 200, {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
      user: { id: data.user.id, email: data.user.email },
    });
  }

  // ── GET /api/auth/google → get OAuth URL ──────────────────────────
  if (url === '/api/auth/google' && req.method === 'GET') {
    const { data, error } = await supabaseAnon.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.SITE_URL}/api/auth/google`,
        scopes: 'email profile',
      },
    });
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { url: data.url });
  }

  // ── POST /api/auth/google → exchange code for session ────────────
  if (url === '/api/auth/google' && req.method === 'POST') {
    const { code } = req.body;
    if (!code) return json(res, 400, { error: 'code is required' });

    const { data, error } = await supabaseAnon.auth.exchangeCodeForSession(code);
    if (error) return json(res, 400, { error: error.message });

    const user     = data.user;
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';

    await supabaseAdmin.from('profiles').upsert({
      id:         user.id,
      email:      user.email,
      full_name:  fullName,
      avatar_url: user.user_metadata?.avatar_url || null,
    }, { onConflict: 'id', ignoreDuplicates: false });

    await supabaseAdmin
      .from('user_skins')
      .insert({ user_id: user.id, skin_key: 'default' })
      .onConflict(['user_id', 'skin_key']).ignore();

    return json(res, 200, {
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at:    data.session.expires_at,
      user: { id: user.id, email: user.email, full_name: fullName },
    });
  }

  // ── GET /api/auth/me → get own profile ───────────────────────────
  if (url === '/api/auth/me' && req.method === 'GET') {
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

  // ── POST /api/auth/me → refresh token ────────────────────────────
  if (url === '/api/auth/me' && req.method === 'POST') {
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

  return json(res, 404, { error: 'Auth route not found' });
}

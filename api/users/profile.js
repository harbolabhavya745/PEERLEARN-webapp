import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET  /api/users/profile?id=<uuid>   → get any user's public profile
 * PUT  /api/users/profile             → update own profile (auth required)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // ── GET: public profile ───────────────────────────────────────────
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return json(res, 400, { error: 'id query param required' });

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, username, full_name, email, college, course, bio, skills,
        avatar_skin, avatar_frame, avatar_url, xp, level, streak, plan, created_at,
        followers_count:follows!following_id(count),
        following_count:follows!follower_id(count),
        quiz_count:quiz_attempts(count),
        user_skins(skin_key)
      `)
      .eq('id', id)
      .single();

    if (error || !profile) return json(res, 404, { error: 'User not found' });
    return json(res, 200, { profile });
  }

  // ── PUT: update own profile ───────────────────────────────────────
  if (req.method === 'PUT') {
    const ok = await requireAuth(req, res);
    if (!ok) return;

    const allowed = ['full_name', 'username', 'college', 'course', 'bio', 'skills',
                     'avatar_skin', 'avatar_frame'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return json(res, 400, { error: 'No valid fields to update' });
    }

    // Username uniqueness check
    if (updates.username) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', req.user.id)
        .maybeSingle();

      if (existing) return json(res, 409, { error: 'Username already taken' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) return json(res, 400, { error: error.message });
    return json(res, 200, { profile: data });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

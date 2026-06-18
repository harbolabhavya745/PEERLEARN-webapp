import { supabaseAdmin } from '../lib/supabase.js';
import { handleCors, json, requireAuth } from '../lib/middleware.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const ok = await requireAuth(req, res);
    if (!ok) return;

    const url = new URL(req.url, `http://${req.headers.host}`).pathname;

    // ── GET /api/users/profile ──────────────────────────────────────
    if (url === '/api/users/profile' && req.method === 'GET') {
      const { id } = req.query;
      if (!id) return json(res, 400, { error: 'id query param required' });

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          id, username, full_name, email, college, course, bio, skills,
          avatar_skin, avatar_frame, avatar_url, xp, level, streak, plan, created_at,
          followers_count:follows!following_id(count),
          following_count:follows!follower_id(count),
          quiz_count:quiz_attempts(count)
        `)
        .eq('id', id)
        .single();

      if (error || !profile) return json(res, 404, { error: 'User not found' });
      return json(res, 200, { profile });
    }

    // ── GET /api/users/leaderboard ──────────────────────────────────
    if (url === '/api/users/leaderboard' && req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 10;
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, avatar_skin, avatar_url, xp, level')
        .order('xp', { ascending: false })
        .limit(limit);

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { leaderboard: data || [] });
    }

    // ── GET /api/users/suggestions ──────────────────────────────────
    if (url === '/api/users/suggestions' && req.method === 'GET') {
      const me = req.profile;
      if (!me) return json(res, 404, { error: 'Profile not found' });

      const { data: followingData } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('follower_id', me.id);

      const excludeIds = (followingData || []).map(f => f.following_id);
      excludeIds.push(me.id);

      let query = supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(10);

      if (me.course) query = query.eq('course', me.course);
      
      const { data, error } = await query;
      if (error) {
        // Fallback if the complex query fails
        const { data: fallback } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, username, avatar_skin, avatar_url, xp, level')
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .order('xp', { ascending: false })
          .limit(10);
        return json(res, 200, { suggestions: (fallback || []).map(u => ({ ...u, match_reason: 'Popular' })) });
      }

      return json(res, 200, { suggestions: (data || []).map(u => ({ ...u, match_reason: 'Recommended for you' })) });
    }

    return json(res, 404, { error: 'Route not found' });

  } catch (err) {
    console.error('Users API Error:', err);
    return json(res, 500, { error: 'Internal Server Error', details: err.message });
  }
}

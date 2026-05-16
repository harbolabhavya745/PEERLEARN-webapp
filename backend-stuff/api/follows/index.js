import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth, addXP } from '../../lib/middleware.js';

/**
 * GET    /api/follows?type=followers|following&user_id=<id>
 * POST   /api/follows          body: { following_id }   → follow
 * DELETE /api/follows          body: { following_id }   → unfollow
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  // ── GET: list followers or following ─────────────────────────────
  if (req.method === 'GET') {
    const { type = 'followers', user_id } = req.query;
    const targetId = user_id || req.user.id;

    if (type === 'followers') {
      const { data, error } = await supabaseAdmin
        .from('follows')
        .select('follower:profiles!follower_id(id,full_name,username,avatar_skin,avatar_url,course,level)')
        .eq('following_id', targetId)
        .order('created_at', { ascending: false });

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { users: data.map(d => d.follower) });
    }

    if (type === 'following') {
      const { data, error } = await supabaseAdmin
        .from('follows')
        .select('following:profiles!following_id(id,full_name,username,avatar_skin,avatar_url,course,level)')
        .eq('follower_id', targetId)
        .order('created_at', { ascending: false });

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { users: data.map(d => d.following) });
    }

    return json(res, 400, { error: 'type must be followers or following' });
  }

  // ── POST: follow ──────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { following_id } = req.body;
    if (!following_id) return json(res, 400, { error: 'following_id is required' });
    if (following_id === req.user.id) return json(res, 400, { error: "Can't follow yourself" });

    const { error } = await supabaseAdmin
      .from('follows')
      .insert({ follower_id: req.user.id, following_id });

    if (error) {
      if (error.code === '23505') return json(res, 409, { error: 'Already following' });
      return json(res, 500, { error: error.message });
    }

    // Give XP to the user being followed (encourages being active)
    await addXP(following_id, 10, 'got_follower');

    // Record activity for the followed user
    await supabaseAdmin.from('activities').insert({
      user_id:  following_id,
      actor_id: req.user.id,
      type:     'new_follower',
      meta:     { follower_name: req.profile?.full_name },
    });

    return json(res, 201, { message: 'Followed successfully' });
  }

  // ── DELETE: unfollow ──────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { following_id } = req.body;
    if (!following_id) return json(res, 400, { error: 'following_id is required' });

    const { error } = await supabaseAdmin
      .from('follows')
      .delete()
      .eq('follower_id', req.user.id)
      .eq('following_id', following_id);

    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { message: 'Unfollowed successfully' });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

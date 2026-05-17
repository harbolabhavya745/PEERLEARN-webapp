import { supabaseAdmin } from '../lib/supabase.js';
import { handleCors, json, requireAuth } from '../lib/middleware.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const url = req.url.split('?')[0];

  // ── GET /api/users/profile?id= → get any user's profile ──────────
  // ── PUT /api/users/profile     → update own profile ──────────────
  if (url === '/api/users/profile') {
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

    if (req.method === 'PUT') {
      const allowed = ['full_name', 'username', 'college', 'course', 'bio',
                       'skills', 'avatar_skin', 'avatar_frame'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      if (Object.keys(updates).length === 0) {
        return json(res, 400, { error: 'No valid fields to update' });
      }

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
  }

  // ── GET /api/users/search?q= ──────────────────────────────────────
  if (url === '/api/users/search' && req.method === 'GET') {
    const { q = '', course = '', skill = '', limit = 20, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level, plan')
      .neq('id', req.user.id)
      .limit(Number(limit))
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (q)     query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,college.ilike.%${q}%`);
    if (course) query = query.ilike('course', `%${course}%`);
    if (skill)  query = query.contains('skills', [skill]);

    const { data, error } = await query;
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { users: data });
  }

  // ── GET /api/users/suggestions ────────────────────────────────────
  if (url === '/api/users/suggestions' && req.method === 'GET') {
    const me = req.profile;

    const { data: followingData } = await supabaseAdmin
      .from('follows')
      .select('following_id')
      .eq('follower_id', me.id);

    const alreadyFollowing = (followingData || []).map(f => f.following_id);
    alreadyFollowing.push(me.id);

    const excludeClause = `(${alreadyFollowing.join(',')})`;

    if (me.course && me.college) {
      const { data: sameCourse } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
        .eq('course', me.course)
        .eq('college', me.college)
        .not('id', 'in', excludeClause)
        .limit(5);

      if (sameCourse?.length) {
        const sameCourseIds = sameCourse.map(u => u.id);
        const excludeIds = [...alreadyFollowing, ...sameCourseIds];
        const excludeClause2 = `(${excludeIds.join(',')})`;

        let skillMatches = [];
        if (me.skills?.length) {
          const { data: bySkill } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
            .overlaps('skills', me.skills)
            .not('id', 'in', excludeClause2)
            .limit(5);
          skillMatches = bySkill || [];
        }

        return json(res, 200, {
          suggestions: [
            ...sameCourse.map(u => ({ ...u, match_reason: 'Same course & college' })),
            ...skillMatches.map(u => ({ ...u, match_reason: 'Shared skills' })),
          ],
        });
      }
    }

    const { data: fallback } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
      .not('id', 'in', excludeClause)
      .order('xp', { ascending: false })
      .limit(10);

    return json(res, 200, {
      suggestions: (fallback || []).map(u => ({ ...u, match_reason: 'Popular on PeerLearn' })),
    });
  }

  return json(res, 404, { error: 'Users route not found' });
}

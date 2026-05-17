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

    // Filter out invalid or empty IDs to prevent SQL errors
    const validIds = alreadyFollowing.filter(id => id && id.length > 0);

    if (me.course && me.college) {
      let query = supabaseAdmin
        .from('profiles')
        .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
        .eq('course', me.course)
        .eq('college', me.college);

      if (validIds.length > 0) {
        query = query.not('id', 'in', `(${validIds.join(',')})`);
      }
      
      const { data: sameCourse } = await query.limit(5);

      if (sameCourse?.length) {
        const sameCourseIds = sameCourse.map(u => u.id);
        const excludeIds = [...validIds, ...sameCourseIds];
        
        let skillMatches = [];
        if (me.skills?.length) {
          let skillQuery = supabaseAdmin
            .from('profiles')
            .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
            .overlaps('skills', me.skills);
          
          if (excludeIds.length > 0) {
            skillQuery = skillQuery.not('id', 'in', `(${excludeIds.join(',')})`);
          }
          
          const { data: bySkill } = await skillQuery.limit(5);
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

    let fallbackQuery = supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
      .order('xp', { ascending: false });

    if (validIds.length > 0) {
      fallbackQuery = fallbackQuery.not('id', 'in', `(${validIds.join(',')})`);
    }

    const { data: fallback } = await fallbackQuery.limit(10);

    return json(res, 200, {
      suggestions: (fallback || []).map(u => ({ ...u, match_reason: 'Popular on PeerLearn' })),
    });
  }

  return json(res, 404, { error: 'Users route not found' });
}

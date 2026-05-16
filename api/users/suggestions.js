import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET /api/users/suggestions
 * Returns smart peer suggestions:
 *  1. Same course at same college
 *  2. Overlapping skills
 * Excludes people the user already follows.
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const me = req.profile;

  // Get list of users already followed
  const { data: followingData } = await supabaseAdmin
    .from('follows')
    .select('following_id')
    .eq('follower_id', me.id);

  const alreadyFollowing = (followingData || []).map(f => f.following_id);
  alreadyFollowing.push(me.id); // exclude self

  // Build suggestion query
  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
    .not('id', 'in', `(${alreadyFollowing.join(',')})`)
    .limit(10);

  // Priority: same course at same college
  if (me.course && me.college) {
    const { data: sameCourse } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
      .eq('course', me.course)
      .eq('college', me.college)
      .not('id', 'in', `(${alreadyFollowing.join(',')})`)
      .limit(5);

    if (sameCourse?.length) {
      // Fill the rest with skill matches
      const sameCourseIds = sameCourse.map(u => u.id);
      const excludeIds = [...alreadyFollowing, ...sameCourseIds];

      let skillMatches = [];
      if (me.skills?.length) {
        const { data: bySkill } = await supabaseAdmin
          .from('profiles')
          .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
          .overlaps('skills', me.skills)
          .not('id', 'in', `(${excludeIds.join(',')})`)
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

  // Fallback: recent active users
  const { data: fallback } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level')
    .not('id', 'in', `(${alreadyFollowing.join(',')})`)
    .order('xp', { ascending: false })
    .limit(10);

  return json(res, 200, {
    suggestions: (fallback || []).map(u => ({ ...u, match_reason: 'Popular on PeerLearn' })),
  });
}

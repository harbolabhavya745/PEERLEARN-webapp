import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET /api/users/search?q=<query>&course=<course>&skill=<skill>
 * Searches profiles by name, course, or skill tag.
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const { q = '', course = '', skill = '', limit = 20, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from('profiles')
    .select('id, full_name, username, college, course, skills, avatar_skin, avatar_url, xp, level, plan')
    .neq('id', req.user.id)
    .limit(Number(limit))
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,username.ilike.%${q}%,college.ilike.%${q}%`);
  }
  if (course) {
    query = query.ilike('course', `%${course}%`);
  }
  if (skill) {
    query = query.contains('skills', [skill]);
  }

  const { data, error } = await query;
  if (error) return json(res, 500, { error: error.message });

  return json(res, 200, { users: data });
}

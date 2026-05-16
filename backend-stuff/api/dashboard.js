import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET /api/dashboard
 * Returns everything needed for the Dashboard page:
 *  - profile stats (xp, level, streak, quiz count, connections)
 *  - recent activity feed
 *  - trending topics (most used note subjects in last 24hrs)
 *  - suggested peers (delegated to /api/users/suggestions on frontend)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const userId = req.user.id;

  // Run queries in parallel
  const [
    profileResult,
    activityResult,
    trendingResult,
    quizCountResult,
    connectionsResult,
  ] = await Promise.all([
    // Profile with XP/level/streak
    supabaseAdmin
      .from('profiles')
      .select('id, full_name, xp, level, streak, plan, avatar_skin, avatar_url, course, college')
      .eq('id', userId)
      .single(),

    // Recent activity (last 10)
    supabaseAdmin
      .from('activities')
      .select(`
        id, type, meta, created_at,
        actor:profiles!actor_id(id, full_name, avatar_skin, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),

    // Trending topics: most common note subjects in last 24hrs
    supabaseAdmin
      .from('notes')
      .select('subject')
      .not('subject', 'is', null)
      .gt('created_at', new Date(Date.now() - 86400000).toISOString())
      .limit(100),

    // Total quiz attempts
    supabaseAdmin
      .from('quiz_attempts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId),

    // Total connections (following + followers)
    supabaseAdmin
      .from('follows')
      .select('id', { count: 'exact' })
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`),
  ]);

  // Tally trending topics
  const subjectCounts = {};
  for (const { subject } of trendingResult.data || []) {
    if (subject) subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
  }
  const trending = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  return json(res, 200, {
    profile:     profileResult.data,
    activities:  activityResult.data || [],
    trending,
    stats: {
      quizzes:     quizCountResult.count     || 0,
      connections: connectionsResult.count   || 0,
      xp:          profileResult.data?.xp    || 0,
      streak:      profileResult.data?.streak || 0,
    },
  });
}

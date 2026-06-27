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

    // ── GET /api/users/search ───────────────────────────────────────
    if (url === '/api/users/search' && req.method === 'GET') {
      const q = (req.query.q || "").trim();

      if (!q)
          return json(res, 200, { users: [] });

      const { data, error } = await supabaseAdmin
          .from("profiles")
          .select(`
              id,
              username,
              full_name,
              avatar_skin,
              avatar_url,
              course,
              college,
              skills,
              xp,
              level
          `)
          .or(
              `username.ilike.%${q}%,full_name.ilike.%${q}%,course.ilike.%${q}%,college.ilike.%${q}%`
          )
          .limit(25);

      if (error)
          return json(res, 500, { error: error.message });

      return json(res, 200, {
          users: data
      });
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
  .from("profiles")
  .select(`
      id,
      full_name,
      username,
      college,
      course,
      skills,
      avatar_skin,
      avatar_url,
      xp,
      level
  `)
  .not("id", "in", `(${excludeIds.join(",")})`);

const { data, error } = await query;

if (error) {
  return json(res, 500, {
    error: error.message
  });
}

const suggestions = (data || []).map(user => {

  let score = 0;
  const reasons = [];

  // Same course (small bonus instead of compulsory)
  if (
    me.course &&
    user.course &&
    me.course === user.course
  ) {
    score += 20;
    reasons.push("Same course");
  }

  // Same college
  if (
    me.college &&
    user.college &&
    me.college === user.college
  ) {
    score += 15;
    reasons.push("Same college");
  }

  // Shared skills
  const mySkills = Array.isArray(me.skills)
    ? me.skills
    : [];

  const theirSkills = Array.isArray(user.skills)
    ? user.skills
    : [];

  const shared = mySkills.filter(skill =>
    theirSkills.includes(skill)
  );

  if (shared.length > 0) {
    score += shared.length * 10;
    reasons.push(`${shared.length} shared skill${shared.length > 1 ? "s" : ""}`);
  }

  // Similar XP
  const diff = Math.abs((me.xp || 0) - (user.xp || 0));

  if (diff < 100)
    score += 10;
  else if (diff < 300)
    score += 5;

  return {
    ...user,
    match_score: score,
    match_reason:
      reasons.length
        ? reasons.join(" • ")
        : "Recommended"
  };

});

suggestions.sort(
  (a, b) => b.match_score - a.match_score
);

return json(res, 200, {
  suggestions: suggestions.slice(0, 10)
});

      
    } //users/suggestion line fxn ending

    // ── GET /api/skins ──────────────────────────────────────────────
    if (url === '/api/skins' && req.method === 'GET') {
      const [skinsResult, ownedResult] = await Promise.all([
        supabaseAdmin.from('skins').select('*').order('xp_required', { ascending: true }),
        supabaseAdmin.from('user_skins').select('skin_key').eq('user_id', req.user.id),
      ]);

      const ownedKeys = new Set((ownedResult.data || []).map(s => s.skin_key));
      const skins = (skinsResult.data || []).map(s => ({
        ...s,
        owned:  ownedKeys.has(s.key),
        locked: !ownedKeys.has(s.key),
      }));

      return json(res, 200, { skins });
    }

    // ── POST /api/skins/unlock ──────────────────────────────────────
    if (url === '/api/skins/unlock' && req.method === 'POST') {
      const { skin_key } = req.body;
      if (!skin_key) return json(res, 400, { error: 'skin_key is required' });

      // Get skin details
      const { data: skin } = await supabaseAdmin
        .from('skins')
        .select('*')
        .eq('key', skin_key)
        .single();

      if (!skin) return json(res, 404, { error: 'Skin not found' });

      // Check plan requirement
      const planOrder = { free: 0, pro: 1, elite: 2 };
      const userPlan  = req.profile?.plan || 'free';

      if (planOrder[userPlan] < planOrder[skin.required_plan]) {
        return json(res, 403, {
          error: `This skin requires the ${skin.required_plan.toUpperCase()} plan`,
        });
      }

      // Check XP requirement
      if ((req.profile?.xp || 0) < skin.xp_required) {
        return json(res, 403, {
          error: `You need ${skin.xp_required} XP to unlock this skin (you have ${req.profile?.xp || 0})`,
        });
      }

      const { error } = await supabaseAdmin
        .from('user_skins')
        .insert({ user_id: req.user.id, skin_key })
        .onConflict(['user_id', 'skin_key']).ignore();

      if (error) return json(res, 500, { error: error.message });

      return json(res, 201, { message: `${skin.name} unlocked! 🎉`, skin });
    }

    // ── QUESTS (/api/users/quests) ──────────────────────────────────
    if (url === '/api/users/quests') {
      if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
          .from('quests')
          .select('*')
          .eq('author_id', req.user.id)
          .order('created_at', { ascending: false });

        if (error) return json(res, 500, { error: error.message });
        return json(res, 200, { 
          quests: data.map(q => ({
            id: q.id,
            type: q.type,
            title: q.title,
            description: q.description,
            xpReward: q.xp_reward,
            goldReward: q.gold_reward,
            difficulty: q.difficulty,
            completed: q.completed,
            dueDate: q.due_date
          })) 
        });
      }

      if (req.method === 'POST') {
        const { type, title, description, xpReward, goldReward, difficulty, dueDate } = req.body;
        const { data, error } = await supabaseAdmin
          .from('quests')
          .insert({
            author_id: req.user.id,
            type,
            title,
            description,
            xp_reward: xpReward,
            gold_reward: goldReward,
            difficulty,
            due_date: dueDate
          })
          .select()
          .single();

        if (error) return json(res, 500, { error: error.message });
        return json(res, 201, { quest: {
          id: data.id,
          type: data.type,
          title: data.title,
          description: data.description,
          xpReward: data.xp_reward,
          goldReward: data.gold_reward,
          difficulty: data.difficulty,
          completed: data.completed,
          dueDate: data.due_date
        }});
      }

      if (req.method === 'PATCH') {
        const { id, completed } = req.body;
        const { data, error } = await supabaseAdmin
          .from('quests')
          .update({ completed })
          .eq('id', id)
          .eq('author_id', req.user.id)
          .select()
          .single();
          
        if (error) return json(res, 500, { error: error.message });
        return json(res, 200, { quest: data });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query;
        const { error } = await supabaseAdmin
          .from('quests')
          .delete()
          .eq('id', id)
          .eq('author_id', req.user.id);

        if (error) return json(res, 500, { error: error.message });
        return json(res, 200, { message: 'Quest deleted' });
      }
    }

    return json(res, 404, { error: 'Route not found' });

  } catch (err) {
    console.error('Users API Error:', err);
    return json(res, 500, { error: 'Internal Server Error', details: err.message });
  }
}

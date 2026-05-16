import { supabaseAdmin, extractToken } from './supabase.js';

/**
 * CORS headers – allow the frontend origin.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Send a JSON response with CORS headers.
 */
export function json(res, statusCode, body) {
  res.status(statusCode).json(body);
}

/**
 * Handle CORS preflight.
 */
export function handleCors(req, res) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Middleware that verifies the user's JWT.
 * Attaches `req.user` (auth user) and `req.profile` (profile row).
 * Returns false and sends 401 if invalid.
 */
export async function requireAuth(req, res) {
  const token = extractToken(req);
  if (!token) {
    json(res, 401, { error: 'No auth token provided' });
    return false;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    json(res, 401, { error: 'Invalid or expired token' });
    return false;
  }

  req.user = data.user;

  // Also attach the profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  req.profile = profile;
  return true;
}

/**
 * XP rewards table.
 */
export const XP_REWARDS = {
  quiz_complete: 50,
  quiz_perfect: 100,
  help_peer: 30,
  streak_bonus: 20,
  follow_back: 10,
};

/**
 * Add XP to a user and recalculate level.
 * Level formula: level = floor(xp / 200) + 1, capped at 50.
 */
export async function addXP(userId, amount, type = 'misc') {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('xp, level, last_active, streak')
    .eq('id', userId)
    .single();

  if (!profile) return;

  const newXp    = (profile.xp || 0) + amount;
  const newLevel = Math.min(50, Math.floor(newXp / 200) + 1);

  // Streak logic
  const today    = new Date().toISOString().split('T')[0];
  const lastDate = profile.last_active;
  const diffDays = lastDate
    ? Math.floor((new Date(today) - new Date(lastDate)) / 86400000)
    : 999;

  const newStreak =
    diffDays === 0 ? profile.streak :
    diffDays === 1 ? profile.streak + 1 :
    1; // reset streak if gap > 1 day

  await supabaseAdmin
    .from('profiles')
    .update({ xp: newXp, level: newLevel, streak: newStreak, last_active: today })
    .eq('id', userId);

  return { xp: newXp, level: newLevel, streak: newStreak, xpGained: amount };
}

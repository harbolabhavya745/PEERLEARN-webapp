import { supabaseAdmin } from '../lib/supabase.js';
import { handleCors, json, requireAuth } from '../lib/middleware.js';

/**
 * GET /api/skins          → all skins catalog + which ones user owns
 * POST /api/skins/unlock  → unlock a skin (if XP requirement met)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const ok = await requireAuth(req, res);
    if (!ok) return;

    if (req.method === 'GET') {
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

    if (req.method === 'POST') {
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

    return json(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('Skins API Error:', err);
    return json(res, 500, { error: err.message });
  }
}

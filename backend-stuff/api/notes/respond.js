import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth, addXP, XP_REWARDS } from '../../lib/middleware.js';

/**
 * GET  /api/notes/respond?note_id=<id>   → get all responses to a note
 * POST /api/notes/respond                → body: { note_id, content }
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  // ── GET: fetch responses for a note ──────────────────────────────
  if (req.method === 'GET') {
    const { note_id } = req.query;
    if (!note_id) return json(res, 400, { error: 'note_id is required' });

    const { data, error } = await supabaseAdmin
      .from('note_responses')
      .select(`
        id, content, created_at,
        author:profiles!author_id(id, full_name, username, avatar_skin, avatar_url, level)
      `)
      .eq('note_id', note_id)
      .order('created_at', { ascending: true });

    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { responses: data });
  }

  // ── POST: respond to a note ───────────────────────────────────────
  if (req.method === 'POST') {
    const { note_id, content } = req.body;
    if (!note_id || !content?.trim()) {
      return json(res, 400, { error: 'note_id and content are required' });
    }
    if (content.length > 500) return json(res, 400, { error: 'Response must be ≤ 500 characters' });

    // Verify note exists and is not expired
    const { data: note } = await supabaseAdmin
      .from('notes')
      .select('id, author_id, type, subject, content')
      .eq('id', note_id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!note) return json(res, 404, { error: 'Note not found or expired' });

    const { data: response, error } = await supabaseAdmin
      .from('note_responses')
      .insert({ note_id, author_id: req.user.id, content: content.trim() })
      .select()
      .single();

    if (error) return json(res, 500, { error: error.message });

    // Give XP to the helper (responder)
    const xpResult = await addXP(req.user.id, XP_REWARDS.help_peer, 'helped_peer');

    // Notify note author
    if (note.author_id !== req.user.id) {
      await supabaseAdmin.from('activities').insert({
        user_id:  note.author_id,
        actor_id: req.user.id,
        type:     'note_response',
        meta: {
          note_id,
          note_subject: note.subject,
          note_type:    note.type,
          response_preview: content.slice(0, 80),
          helper_name: req.profile?.full_name,
        },
      });
    }

    return json(res, 201, {
      response,
      xp_gained: xpResult?.xpGained,
    });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

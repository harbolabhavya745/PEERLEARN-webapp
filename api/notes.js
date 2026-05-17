import { supabaseAdmin } from '../lib/supabase.js';
import { handleCors, json, requireAuth, addXP, XP_REWARDS } from '../lib/middleware.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const url = req.url.split('?')[0];

  // ══════════════════════════════════════════
  //  NOTES  (/api/notes)
  // ══════════════════════════════════════════
  if (url === '/api/notes') {

    // ── GET: feed or by user ──────────────────────────────────────
    if (req.method === 'GET') {
      const { feed, user_id, type } = req.query;

      let query = supabaseAdmin
        .from('notes')
        .select(`
          id, content, type, subject, is_anonymous, created_at, expires_at,
          author:profiles!author_id(id, full_name, username, avatar_skin, avatar_url, course),
          responses:note_responses(count)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (type) query = query.eq('type', type);

      if (feed === 'true') {
        const { data: following } = await supabaseAdmin
          .from('follows')
          .select('following_id')
          .eq('follower_id', req.user.id);

        const ids = (following || []).map(f => f.following_id);
        ids.push(req.user.id);
        if (ids.length === 0) return json(res, 200, { notes: [] });
        query = query.in('author_id', ids);

      } else if (user_id) {
        query = query.eq('author_id', user_id);
        if (user_id !== req.user.id) query = query.eq('is_anonymous', false);
      }

      const { data, error } = await query.limit(50);
      if (error) return json(res, 500, { error: error.message });

      const notes = (data || []).map(note => ({
        ...note,
        author: note.is_anonymous && note.author?.id !== req.user.id
          ? { id: null, full_name: 'Anonymous', avatar_skin: '🎭' }
          : note.author,
      }));

      return json(res, 200, { notes });
    }

    // ── POST: create note ─────────────────────────────────────────
    if (req.method === 'POST') {
      const { content, type = 'general', subject, is_anonymous = false } = req.body;
      if (!content?.trim()) return json(res, 400, { error: 'content is required' });
      if (content.length > 280) return json(res, 400, { error: 'Note must be ≤ 280 characters' });

      const { data, error } = await supabaseAdmin
        .from('notes')
        .insert({ author_id: req.user.id, content: content.trim(), type, subject, is_anonymous })
        .select()
        .single();

      if (error) return json(res, 500, { error: error.message });

      const { data: followers } = await supabaseAdmin
        .from('follows')
        .select('follower_id')
        .eq('following_id', req.user.id);

      if (followers?.length) {
        await supabaseAdmin.from('activities').insert(
          followers.map(f => ({
            user_id:  f.follower_id,
            actor_id: is_anonymous ? null : req.user.id,
            type:     'new_note',
            meta: { note_id: data.id, note_type: type, subject, preview: content.slice(0, 60), anonymous: is_anonymous },
          }))
        );
      }

      return json(res, 201, { note: data });
    }

    // ── DELETE: delete own note ───────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return json(res, 400, { error: 'id is required' });

      const { error } = await supabaseAdmin
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('author_id', req.user.id);

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { message: 'Note deleted' });
    }
  }

  // ══════════════════════════════════════════
  //  NOTE RESPONSES  (/api/notes/respond)
  // ══════════════════════════════════════════
  if (url === '/api/notes/respond') {

    // ── GET: fetch responses ──────────────────────────────────────
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

    // ── POST: respond to note ─────────────────────────────────────
    if (req.method === 'POST') {
      const { note_id, content } = req.body;
      if (!note_id || !content?.trim()) {
        return json(res, 400, { error: 'note_id and content are required' });
      }
      if (content.length > 500) return json(res, 400, { error: 'Response must be ≤ 500 characters' });

      const { data: note } = await supabaseAdmin
        .from('notes')
        .select('id, author_id, type, subject')
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

      const xpResult = await addXP(req.user.id, XP_REWARDS.help_peer, 'helped_peer');

      if (note.author_id !== req.user.id) {
        await supabaseAdmin.from('activities').insert({
          user_id:  note.author_id,
          actor_id: req.user.id,
          type:     'note_response',
          meta: {
            note_id,
            note_subject:     note.subject,
            note_type:        note.type,
            response_preview: content.slice(0, 80),
            helper_name:      req.profile?.full_name,
          },
        });
      }

      return json(res, 201, { response, xp_gained: xpResult?.xpGained });
    }
  }

  return json(res, 404, { error: 'Notes route not found' });
}

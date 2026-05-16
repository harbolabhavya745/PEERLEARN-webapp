import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET    /api/notes?feed=true          → notes from people you follow (feed)
 * GET    /api/notes?user_id=<id>       → notes by a specific user
 * POST   /api/notes                    → create a note
 * DELETE /api/notes?id=<note_id>       → delete own note
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  // ── GET ───────────────────────────────────────────────────────────
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
      // Get IDs of people the user follows
      const { data: following } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('follower_id', req.user.id);

      const ids = (following || []).map(f => f.following_id);
      ids.push(req.user.id); // include own notes

      if (ids.length === 0) return json(res, 200, { notes: [] });
      query = query.in('author_id', ids);
    } else if (user_id) {
      query = query.eq('author_id', user_id);
      // Hide anonymous notes' author info if not own
      if (user_id !== req.user.id) {
        query = query.eq('is_anonymous', false);
      }
    }

    const { data, error } = await query.limit(50);
    if (error) return json(res, 500, { error: error.message });

    // Mask author info for anonymous notes
    const notes = (data || []).map(note => ({
      ...note,
      author: note.is_anonymous && note.author?.id !== req.user.id
        ? { id: null, full_name: 'Anonymous', avatar_skin: '🎭' }
        : note.author,
    }));

    return json(res, 200, { notes });
  }

  // ── POST: create note ─────────────────────────────────────────────
  if (req.method === 'POST') {
    const { content, type = 'general', subject, is_anonymous = false } = req.body;
    if (!content?.trim()) return json(res, 400, { error: 'content is required' });
    if (content.length > 280) return json(res, 400, { error: 'Note must be ≤ 280 characters' });

    const { data, error } = await supabaseAdmin
      .from('notes')
      .insert({
        author_id: req.user.id,
        content:   content.trim(),
        type,
        subject,
        is_anonymous,
      })
      .select()
      .single();

    if (error) return json(res, 500, { error: error.message });

    // Notify followers about new note
    const { data: followers } = await supabaseAdmin
      .from('follows')
      .select('follower_id')
      .eq('following_id', req.user.id);

    if (followers?.length) {
      const activities = followers.map(f => ({
        user_id:  f.follower_id,
        actor_id: is_anonymous ? null : req.user.id,
        type:     'new_note',
        meta: {
          note_id:   data.id,
          note_type: type,
          subject,
          preview:   content.slice(0, 60),
          anonymous: is_anonymous,
        },
      }));
      await supabaseAdmin.from('activities').insert(activities);
    }

    return json(res, 201, { note: data });
  }

  // ── DELETE ────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return json(res, 400, { error: 'id is required' });

    const { error } = await supabaseAdmin
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('author_id', req.user.id); // only own notes

    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { message: 'Note deleted' });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

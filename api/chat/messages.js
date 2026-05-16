import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET  /api/chat/messages?conversation_id=<id>&before=<timestamp>&limit=50
 *      → fetch paginated messages (newest first then reverse on frontend)
 * POST /api/chat/messages
 *      body: { conversation_id, content, attachment_url?, attachment_type? }
 *      → send a message
 * PUT  /api/chat/messages?conversation_id=<id>
 *      → mark all messages in conversation as read
 *
 * NOTE: Real-time delivery is handled client-side via Supabase Realtime.
 * The client subscribes to:
 *   supabase.channel('messages').on('postgres_changes', { event:'INSERT', table:'messages' }, cb)
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  // ── Verify membership helper ──────────────────────────────────────
  async function isMember(conversation_id) {
    const { data } = await supabaseAdmin
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', req.user.id)
      .single();
    return !!data;
  }

  // ── GET: fetch messages ───────────────────────────────────────────
  if (req.method === 'GET') {
    const { conversation_id, before, limit = 50 } = req.query;
    if (!conversation_id) return json(res, 400, { error: 'conversation_id is required' });

    if (!(await isMember(conversation_id))) {
      return json(res, 403, { error: 'Not a member of this conversation' });
    }

    let query = supabaseAdmin
      .from('messages')
      .select(`
        id, content, attachment_url, attachment_type, read_by, created_at,
        sender:profiles!sender_id(id, full_name, username, avatar_skin, avatar_url)
      `)
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (before) query = query.lt('created_at', before);

    const { data, error } = await query;
    if (error) return json(res, 500, { error: error.message });

    return json(res, 200, { messages: (data || []).reverse() }); // oldest first
  }

  // ── POST: send message ────────────────────────────────────────────
  if (req.method === 'POST') {
    const { conversation_id, content, attachment_url, attachment_type } = req.body;
    if (!conversation_id) return json(res, 400, { error: 'conversation_id is required' });
    if (!content && !attachment_url) return json(res, 400, { error: 'content or attachment required' });

    if (!(await isMember(conversation_id))) {
      return json(res, 403, { error: 'Not a member of this conversation' });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id,
        sender_id:       req.user.id,
        content:         content?.trim() || null,
        attachment_url:  attachment_url || null,
        attachment_type: attachment_type || null,
        read_by:         [req.user.id],
      })
      .select(`
        id, content, attachment_url, attachment_type, read_by, created_at,
        sender:profiles!sender_id(id, full_name, username, avatar_skin, avatar_url)
      `)
      .single();

    if (error) return json(res, 500, { error: error.message });
    return json(res, 201, { message: data });
  }

  // ── PUT: mark as read ─────────────────────────────────────────────
  if (req.method === 'PUT') {
    const { conversation_id } = req.query;
    if (!conversation_id) return json(res, 400, { error: 'conversation_id is required' });

    // Append user ID to read_by array for unread messages
    const { error } = await supabaseAdmin.rpc('mark_messages_read', {
      p_conversation_id: conversation_id,
      p_user_id: req.user.id,
    });

    // If RPC doesn't exist, fallback: update individually (less efficient)
    if (error) {
      await supabaseAdmin
        .from('messages')
        .update({ read_by: supabaseAdmin.sql`array_append(read_by, ${req.user.id}::uuid)` })
        .eq('conversation_id', conversation_id)
        .not('read_by', 'cs', `{${req.user.id}}`);
    }

    return json(res, 200, { message: 'Marked as read' });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

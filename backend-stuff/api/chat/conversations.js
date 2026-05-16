import { supabaseAdmin } from '../../lib/supabase.js';
import { handleCors, json, requireAuth } from '../../lib/middleware.js';

/**
 * GET  /api/chat/conversations             → list user's conversations
 * POST /api/chat/conversations             → create DM or group
 *   body (DM):    { type: 'dm', user_id }
 *   body (group): { type: 'group', name, avatar, member_ids: [] }
 */
export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  // ── GET: list all conversations ───────────────────────────────────
  if (req.method === 'GET') {
    // Get all conversation IDs user is a member of
    const { data: memberships } = await supabaseAdmin
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', req.user.id);

    if (!memberships?.length) return json(res, 200, { conversations: [] });

    const convIds = memberships.map(m => m.conversation_id);

    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id, name, is_group, avatar, created_at,
        members:conversation_members(
          user:profiles!user_id(id, full_name, username, avatar_skin, avatar_url)
        ),
        last_message:messages(content, created_at, sender_id)
      `)
      .in('id', convIds)
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .limit(1, { foreignTable: 'messages' });

    if (error) return json(res, 500, { error: error.message });

    // For DMs, set the "other person" as the display name
    const enriched = conversations.map(conv => {
      if (!conv.is_group) {
        const other = conv.members
          .map(m => m.user)
          .find(u => u.id !== req.user.id);
        return { ...conv, display_name: other?.full_name, display_avatar: other?.avatar_skin, other_user: other };
      }
      return { ...conv, display_name: conv.name, display_avatar: conv.avatar };
    });

    return json(res, 200, { conversations: enriched });
  }

  // ── POST: create conversation ─────────────────────────────────────
  if (req.method === 'POST') {
    const { type, user_id, name, avatar, member_ids = [] } = req.body;

    if (type === 'dm') {
      if (!user_id) return json(res, 400, { error: 'user_id is required for DM' });

      // Check if DM already exists between these two users
      const { data: existing } = await supabaseAdmin
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', req.user.id);

      if (existing?.length) {
        const myConvIds = existing.map(e => e.conversation_id);

        const { data: shared } = await supabaseAdmin
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', user_id)
          .in('conversation_id', myConvIds);

        if (shared?.length) {
          // Find a non-group conversation among shared ones
          const { data: dmConv } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .in('id', shared.map(s => s.conversation_id))
            .eq('is_group', false)
            .single();

          if (dmConv) return json(res, 200, { conversation_id: dmConv.id, existing: true });
        }
      }

      // Create new DM conversation
      const { data: conv, error: convErr } = await supabaseAdmin
        .from('conversations')
        .insert({ is_group: false, created_by: req.user.id })
        .select()
        .single();

      if (convErr) return json(res, 500, { error: convErr.message });

      await supabaseAdmin.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: req.user.id, role: 'admin' },
        { conversation_id: conv.id, user_id,              role: 'member' },
      ]);

      return json(res, 201, { conversation_id: conv.id });
    }

    if (type === 'group') {
      if (!name) return json(res, 400, { error: 'name is required for group' });

      const { data: conv, error: convErr } = await supabaseAdmin
        .from('conversations')
        .insert({ is_group: true, name, avatar: avatar || '📚', created_by: req.user.id })
        .select()
        .single();

      if (convErr) return json(res, 500, { error: convErr.message });

      const allMembers = [req.user.id, ...member_ids.filter(id => id !== req.user.id)];
      await supabaseAdmin.from('conversation_members').insert(
        allMembers.map(uid => ({
          conversation_id: conv.id,
          user_id: uid,
          role: uid === req.user.id ? 'admin' : 'member',
        }))
      );

      return json(res, 201, { conversation_id: conv.id });
    }

    return json(res, 400, { error: 'type must be dm or group' });
  }

  return json(res, 405, { error: 'Method not allowed' });
}

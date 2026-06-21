import { supabaseAdmin } from '../lib/supabase.js';
import { handleCors, json, requireAuth } from '../lib/middleware.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const ok = await requireAuth(req, res);
  if (!ok) return;

  const url = req.url.split('?')[0];

  // helper: check if user is member of a conversation
  async function isMember(conversation_id) {
    const { data } = await supabaseAdmin
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversation_id)
      .eq('user_id', req.user.id)
      .single();
    return !!data;
  }

  // ══════════════════════════════════════════
  //  CONVERSATIONS  (/api/chat/conversations)
  // ══════════════════════════════════════════
  if (url === '/api/chat/conversations') {

    // ── GET: list all conversations ───────────────────────────────
    if (req.method === 'GET') {
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

      const enriched = conversations.map(conv => {
        const lastMsg = (conv.last_message || [])[0];
        if (!conv.is_group) {
          const other = conv.members.map(m => m.user).find(u => u.id !== req.user.id);
          return { 
            ...conv, 
            display_name: other?.full_name, 
            display_avatar: other?.avatar_skin, 
            target_user_id: other?.id,
            other_user: other,
            last_message: lastMsg 
          };
        }
        return { 
          ...conv, 
          display_name: conv.name || 'Group Chat', 
          display_avatar: conv.avatar,
          last_message: lastMsg
        };
      });

      return json(res, 200, { conversations: enriched });
    }

    // ── POST: create DM or group ──────────────────────────────────
    if (req.method === 'POST') {
      const { type, user_id, name, avatar, member_ids = [] } = req.body;

      if (type === 'dm') {
        if (!user_id) return json(res, 400, { error: 'user_id is required for DM' });

        // Robust check for existing DM:
        // 1. Get all conversation IDs that I am a member of
        const { data: myMemberships } = await supabaseAdmin
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', req.user.id);

        if (myMemberships && myMemberships.length > 0) {
          const myConvIds = myMemberships.map(m => m.conversation_id);

          // 2. Check if the target user is also in any of those conversations
          // AND ensure the conversation is NOT a group
          const { data: sharedDM } = await supabaseAdmin
            .from('conversation_members')
            .select('conversation_id, conversations!inner(is_group)')
            .eq('user_id', user_id)
            .in('conversation_id', myConvIds)
            .eq('conversations.is_group', false)
            .limit(1);

          if (sharedDM && sharedDM.length > 0) {
            return json(res, 200, { conversation_id: sharedDM[0].conversation_id, existing: true });
          }
        }

        // No DM found, create a new one
        const { data: conv, error } = await supabaseAdmin
          .from('conversations')
          .insert({ is_group: false, created_by: req.user.id })
          .select()
          .single();

        if (error) return json(res, 500, { error: error.message });

        await supabaseAdmin.from('conversation_members').insert([
          { conversation_id: conv.id, user_id: req.user.id, role: 'admin' },
          { conversation_id: conv.id, user_id,              role: 'member' },
        ]);

        return json(res, 201, { conversation_id: conv.id });
      }

      if (type === 'group') {
        if (!name) return json(res, 400, { error: 'name is required for group' });

        const { data: conv, error } = await supabaseAdmin
          .from('conversations')
          .insert({ is_group: true, name, avatar: avatar || '📚', created_by: req.user.id })
          .select()
          .single();

        if (error) return json(res, 500, { error: error.message });

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
  }

  // ══════════════════════════════════════════
  //  MESSAGES  (/api/chat/messages)
  // ══════════════════════════════════════════
  if (url === '/api/chat/messages') {

    // ── GET: fetch messages ───────────────────────────────────────
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
      return json(res, 200, { messages: (data || []).reverse() });
    }

    // ── POST: send message ────────────────────────────────────────
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

    // ── PUT: mark as read ─────────────────────────────────────────
    if (req.method === 'PUT') {
      const { conversation_id } = req.query;
      if (!conversation_id) return json(res, 400, { error: 'conversation_id is required' });

      // Get existing read_by for messages in this conversation
      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('id, read_by')
        .eq('conversation_id', conversation_id);

      if (messages) {
        for (const msg of messages) {
          if (!msg.read_by.includes(req.user.id)) {
            const newReadBy = [...msg.read_by, req.user.id];
            await supabaseAdmin
              .from('messages')
              .update({ read_by: newReadBy })
              .eq('id', msg.id);
          }
        }
      }

      return json(res, 200, { message: 'Marked as read' });
    }
  }

  return json(res, 404, { error: 'Chat route not found' });
}

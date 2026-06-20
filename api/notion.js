import { handleCors, json, requireAuth } from '../lib/middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { getNotionClient, requireNotion, createDatabases } from '../lib/notion.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const url = req.url.split('?')[0];
  const baseUrl = process.env.SITE_URL.replace(/\/$/, '');

  // ── OAUTH CALLBACK (NO AUTH REQUIRED) ────────────────────────
  if (url === '/api/notion/callback' && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');

    if (!code || !state) {
      res.writeHead(302, { Location: `${baseUrl}/#notion?error=missing_params` });
      return res.end();
    }

    try {
      const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
      const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
      
      const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${baseUrl}/api/notion/callback`
        })
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenData.access_token) {
        throw new Error('Failed to get access token');
      }

      // Find a parent page
      const userNotion = getNotionClient(tokenData.access_token);
      const searchRes = await userNotion.search({
        filter: { property: 'object', value: 'page' },
        page_size: 1
      });
      const parentPageId = searchRes.results[0]?.id;

      if (!parentPageId) {
        throw new Error('No accessible page found to create databases in.');
      }

      // Create DBs
      const dbs = await createDatabases(tokenData.access_token, parentPageId);

      // Store in profiles (state is userId)
      await supabaseAdmin.from('profiles').update({
        notion_token: tokenData.access_token,
        notion_workspace_id: tokenData.workspace_id,
        notion_workspace_name: tokenData.workspace_name,
        notion_bot_id: tokenData.bot_id,
        notion_parent_page_id: parentPageId,
        notion_todos_db_id: dbs.todos_db_id,
        notion_events_db_id: dbs.events_db_id,
        notion_notes_db_id: dbs.notes_db_id,
        notion_connected_at: new Date().toISOString()
      }).eq('id', state);

      res.writeHead(302, { Location: `${baseUrl}/#notion?connected=true` });
      return res.end();
    } catch (err) {
      console.error("Notion OAuth Callback Error:", err);
      res.writeHead(302, { Location: `${baseUrl}/#notion?error=oauth_failed` });
      return res.end();
    }
  }

  // ALL OTHER ROUTES REQUIRE AUTH
  const ok = await requireAuth(req, res);
  if (!ok) return;
  const userId = req.user.id;

  try {
    // ── OAUTH START ──────────────────────────────────────────────
    if (url === '/api/notion/oauth' && req.method === 'GET') {
      const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${baseUrl}/api/notion/callback`);
      const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}&state=${userId}`;
      return json(res, 200, { url: authUrl });
    }

    // ── STATUS & DISCONNECT ──────────────────────────────────────
    if (url === '/api/notion/status' && req.method === 'GET') {
      return json(res, 200, { 
        connected: !!req.profile?.notion_token,
        workspace_name: req.profile?.notion_workspace_name,
        last_synced_at: req.profile?.notion_last_synced_at
      });
    }

    if (url === '/api/notion/disconnect' && req.method === 'POST') {
      await supabaseAdmin.from('profiles').update({
        notion_token: null,
        notion_workspace_id: null,
        notion_workspace_name: null,
        notion_bot_id: null,
        notion_parent_page_id: null,
        notion_todos_db_id: null,
        notion_events_db_id: null,
        notion_notes_db_id: null,
        notion_connected_at: null,
        notion_last_synced_at: null
      }).eq('id', userId);
      return json(res, 200, { success: true });
    }

    // ── TODOS ──────────────────────────────────────────────
    if (url === '/api/notion/todos') {
      if (req.method === 'GET') {
        const { data: todos } = await supabaseAdmin.from('todos').select('*').eq('author_id', userId).order('created_at', { ascending: false });
        return json(res, 200, { todos: todos || [] });
      }
      
      if (!requireNotion(req, res)) return;

      if (req.method === 'POST') {
        const { title, status, due_date } = req.body;
        const { data: todo } = await supabaseAdmin.from('todos').insert({
          author_id: userId, title, status: status || 'Not started', due_date: due_date || null
        }).select().single();

        try {
          const userNotion = getNotionClient(req.profile.notion_token);
          const notionPage = await userNotion.pages.create({
            parent: { database_id: req.profile.notion_todos_db_id },
            properties: {
              'Name': { title: [{ text: { content: todo.title } }] },
              'Status': { status: { name: todo.status } },
              'Due Date': todo.due_date ? { date: { start: todo.due_date } } : undefined,
              'PeerLearn ID': { rich_text: [{ text: { content: todo.id } }] }
            }
          });
          await supabaseAdmin.from('todos').update({ notion_page_id: notionPage.id, notion_last_edited: notionPage.last_edited_time }).eq('id', todo.id);
          todo.notion_page_id = notionPage.id;
        } catch (err) {
          console.error('Notion sync failed:', err.message);
        }
        return json(res, 201, { todo });
      }

      if (req.method === 'PATCH') {
        const { id, title, status, due_date } = req.body;
        const { data: todo } = await supabaseAdmin.from('todos')
          .update({ title, status, due_date, updated_at: new Date().toISOString() })
          .eq('id', id).eq('author_id', userId).select().single();

        if (todo?.notion_page_id) {
          try {
            const userNotion = getNotionClient(req.profile.notion_token);
            await userNotion.pages.update({
              page_id: todo.notion_page_id,
              properties: {
                'Name': { title: [{ text: { content: todo.title } }] },
                'Status': { status: { name: todo.status } },
                'Due Date': todo.due_date ? { date: { start: todo.due_date } } : undefined
              }
            });
          } catch (err) { console.error('Notion update failed:', err.message); }
        }
        return json(res, 200, { todo });
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        const { data: todo } = await supabaseAdmin.from('todos').delete().eq('id', id).eq('author_id', userId).select().single();
        if (todo?.notion_page_id) {
          try {
            const userNotion = getNotionClient(req.profile.notion_token);
            await userNotion.pages.update({ page_id: todo.notion_page_id, archived: true });
          } catch (err) { console.error('Notion archive failed:', err.message); }
        }
        return json(res, 200, { success: true });
      }
    }

    // ── EVENTS ─────────────────────────────────────────────
    if (url === '/api/notion/events') {
      if (req.method === 'GET') {
        const { data: events } = await supabaseAdmin.from('events').select('*').eq('author_id', userId).order('created_at', { ascending: false });
        return json(res, 200, { events: events || [] });
      }
      
      if (!requireNotion(req, res)) return;

      if (req.method === 'POST') {
        const { title, event_type, date } = req.body;
        const { data: event } = await supabaseAdmin.from('events').insert({
          author_id: userId, title, event_type: event_type || 'Other', date: date || null
        }).select().single();

        try {
          const userNotion = getNotionClient(req.profile.notion_token);
          const notionPage = await userNotion.pages.create({
            parent: { database_id: req.profile.notion_events_db_id },
            properties: {
              'Name': { title: [{ text: { content: event.title } }] },
              'Event Type': { select: { name: event.event_type } },
              'Date': event.date ? { date: { start: event.date } } : undefined,
              'PeerLearn ID': { rich_text: [{ text: { content: event.id } }] }
            }
          });
          await supabaseAdmin.from('events').update({ notion_page_id: notionPage.id, notion_last_edited: notionPage.last_edited_time }).eq('id', event.id);
          event.notion_page_id = notionPage.id;
        } catch (err) {
          console.error('Notion sync failed:', err.message);
        }
        return json(res, 201, { event });
      }

      if (req.method === 'PATCH') {
        const { id, title, event_type, date } = req.body;
        const { data: event } = await supabaseAdmin.from('events')
          .update({ title, event_type, date, updated_at: new Date().toISOString() })
          .eq('id', id).eq('author_id', userId).select().single();

        if (event?.notion_page_id) {
          try {
            const userNotion = getNotionClient(req.profile.notion_token);
            await userNotion.pages.update({
              page_id: event.notion_page_id,
              properties: {
                'Name': { title: [{ text: { content: event.title } }] },
                'Event Type': { select: { name: event.event_type } },
                'Date': event.date ? { date: { start: event.date } } : undefined
              }
            });
          } catch (err) { console.error('Notion update failed:', err.message); }
        }
        return json(res, 200, { event });
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        const { data: event } = await supabaseAdmin.from('events').delete().eq('id', id).eq('author_id', userId).select().single();
        if (event?.notion_page_id) {
          try {
            const userNotion = getNotionClient(req.profile.notion_token);
            await userNotion.pages.update({ page_id: event.notion_page_id, archived: true });
          } catch (err) { console.error('Notion archive failed:', err.message); }
        }
        return json(res, 200, { success: true });
      }
    }

    // ── NOTES ──────────────────────────────────────────────
    if (url === '/api/notion/notes') {
      if (req.method === 'GET') {
        const { data: notes } = await supabaseAdmin.from('study_notes').select('*').eq('author_id', userId).order('created_at', { ascending: false });
        return json(res, 200, { notes: notes || [] });
      }
      
      if (!requireNotion(req, res)) return;

      if (req.method === 'POST') {
        const { title, content, subject, is_public } = req.body;
        const { data: note } = await supabaseAdmin.from('study_notes').insert({
          author_id: userId, title, content, subject: subject || 'Other', is_public: is_public || false
        }).select().single();

        try {
          const userNotion = getNotionClient(req.profile.notion_token);
          const notionPage = await userNotion.pages.create({
            parent: { database_id: req.profile.notion_notes_db_id },
            properties: {
              'Name': { title: [{ text: { content: note.title } }] },
              'Subject': { select: { name: note.subject } },
              'Public': { checkbox: note.is_public },
              'PeerLearn ID': { rich_text: [{ text: { content: note.id } }] }
            },
            children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: content || "" } }] } }]
          });
          await supabaseAdmin.from('study_notes').update({ notion_page_id: notionPage.id, notion_last_edited: notionPage.last_edited_time }).eq('id', note.id);
          note.notion_page_id = notionPage.id;
        } catch (err) {
          console.error('Notion sync failed:', err.message);
        }
        return json(res, 201, { note });
      }

      if (req.method === 'PATCH') {
        const { id, title, content, subject, is_public } = req.body;
        const { data: note } = await supabaseAdmin.from('study_notes')
          .update({ title, content, subject, is_public, updated_at: new Date().toISOString() })
          .eq('id', id).eq('author_id', userId).select().single();

        if (note?.notion_page_id) {
          try {
            const userNotion = getNotionClient(req.profile.notion_token);
            await userNotion.pages.update({
              page_id: note.notion_page_id,
              properties: {
                'Name': { title: [{ text: { content: note.title } }] },
                'Subject': { select: { name: note.subject } },
                'Public': { checkbox: note.is_public }
              }
            });
          } catch (err) { console.error('Notion update failed:', err.message); }
        }
        return json(res, 200, { note });
      }

      if (req.method === 'DELETE') {
        const { id } = req.body;
        const { data: note } = await supabaseAdmin.from('study_notes').delete().eq('id', id).eq('author_id', userId).select().single();
        if (note?.notion_page_id) {
          try {
            const userNotion = getNotionClient(req.profile.notion_token);
            await userNotion.pages.update({ page_id: note.notion_page_id, archived: true });
          } catch (err) { console.error('Notion archive failed:', err.message); }
        }
        return json(res, 200, { success: true });
      }
    }

    return json(res, 404, { error: 'Notion route not found' });
  } catch (error) {
    console.error("Notion API Error:", error);
    if (error.status === 401) {
      await supabaseAdmin.from('profiles').update({ notion_token: null, notion_workspace_id: null }).eq('id', userId);
      return json(res, 401, { error: 'Notion access revoked', action: 'reconnect_notion' });
    }
    return json(res, 500, { error: error.message });
  }
}

import { handleCors, json, requireAuth } from '../lib/middleware.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { getNotionClient, requireNotion, createDatabases, syncUserNotion, findExistingPeerLearnStructure } from '../lib/notion.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const url = req.url.split('?')[0];
  const baseUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  // ── CRON SYNC JOB (NO USER AUTH REQUIRED, VERIFIES CRON_SECRET) ──
  if (url === '/api/notion-sync' || url === '/api/notion/cron-sync') {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    const { data: users } = await supabaseAdmin.from('profiles')
      .select('id, notion_token, notion_todos_db_id, notion_events_db_id, notion_notes_db_id, notion_last_synced_at')
      .not('notion_token', 'is', null);

    if (!users) return json(res, 200, { synced: 0 });

    for (const user of users) {
      try {
        await syncUserNotion(user);
      } catch (err) {
        console.error(`Sync failed for user ${user.id}:`, err.message);
        if (err.status === 401) {
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
          }).eq('id', user.id);
        }
      }
    }

    return json(res, 200, { synced: users.length });
  }

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

      // With public OAuth, we can only create pages inside items the user shared.
      const userNotion = getNotionClient(tokenData.access_token);

      // ── Step 1: Try to find an existing "📚 PeerLearn" hub + databases ──
      const existing = await findExistingPeerLearnStructure(userNotion);

      let hubPageId = existing.hub_page_id;
      let dbs;

      if (hubPageId) {
        // Hub found – only create whichever databases are missing inside it
        console.log('Reusing existing PeerLearn hub:', hubPageId);
        dbs = await createDatabases(tokenData.access_token, hubPageId, {
          todos_db_id:  existing.todos_db_id,
          events_db_id: existing.events_db_id,
          notes_db_id:  existing.notes_db_id
        });
      } else {
        // ── Step 2: No hub found – create everything from scratch ──
        // Find the first accessible page or database to place the hub inside.
        let parentItem = null;
        for (let i = 0; i < 5; i++) {
          const searchRes = await userNotion.search({});
          parentItem = searchRes.results?.find(r => r.object === 'page') || searchRes.results?.[0];
          if (parentItem) break;
          await new Promise(r => setTimeout(r, 1500));
        }

        if (!parentItem) {
          throw new Error('No accessible pages or databases found. Please select at least one item when connecting Notion.');
        }

        // Create the "📚 PeerLearn" hub page
        const hubPage = await userNotion.pages.create({
          parent: parentItem.object === 'database'
            ? { database_id: parentItem.id }
            : { page_id: parentItem.id },
          properties: parentItem.object === 'database'
            ? { Name: { title: [{ text: { content: '📚 PeerLearn' } }] } }
            : { title: [{ text: { content: '📚 PeerLearn' } }] }
        });
        hubPageId = hubPage.id;

        // Create all 3 databases inside the new hub
        dbs = await createDatabases(tokenData.access_token, hubPageId);
      }

      // ── Store / update profile ──
      const { error: updateError } = await supabaseAdmin.from('profiles').update({
        notion_token: tokenData.access_token,
        notion_workspace_id: tokenData.workspace_id,
        notion_workspace_name: tokenData.workspace_name,
        notion_bot_id: tokenData.bot_id,
        notion_parent_page_id: hubPageId,
        notion_todos_db_id: dbs.todos_db_id,
        notion_events_db_id: dbs.events_db_id,
        notion_notes_db_id: dbs.notes_db_id,
        notion_connected_at: new Date().toISOString()
      }).eq('id', state);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

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
        last_synced_at: req.profile?.notion_last_synced_at,
        todos_db_id: req.profile?.notion_todos_db_id,
        events_db_id: req.profile?.notion_events_db_id,
        notes_db_id: req.profile?.notion_notes_db_id
      });
    }

    if (url === '/api/notion/disconnect' && req.method === 'POST') {
      const { error: discError } = await supabaseAdmin.from('profiles').update({
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
      if (discError) {
        throw new Error(`Profile update failed: ${discError.message}`);
      }
      return json(res, 200, { success: true });
    }

    // ── SYNC ──────────────────────────────────────────────
    if (url === '/api/notion/sync' && req.method === 'POST') {
      // Notion is the sole data store now, no Supabase sync required.
      return json(res, 200, { success: true });
    }

    // ── TODOS ──────────────────────────────────────────────
    if (url === '/api/notion/todos') {
      if (!requireNotion(req, res)) return;
      const userNotion = getNotionClient(req.profile.notion_token);

      if (req.method === 'GET') {
        try {
          const notionRes = await userNotion.databases.query({ database_id: req.profile.notion_todos_db_id });
          const todos = notionRes.results.map(page => ({
            id: page.id,
            title: page.properties['Name']?.title?.[0]?.text?.content || 'Untitled',
            status: page.properties['Status']?.status?.name || 'Not started',
            due_date: page.properties['Due Date']?.date?.start || null
          }));
          return json(res, 200, { todos });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'POST') {
        try {
          const { title, status, due_date } = req.body;
          const notionPage = await userNotion.pages.create({
            parent: { database_id: req.profile.notion_todos_db_id },
            properties: {
              'Name': { title: [{ text: { content: title || 'Untitled' } }] },
              'Status': { status: { name: status || 'Not started' } },
              'Due Date': due_date ? { date: { start: due_date } } : undefined
            }
          });
          return json(res, 201, { todo: { id: notionPage.id, title, status, due_date } });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'PATCH') {
        try {
          const { id, title, status, due_date } = req.body;
          const notionPage = await userNotion.pages.update({
            page_id: id,
            properties: {
              ...(title !== undefined && { 'Name': { title: [{ text: { content: title } }] } }),
              ...(status !== undefined && { 'Status': { status: { name: status } } }),
              ...(due_date !== undefined && { 'Due Date': due_date ? { date: { start: due_date } } : null })
            }
          });
          return json(res, 200, { success: true });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'DELETE') {
        try {
          await userNotion.pages.update({ page_id: req.body.id, archived: true });
          return json(res, 200, { success: true });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }
    }

    // ── EVENTS ─────────────────────────────────────────────
    if (url === '/api/notion/events') {
      if (!requireNotion(req, res)) return;
      const userNotion = getNotionClient(req.profile.notion_token);

      if (req.method === 'GET') {
        try {
          const notionRes = await userNotion.databases.query({ database_id: req.profile.notion_events_db_id });
          const events = notionRes.results.map(page => ({
            id: page.id,
            title: page.properties['Name']?.title?.[0]?.text?.content || 'Untitled',
            event_type: page.properties['Event Type']?.select?.name || 'Other',
            date: page.properties['Date']?.date?.start || null
          }));
          return json(res, 200, { events });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'POST') {
        try {
          const { title, event_type, date } = req.body;
          const notionPage = await userNotion.pages.create({
            parent: { database_id: req.profile.notion_events_db_id },
            properties: {
              'Name': { title: [{ text: { content: title || 'Untitled' } }] },
              'Event Type': { select: { name: event_type || 'Other' } },
              'Date': date ? { date: { start: date } } : undefined
            }
          });
          return json(res, 201, { event: { id: notionPage.id, title, event_type, date } });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'PATCH') {
        try {
          const { id, title, event_type, date } = req.body;
          const notionPage = await userNotion.pages.update({
            page_id: id,
            properties: {
              ...(title !== undefined && { 'Name': { title: [{ text: { content: title } }] } }),
              ...(event_type !== undefined && { 'Event Type': { select: { name: event_type } } }),
              ...(date !== undefined && { 'Date': date ? { date: { start: date } } : null })
            }
          });
          return json(res, 200, { success: true });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'DELETE') {
        try {
          await userNotion.pages.update({ page_id: req.body.id, archived: true });
          return json(res, 200, { success: true });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }
    }

    // ── PUBLIC NOTES ───────────────────────────────────────
    if (url === '/api/notion/public-notes') {
      const { user_id } = req.query;
      if (!user_id) return json(res, 400, { error: 'user_id required' });
      try {
        const { data: targetUser } = await supabaseAdmin
          .from('profiles')
          .select('notion_token, notion_notes_db_id')
          .eq('id', user_id)
          .single();
        if (!targetUser || !targetUser.notion_token || !targetUser.notion_notes_db_id) {
          return json(res, 200, { notes: [] });
        }
        const targetNotion = getNotionClient(targetUser.notion_token);
        const notionRes = await targetNotion.databases.query({
          database_id: targetUser.notion_notes_db_id,
          filter: { property: 'Public', checkbox: { equals: true } }
        });
        const notes = notionRes.results.slice(0, 15).map(page => ({
          id: page.id,
          url: page.url,
          title: page.properties['Name']?.title?.[0]?.text?.content || 'Untitled',
          subject: page.properties['Subject']?.select?.name || 'Other'
        }));
        return json(res, 200, { notes });
      } catch (err) {
        return json(res, 500, { error: err.message });
      }
    }

    // ── NOTES ──────────────────────────────────────────────
    if (url === '/api/notion/notes') {
      if (!requireNotion(req, res)) return;
      const userNotion = getNotionClient(req.profile.notion_token);

      if (req.method === 'GET') {
        try {
          const notionRes = await userNotion.databases.query({ database_id: req.profile.notion_notes_db_id });
          const notes = notionRes.results.slice(0, 15).map(page => ({
            id: page.id,
            url: page.url,
            title: page.properties['Name']?.title?.[0]?.text?.content || 'Untitled',
            subject: page.properties['Subject']?.select?.name || 'Other',
            is_public: page.properties['Public']?.checkbox || false
          }));
          return json(res, 200, { notes });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'POST') {
        try {
          const { title, subject } = req.body;
          const notionPage = await userNotion.pages.create({
            parent: { database_id: req.profile.notion_notes_db_id },
            properties: {
              'Name': { title: [{ text: { content: title || 'Untitled Note' } }] },
              'Subject': { select: { name: subject || 'General' } },
              'Public': { checkbox: false }
            }
          });
          return json(res, 201, { note: { id: notionPage.id, url: notionPage.url, title, subject } });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'PATCH') {
        try {
          const { id, title, subject, is_public } = req.body;
          const notionPage = await userNotion.pages.update({
            page_id: id,
            properties: {
              ...(title !== undefined && { 'Name': { title: [{ text: { content: title } }] } }),
              ...(subject !== undefined && { 'Subject': { select: { name: subject } } }),
              ...(is_public !== undefined && { 'Public': { checkbox: is_public } })
            }
          });
          return json(res, 200, { success: true });
        } catch (err) { return json(res, 500, { error: err.message }); }
      }

      if (req.method === 'DELETE') {
        try {
          await userNotion.pages.update({ page_id: req.body.id, archived: true });
          return json(res, 200, { success: true });
        } catch (err) { return json(res, 500, { error: err.message }); }
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

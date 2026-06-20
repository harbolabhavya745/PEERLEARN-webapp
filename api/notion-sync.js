import { supabaseAdmin } from '../lib/supabase.js';
import { getNotionClient } from '../lib/notion.js';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get all users with Notion connected
  const { data: users } = await supabaseAdmin.from('profiles')
    .select('id, notion_token, notion_todos_db_id, notion_events_db_id, notion_notes_db_id, notion_last_synced_at')
    .not('notion_token', 'is', null);

  if (!users) return res.status(200).json({ synced: 0 });

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

  res.status(200).json({ synced: users.length });
}

async function syncUserNotion(user) {
  const notion = getNotionClient(user.notion_token);
  const now = new Date().toISOString();

  // Todos
  if (user.notion_todos_db_id) {
    await syncDatabase(notion, user.notion_todos_db_id, user.id, 'todos', user.notion_last_synced_at, async (page) => {
      const title = page.properties['Name']?.title?.[0]?.text?.content;
      const status = page.properties['Status']?.status?.name;
      const dueDate = page.properties['Due Date']?.date?.start;
      return { title, status, due_date: dueDate };
    });
  }

  // Events
  if (user.notion_events_db_id) {
    await syncDatabase(notion, user.notion_events_db_id, user.id, 'events', user.notion_last_synced_at, async (page) => {
      const title = page.properties['Name']?.title?.[0]?.text?.content;
      const eventType = page.properties['Event Type']?.select?.name;
      const date = page.properties['Date']?.date?.start;
      return { title, event_type: eventType, date };
    });
  }

  // Notes
  if (user.notion_notes_db_id) {
    await syncDatabase(notion, user.notion_notes_db_id, user.id, 'study_notes', user.notion_last_synced_at, async (page) => {
      const title = page.properties['Name']?.title?.[0]?.text?.content;
      const subject = page.properties['Subject']?.select?.name;
      const isPublic = page.properties['Public']?.checkbox;
      // We skip content for now as it's hard to sync blocks backwards
      return { title, subject, is_public: isPublic, content: '(Synced from Notion - content not available)' };
    });
  }

  await supabaseAdmin.from('profiles').update({ notion_last_synced_at: now }).eq('id', user.id);
}

async function syncDatabase(notion, dbId, userId, table, lastSyncedAt, parsePage) {
  const filter = lastSyncedAt ? {
    timestamp: 'last_edited_time',
    last_edited_time: { after: lastSyncedAt }
  } : undefined;

  const res = await notion.databases.query({
    database_id: dbId,
    filter
  });

  for (const page of res.results) {
    const peerlearnId = page.properties['PeerLearn ID']?.rich_text?.[0]?.text?.content;
    const parsedData = await parsePage(page);
    
    if (page.archived) {
      if (peerlearnId) {
        await supabaseAdmin.from(table).delete().eq('id', peerlearnId);
      }
      continue;
    }

    if (!peerlearnId) {
      // Created in Notion -> Create in Supabase
      const { data } = await supabaseAdmin.from(table).insert({
        author_id: userId,
        ...parsedData,
        notion_page_id: page.id,
        notion_last_edited: page.last_edited_time
      }).select().single();
      
      // Write back PeerLearn ID to Notion
      if (data) {
        await notion.pages.update({
          page_id: page.id,
          properties: {
            'PeerLearn ID': { rich_text: [{ text: { content: data.id } }] }
          }
        });
      }
    } else {
      // Updated in Notion -> Update in Supabase
      await supabaseAdmin.from(table).update({
        ...parsedData,
        notion_last_edited: page.last_edited_time
      }).eq('id', peerlearnId).eq('author_id', userId);
    }
  }
}

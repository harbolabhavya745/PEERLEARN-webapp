import { supabaseAdmin } from '../lib/supabase.js';
import { syncUserNotion } from '../lib/notion.js';

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

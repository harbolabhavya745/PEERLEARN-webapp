import { Client } from '@notionhq/client';
import { supabaseAdmin } from './supabase.js';

export function getNotionClient(token) {
  return new Client({ auth: token });
}

export function requireNotion(req, res) {
  if (!req.profile?.notion_token) {
    res.status(403).json({
      error: 'Notion not connected',
      action: 'connect_notion',
      message: 'Please connect your Notion account to use this feature.'
    });
    return false;
  }
  return true;
}

/**
 * Lazily finds or creates the "📚 PeerLearn" Hub page and the Notes database inside it.
 * Uses polling to handle Notion's search indexing delays after OAuth.
 */
export async function ensureNotesDb(notion, profile) {
  if (profile.notion_notes_db_id) return profile.notion_notes_db_id;

  try {
    let hubPageId = profile.notion_parent_page_id;

    // 1. Find or create the Hub Page
    if (!hubPageId) {
      const searchRes = await notion.search({
        query: 'PeerLearn',
        filter: { property: 'object', value: 'page' }
      });

      const existingHub = searchRes.results.find(p => {
        const title = (p.properties?.title?.title ?? []).map(t => t.plain_text).join('');
        return title.includes('📚 PeerLearn');
      });

      if (existingHub) {
        hubPageId = existingHub.id;
      } else {
        // Need to create the Hub Page. Find a parent page first.
        let parentItem = null;
        for (let i = 0; i < 5; i++) {
          const allRes = await notion.search({});
          parentItem = allRes.results?.find(r => r.object === 'page' && r.parent?.type !== 'database_id') 
                    || allRes.results?.find(r => r.object === 'database') 
                    || allRes.results?.[0];
          
          if (parentItem) {
            break;
          }
          // Wait 2s for search index
          await new Promise(r => setTimeout(r, 2000));
        }

        if (!parentItem) {
          throw new Error('No accessible pages or databases found. Please select at least one item when connecting Notion.');
        }

        // We try to find the actual title property key if it's a database, but default to 'Name'
        let titleKey = 'Name';
        if (parentItem.object === 'database' && parentItem.properties) {
          const foundKey = Object.keys(parentItem.properties).find(k => parentItem.properties[k].type === 'title');
          if (foundKey) titleKey = foundKey;
        }

        const newHub = await notion.pages.create({
          parent: parentItem.object === 'database'
            ? { database_id: parentItem.id }
            : { page_id: parentItem.id },
          properties: parentItem.object === 'database'
            ? { [titleKey]: { title: [{ text: { content: '📚 PeerLearn' } }] } }
            : { title: [{ text: { content: '📚 PeerLearn' } }] }
        });
        hubPageId = newHub.id;
      }
      
      await supabaseAdmin.from('profiles').update({ notion_parent_page_id: hubPageId }).eq('id', profile.id);
    }

    // 2. Check if Notes DB already exists
    const searchDbRes = await notion.search({
      query: 'PeerLearn Notes',
      filter: { property: 'object', value: 'database' }
    });

    const existingDb = searchDbRes.results.find(db => {
      const title = (db.title ?? []).map(t => t.plain_text).join('');
      return title.includes('📝 PeerLearn Notes');
    });

    if (existingDb) {
      await supabaseAdmin.from('profiles').update({ notion_notes_db_id: existingDb.id }).eq('id', profile.id);
      return existingDb.id;
    }

    // 3. Create the Notes DB inside the Hub Page
    const newDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: hubPageId },
      title: [{ type: 'text', text: { content: '📝 PeerLearn Notes' } }],
      properties: {
        'Name': { title: {} },
        'Subject': { select: {
          options: [
            { name: 'Mathematics', color: 'blue' },
            { name: 'Physics', color: 'purple' },
            { name: 'Chemistry', color: 'green' },
            { name: 'Computer Science', color: 'orange' },
            { name: 'Other', color: 'default' }
          ]
        }},
        'Public': { checkbox: {} },
        'PeerLearn ID': { rich_text: {} }
      }
    });

    await supabaseAdmin.from('profiles').update({ notion_notes_db_id: newDb.id }).eq('id', profile.id);
    return newDb.id;
  } catch (err) {
    console.warn('ensureNotesDb failed:', err.message);
    throw err;
  }
}

export async function syncUserNotion(user) {
  const notion = getNotionClient(user.notion_token);
  const now = new Date().toISOString();

  // Notes
  if (user.notion_notes_db_id) {
    await syncDatabase(notion, user.notion_notes_db_id, user.id, 'study_notes', user.notion_last_synced_at, async (page) => {
      const title = page.properties['Name']?.title?.[0]?.text?.content;
      const subject = page.properties['Subject']?.select?.name;
      const isPublic = page.properties['Public']?.checkbox;
      return { title, subject, is_public: isPublic, content: '(Synced from Notion - content not available)' };
    });
  }

  await supabaseAdmin.from('profiles').update({ notion_last_synced_at: now }).eq('id', user.id);
}

export async function syncDatabase(notion, dbId, userId, table, lastSyncedAt, parsePage) {
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

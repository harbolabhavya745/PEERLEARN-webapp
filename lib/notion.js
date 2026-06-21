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
 * Searches the user's Notion workspace for an existing "📚 PeerLearn" hub page
 * and inspects its children for the three expected databases.
 *
 * Returns:
 *   {
 *     hub_page_id: string | null,
 *     todos_db_id: string | null,
 *     events_db_id: string | null,
 *     notes_db_id: string | null
 *   }
 *
 * Any value that is null means the corresponding resource was not found
 * and must be created.
 */
export async function findExistingPeerLearnStructure(notion) {
  try {
    // Search for pages whose title contains "PeerLearn"
    const searchRes = await notion.search({
      query: 'PeerLearn',
      filter: { property: 'object', value: 'page' }
    });

    // Find the hub page – title must start with "📚 PeerLearn"
    const hubPage = searchRes.results.find(page => {
      const titleParts = page.properties?.title?.title ?? [];
      const title = titleParts.map(t => t.plain_text).join('');
      return title.startsWith('📚 PeerLearn');
    });

    if (!hubPage) return { hub_page_id: null, todos_db_id: null, events_db_id: null, notes_db_id: null };

    const hubPageId = hubPage.id;

    // Fetch direct children of the hub page to look for our databases
    let todosDbId = null, eventsDbId = null, notesDbId = null;

    let cursor = undefined;
    do {
      const childRes = await notion.blocks.children.list({
        block_id: hubPageId,
        start_cursor: cursor,
        page_size: 100
      });

      for (const block of childRes.results) {
        if (block.type !== 'child_database') continue;
        const dbTitle = block.child_database?.title ?? '';
        if (dbTitle.startsWith('📋 PeerLearn Todos'))  todosDbId  = block.id;
        if (dbTitle.startsWith('📅 PeerLearn Events')) eventsDbId = block.id;
        if (dbTitle.startsWith('📝 PeerLearn Notes'))  notesDbId  = block.id;
      }

      cursor = childRes.has_more ? childRes.next_cursor : undefined;
    } while (cursor);

    return { hub_page_id: hubPageId, todos_db_id: todosDbId, events_db_id: eventsDbId, notes_db_id: notesDbId };
  } catch (err) {
    // Non-fatal – fall back to creating everything from scratch
    console.warn('findExistingPeerLearnStructure failed:', err.message);
    return { hub_page_id: null, todos_db_id: null, events_db_id: null, notes_db_id: null };
  }
}

/**
 * Creates whichever of the three PeerLearn databases are missing inside
 * the given hub page.  Pass the IDs already found so they are skipped.
 */
export async function createDatabases(token, parentPageId, existing = {}) {
  const notion = getNotionClient(token);

  let todosDbId  = existing.todos_db_id  ?? null;
  let eventsDbId = existing.events_db_id ?? null;
  let notesDbId  = existing.notes_db_id  ?? null;

  if (!todosDbId) {
    const todosDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: '📋 PeerLearn Todos' } }],
      properties: {
        'Name': { title: {} },
        'Status': { status: {} },
        'Due Date': { date: {} },
        'PeerLearn ID': { rich_text: {} }
      }
    });
    todosDbId = todosDb.id;
  }

  if (!eventsDbId) {
    const eventsDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: '📅 PeerLearn Events' } }],
      properties: {
        'Name': { title: {} },
        'Event Type': { select: {
          options: [
            { name: 'Study Session', color: 'blue' },
            { name: 'Exam', color: 'red' },
            { name: 'Workshop', color: 'green' },
            { name: 'Meetup', color: 'yellow' },
            { name: 'Other', color: 'default' }
          ]
        }},
        'Date': { date: {} },
        'PeerLearn ID': { rich_text: {} }
      }
    });
    eventsDbId = eventsDb.id;
  }

  if (!notesDbId) {
    const notesDb = await notion.databases.create({
      parent: { type: 'page_id', page_id: parentPageId },
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
    notesDbId = notesDb.id;
  }

  return {
    todos_db_id: todosDbId,
    events_db_id: eventsDbId,
    notes_db_id: notesDbId
  };
}

export async function syncUserNotion(user) {
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


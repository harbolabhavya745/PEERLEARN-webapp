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

export async function createDatabases(token, parentPageId) {
  const notion = getNotionClient(token);

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

  return {
    todos_db_id: todosDb.id,
    events_db_id: eventsDb.id,
    notes_db_id: notesDb.id
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


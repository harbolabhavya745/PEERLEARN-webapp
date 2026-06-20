import { Client } from '@notionhq/client';

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
      'Status': { status: {
        options: [
          { name: 'Not started', color: 'default' },
          { name: 'In progress', color: 'blue' },
          { name: 'Done', color: 'green' }
        ]
      }},
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


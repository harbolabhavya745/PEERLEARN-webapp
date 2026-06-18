import { supabaseAdmin } from '../lib/supabase.js';
import { handleCors, json, requireAuth } from '../lib/middleware.js';
import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  const ok = await requireAuth(req, res);
  if (!ok) return;

  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const NOTES_DB_ID = process.env.NOTION_NOTES_DB_ID;
  const TODOS_DB_ID = process.env.NOTION_TODOS_DB_ID;
  const EVENTS_DB_ID = process.env.NOTION_EVENTS_DB_ID;

  const url = req.url.split('?')[0];

  try {
    if (url === '/api/notion/notes' && req.method === 'POST') {
      const { title, content, subject, is_public } = req.body;
      let notionPageId = null;
      if (NOTES_DB_ID && process.env.NOTION_API_KEY) {
        const notionRes = await notion.pages.create({
          parent: { database_id: NOTES_DB_ID },
          properties: {
            "Title": { title: [{ text: { content: title || "Untitled Note" } }] },
            "Subject": { select: { name: subject || "General" } },
            "Author": { rich_text: [{ text: { content: req.user.id } }] }
          },
          children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content } }] } }]
        });
        notionPageId = notionRes.id;
      }
      const { data, error } = await supabaseAdmin.from('study_notes').insert({
        author_id: req.user.id, title, content, subject, is_public: !!is_public, notion_page_id: notionPageId
      }).select().single();
      if (error) throw error;
      return json(res, 201, { note: data });
    }

    if (url === '/api/notion/todos' && req.method === 'POST') {
      const { title, status, due_date } = req.body;
      let notionPageId = null;
      if (TODOS_DB_ID && process.env.NOTION_API_KEY) {
        const notionRes = await notion.pages.create({
          parent: { database_id: TODOS_DB_ID },
          properties: {
            "Title": { title: [{ text: { content: title || "Untitled Task" } }] },
            "Status": { status: { name: status || "Todo" } },
            "Assigned To": { rich_text: [{ text: { content: req.user.id } }] }
          }
        });
        notionPageId = notionRes.id;
      }
      const { data, error } = await supabaseAdmin.from('todos').insert({
        author_id: req.user.id, title, status, due_date, notion_page_id: notionPageId
      }).select().single();
      if (error) throw error;
      return json(res, 201, { todo: data });
    }

    if (url === '/api/notion/events' && req.method === 'POST') {
      const { title, event_type, date } = req.body;
      let notionPageId = null;
      if (EVENTS_DB_ID && process.env.NOTION_API_KEY) {
        const notionRes = await notion.pages.create({
          parent: { database_id: EVENTS_DB_ID },
          properties: {
            "Title": { title: [{ text: { content: title || "Untitled Event" } }] },
            "Event Type": { select: { name: event_type || "Study Session" } },
            "Date": { date: { start: date } },
            "Organizer": { rich_text: [{ text: { content: req.user.id } }] }
          }
        });
        notionPageId = notionRes.id;
      }
      const { data, error } = await supabaseAdmin.from('events').insert({
        author_id: req.user.id, title, event_type, date, notion_page_id: notionPageId
      }).select().single();
      if (error) throw error;
      return json(res, 201, { event: data });
    }

    if (url === '/api/notion/notes' && req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('study_notes').select('*').or(`author_id.eq.${req.user.id},is_public.eq.true`);
      if (error) throw error;
      return json(res, 200, { notes: data });
    }
    if (url === '/api/notion/todos' && req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('todos').select('*').eq('author_id', req.user.id);
      if (error) throw error;
      return json(res, 200, { todos: data });
    }
    if (url === '/api/notion/events' && req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('events').select('*').eq('author_id', req.user.id);
      if (error) throw error;
      return json(res, 200, { events: data });
    }

    return json(res, 404, { error: 'Notion route not found' });
  } catch (error) {
    console.error("Notion API Error:", error);
    return json(res, 500, { error: error.message });
  }
}

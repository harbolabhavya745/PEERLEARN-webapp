import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';
import fs from 'fs';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=')));
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*').not('notion_token', 'is', null);
  const profile = profiles[0];
  console.log("Events DB ID:", profile.notion_events_db_id);
  
  const notion = new Client({ auth: profile.notion_token });
  const res = await notion.databases.query({ database_id: profile.notion_events_db_id });
  console.log(`Found ${res.results.length} events in Notion:`);
  res.results.forEach(page => {
    console.log("- " + page.properties['Name']?.title?.[0]?.text?.content);
  });
}
check();

import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';
import fs from 'fs';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=')));
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*').not('notion_token', 'is', null);
  if (profiles.length === 0) { console.log("No profiles with tokens"); return; }
  const profile = profiles[0];
  console.log("Found token for profile:", profile.id);
  
  const notion = new Client({ auth: profile.notion_token });
  const resAll = await notion.search({});
  console.log(`Unfiltered search found ${resAll.results.length} results.`);
  resAll.results.forEach(r => console.log(" -", r.object, r.id, r.properties?.Name?.title?.[0]?.text?.content || r.title?.[0]?.text?.content));

  const resFiltered = await notion.search({ filter: { property: 'object', value: 'page' } });
  console.log(`Filtered search found ${resFiltered.results.length} results.`);
}
check();

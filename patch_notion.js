import fs from 'fs';
let content = fs.readFileSync('api/notion.js', 'utf8');

// 1. Fix baseUrl to handle Vercel production URLs correctly
content = content.replace(
  "  const baseUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\\/\\$/, '');",
  `  let baseUrl = 'http://localhost:3000';
  if (process.env.SITE_URL && process.env.SITE_URL !== 'http://localhost:3000') {
    baseUrl = process.env.SITE_URL.replace(/\\/\\$/, '');
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    baseUrl = \`https://\${process.env.VERCEL_PROJECT_PRODUCTION_URL}\`;
  } else if (process.env.VERCEL_URL) {
    baseUrl = \`https://\${process.env.VERCEL_URL}\`;
  } else if (req.headers.host) {
    baseUrl = \`http\${req.headers.host.includes('localhost') ? '' : 's'}://\${req.headers.host}\`;
  }`
);

// 2. Fix the client ID trimming (just in case they have spaces)
content = content.replace(
  "const clientId = process.env.NOTION_OAUTH_CLIENT_ID;",
  "const clientId = (process.env.NOTION_OAUTH_CLIENT_ID || '').trim();"
);

// 3. Fix the callback error redirect to include the message
content = content.replace(
  "res.writeHead(302, { Location: `${baseUrl}/#notion?error=oauth_failed` });",
  "res.writeHead(302, { Location: `${baseUrl}/#notion?error=oauth_failed&details=${encodeURIComponent(err.message)}` });"
);

// 4. Update the callback logic to bypass search delay and handle eventual consistency
content = content.replace(
  `        const searchRes = await userNotion.search({});
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
        dbs = await createDatabases(tokenData.access_token, hubPageId);`,
  `        const searchRes = await userNotion.search({ filter: { property: 'object', value: 'page' } });
          parentItem = searchRes.results?.[0];
          if (parentItem) break;
          const fallbackRes = await userNotion.search({});
          const fallbackPage = fallbackRes.results?.find(r => r.object === 'page');
          if (fallbackPage) {
            parentItem = fallbackPage;
            break;
          }
          await new Promise(r => setTimeout(r, 2000));
        }

        if (!parentItem) {
          throw new Error('No accessible pages or databases found. Please select at least one item when connecting Notion.');
        }

        parentPageId = parentItem.id;
        dbs = await createDatabases(tokenData.access_token, parentPageId);`
);

// 5. Inject the existing profile bypass
content = content.replace(
  `      // ── Step 1: Try to find an existing Notes database ──
      const existing = await findExistingPeerLearnStructure(userNotion);

      let dbs;
      let hubPageId = null;

      if (existing.notes_db_id) {
        // Notes database found
        console.log('Reusing existing PeerLearn Notes DB:', existing.notes_db_id);
        dbs = { notes_db_id: existing.notes_db_id };
      } else {
        // ── Step 2: No database found – create everything from scratch ──
        // Find the first accessible page or database to place the database inside.
        let parentItem = null;
        for (let i = 0; i < 5; i++) {`,
  `      // ── Step 1: Try to find an existing Notes database ──
      const { data: existingProfile } = await supabaseAdmin.from('profiles').select('notion_notes_db_id, notion_todos_db_id, notion_events_db_id').eq('id', state).single();
      
      let dbs = {};
      let parentPageId = null;

      if (existingProfile?.notion_notes_db_id) {
        try {
          await userNotion.databases.retrieve({ database_id: existingProfile.notion_notes_db_id });
          dbs.notes_db_id = existingProfile.notion_notes_db_id;
          dbs.todos_db_id = existingProfile.notion_todos_db_id;
          dbs.events_db_id = existingProfile.notion_events_db_id;
        } catch (e) {}
      }

      if (!dbs.notes_db_id) {
        const existing = await findExistingPeerLearnStructure(userNotion);
        if (existing.notes_db_id) {
          dbs = { notes_db_id: existing.notes_db_id, todos_db_id: existing.todos_db_id, events_db_id: existing.events_db_id };
        }
      }

      if (!dbs.notes_db_id) {
        // ── Step 2: No database found – create everything from scratch ──
        // Find the first accessible page or database to place the database inside.
        let parentItem = null;
        for (let i = 0; i < 7; i++) {`
);

// 6. Fix the update object
content = content.replace(
  `        notion_parent_page_id: hubPageId,
        notion_todos_db_id: dbs.todos_db_id,
        notion_events_db_id: dbs.events_db_id,`,
  `        notion_parent_page_id: parentPageId,
        notion_todos_db_id: dbs.todos_db_id || null,
        notion_events_db_id: dbs.events_db_id || null,`
);

fs.writeFileSync('api/notion.js', content);

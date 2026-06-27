import fs from 'fs';
import http from 'http';
import handler from './api/notion.js';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('=')));
for (const [k, v] of Object.entries(env)) process.env[k] = v;

const req = {
  url: '/api/notion/oauth',
  method: 'GET',
  headers: {
    host: 'localhost:3000',
    authorization: 'Bearer FAKE_TOKEN'
  }
};
const res = {
  setHeader: console.log,
  status: (code) => { console.log('STATUS', code); return res; },
  json: (data) => console.log('JSON', data),
  end: () => console.log('END')
};

handler(req, res).catch(console.error);

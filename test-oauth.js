import http from 'http';
import handler from './api/notion.js';

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

import { handler } from './build/handler.js';
import express from 'express';
import fs from 'fs';

const app = express();

// need pouchdb directory for SSR DB
const dir = './pouchdb';
!fs.existsSync(dir) && fs.mkdirSync(dir);

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
  res.end('ok');
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('listening on port', port);
});
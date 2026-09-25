import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.jpg':'image/jpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.xml':'application/xml','.pdf':'application/pdf'};
http.createServer(async (req,res) => {
  if (req.url.startsWith('/api/')) { res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'email_not_configured'}));return; }
  try {
    let name = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (name !== root && !name.startsWith(root + path.sep)) throw Error('Invalid path');
    if ((await stat(name)).isDirectory()) name=path.join(name,'index.html');
    const body=await readFile(name);res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream'});res.end(body);
  } catch { res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(path.join(root,'404.html'))); }
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));

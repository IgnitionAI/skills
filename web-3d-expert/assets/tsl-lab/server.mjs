import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';
const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.TSL_LAB_PORT ?? 8768);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json'};
http.createServer(async(req,res) => {
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root, '.'+(pathname==='/'?'/index.html':pathname));
    if(!path.startsWith(root+'/')) {res.writeHead(403).end();return;}
    const data=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream','Cache-Control':'no-store'}).end(data);
  } catch {res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Atelier TSL : http://127.0.0.1:${port}`));

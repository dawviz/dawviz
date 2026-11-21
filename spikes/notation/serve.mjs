// Máy chủ tĩnh tối thiểu cho các trang thử trong trình duyệt (chỉ localhost).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.map': 'application/json' };

export function serve(port = 0) {
  const srv = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^\/+/, '');
    if (p.startsWith('..')) { res.writeHead(403).end(); return; }
    // Cho phép import 'vexflow' trần trong trình duyệt qua importmap
    try {
      const body = await readFile(join(root, p));
      res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise((ok) => srv.listen(port, '127.0.0.1', () => ok({ srv, port: srv.address().port })));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const { port } = await serve(+(process.argv[2] ?? 8765));
  console.log('http://127.0.0.1:' + port);
}

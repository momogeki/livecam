// ローカル確認用サーバー（Vercelには不要。本番では使われません）
// 使い方:
//   1. このフォルダに .env を作って  YOUTUBE_API_KEY=あなたのキー  と1行書く
//   2. ターミナルで  node dev-server.mjs
//   3. ブラウザで  http://localhost:3000  を開く

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

// .env を読み込む
const envPath = path.join(dir, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
if (!process.env.YOUTUBE_API_KEY) {
  console.log('⚠ .env に YOUTUBE_API_KEY がありません。画面は開けますが検索はエラーになります。');
}

const { default: liveHandler } = await import('./api/live.js');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/live') {
    // Vercel風の req/res を用意して api/live.js をそのまま動かす
    const vres = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      setHeader(k, v) { res.setHeader(k, v); },
      json(o) {
        res.writeHead(this.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(o));
      },
    };
    return liveHandler({ query: Object.fromEntries(url.searchParams) }, vres);
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(dir, 'index.html')));
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => {
  console.log('▶ http://localhost:3000 を開いてください（止めるときは Ctrl+C）');
});

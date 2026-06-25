const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const ROOT = __dirname;

// ── Tencent Cloud COS config (from env vars or .env file) ──────────
const COS_BUCKET = process.env.COS_BUCKET || 'yxh-1446431912';
const COS_REGION = process.env.COS_REGION || 'ap-guangzhou';
const COS_SECRET_ID = process.env.COS_SECRET_ID || '';
const COS_SECRET_KEY = process.env.COS_SECRET_KEY || '';
const COS_BASE = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;

function getPresignedUrl(key, expiresSec = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 60;
  const end = now + expiresSec;
  const keyTime = `${start};${end}`;
  const signKey = crypto.createHmac('sha1', COS_SECRET_KEY).update(keyTime).digest('hex');
  const httpString = `get\n/${key}\n\nhost=${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com\n`;
  const sha1Http = crypto.createHash('sha1').update(httpString).digest('hex');
  const stringToSign = `sha1\n${keyTime}\n${sha1Http}\n`;
  const signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');
  const params = new URLSearchParams({
    'q-sign-algorithm': 'sha1',
    'q-ak': COS_SECRET_ID,
    'q-sign-time': keyTime,
    'q-key-time': keyTime,
    'q-header-list': 'host',
    'q-url-param-list': '',
    'q-signature': signature,
  });
  return `${COS_BASE}/${key}?${params.toString()}`;
}

// ── MIME types ────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
};

// ── COS 302 redirect for all media ────────────────────────────────
const MEDIA_PREFIXES = ['/videos/', '/sounds/'];

// ── Server ────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const urlPath = parsed.pathname;

  // API: /api/sign-url?key=...
  if (urlPath === '/api/sign-url' && req.method === 'GET') {
    const key = parsed.searchParams.get('key');
    if (!key) { res.writeHead(400); res.end('{"error":"Missing key"}'); return; }
    const signedUrl = getPresignedUrl(key);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ url: signedUrl, expiresIn: 3600 }));
    return;
  }

  // COS media → 302 redirect to presigned URL
  if (MEDIA_PREFIXES.some(p => urlPath.startsWith(p))) {
    const cosKey = urlPath.replace(/^\//, '');
    const signedUrl = getPresignedUrl(cosKey);
    res.writeHead(302, { Location: signedUrl, 'Cache-Control': 'no-cache' });
    res.end();
    return;
  }

  // Static files
  let file = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const ifaces = os.networkInterfaces();
  console.log(`\n  ✅ Server on http://localhost:${PORT}`);
  console.log(`  🎬 /videos/*  /sounds/*  → 302 → COS CDN\n`);
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  📱 Phone: http://${iface.address}:${PORT}`);
      }
    }
  }
  console.log('');
});

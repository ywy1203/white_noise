// music-proxy.js — 网易云音乐代理（支持扫码 + 手机号登录）
// 用法: node music-proxy.js
// 端口: 8787

const http = require('http');
const crypto = require('crypto');

const PORT = 8787;
const MUSIC_ORIGIN = 'https://music.163.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 NetEaseMusicMCP/0.3';
const TIMEOUT = 15000;
const NONCE = '0CoJUm6Qyw8W8jud';
const IV = '0102030405060708';
const PUBLIC_EXPONENT = '010001';
const MODULUS =
  '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7';

// ═══════════════════ Encryption ═══════════════════
function modPow(b, e, m) { let r = 1n, v = b % m, p = e; while (p > 0n) { if (p & 1n) r = (r * v) % m; p >>= 1n; v = (v * v) % m; } return r; }
function aesEncrypt(text, key) { const c = crypto.createCipheriv('aes-128-cbc', Buffer.from(key), Buffer.from(IV)); c.setAutoPadding(true); return Buffer.concat([c.update(text, 'utf8'), c.final()]).toString('base64'); }
function rsaEncrypt(text) { const rev = [...text].reverse().join(''); const h = Buffer.from(rev).toString('hex'); return modPow(BigInt('0x' + h), BigInt('0x' + PUBLIC_EXPONENT), BigInt('0x' + MODULUS)).toString(16).padStart(256, '0'); }
function randomKey() { const A = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let k = ''; for (let i = 0; i < 16; i++) k += A[crypto.randomInt(A.length)]; return k; }
function weapiPayload(data) { const sk = randomKey(); const t = JSON.stringify({ ...data, csrf_token: '' }); return new URLSearchParams({ params: aesEncrypt(aesEncrypt(t, NONCE), sk), encSecKey: rsaEncrypt(sk) }).toString(); }

// ═══════════════════ State ═══════════════════
let loginCookies = '';
let loginProfile = null;
let initCookies = '';

function clearLogin() { loginCookies = ''; loginProfile = null; }

async function ensureInitCookies() {
  if (initCookies) return;
  try {
    const res = await fetch(MUSIC_ORIGIN + '/', { headers: { 'User-Agent': UA } });
    const sc = res.headers.get('set-cookie');
    if (sc) initCookies = sc.split(',').map(c => c.split(';')[0].trim()).join('; ');
  } catch (e) { /* ok without */ }
}

// ═══════════════════ HTTP ═══════════════════
function readBody(req) { return new Promise((resolve, reject) => { let b = ''; req.on('data', c => b += c); req.on('end', () => resolve(b)); req.on('error', reject); }); }

async function postWeapi(path, data, extraHeaders = {}) {
  await ensureInitCookies();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const allCookies = [initCookies, loginCookies].filter(Boolean).join('; ');
    const hdrs = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, Referer: MUSIC_ORIGIN + '/', Origin: MUSIC_ORIGIN, ...extraHeaders };
    if (allCookies) hdrs['Cookie'] = extraHeaders['Cookie'] ? [allCookies, extraHeaders['Cookie']].filter(Boolean).join('; ') : allCookies;
    const res = await fetch(MUSIC_ORIGIN + path, { method: 'POST', headers: hdrs, body: weapiPayload(data), signal: ctrl.signal });

    // Only update cookies from login endpoints, NOT from normal music requests
    if (path.includes('/login/')) {
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) loginCookies = setCookie.split(',').map(c => c.split(';')[0].trim()).join('; ');
    }
    const body = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let json;
    try { json = JSON.parse(body); } catch (e) { throw new Error('Invalid JSON: ' + body.slice(0, 100)); }
    if (json.code && json.code !== 200) {
      if ([800, 801, 802, 803].includes(json.code)) return json;
      throw new Error(`NetEase code ${json.code}: ${json.message || ''}`);
    }
    return json;
  } finally { clearTimeout(timer); }
}

// ═══════════════════ Server ═══════════════════
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };

  try {
    const u = new URL(req.url, 'http://localhost');
    const p = u.pathname;
    const q = u.searchParams;

    // ──── Login ────

    if (p === '/api/login/status') return send(200, { loggedIn: !!loginProfile, profile: loginProfile });

    if (p === '/api/login/qr/key') {
      let data, lastErr = '';
      for (const ep of ['/weapi/login/qrcode/unikey', '/weapi/login/qr/key']) {
        try { data = await postWeapi(ep + '?csrf_token=', { type: 1 }); break; }
        catch (e) { lastErr = e.message; }
      }
      if (!data) { try { data = await postWeapi('/weapi/login/qrcode/unikey', { type: 1, csrf_token: '' }); } catch (e) {} }
      if (!data) return send(500, { error: '获取 key 失败: ' + lastErr });
      const unikey = data.data?.unikey || data.unikey;
      if (!unikey) return send(500, { error: '无法解析 unikey' });
      return send(200, { unikey });
    }

    if (p === '/api/login/qr/image') {
      const key = q.get('key'); if (!key) return send(400, { error: 'Missing key' });
      let data;
      for (const ep of ['/weapi/login/qr/create', '/weapi/login/qrcode/create']) {
        try { data = await postWeapi(ep + '?csrf_token=', { key, qrimg: true }); break; } catch (e) { }
      }
      const img = data?.data?.qrimg || data?.qrimg;
      if (img) { const buf = Buffer.from(img, 'base64'); res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': buf.length }); res.end(buf); return; }
      return send(200, { qrUrl: `https://music.163.com/login?codekey=${key}`, type: 'url' });
    }

    if (p === '/api/login/qr/check') {
      const key = q.get('key'); if (!key) return send(400, { error: 'Missing key' });
      let data;
      for (const ep of ['/weapi/login/qr/check', '/weapi/login/qrcode/check']) {
        try { data = await postWeapi(ep + '?csrf_token=', { key }); break; } catch (e) { }
      }
      if (!data) return send(500, { error: '检查失败' });
      const code = data.code || 0;
      console.log('[qr-check] code=' + code + ' key=' + key.slice(0, 8) + '... cookie=' + (data.cookie ? data.cookie.slice(0, 50) + '...' : 'null'));

      if (code === 803) {
        if (data.cookie) loginCookies = data.cookie;
        console.log('[qr-check] login success, cookies len=' + loginCookies.length);
        try {
          const pd = await postWeapi('/weapi/v1/user/detail?csrf_token=', {});
          loginProfile = pd.profile ? { nickname: pd.profile.nickname, avatarUrl: pd.profile.avatarUrl, userId: pd.profile.userId } : { nickname: '已登录', avatarUrl: '', userId: 0 };
          console.log('[qr-check] profile: ' + loginProfile.nickname);
        } catch (e) {
          loginProfile = { nickname: '已登录', avatarUrl: '', userId: 0 };
          console.log('[qr-check] profile fetch failed: ' + e.message);
        }
      }
      return send(200, { code, nickname: loginProfile?.nickname || null });
    }

    if (p === '/api/login/phone' && req.method === 'POST') {
      const body = await readBody(req); const { phone, password } = JSON.parse(body || '{}');
      if (!phone || !password) return send(400, { error: 'Missing phone or password' });
      const md5pw = crypto.createHash('md5').update(password).digest('hex');
      try {
        const data = await postWeapi('/weapi/login/cellphone?csrf_token=', { phone, password: md5pw, rememberLogin: 'true' });
        if (data.cookie) loginCookies = data.cookie;
        loginProfile = data.profile ? { nickname: data.profile.nickname, avatarUrl: data.profile.avatarUrl, userId: data.profile.userId } : (data.account ? { nickname: '用户', avatarUrl: '', userId: data.account.id } : null);
        return send(200, { ok: true, profile: loginProfile });
      } catch (e) { return send(500, { error: '登录失败: ' + e.message }); }
    }

    if (p === '/api/login/email' && req.method === 'POST') {
      const body = await readBody(req); const { email, password } = JSON.parse(body || '{}');
      if (!email || !password) return send(400, { error: 'Missing email or password' });
      const md5pw = crypto.createHash('md5').update(password).digest('hex');
      try {
        const data = await postWeapi('/weapi/login?csrf_token=', { username: email, password: md5pw, rememberLogin: 'true' });
        if (data.cookie) loginCookies = data.cookie;
        loginProfile = data.profile ? { nickname: data.profile.nickname, avatarUrl: data.profile.avatarUrl, userId: data.profile.userId } : null;
        return send(200, { ok: true, profile: loginProfile });
      } catch (e) { return send(500, { error: '登录失败: ' + e.message }); }
    }

    if (p === '/api/logout') { clearLogin(); return send(200, { ok: true }); }

    // ──── Music ────

    if (p === '/api/search') {
      const kw = q.get('q') || ''; if (!kw) return send(400, { error: 'Missing q' });
      const limit = Math.min(parseInt(q.get('limit')) || 10, 20);
      const data = await postWeapi('/weapi/search/get?csrf_token=', { s: kw, type: 1, limit, offset: 0, total: true });
      const songs = (data.result?.songs || []).map(s => ({ id: s.id, name: s.name, artists: (s.ar || []).map(a => a.name).join(', '), album: (s.al || {}).name || '', duration: Math.floor((s.dt || 0) / 1000), picUrl: (s.al || {}).picUrl || '' }));
      return send(200, { q: kw, total: data.result?.songCount || 0, songs });
    }

    if (p === '/api/song-url') {
      const id = q.get('id'); if (!id) return send(400, { error: 'Missing id' });
      let songUrl = null, br = 0;
      const levels = loginCookies ? ['lossless', 'hires', 'higher', 'standard'] : ['higher', 'standard'];
      for (const lv of levels) {
        try {
          const data = await postWeapi('/weapi/song/enhance/player/url/v1?csrf_token=', { ids: '[' + id + ']', level: lv, encodeType: 'mp3' });
          const item = data.data?.[0]; if (item && item.url) { songUrl = item.url; br = item.br || 0; break; }
        } catch (e) { }
      }
      if (!songUrl) { songUrl = `https://music.163.com/song/media/outer/url?id=${id}.mp3`; br = 128000; }
      return send(200, { id, url: songUrl, br });
    }

    if (p === '/api/lyric') {
      const id = q.get('id'); if (!id) return send(400, { error: 'Missing id' });
      const data = await postWeapi('/weapi/song/lyric?csrf_token=', { id: parseInt(id), lv: -1, tv: -1 });
      return send(200, { id, lyric: data.lrc?.lyric || '', tlyric: data.tlyric?.lyric || '' });
    }

    if (p === '/api/playlist-songs') {
      const id = q.get('id'); if (!id) return send(400, { error: 'Missing id' });
      const data = await postWeapi('/weapi/v6/playlist/detail?csrf_token=', { id: parseInt(id), n: 100000, s: 0 });
      const tracks = data.playlist?.tracks || [];
      return send(200, { playlist: { id: data.playlist?.id, name: data.playlist?.name }, total: tracks.length, songs: tracks.map(s => ({ id: s.id, name: s.name, artists: (s.ar || []).map(a => a.name).join(', '), album: (s.al || {}).name || '', duration: Math.floor((s.dt || 0) / 1000), picUrl: (s.al || {}).picUrl || '' })) });
    }

    send(404, { error: 'Not found' });
  } catch (e) {
    console.error('[music-proxy]', e.message);
    send(500, { error: e.message });
  }
});

server.listen(PORT, () => { console.log(`[music-proxy] http://localhost:${PORT} — QR/Phone/Email 登录 + 搜索/播放/歌词`); });

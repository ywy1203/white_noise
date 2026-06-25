import express from 'express'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const ROOT = path.resolve(__dirname, '..')

// COS config from env or .env
const COS_BUCKET = process.env.COS_BUCKET || 'yxh-1446431912'
const COS_REGION = process.env.COS_REGION || 'ap-guangzhou'
const COS_SECRET_ID = process.env.COS_SECRET_ID || ''
const COS_SECRET_KEY = process.env.COS_SECRET_KEY || ''
const COS_BASE = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`

function getPresignedUrl(key: string, expiresSec = 3600): string {
  const now = Math.floor(Date.now() / 1000)
  const start = now - 60
  const end = now + expiresSec
  const keyTime = `${start};${end}`
  const signKey = crypto.createHmac('sha1', COS_SECRET_KEY).update(keyTime).digest('hex')
  const httpString = `get\n/${key}\n\nhost=${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com\n`
  const sha1Http = crypto.createHash('sha1').update(httpString).digest('hex')
  const stringToSign = `sha1\n${keyTime}\n${sha1Http}\n`
  const signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')
  const params = new URLSearchParams({
    'q-sign-algorithm': 'sha1',
    'q-ak': COS_SECRET_ID,
    'q-sign-time': keyTime,
    'q-key-time': keyTime,
    'q-header-list': 'host',
    'q-url-param-list': '',
    'q-signature': signature,
  })
  return `${COS_BASE}/${key}?${params.toString()}`
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
}

const MEDIA_PREFIXES = ['/videos/', '/sounds/']

const app = express()

// API: COS signed URL
app.get('/api/sign-url', (req, res) => {
  const key = req.query.key as string
  if (!key) { res.status(400).json({ error: 'Missing key' }) }
  const signedUrl = getPresignedUrl(key)
  res.json({ url: signedUrl, expiresIn: 3600 })
})

// Media → 302 redirect to COS presigned URL
app.use((req, res, next) => {
  if (MEDIA_PREFIXES.some(p => req.path.startsWith(p))) {
    const cosKey = req.path.replace(/^\//, '')
    const signedUrl = getPresignedUrl(cosKey)
    res.redirect(302, signedUrl)
  } else {
    next()
  }
})

// Static: serve Vite build output (dist/) or src/ in dev
const staticDir = fs.existsSync(path.join(ROOT, 'dist')) ? path.join(ROOT, 'dist') : path.join(ROOT, 'public')
app.use(express.static(staticDir))

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  const os = require('os')
  const ifaces = os.networkInterfaces()
  console.log(`\n  ✅ WhiteNoise server on http://localhost:${PORT}\n`)
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  📱 Phone: http://${iface.address}:${PORT}`)
      }
    }
  }
  console.log('')
})

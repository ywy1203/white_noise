import express from 'express'
import path from 'path'
import fs from 'fs'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const ROOT = path.resolve(__dirname, '..')

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

const app = express()

// Static: serve Vite build output (dist/) or public/ in dev
const staticDir = fs.existsSync(path.join(ROOT, 'dist')) ? path.join(ROOT, 'dist') : ROOT
app.use(express.static(staticDir))

// Fallback to index.html for SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ✅ WhiteNoise server on http://localhost:${PORT}\n`)
  const os = require('os')
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  📱 Phone: http://${iface.address}:${PORT}`)
      }
    }
  }
  console.log('')
})

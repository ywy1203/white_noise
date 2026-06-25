import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import crypto from 'crypto'
import http from 'http'
import https from 'https'
import type { ServerResponse, IncomingMessage, RequestOptions } from 'http'
import 'dotenv/config'

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

/**
 * Proxy middleware: intercept /videos/* and /sounds/*,
 * fetch from COS presigned URL with Range forwarding, stream back.
 * Same-origin: eliminates CORS and Content-Disposition: attachment issues.
 */
export function cosProxyPlugin() {
  return {
    name: 'cos-proxy',
    configureServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        try {
          const url = req.url || ''
          if (!url.startsWith('/videos/') && !url.startsWith('/sounds/')) {
            return next()
          }
          const cosKey = url.slice(1).split('?')[0]
          const signedUrl = getPresignedUrl(cosKey)

          const parsed = new URL(signedUrl)
          const isHttps = parsed.protocol === 'https:'
          const fetcher = isHttps ? https : http

          const fetchOpts: RequestOptions = {
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: req.method || 'GET',
            headers: {} as Record<string, string>,
          }

          // Forward Range header for progressive video playback & seeking
          if (req.headers.range) {
            (fetchOpts.headers as Record<string, string>)['Range'] = req.headers.range as string
          }

          fetcher.get(fetchOpts, (cosRes: IncomingMessage) => {
            try {
              if (res.writableEnded) return
              const status = cosRes.statusCode ?? 200
              const headers: Record<string, string> = {
                'Content-Type': cosRes.headers['content-type'] || 'application/octet-stream',
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'public, max-age=3600',
                'Content-Disposition': 'inline',
              }
              if (cosRes.headers['content-range']) {
                headers['Content-Range'] = cosRes.headers['content-range'] as string
              }
              if (cosRes.headers['content-length']) {
                headers['Content-Length'] = cosRes.headers['content-length'] as string
              }
              res.writeHead(status, headers)
              cosRes.pipe(res)
            } catch {
              // ignore write errors to avoid crash
            }
          }).on('error', (err: Error) => {
            console.error('COS proxy error:', err.message)
            try {
              if (!res.writableEnded) {
                res.writeHead(502)
                res.end('Bad Gateway')
              }
            } catch {
              // ignore
            }
          })
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), cosProxyPlugin()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['three', 'three/examples/jsm/controls/OrbitControls.js'],
  },
})

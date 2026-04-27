// Unified server: serves the SPA bundle from dist/ AND the JSON+RealmEye API.
// Designed for single-process deployment on Railway / Fly / any Node host.
//
// Environment variables:
//   PORT           — port to bind (default 3001)
//   NODE_ENV       — "production" enables static serving + tighter CORS
//   ALLOWED_ORIGIN — comma-separated CORS allowlist (production only)
//
// Production: when NODE_ENV=production, serves dist/* with SPA catch-all and
// only allows configured origins. In dev, allows all origins so vite-on-:3006
// can proxy to us on :3001.

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')
// Auto-detect production mode: explicit NODE_ENV wins, otherwise infer from
// presence of a built dist/ folder (so `npm start` after `npm run build` Just
// Works without needing env vars locally).
const IS_PROD = process.env.NODE_ENV === 'production' || existsSync(DIST)

const app = express()
app.set('trust proxy', 1) // Railway / Vercel terminate TLS upstream
app.disable('x-powered-by')

// --- Security hardening ---------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // SPA loads from RealmEye CDN — let app set it
    crossOriginEmbedderPolicy: false,
  }),
)

// CORS: in production restrict to ALLOWED_ORIGIN (csv); in dev allow all.
const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(
  cors({
    origin: IS_PROD && allowedOrigins.length > 0
      ? (origin, cb) => {
          // same-origin requests have no Origin header — allow them.
          if (!origin) return cb(null, true)
          if (allowedOrigins.includes(origin)) return cb(null, true)
          return cb(new Error('CORS blocked'))
        }
      : true,
  }),
)

// Global rate limit — 200 requests / minute / IP. Tighter limit on the
// RealmEye proxy below.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/data') || req.path.startsWith('/assets'),
  }),
)

app.use(express.json({ limit: '256kb' }))

// gzip + brotli for everything 1KB+. items.json (511KB) → ~95KB on the wire.
app.use(compression({ threshold: 1024 }))

// --- Data loading ---------------------------------------------------------
function readJson(rel) {
  return JSON.parse(readFileSync(resolve(ROOT, rel), 'utf-8'))
}

let ITEMS = []
let CLASSES = []
try { ITEMS = readJson('product/data/items.json') } catch { console.warn('items.json not found yet') }
try { CLASSES = readJson('product/data/classes.json') } catch { console.warn('classes.json not found yet') }

// --- API endpoints --------------------------------------------------------
app.get('/api/health', (_, res) =>
  res.json({ ok: true, items: ITEMS.length, classes: CLASSES.length, env: IS_PROD ? 'production' : 'development' }),
)

app.get('/api/items', (req, res) => {
  const { type, classId, rarity, weaponType, abilityType, search, sort = 'name' } = req.query
  let result = ITEMS.slice()
  if (type) result = result.filter((i) => i.type === type)
  if (classId) result = result.filter((i) => Array.isArray(i.classes) && i.classes.includes(classId))
  if (rarity) result = result.filter((i) => i.rarity === rarity)
  if (weaponType) result = result.filter((i) => i.weaponType === weaponType)
  if (abilityType) result = result.filter((i) => i.abilityType === abilityType)
  if (search) {
    const q = String(search).toLowerCase()
    result = result.filter((i) => i.name.toLowerCase().includes(q))
  }
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'tier-desc') result.sort((a, b) => (b.tierNumeric ?? 99) - (a.tierNumeric ?? 99))
  else if (sort === 'tier-asc') result.sort((a, b) => (a.tierNumeric ?? 99) - (b.tierNumeric ?? 99))
  res.json({ count: result.length, items: result })
})

app.get('/api/items/:id', (req, res) => {
  const item = ITEMS.find((i) => i.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'not found' })
  res.json(item)
})

app.get('/api/classes', (_, res) => res.json({ classes: CLASSES }))

app.get('/api/classes/:id', (req, res) => {
  const cls = CLASSES.find((c) => c.id === req.params.id)
  if (!cls) return res.status(404).json({ error: 'not found' })
  res.json(cls)
})

// RealmEye proxy — strict rate limit because it makes an outbound network call.
const realmEyeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many RealmEye imports — please wait a minute.' },
})

app.post('/api/inventory/realmeye-import', realmEyeLimiter, async (req, res) => {
  const { username } = req.body ?? {}
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username required' })
  }
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)
  if (!safe) return res.status(400).json({ error: 'invalid username' })

  // 8s timeout on outbound fetch — RealmEye sometimes hangs.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)

  try {
    const url = `https://www.realmeye.com/player/${encodeURIComponent(safe)}`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OryxLab/1.0)' },
      signal: ctrl.signal,
    })
    clearTimeout(timer)

    if (r.status === 404) {
      return res.status(404).json({ error: 'profile not found' })
    }
    if (!r.ok) {
      return res.status(502).json({ error: 'RealmEye unavailable', upstreamStatus: r.status })
    }

    const html = await r.text()
    const items = []
    const equipRe = /<a href="\/wiki\/([^"]+)"><img alt="([^"]+)"[^>]+src="(\/s\/a\/img\/wiki\/i\/[^"]+)"[^>]*class="img-responsive"/g
    let m
    while ((m = equipRe.exec(html)) !== null) {
      items.push({ slug: m[1], name: m[2], imageUrl: `https://www.realmeye.com${m[3]}` })
    }
    const charsRe = /<a class="entity-name" href="\/player\/[^"]+\/[^"]+">([^<]+)<\/a>/g
    const characters = []
    let cm
    while ((cm = charsRe.exec(html)) !== null) characters.push(cm[1])

    // Detect private profile: page exists but lists no items + no characters.
    const isPrivate = items.length === 0 && characters.length === 0 && /This profile is private/i.test(html)

    res.json({
      username: safe,
      isPrivate,
      preview: {
        username: safe,
        vaultCount: items.length,
        characterCount: characters.length,
        characters: characters.map((name, i) => ({
          id: `char-${i}`, classId: name.toLowerCase(), className: name, equippedItems: [],
        })),
        delta: { added: items.length, removed: 0, unchanged: 0 },
      },
      items,
    })
  } catch (e) {
    clearTimeout(timer)
    if (e?.name === 'AbortError') {
      return res.status(504).json({ error: 'RealmEye request timed out' })
    }
    res.status(500).json({ error: String(e?.message ?? e) })
  }
})

// --- Static SPA serving (production) -------------------------------------
if (IS_PROD && existsSync(DIST)) {
  app.use(
    express.static(DIST, {
      etag: true,
      lastModified: true,
      maxAge: '1d',
      // Hashed asset filenames safely cache forever.
      setHeaders: (res, filePath) => {
        if (/\/assets\/.+\.(js|css|woff2?)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    }),
  )

  // Also serve the data/ folder (1500 items, classes, sets) under hash-immune paths.
  app.use('/data', express.static(resolve(DIST, 'data'), { maxAge: '1h' }))

  // SPA catch-all: unknown non-/api routes return index.html so React Router
  // can resolve them client-side.
  app.get(/^(?!\/api).*/, (_, res) => {
    res.sendFile(resolve(DIST, 'index.html'))
  })
}

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, '0.0.0.0', () =>
  console.log(`OryxLab server on :${PORT} (${IS_PROD ? 'production' : 'development'})`),
)

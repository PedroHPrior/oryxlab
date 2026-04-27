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

    // RealmEye now uses CSS sprite sheets instead of <img> tags. Each item
    // is rendered as `<a href="/wiki/<slug>"><span class="item ..." title="<name>"`.
    // Title sometimes carries a rarity prefix ("Legendary ", "Rare ",
    // "Uncommon ") which we strip; tier suffix ("T13", "UT") is kept.
    const decodeHtml = (s) =>
      s
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
    const items = []
    const seen = new Set()
    const itemRe = /<a href="\/wiki\/([^"]+)"[^>]*>\s*<span class="item[^"]*"[^>]*title="([^"]+)"/g
    let m
    while ((m = itemRe.exec(html)) !== null) {
      const slug = m[1]
      if (seen.has(slug)) continue
      // Skip non-equipment links like /wiki/realm-of-the-mad-god.
      if (slug === 'realm-of-the-mad-god' || slug === 'backpack') continue
      seen.add(slug)
      const titleRaw = decodeHtml(m[2].split('\n')[0]).trim()
      const name = titleRaw
        .replace(/^(Legendary|Rare|Uncommon|Common|Mythical)\s+/i, '')
        // Strip trailing tier marker so we land on the bare item name (engine
        // resolves tier from items.json).
        .replace(/\s+(T\d{1,2}|UT|ST|Talisman)$/i, '')
        .trim()
      items.push({
        slug,
        name,
        imageUrl: `https://www.realmeye.com/wiki/${slug}`,
      })
    }

    // Characters: extract class + equipped items from each character row.
    // Each row in the characters table is structured as:
    //   <td>#</td><td>CLASS</td><td>LVL</td><td>FAME</td><td>EXP</td>
    //   <td>EQUIPPED_ITEMS</td>
    // We grab the 5th <td> and pull all wiki-linked items from it.
    const characters = []
    const charClasses = ['Wizard','Necromancer','Mystic','Priest','Sorcerer','Summoner','Druid','Archer','Huntress','Bard','Knight','Paladin','Warrior','Rogue','Trickster','Assassin','Ninja','Samurai','Kensei']
    const charItemRe = new RegExp(
      `<td>(${charClasses.join('|')})<\\/td>\\s*` +
      `<td[^>]*>\\d+<\\/td>\\s*` +
      `<td[^>]*>[\\d,]+<\\/td>\\s*` +
      `<td[^>]*>[\\d,]+<\\/td>\\s*` +
      `<td[^>]*>([\\s\\S]*?)<\\/td>`,
      'g',
    )
    let cm
    let charIdx = 0
    while ((cm = charItemRe.exec(html)) !== null) {
      const className = cm[1]
      const equipBlock = cm[2]
      const equipRe = /<a href="\/wiki\/([^"]+)"[^>]*>\s*<span class="item[^"]*"[^>]*title="([^"]+)"/g
      const equippedItems = []
      let im
      while ((im = equipRe.exec(equipBlock)) !== null) {
        const slug = im[1]
        if (slug === 'backpack' || slug === 'realm-of-the-mad-god') continue
        const titleRaw = decodeHtml(im[2].split('\n')[0]).trim()
        const name = titleRaw
          .replace(/^(Legendary|Rare|Uncommon|Common|Mythical)\s+/i, '')
          .replace(/\s+(T\d{1,2}|UT|ST|Talisman)$/i, '')
          .trim()
        equippedItems.push({ slug, name })
      }
      characters.push({
        id: `char-${charIdx++}`,
        classId: className.toLowerCase(),
        className,
        equippedItems,
      })
    }

    // Detect private profile: explicit message OR no items + no characters.
    const isPrivate =
      /This profile is private/i.test(html) ||
      (items.length === 0 && characters.length === 0)

    res.json({
      username: safe,
      isPrivate,
      preview: {
        username: safe,
        vaultCount: items.length,
        characterCount: characters.length,
        characters,
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
      // ETags + If-None-Match revalidation are explicitly disabled on assets:
      // a transient 5xx during deploy rollover ends up cached in browsers
      // alongside the file's etag, and on subsequent visits the browser
      // sends If-None-Match → server returns 304 → browser serves the
      // poisoned 500 from disk cache. Without etags every request gets a
      // fresh 200 + new bytes.
      etag: false,
      lastModified: false,
      maxAge: 0,
      setHeaders: (res, filePath) => {
        // Hashed asset filenames are content-addressed → safe to cache forever.
        if (/\/assets\/.+\.(js|css|woff2?)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          return
        }
        // index.html is the *only* place new asset hashes are referenced —
        // if a CDN/browser caches a stale copy, the page will request asset
        // URLs from the previous deploy that no longer exist. Force
        // revalidation on every load.
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate')
        }
      },
    }),
  )

  // Also serve the data/ folder (1500 items, classes, sets) under hash-immune paths.
  app.use('/data', express.static(resolve(DIST, 'data'), { maxAge: '1h' }))

  // SPA catch-all: unknown non-/api routes return index.html so React Router
  // can resolve them client-side.
  //
  // Hard guard for /assets/* — those are hashed bundles served by
  // express.static above. If a request reaches the catch-all for an /assets/
  // path it means the file wasn't on disk yet (deploy rollover race), and
  // returning index.html with `Content-Type: text/html` would let Chrome
  // refuse to apply it as CSS/JS AND let the CDN cache the wrong response
  // for a year (since the asset URL carries an `immutable` header upstream).
  // Respond 503 with explicit `no-store` so neither Fastly nor browsers
  // cache the failure — clients retry and get the asset on a healthy edge.
  app.get(/^(?!\/api).*/, (req, res) => {
    if (req.path.startsWith('/assets/')) {
      res.setHeader('Cache-Control', 'no-store, must-revalidate')
      return res.status(503).type('text/plain').send('Asset not ready (deploy in progress)')
    }
    res.setHeader('Cache-Control', 'no-cache, must-revalidate')
    res.sendFile(resolve(DIST, 'index.html'))
  })
}

const PORT = Number(process.env.PORT ?? 3001)
app.listen(PORT, '0.0.0.0', () =>
  console.log(`OryxLab server on :${PORT} (${IS_PROD ? 'production' : 'development'})`),
)

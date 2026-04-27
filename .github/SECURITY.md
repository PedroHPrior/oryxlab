# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in OryxLab, please report it
responsibly:

1. **Do not** open a public GitHub issue.
2. Email **pedrohpk17@gmail.com** with:
   - A description of the vulnerability.
   - Steps to reproduce.
   - Potential impact.
3. We aim to acknowledge within 48 hours and ship a fix within 7 days for
   high-severity issues.

## Scope

In scope:
- The hosted app at `www.oryxlab.app` (and the Railway preview URL it sits
  behind).
- The Express API endpoints (`/api/*`).
- Build and deploy pipeline (Dockerfile, Railway config).
- Code in this repo that handles user input (RealmEye proxy, share-state
  decoding, file imports).

Out of scope:
- RealmEye.com itself — please report those directly to RealmEye.
- Issues that require physical access to a user's device.
- Brute-force / DoS — the API has rate limiting; if you find a way past it
  that's in scope, otherwise it's expected behavior.

## Hardening already in place

### Headers (via `helmet`)
- **Content-Security-Policy**: explicit allowlist — 'self' + RealmEye
  sprite CDN, Google Fonts, Plausible analytics. `frameSrc: 'none'`,
  `objectSrc: 'none'`, no eval / new Function.
- **Strict-Transport-Security**: HSTS with `includeSubDomains`.
- **X-Content-Type-Options**: nosniff.
- **X-Frame-Options**: DENY (anti-clickjacking).
- **Referrer-Policy**: no-referrer.
- **X-DNS-Prefetch-Control**: off.

### Rate limits (`express-rate-limit`)
- 200 req/min/IP globally.
- 10 req/min/IP on `/api/inventory/realmeye-import` (the only outbound
  proxy). Static assets (`/data`, `/assets`) are skipped.

### Input handling
- Username sanitization on `/api/inventory/realmeye-import`:
  `[a-zA-Z0-9_-]` only, capped at 32 chars before URL-encoding.
- `express.json({ limit: '256kb' })` caps request body size.
- 8s `AbortController` timeout on outbound RealmEye fetches.
- `app.set('trust proxy', 1)` so rate-limit and HSTS see the real client
  IP behind Railway's TLS terminator (not the proxy itself).

### Origins
- CORS allowlist via `ALLOWED_ORIGIN` env var in production. In dev
  mode, all origins are allowed so the Vite dev server can talk to it.
- `x-powered-by` header disabled.

### What we don't have to defend
- **No auth, no sessions** — no credentials anywhere, no auth-bypass
  surface, no CSRF (no state-changing endpoints).
- **No database** — no SQLi, no NoSQL injection, no privilege-escalation
  through stored data.
- **No file upload to disk** — inventory JSON imports are parsed
  client-side and never sent to the server.
- **localStorage is plain-text** but contains no secrets — only build
  configurations and item ownership flags. A user can dump their own
  localStorage and leak nothing about anyone else.

### Supply chain
- `npm audit` is part of the editing checklist. At time of last release
  there are 4 known build-time-only vulnerabilities in the dependency
  graph (all in `serialize-javascript` reached transitively via
  `vite-plugin-pwa` → `workbox-build`). They affect manifest-generation
  during build, never the runtime bundle, and the only attack vector
  would be source code an attacker has already committed — out of scope.

## What we don't store

- Passwords, tokens, or any credentials.
- RealmEye account credentials — we only proxy the public profile page.
- Email addresses, IP addresses, or analytics.

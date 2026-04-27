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

- `helmet` middleware sets standard security headers (CSP, HSTS, no-sniff).
- `express-rate-limit` caps:
  - 200 req/min/IP globally
  - 10 req/min/IP on `/api/inventory/realmeye-import` (the only outbound proxy)
- 8s timeout + AbortController on outbound RealmEye fetches.
- Username sanitization: `[a-zA-Z0-9_-]` only, capped at 32 chars.
- CORS allowlist via `ALLOWED_ORIGIN` env var in production.
- localStorage data is plain-text but contains no secrets — only build
  configurations and item ownership flags.
- No authentication = no auth bypass surface. Builds saved client-side.

## What we don't store

- Passwords, tokens, or any credentials.
- RealmEye account credentials — we only proxy the public profile page.
- Email addresses, IP addresses, or analytics.

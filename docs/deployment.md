# Deployment

OryxLab ships as a single Express container that serves both the static SPA
and the JSON/RealmEye-proxy API. The production site lives on Railway.

- **Production**: <https://www.oryxlab.app/app>
- **Health**: <https://www.oryxlab.app/api/health>
- **Hosting**: Railway · build via `Dockerfile` · auto-deploy from `main`

---

## Local

```bash
npm ci
npm run dev:all       # Vite (5173) + Express (3001) in parallel
```

The Vite dev server proxies `/api/*` to `http://localhost:3001` so the SPA
hits the same routes locally that it hits in production.

---

## Railway

Railway picks up the `Dockerfile` in the repo root. The custom Dockerfile
exists specifically because Nixpacks's cache-mount layer hits an `EBUSY`
error on this project's npm-ci step. Don't switch back to Nixpacks unless
you've verified the cache-mount issue is gone.

### Environment variables

| Var               | Required | Notes                                                     |
|-------------------|----------|-----------------------------------------------------------|
| `NODE_ENV`        | yes      | Always `production` in Railway. Toggles helmet + caching. |
| `PORT`            | yes      | Provided by Railway automatically.                        |
| `ALLOWED_ORIGIN`  | optional | Tightens CORS allow-list. Defaults to the Railway URL.    |

### Cost guard-rails

Railway billing scales with traffic, so it's worth setting two things up:

1. **Usage Limit** — Railway → project → **Usage Limits**. A hard cap caps
   the bill regardless of load.
2. **Email alerts** — same panel. Notifications at 50% / 80% / 100%.

The `/api` routes are already protected by:

- `express-rate-limit` (60 req/min per IP — see `server/index.mjs`)
- A 5-minute in-process cache for the RealmEye proxy
- Gzip + `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=86400`
  on the JSON catalog routes

The most likely bottleneck under sustained load is *bandwidth*, not CPU. A
single full catalog response is ~600 KB gzipped, so 100 GB of egress equals
roughly 170k cold loads.

### Custom domain

Once you've bought a domain (e.g. `oryxlab.app`):

1. Railway → service → **Settings → Domains → Custom Domain**
2. Paste the domain, copy the CNAME target Railway shows you
3. At the registrar, add a CNAME record:
   - Host: `@` (or `www`, or both)
   - Value: the Railway-provided target (looks like `xxx.up.railway.app`)
4. Wait a few minutes for DNS propagation; Railway provisions a Let's Encrypt
   cert automatically once the CNAME resolves
5. Update the canonical/OG/Twitter URLs in `index.html` to the new domain
6. Update `ALLOWED_ORIGIN` env var if you want to keep CORS strict
7. Update the Plausible `data-domain` attribute in `index.html` to match

The auto-close-PRs workflow and analytics work regardless of domain — they
key on the GitHub repo and the request `Host` header respectively.

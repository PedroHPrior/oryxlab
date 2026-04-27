# OryxLab — DPS Calculator & Build Comparator for Realm of the Mad God

[![CI](https://github.com/PedroHPrior/oryxlab/actions/workflows/ci.yml/badge.svg)](https://github.com/PedroHPrior/oryxlab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Build, compare, and optimize ROTMG characters with theorycrafter-grade calculation fidelity wrapped in a UI fast enough to answer *"is this drop an upgrade?"* in seconds.

**🚀 Live:** <https://oryxlab-production.up.railway.app/app>

**🤝 Contributing:** Wrong stats on an item? Wrong class assignment? Idea for a new feature? See [CONTRIBUTING.md](CONTRIBUTING.md) — most data fixes are 5-minute one-liners.

---

## Highlights

- **1,500 real ROTMG items** scraped from RealmEye with verified base damage, RoF, range, classes, procs.
- **100 ST sets** with parsed full-set stat bonuses (engine applies them when all components are equipped).
- **19 classes** with real portraits, base/cap stats, and weapon/ability/armor compatibility.
- **Validated DPS engine** — Crystal Wand on maxed Wizard lands ~1,100 DPS, matching community calculators.
- **Beam-search optimizer** with three modes (BIS, With My Inventory, With Constraints) — sub-100ms for any class.
- **RealmEye import** — paste your username, get your vault + characters parsed (production-grade rate-limit + timeout).
- **Quick compare** — pick 2–4 items in the catalog, get a verdict ("Doom Bow wins on DPS, +47% vs Crystal Wand") with stats + DPS-vs-defense chart.
- **PWA** — installable, works offline after first visit.

## Try it locally

```bash
npm install

# Dev with backend (RealmEye import works):
npm run dev:all

# Or static-only:
npm run dev
```

Open <http://localhost:3000/app>.

## Run tests

```bash
npm test                  # one-shot
npm run test:watch        # watch mode
npm run test:coverage     # coverage report
npm run typecheck         # TypeScript strict-check
```

## Deploy to Railway

1. Push this repo to GitHub.
2. Create a new Railway project from the repo. Railway auto-detects Node and uses `railway.json`.
3. Set the optional env var `ALLOWED_ORIGIN` to your custom domain (comma-separated for multiple). If unset, CORS is permissive in non-production.
4. Healthcheck is wired to `/api/health` with a 100s timeout.

The single `npm start` command boots one process that serves both the SPA bundle from `dist/` and the `/api/*` endpoints. `NODE_ENV=production` is detected automatically when `dist/` is present.

## Architecture

```
oryxlab/
├── src/
│   ├── app/
│   │   ├── OryxLabApp.tsx       Top-level state container + provider
│   │   ├── ErrorBoundary.tsx    Global crash recovery
│   │   ├── api.ts               Static-or-backend fetch client
│   │   ├── storage.ts           localStorage with versioned migrations
│   │   ├── share.ts             URL state encoding (gzip + base64)
│   │   ├── logger.ts            Namespaced logger (silent in prod for non-errors)
│   │   ├── sw.ts                Service-worker registration
│   │   ├── useBuildHistory.ts   Cmd-Z undo/redo for the editor
│   │   └── routes/              5 route components
│   ├── engine/
│   │   ├── dps.ts               Pure-functional DPS engine
│   │   ├── optimizer.ts         Beam-search build optimizer
│   │   ├── optimizer.worker.ts  Web Worker wrapper
│   │   └── optimizer-client.ts  Main-thread client with sync fallback
│   ├── shell/components/        AppShell, MainNav, ShellActions, ScenarioBar, OryxLogo
│   └── sections/
│       ├── _shared/             ItemSprite, ClassPortrait, Stat, TierBadge, …
│       ├── comparator/          BuildColumn, FocusView, TableView, DpsCurveChart, SlotPicker, …
│       ├── build-editor/        BuildEditorView with live stat sources
│       ├── catalog/             CatalogView, ItemDetailModal, QuickComparePanel
│       ├── optimizer/
│       └── inventory/
├── server/index.mjs             Express server (API + static SPA)
├── api/inventory-import.mjs     Vercel-style serverless proxy (also lives in /server)
├── scripts/                     RealmEye scrapers (one-shot + delta)
├── product/data/                Source-of-truth: items.json, classes.json, sets.json, balance.json
├── public/data/                 Bundled JSON shipped to clients (trimmed for size)
└── tests/                       Engine + components + routes + validation suites
```

## DPS engine

The pure-functional engine lives in `src/engine/dps.ts`:

```ts
function computeDerivedStats({
  build,      // class + equipped items + exaltations
  scenario,   // target def, statuses, party buffs
  classDef,   // base stats and caps
  itemMap,    // catalog
  itemSets,   // optional set definitions for set bonuses
}): DerivedStats
```

Output: `dps`, `dpsAtZeroDef`, `ehp`, all stats, time-to-kill, and a 17-point `dpsCurve` from def 0 → 80.

**What the engine models:**

- ATT linear modifier `att / 50`
- DEX RoF modifier `0.5 + 1.5 × min(dex, 100) / 75`
- Hit rate by weapon range
- Multi-shot directional factor (0.80 for katanas)
- AoE multiplier (1.6×) and piercing/wavy/parametric/boomerang (1.10×)
- Class multipliers — Trickster 1.6×, Summoner 1.4×, Necro 1.15×, etc.
- Party buffs — additive flat stats + multiplicative damage (paladinSeal, warriorHelm, bardInspire/Crescendo/Encore)
- Status effects — exposed +20%, cursed +25%, armorBroken bypasses def
- Weapon proc damage — `procRate × procDamage` added per shot
- Ability damage — spells + skulls + quivers contribute `damage / cycleTime`, bottlenecked by `mpCost / mpRegen`
- Inflict-status tags — apply uptime-weighted bonus when scenario doesn't already have the status
- Self-buff tags — small DPS multipliers for berserk / damaging / inspired / speedy
- Set bonuses — full-set stat contributions
- Min damage rule — at least 10% of raw damage even at high defense

All tunable constants are in `product/data/balance.json` so they can be iterated without touching code.

**Known limitations:**
- Per-item unique mechanics (T14 HP-threshold scaling, Sigil of the Rhino transform, Skuld stack-based effects) are not modeled — the long tail.
- Range/projectile lifetime affects hit rate but not yet ground-truth target coverage geometry.

See `tests/engine/dps.test.ts` and `tests/validation/full-validation.test.ts` for the validation suite — the latter spot-checks Crystal Wand, Doom Bow, Staff of Esben, and runs the optimizer for all 19 classes.

## Re-scraping data

```bash
node scripts/scrape-items.mjs                  # ~7 min for 1.5K items from RealmEye index pages
node scripts/scrape-classes.mjs                # ~30s for 19 classes
node scripts/scrape-sets.mjs                   # ~80s for 100 ST sets
node scripts/rescrape-weapon-damage.mjs        # ~6 min — corrects base damage from awakened mis-attribution
node scripts/backfill-mpcost.mjs               # ~2 min — adds mpCost to damaging abilities
node scripts/scrape-procs.mjs                  # ~15 min — extracts proc damage + inflict/self-buff tags
node scripts/trim-items.mjs                    # < 1s — strips unused fields for the public bundle
```

All write to `product/data/` and `public/data/` (the latter is what the client fetches).

## Contributing

OryxLab is fan-built and the data is only as good as the community keeps it.
We have a layered set of contribution paths in [CONTRIBUTING.md](CONTRIBUTING.md):

- **No-code data fixes** (5 min): stat is wrong on an item → edit `items.json`,
  PR with a RealmEye link.
- **Balance tuning** (10 min): `balance.json` exposes class DPS multipliers,
  status uptimes, party-buff peaks. Adjust + run tests + PR.
- **New scenarios** (15 min): boss-specific scenario presets in
  `comparator/data.json`.
- **Per-item unique mechanics** (1–4h): T14 HP-thresholds, Druid/Sigil
  transforms, Skuld stacks — engine accepts custom code per item.
- **Translations / a11y / E2E tests** — also welcome.

By contributing you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
Security issues: see [SECURITY.md](SECURITY.md).

## Roadmap

Tracked in [GitHub Issues](https://github.com/PedroHPrior/oryxlab/issues) and
[Discussions](https://github.com/PedroHPrior/oryxlab/discussions). Big-ticket
items on the wishlist:

- Per-item unique mechanics (HP-threshold scaling, transform sigils, stacks)
- Set-bonus tiers (2/3/4-piece thresholds)
- Group-DPS scenarios (multi-target piercing math)
- Translations (PT-BR, ES)
- Mobile polish for screens < 400px

## License

MIT for OryxLab code. Realm of the Mad God is © Deca Games — OryxLab is an unofficial fan tool. Item sprites are served from RealmEye's CDN.

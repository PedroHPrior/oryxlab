<div align="center">

  <img src="public/favicon.svg" width="92" alt="OryxLab logo" />

  # OryxLab

  **A theorycrafter-grade DPS calculator and build optimizer for Realm of the Mad God.**

  [![CI](https://github.com/PedroHPrior/oryxlab/actions/workflows/ci.yml/badge.svg)](https://github.com/PedroHPrior/oryxlab/actions/workflows/ci.yml)
  [![License: MIT](https://img.shields.io/badge/license-MIT-amber.svg)](LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](tsconfig.json)
  [![Tests](https://img.shields.io/badge/tests-165%20passing-brightgreen.svg)](tests)
  [![Issues welcome](https://img.shields.io/badge/feedback-welcome-purple.svg)](https://github.com/PedroHPrior/oryxlab/issues/new/choose)

  ### [→ Try it live ←](https://oryxlab-production.up.railway.app/app)

</div>

---

OryxLab answers the only ROTMG question that actually matters in the field:
*"is this drop an upgrade?"* It runs a calibrated DPS engine over **1,500
real items**, **100 ST sets**, and **19 classes**, lets you slot builds
side-by-side, runs a beam-search optimizer for any class in under 100ms,
and pulls your live RealmEye loadout so each character can be benchmarked
against its own best-in-slot.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   1,500 items   ·   100 sets   ·   19 classes   ·   100% real data       │
│                                                                          │
│   Engine validated against community calculators (Crystal Wand, Doom     │
│   Bow, Staff of Esben — all within ±10%).                                │
│                                                                          │
│   Sub-100ms beam-search optimizer in a Web Worker.                       │
│                                                                          │
│   PWA. Offline-capable. Schema-versioned localStorage.                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Highlights

|  | Feature |
|---|---|
| 🎯 | **Calibrated DPS engine** — pure-functional, ATT/DEX modifiers, hit-rate by range, multi-shot direction, AoE/piercing, weapon procs, ability cycle-time bottlenecks, set bonuses, status uptime, party-buff stacking |
| ⚙️ | **Beam-search optimizer** — top-6 candidates per slot × 5 slots = 7,776 enumerated combos under hard constraints (DEF≥X, HP≥Y, max UTs, no talisman, weapon-type lock). Runs in a Web Worker |
| 🆚 | **Side-by-side comparator** — up to 6 builds with cards / focus / table modes. DPS-vs-defense chart, scenario presets for major bosses (Oryx 3, Void Entity, Lost Halls, Shatters, etc) |
| 🛒 | **Quick compare** — pick 2–4 items in the catalog, get a verdict (*"Crystal Wand wins on DPS, +47% vs Doom Bow"*), DPS curve, ✦-marked winner per metric |
| 👤 | **RealmEye import** — drop your username, get every character with current loadout, one-click compare each against optimizer suggestions |
| 🛠️ | **Build editor** — live stat-source breakdown (base / items / exalts / buffs), exalt sliders with caps, undo/redo (⌘Z), notes per build |
| 📚 | **Catalog** — virtualized list of 1,500 items, filters (type/class/tier/rarity/mechanic) with live counts, item detail modal with proc tooltips |
| 💾 | **Persistence** — schema-versioned localStorage with migration path, share-state via URL (gzip + base64) |
| 📲 | **PWA** — installable, offline-capable, dark-mode persisted |
| 🛡️ | **Production hardening** — Helmet headers, rate limiting on RealmEye proxy (10 req/min/IP), CORS allowlist, gzip compression, 8s outbound timeout |

## Tech stack

<table>
  <tr>
    <td><b>Frontend</b></td>
    <td>React 19 · TypeScript (strict) · Vite 7 · Tailwind v4 · React Router 7 · Web Worker</td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>Express 5 · Helmet · express-rate-limit · gzip compression · Node 22</td>
  </tr>
  <tr>
    <td><b>Engine</b></td>
    <td>Pure-functional TypeScript · zero-dep · 100% deterministic</td>
  </tr>
  <tr>
    <td><b>Tests</b></td>
    <td>Vitest · Testing Library · jsdom · 165 tests across engine / components / routes / validation</td>
  </tr>
  <tr>
    <td><b>Build / Deploy</b></td>
    <td>Docker (multi-stage) · Railway · GitHub Actions CI · vite-plugin-pwa</td>
  </tr>
  <tr>
    <td><b>Data</b></td>
    <td>1,500 items · 100 sets · 19 classes — all scraped from RealmEye, validated against in-game values</td>
  </tr>
</table>

## Architecture

```
┌─────────────────────────── Browser ────────────────────────────┐
│                                                                │
│   React Router  ┬── ComparatorRoute    ──┐                     │
│                 ├── CatalogRoute       ──┤                     │
│                 ├── OptimizerRoute     ──┤   useOryxLab()      │
│                 ├── InventoryRoute     ──┤   ↑                 │
│                 └── BuildEditorRoute   ──┤   │                 │
│                                          │   ▼                 │
│                       OryxLabContext ◄───┴── OryxLabApp        │
│                              │                                 │
│              ┌───────────────┼─────────────────────────┐       │
│              ▼               ▼                         ▼       │
│         engine/dps     engine/optimizer          app/storage   │
│         (pure)         (Web Worker)              (localStorage,│
│                                                   versioned)   │
│                                                                │
└─────────────────────────────────┬──────────────────────────────┘
                                  │  fetch /api, /data
                                  ▼
┌─────────────────────────── Express ────────────────────────────┐
│                                                                │
│   Helmet · CORS allowlist · rate-limit · gzip                  │
│                                                                │
│   /api/health                                                  │
│   /api/items, /api/items/:id, /api/classes, /api/classes/:id   │
│   /api/inventory/realmeye-import  (proxy + parse)              │
│                                                                │
│   Static: dist/* + /data/{items,classes,sets,balance}.json     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## DPS engine

The pure-functional core in `src/engine/dps.ts`:

```ts
import { computeDerivedStats } from "@/engine/dps"

const result = computeDerivedStats({
  build,        // class + equipped items + exaltations
  scenario,    // target def + statuses + party buffs
  classDef,    // base stats and caps
  itemMap,     // catalog
  itemSets,    // optional set definitions
})
// → { dps, dpsAtZeroDef, ehp, att, dex, wis, def, hp, mp,
//     timeToKill1k, dpsCurve: number[17] }
```

What it models:

- **ATT linear modifier** `att / 50`
- **DEX RoF modifier** `0.5 + 1.5 × min(dex, 100) / 75`
- **Hit rate by weapon range** (≥8 tiles → 1.0, falling off below)
- **Multi-shot directional factor** (0.80 for katanas)
- **AoE multiplier** (1.6×) and piercing/wavy/parametric/boomerang (1.10×)
- **Class multipliers** — Trickster 1.6×, Summoner 1.4×, Necromancer 1.15×, etc
- **Party buffs** — additive flat stats + multiplicative damage (Paladin Seal, Warrior Helm, Bard Inspire/Crescendo/Encore)
- **Status effects** — Exposed +20%, Cursed +25%, Armor Broken bypasses defense
- **Weapon proc damage** — `procRate × procDamage` per shot (Crystal Wand shards, Conducting Wand bolts)
- **Ability damage** — spells / skulls / quivers contribute `damage / cycleTime`, bottlenecked by `mpCost / mpRegen`
- **Inflict-status tags** — apply uptime-weighted bonus when scenario doesn't already have the status
- **Self-buff tags** — small DPS multipliers for berserk / damaging / inspired / speedy
- **Set bonuses** — full-set stat contributions
- **Min damage rule** — at least 10% of raw damage even at high defense

Every tunable constant lives in [`product/data/balance.json`](product/data/balance.json) so the community can iterate on values without touching code.

## Quickstart (local dev)

```bash
git clone https://github.com/PedroHPrior/oryxlab.git
cd oryxlab
npm install
npm run dev:all      # Vite on :3000 + Express on :3001
```

Open <http://localhost:3000/app>.

```bash
npm test             # 165 tests
npm run typecheck    # tsc strict
npm run lint         # eslint
npm run build        # produces dist/
```

## Deployment

**Live target:** Railway with a Dockerfile builder (Nixpacks's cache-mount
EBUSY bug forces us off the default).

```bash
# One-process container that serves SPA + API on $PORT.
docker build -t oryxlab .
docker run -p 3001:3001 oryxlab
```

Required env vars in production (optional in dev):

| Variable | Purpose |
|----------|---------|
| `PORT` | Bind port (Railway provides automatically) |
| `NODE_ENV` | Set to `production` (auto-detected from `dist/` presence) |
| `ALLOWED_ORIGIN` | Comma-separated CORS allowlist |

## Repo layout

```
oryxlab/
├── src/
│   ├── app/                Top-level state, routing, storage, error boundary, logger
│   │   ├── OryxLabApp.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── api.ts          Static-or-backend fetch client
│   │   ├── storage.ts      localStorage with versioned migrations
│   │   ├── share.ts        URL state encoding (gzip + base64)
│   │   ├── logger.ts       Namespaced logger (silent in prod for non-errors)
│   │   ├── sw.ts           Service-worker registration
│   │   ├── useBuildHistory.ts   ⌘Z undo/redo
│   │   └── routes/         5 route components
│   ├── engine/
│   │   ├── dps.ts          Pure-functional DPS engine
│   │   ├── optimizer.ts    Beam-search build optimizer
│   │   ├── optimizer.worker.ts    Web Worker wrapper
│   │   └── optimizer-client.ts    Main-thread client with sync fallback
│   ├── shell/components/   AppShell, MainNav, ScenarioBar, OryxLogo
│   └── sections/
│       ├── _shared/        ItemSprite, ClassPortrait, TierBadge, …
│       ├── comparator/     BuildColumn, FocusView, TableView, DpsCurveChart, SlotPicker
│       ├── build-editor/   Live stat-source bars, exalt panel, calc steps
│       ├── catalog/        ItemCard, ItemDetailModal, QuickComparePanel, FilterRail
│       ├── optimizer/      ClassPicker, ConstraintsPanel, ResultCard
│       └── inventory/      OwnedSummaryCards, RealmEyeImportPanel, CharactersPanel
├── server/index.mjs        Express server (API + static SPA)
├── scripts/                RealmEye scrapers (one-shot + delta + canon-enforce)
├── product/data/           Source-of-truth: items / classes / sets / balance JSON
├── public/data/            Bundled JSON shipped to clients (trimmed for size)
└── tests/                  Engine + components + routes + validation suites
```

## Contributing

OryxLab is a single-maintainer project. **Code changes (PRs) are not accepted
from external contributors at this time** — but bugs, data corrections, and
feature ideas are extremely welcome.

| What you have | Where to file it |
|---------------|------------------|
| 🐛 Found a bug | [Bug report template](https://github.com/PedroHPrior/oryxlab/issues/new?template=bug_report.yml) |
| 📊 Wrong stat / class / proc | [Data correction template](https://github.com/PedroHPrior/oryxlab/issues/new?template=data_correction.yml) (fast-tracked) |
| 💡 Idea for a feature | [Feature request template](https://github.com/PedroHPrior/oryxlab/issues/new?template=feature_request.yml) |
| 💬 Want to discuss | [GitHub Discussions](https://github.com/PedroHPrior/oryxlab/discussions) |
| 🔒 Security issue | Email **pedrohpk17@gmail.com** — see [SECURITY.md](SECURITY.md) |

See [CONTRIBUTING.md](CONTRIBUTING.md) for what makes a good issue.

## License

[MIT](LICENSE). Realm of the Mad God is © Deca Games — OryxLab is an
unofficial fan tool, not affiliated with Deca Games or RealmEye. Item sprites
are served from RealmEye's CDN.

---

<div align="center">
  <sub>
    Built with ☕ in 🇧🇷 by <a href="https://github.com/PedroHPrior">@PedroHPrior</a>.<br/>
    If OryxLab saved you from a bad fuse roll, consider <a href="https://github.com/PedroHPrior/oryxlab">starring the repo</a>.
  </sub>
</div>

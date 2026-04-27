# Changelog

All notable changes to OryxLab are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] — 2026-04-27

### Added
- **Guided onboarding tour** (driver.js): 9-step spotlight walkthrough on
  first visit, replayable from the footer "Take the tour" link.
- **ClassPicker modal** in the comparator: click a build's class portrait
  to reassign it; weapon / ability / armor wipe (class-restricted), rings
  + talismans stay.
- **SlotPicker filters**: rarity pills (All / UT / ST / Tiered) and sort
  pills (Tier ↓ / A → Z / Damage ↓).
- **Catalog completeness**: 6 missing weapon families added — spellblades,
  tachis, longbows, flails, morning-stars, dual-blades. Catalog grew from
  1,500 → 1,601 items, 100% coverage of every RealmEye category.
- **Real ST tier classification**: 393 items now correctly tagged `ST`
  (was 0). Sets re-scraped with a corrected parser that no longer
  misclassifies cross-class items.
- **Custom domain**: `oryxlab.app` (with `www.oryxlab.app` as canonical).
- **Open Graph + Twitter Card** meta + a hand-crafted `og-image.png`.

### Fixed
- Inventory empty-state buttons: "Mark items I own" navigates to the
  Catalog (existing per-item Mark-as-owned), and "Import from RealmEye"
  panel renders in both empty and populated states.
- Saved-builds badge: was hardcoded to sample-data length (always "7"),
  now reflects the actual saved-builds count from localStorage.
- Save / Share / Load actions now show toast feedback.
- Ring SlotPicker showed 0 items because rings have empty `classes` array
  (class-agnostic in RotMG); filter now treats empty classes as "any".
- Modal flicker on hover: ClassPicker / SlotPicker now portal to
  `document.body` so a parent's hover transform can't capture
  `position: fixed`.
- CDN cache poisoning: ETag-driven 5xx responses cached forever broke
  asset loads after deploy rollovers. Disabled ETag on `/assets/*`,
  added `Cache-Control: no-cache` on `index.html`, and the SPA catch-all
  returns a `Cache-Control: no-store` 503 for any `/assets/*` miss.

### Changed
- Repo cleanup: community files (CONTRIBUTING / CODE_OF_CONDUCT /
  SECURITY) moved to `.github/` (GitHub still surfaces them at the same
  URLs); root has only README + CHANGELOG + LICENSE + CLAUDE alongside
  build configs.
- Added `scripts/README.md` documenting the scrape and fixup pipelines.

## [1.0.0] — 2026-04-27

First public release.

### Added
- **DPS engine**: pure-functional, validated against community calculators
  for Crystal Wand on maxed Sorcerer (~1100 DPS, in range), Doom Bow on Archer,
  Staff of Esben on Wizard.
- **1,500 ROTMG items** scraped from RealmEye with verified base damage,
  rate-of-fire, range, classes, procs, on-equip tags.
- **100 ST sets** with parsed full-set stat bonuses applied via the engine.
- **19 classes** with portraits, base/cap stats, weapon/ability/armor
  compatibility.
- **Comparator**: side-by-side build comparison (cards / focus / table modes),
  DPS-vs-defense chart, scenario presets for major bosses.
- **Beam-search optimizer** for all 19 classes (BIS / With My Inventory /
  With Constraints), running in a Web Worker.
- **Quick compare** in the Catalog: pick 2–4 items, get a verdict ("Crystal
  Wand wins on DPS, +47% vs Doom Bow"), DPS curve, ✦ winner per metric.
- **RealmEye import**: paste your username, get characters + equipped sets.
  Each character has a "Compare in builder" button that drops the loadout
  into the Comparator for optimizer comparison.
- **Build Editor** with live stat sources breakdown, exalts, undo/redo
  (Cmd-Z), notes per build.
- **Catalog filter counters** show "(N)" beside each filter chip.
- **Item detail modal** with stats, proc info, equipped-by classes, tooltips
  for every status tag.
- **PWA** installable, offline-capable.
- **Persistent dark mode**, share-state via URL (gzip + base64).
- **Tunable balance** in `product/data/balance.json` (community-editable).
- **Production-grade Express server**: rate limiting, CORS allowlist, helmet
  headers, gzip, 8s timeout on RealmEye proxy.
- **CI** via GitHub Actions on every push and PR (typecheck + tests + build).
- 165 tests (engine + components + routes + validation).

### Infrastructure
- Deployed to Railway via Dockerfile (Nixpacks's cache-mount EBUSY bug
  required a custom build).
- Schema-versioned localStorage with v1 → v2 migration path.
- Structured logger silent in production for non-errors.

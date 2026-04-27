# Changelog

All notable changes to OryxLab are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

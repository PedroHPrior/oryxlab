# Contributing to OryxLab

Thanks for considering a contribution. OryxLab is a fan tool by-and-for the
ROTMG community — every kind of help moves the project forward.

## Quick start (5 minutes)

```bash
git clone https://github.com/PedroHPrior/oryxlab.git
cd oryxlab
npm install
npm run dev:all      # frontend on :3000 + API on :3001
```

Run the test suite + typecheck before opening a PR:

```bash
npm test
npm run typecheck
```

GitHub Actions runs both on every PR; PRs that fail CI won't be merged.

## Where contributions land best

We've grouped the most impactful contribution areas by skill level. Pick whatever
fits your interest and time budget.

### 🎯 No-code: data corrections (5–30 min)

The fastest way to help. The DPS engine is only as accurate as the underlying
data — every fix improves what 1000s of players see.

- **Wrong damage / RoF / range on an item** — open `product/data/items.json`,
  fix the values, send a PR. Reference the [RealmEye wiki page](https://www.realmeye.com/wiki) URL in the PR description.
- **Class restriction wrong** — `item.classes` should match the canonical
  class set defined in `scripts/enforce-class-canon.mjs`. Re-run that script
  if you fix many.
- **Procs / inflict tags missing** — add the right `procDamage`/`procRate`
  or tag (e.g. `inflicts-cursed`, `self-berserk`) to `item.tags`.
- **New ROTMG release just dropped new items** — re-run the scrapers (see
  the README's "Re-scraping data" section), then PR the updated JSON.

### 🎲 No-code: balance tuning (10 min)

`product/data/balance.json` has every tunable engine constant — class DPS
multipliers, party-buff uptime modeling, status-effect damage bonuses. If you
think Trickster's prism multiplier should be 1.7× instead of 1.6×, change one
number, run `npm test` to confirm the validation suite still passes, send a
PR with reasoning.

The community knows ROTMG mechanics far better than any single contributor.

### 🗺️ Light coding: new scenarios (15 min)

Boss-specific or dungeon-specific scenarios live in
`product/sections/comparator/data.json` under `scenarioPresets`. Each preset
sets target defense, status effects on target, and party buffs. Adding a new
boss preset is a JSON edit + a screenshot in the PR.

### 💻 Code: per-item unique mechanics (1–4 hours)

The engine handles ~90% of effects generically (procs, ability damage, set
bonuses, inflict-status, self-buffs). The long tail is unique mechanics:

- T14 weapons that scale damage with player HP%
- Druid form transformations
- Skuld stack-based effects
- Bard crescendo build-up
- HP-threshold-gated buffs

Each of these needs item-specific code in `src/engine/dps.ts`. Open an issue
first to discuss approach before implementing.

### 🌐 Translations (2–4 hours)

OryxLab is currently English-only. Adding i18n with locale files for PT-BR,
ES, etc. would help reach non-English ROTMG communities. Open an issue if
you want to take this on; we'll need to extract strings first.

### 🎨 UI/UX & accessibility (variable)

- Mobile polish for screens under 400px
- Keyboard navigation for the slot picker
- Better screen-reader labels
- Color-contrast fixes for low-vision users

Tests for visual regression aren't set up yet — that's also a great
contribution.

### 🧪 Tests (1–2 hours)

Test coverage is currently ~17% by LOC. Specific areas wanted:
- E2E tests with Playwright (we don't have any)
- Edge cases in the engine (extreme stat values, missing fields)
- The optimizer's constraint solver corners

## How to submit

1. **Fork** the repo, branch off `main`.
2. Make your change. Keep PRs focused — one logical change per PR is easier
   to review than a kitchen sink.
3. Add or update tests if you touched engine logic. The validation suite in
   `tests/validation/` catches data regressions; the engine tests in
   `tests/engine/` cover behavior.
4. Run `npm test` and `npm run typecheck`.
5. Open a PR against `main`. The PR description should say:
   - **What** changed (one line).
   - **Why** (link to issue or explain).
   - **How to verify** (steps a reviewer should take).
6. CI will run; address any failures.
7. A maintainer reviews. Most PRs land in 24–48h.

## Code style

- TypeScript strict mode (`tsc -b` must pass clean).
- Tailwind for styling (no CSS files except `index.css`).
- Tests via Vitest + Testing Library.
- ESLint config in `eslint.config.js` — `npm run lint` enforces it.

Run formatters via your editor or `npm run lint -- --fix`.

## What we won't merge

- Breaking changes to the persisted localStorage shape without a migration in
  `src/app/storage.ts`.
- Code that hardcodes class/balance constants instead of reading
  `product/data/balance.json`.
- PRs that disable security middleware (rate limiting, CORS, helmet) in
  `server/index.mjs`.
- Anything that adds a runtime dep heavier than 50 KB unless it's the only
  reasonable approach.

## Reporting bugs / feature requests

[Open an issue](https://github.com/PedroHPrior/oryxlab/issues/new/choose)
with the appropriate template. For data corrections, "Item is wrong"
template gets fast-tracked.

## Code of conduct

We follow the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md). The short
version: be civil, give credit, no harassment. Anyone violating it will be
removed from the project.

## Recognition

Every merged PR's author is listed in the repo's contributors graph. We don't
maintain a separate AUTHORS file — GitHub does that for us. Significant
contributions get called out in `CHANGELOG.md` for the release they ship in.

Thanks for helping make OryxLab better.

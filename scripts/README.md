# Scripts

Operational scripts that build and maintain the OryxLab catalog. Each
script is a self-contained Node 22 ESM module — run any of them with
`node scripts/<path>`.

## Layout

```
scripts/
├── scrape/       Pull data from RealmEye (slow, network-bound)
├── fixups/       One-shot data migrations / canon enforcement
└── build-og-image.mjs   Regenerate public/og-image.png
```

## scripts/scrape/

Pulls fresh data from RealmEye's wiki. Each script is rate-limited
(120-600ms between requests) so they're network-friendly. Run order:

| Script                              | What it does |
|-------------------------------------|--------------|
| `scrape-classes.mjs`                | All 19 player classes, base stats, weapon/ability/armor types |
| `scrape-items.mjs`                  | List-scrape: every item across 36 category pages → `product/data/items.json` |
| `scrape-item-details.mjs`           | Detail-scrape: per-item wiki page → fills in `stats` / `tags` / `effects` |
| `scrape-item-details-final.mjs`     | Retry pass for items the bulk script missed |
| `scrape-item-details-retry.mjs`     | Slower retry for rate-limited fetches |
| `scrape-sets.mjs`                   | ST-set membership + bonus stats |
| `scrape-talismans.mjs`              | Talismans (separate page from rings) |
| `scrape-procs.mjs`                  | Weapon proc rates / proc damage |
| `rescrape-class-restrictions.mjs`   | Refresh `item.classes` against current canon |
| `rescrape-cooldowns.mjs`            | Ability cooldowns (when wiki updates) |
| `rescrape-weapon-damage.mjs`        | Weapon damage ranges (after balance patches) |

`npm run scrape:items` and `npm run scrape:classes` are the convenience
shortcuts in `package.json`.

## scripts/fixups/

One-shot data hygiene. These run AFTER scrapes to enforce invariants
the scrapers don't catch:

| Script                              | What it does |
|-------------------------------------|--------------|
| `mark-st-tier.mjs`                  | Tag every item that participates in a themed set with `tier: "ST"` |
| `merge-original-stats.mjs`          | After a list-rescrape: restore detail stats for items that still exist |
| `audit-coverage.mjs`                | Report items in RealmEye categories that aren't in our catalog |
| `add-missing-items.mjs`             | Backfill specific items the scraper missed |
| `enrich-new-items.mjs`              | Run `scrape-item-details` only on items missing key stats |
| `remove-non-items.mjs`              | Drop bosses / pets / dungeons that the untiered-drops scrape picked up |
| `remove-admin-items.mjs`            | Drop named admin/joke items (Crown, Admin Wand, …) |
| `enforce-class-canon.mjs`           | Validate `item.classes` against canonical class-weapon mapping |
| `fix-classes.mjs`                   | Bulk class assignment fixes after canon changes |
| `filter-non-items.mjs`              | Older variant of `remove-non-items.mjs` |
| `backfill-mpcost.mjs`               | Patch ability mp-cost values from wiki when missing |
| `backfill-weapon-types.mjs`         | Patch `weaponType` for items that have damage but no category |
| `restore-removed.mjs`               | Re-add items from a saved snapshot if a fix accidentally drops them |
| `trim-items.mjs`                    | Strip unused fields / normalize keys |

## build-og-image.mjs

Regenerates `public/og-image.png` from the inline SVG template. Run via
`npm run build:og` after touching anything in the SVG hero (catalog
counts, the URL strip at the bottom, etc.).

## Conventions

- Every script writes to BOTH `product/data/items.json` (source of truth)
  and `public/data/items.json` (what the API serves).
- Scrapers are network-friendly: 120-600ms between requests, retries on
  429s, three-attempt fetches.
- Fixups are idempotent: running them twice produces the same result.
- Tests in `tests/engine/real-catalog.test.ts` and
  `tests/validation/full-validation.test.ts` validate the catalog after
  any script run; treat their failures as the script being incorrect.

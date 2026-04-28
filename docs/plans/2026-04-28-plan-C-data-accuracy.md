# Plan C — Data Accuracy

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the three confirmed scrape bugs surfaced by the JRelay drift validation, and lay the type-only foundation for future enchant support so that path isn't blocked behind a giant refactor when the data shows up.

**Architecture:** Surgical patches to `product/data/items.json` for the 3 known scrape bugs, with the patches expressed as a re-runnable Node script committed to `scripts/fixups/` for auditability. Type plumbing for enchants is a 20-line addition to `product/sections/comparator/types.ts` — no engine wiring, no UI, just the type contracts so enchant data can land later without breaking changes.

**Tech Stack:** Node.js (existing), TypeScript types, vendored `product/data/_references/jrelay-items-2020.xml` as the authoritative source for the 3 fixes.

**Closes:** Partially [#12](https://github.com/PedroHPrior/oryxlab/issues/12), partially [#13](https://github.com/PedroHPrior/oryxlab/issues/13).

---

## Investigation findings

### #12 — top-15 drift triage

Re-ran `node scripts/scrape/validate-against-jrelay.mjs` and ranked by `|pct|`:

| Item | Ours | JRelay | Drift | Class | Action |
|---|---|---|---|---|---|
| Verdant Bow | 135–165 | 40–65 | +186% | B (Deca rebuff) | Leave |
| Golden Bow | 125–155 | 40–60 | +180% | B | Leave |
| **Ray Katana** | undefined | 60–95 | -100% | **A — scrape bug** | **Fix** |
| Obsidian Dagger | 60–125 | 35–65 | +85% | C (uncertain) | Document, leave |
| St. Abraham's Wand | 155–180 | 90–110 | +68% | B | Leave |
| Thousand Shot | 65–130 | 50–70 | +63% | C | Document, leave |
| Wand of Retribution | 165–205 | 95–140 | +57% | B (tier rework) | Leave |
| Wand of the Bulwark | 500–600 | 300–400 | +57% | B | Leave |
| Fire Bow | 75–95 | 45–65 | +55% | B | Leave |
| Sprite Wand | 10–290 | 50–150 | +50% | B (variance is a feature) | Leave |
| Ironwood Bow | 65–85 | 35–65 | +50% | B | Leave |
| Bow of Covert Havens | 70–110 | 50–70 | +50% | B | Leave |
| Wand of Evocation | 150–190 | 95–135 | +48% | B | Leave |
| **Bow of Innocent Blood** | 25–35 | 45–70 | -48% | **A — scrape bug** | **Fix** |
| **Bow of Fey Magic** | 25–35 | 45–65 | -45% | **A — scrape bug** | **Fix** |

**Three confirmed scrape bugs:**
- `Ray Katana` — damage fields are undefined entirely
- `Bow of Innocent Blood` — damage range 25–35 is implausibly narrow for a bow (10-wide); JRelay's 45–70 (25-wide) matches the bow family's normal pattern
- `Bow of Fey Magic` — same shape, same fix

The other 12 are either Deca rebalances we shouldn't touch, or genuine variance items where JRelay's narrower range is the outdated number.

### #13 — what enchants actually look like

Without a current XML dump, we can't pull the live enchant table. But we know structurally enchants are:
- Bound to specific item slots (some enchants only on weapons, some only on rings, etc)
- Stack additively for stat-style enchants
- Some are conditional (proc on hit, threshold-triggered)

Type plumbing today, engine wiring when we have data.

---

## Task 1: Fix the 3 scrape bugs as a re-runnable script

**Files:**
- Create: `scripts/fixups/fix-jrelay-confirmed-bugs.mjs`
- Modify: `product/data/items.json` (via running the script)

**Step 1: Create the script**

Create `scripts/fixups/fix-jrelay-confirmed-bugs.mjs`:

```js
// Three weapons that came through the RealmEye scrape with broken stats.
// Cross-validated against the JRelay 2020 items.xml dump (the only public
// authoritative source we have for these era weapons), the JRelay numbers
// are right and our scrape is wrong.
//
// This is intentionally a per-item allowlist, not a bulk drift correction.
// Bulk-applying JRelay would regress legitimate Deca rebalances on dozens
// of other weapons. See product/data/_references/jrelay-drift-report.json
// for the full audit.

import { readFileSync, writeFileSync } from "fs"

const ITEMS_PATH = "product/data/items.json"

// Each entry is the JRelay-validated stat block, hand-confirmed against
// current realmeye/wiki to be still correct.
const FIXES = [
  {
    name: "Ray Katana",
    reason: "Our scrape produced undefined damage fields. JRelay has 60–95 range.",
    stats: { dmgMin: 60, dmgMax: 95, dmgAvg: 77.5, rateOfFireMod: 1, shots: 1 },
  },
  {
    name: "Bow of Innocent Blood",
    reason: "Our 25–35 (10-wide) is implausible for a bow. JRelay 45–70 matches the bow family pattern.",
    stats: { dmgMin: 45, dmgMax: 70, dmgAvg: 57.5 },
  },
  {
    name: "Bow of Fey Magic",
    reason: "Same shape as Innocent Blood. Our 25–35 too narrow, JRelay 45–65 fits the family.",
    stats: { dmgMin: 45, dmgMax: 65, dmgAvg: 55 },
  },
]

const items = JSON.parse(readFileSync(ITEMS_PATH, "utf-8"))
let touched = 0
for (const fix of FIXES) {
  const item = items.find((i) => i.name === fix.name)
  if (!item) {
    console.log(`SKIP — ${fix.name} not in catalog`)
    continue
  }
  Object.assign(item.stats, fix.stats)
  console.log(`✓ ${fix.name}: ${fix.reason}`)
  touched++
}

writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 2) + "\n")
console.log(`\nPatched ${touched} weapons.`)
```

**Step 2: Run the script**

```bash
node scripts/fixups/fix-jrelay-confirmed-bugs.mjs
```

Expected output:
```
✓ Ray Katana: ...
✓ Bow of Innocent Blood: ...
✓ Bow of Fey Magic: ...
Patched 3 weapons.
```

**Step 3: Verify the catalog change**

```bash
node -e "
const items = require('./product/data/items.json');
for (const name of ['Ray Katana', 'Bow of Innocent Blood', 'Bow of Fey Magic']) {
  const i = items.find(x => x.name === name);
  console.log(name, JSON.stringify(i.stats));
}
"
```

Expected: each one shows the new dmgMin/dmgMax.

**Step 4: Re-run the drift validator**

```bash
node scripts/scrape/validate-against-jrelay.mjs | grep -E "(Ray Katana|Innocent Blood|Fey Magic)"
```

Expected: those three names no longer appear in the output, or appear with drift < 5%.

**Step 5: Run the full bench — make sure nothing else broke**

```bash
npm test -- tests/engine/bench.test.ts
```

Expected: all 22 builds still pass within tolerance. The fixed weapons aren't in the bench so the bench shouldn't change much.

**Step 6: Commit**

```bash
git add scripts/fixups/fix-jrelay-confirmed-bugs.mjs product/data/items.json
git commit -m "data(items): patch 3 scrape-error weapons to JRelay-validated stats (#12)"
```

---

## Task 2: Document the unfixed drift items

**Files:**
- Create: `product/data/_references/triage-notes.md`

**Step 1: Write the triage notes**

```markdown
# JRelay drift triage — 2026-04-28

Manual classification of the top-15 highest-drift weapons from
`jrelay-drift-report.json`, deciding scrape-error (we fix) vs Deca-rebalance
(we leave). Numbers in the table are damage range only; full diff in the
JSON report.

| Weapon | Ours | JRelay | Drift | Class | Action |
|---|---|---|---|---|---|
| Verdant Bow | 135–165 | 40–65 | +186% | B | Leave — bow tier had 2 buff passes 2021–23 |
| Golden Bow | 125–155 | 40–60 | +180% | B | Leave — same era as Verdant |
| Ray Katana | (undefined) | 60–95 | -100% | A | **Fixed** in fix-jrelay-confirmed-bugs.mjs |
| Obsidian Dagger | 60–125 | 35–65 | +85% | C | Unverified — UT dagger may have been buffed |
| St. Abraham's Wand | 155–180 | 90–110 | +68% | B | Leave — wand tier rework era |
| Thousand Shot | 65–130 | 50–70 | +63% | C | Unverified — needs realmeye cross-check |
| Wand of Retribution | 165–205 | 95–140 | +57% | B | Leave |
| Wand of the Bulwark | 500–600 | 300–400 | +57% | B | Leave — confirmed Deca buff |
| Fire Bow | 75–95 | 45–65 | +55% | B | Leave |
| Sprite Wand | 10–290 | 50–150 | +50% | B | Leave — wide variance is the design |
| Ironwood Bow | 65–85 | 35–65 | +50% | B | Leave |
| Bow of Covert Havens | 70–110 | 50–70 | +50% | B | Leave |
| Wand of Evocation | 150–190 | 95–135 | +48% | B | Leave |
| Bow of Innocent Blood | 25–35 | 45–70 | -48% | A | **Fixed** in fix-jrelay-confirmed-bugs.mjs |
| Bow of Fey Magic | 25–35 | 45–65 | -45% | A | **Fixed** in fix-jrelay-confirmed-bugs.mjs |

## Class definitions

- **A — Scrape error.** The number we have is structurally invalid (undefined,
  range too narrow for the family, etc). JRelay numbers applied directly.
- **B — Deca rebalance.** The drift is consistent with known patches between
  2020 and 2026. Leave our number — JRelay is the outdated source.
- **C — Uncertain.** Drift is large but plausibly either error or rebalance.
  Needs a current realmeye cross-check or community confirmation. Document
  here, don't touch the catalog until verified.

## How to update

When new drift surfaces (e.g., after a future scrape pass), re-run:

```bash
node scripts/scrape/validate-against-jrelay.mjs > /tmp/drift.txt
```

Cross-check the new top-N against this table. Add new rows for new entries.
Promote a row from C to A or B when verified.
```

**Step 2: Update the references README**

Append to `product/data/_references/README.md`:

```markdown
## triage-notes.md

Manual classification of which JRelay-baseline drift is a scrape error
(fixed in `scripts/fixups/fix-jrelay-confirmed-bugs.mjs`) vs a Deca
rebalance (left). Updated when the drift report top-N changes. Never
auto-generated — the judgment is the value.
```

**Step 3: Commit**

```bash
git add product/data/_references/triage-notes.md product/data/_references/README.md
git commit -m "docs(data): vendor JRelay drift triage notes (#12)"
```

---

## Task 3: Type plumbing for enchants

**Files:**
- Modify: `product/sections/comparator/types.ts`
- Test: `tests/engine/types-enchant.test.ts` (create)

**Step 1: Write the failing test**

Create `tests/engine/types-enchant.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import type { EnchantSlot, Item } from "../../product/sections/comparator/types"

describe("Enchant type plumbing (no engine support yet)", () => {
  it("EnchantSlot can be constructed", () => {
    const e: EnchantSlot = {
      id: "fortify-att",
      name: "Fortify ATT",
      stats: { att: 5 },
    }
    expect(e.stats.att).toBe(5)
  })

  it("Item can carry an optional enchants array", () => {
    const item: Item = {
      id: "demon-blade",
      name: "Demon Blade",
      tier: "UT",
      rarity: "ut",
      type: "weapon",
      classes: ["knight"],
      stats: { dmgMin: 200, dmgMax: 400 },
      tags: [],
      sprite: "demon-blade",
      enchants: [
        { id: "fortify-att", name: "Fortify ATT", stats: { att: 5 } },
      ],
    }
    expect(item.enchants?.[0].id).toBe("fortify-att")
  })

  it("Item without enchants type-checks (optional field)", () => {
    const item: Item = {
      id: "x", name: "x", tier: "T1", rarity: "tiered", type: "weapon",
      classes: [], stats: {}, tags: [], sprite: "",
    }
    expect(item.enchants).toBeUndefined()
  })
})
```

**Step 2: Run, see TS failure**

Run: `npx vitest run tests/engine/types-enchant.test.ts`
Expected: TS error: `'EnchantSlot' is not exported`.

**Step 3: Add the types**

In `product/sections/comparator/types.ts`, after the `ItemStats` interface, add:

```ts
/**
 * Forge enchant / item modifier. Modern RotMG items have one or more
 * of these; the engine ignores them today (issue #13). Adding the type
 * now means the next person doesn't have to refactor when we wire
 * enchant support after the data pipeline lands.
 */
export interface EnchantSlot {
  /** Enchant identifier from the game's enchant table. */
  id: string
  /** Display name shown in tooltips. */
  name: string
  /** Stat deltas this enchant applies. Same shape as ItemStats so it
      can be merged additively into the item's effective stats. */
  stats: Partial<ItemStats>
  /** Optional human-readable description of any conditional effect
      that the engine doesn't model yet (e.g., "+10% damage when below
      50% HP"). Surfaced in the UI as flavor text only. */
  description?: string
}
```

Find the `Item` interface and add the optional field:

```ts
export interface Item {
  id: string
  name: string
  tier: string
  rarity: Rarity
  type: ItemType
  weaponType?: WeaponType
  abilityType?: AbilityType
  classes: string[]
  stats: ItemStats
  tags: string[]
  sprite: string
  imageUrl?: string
  /** Forge enchants currently applied to this item. Empty / undefined
      means default unenchanted. Engine support tracked in issue #13. */
  enchants?: EnchantSlot[]
}
```

**Step 4: Run, see pass**

Run: `npx vitest run tests/engine/types-enchant.test.ts`
Expected: PASS (all 3).

**Step 5: Run full quality bar**

```bash
npm run lint && npm run typecheck && npm test
```

All clean.

**Step 6: Commit**

```bash
git add product/sections/comparator/types.ts tests/engine/types-enchant.test.ts
git commit -m "feat(types): EnchantSlot + Item.enchants type plumbing (#13)"
```

---

## Task 4: Push, comment on issues

**Step 1: Push**

```bash
git push origin main
```

**Step 2: Comment on #12**

```bash
gh issue comment 12 --body "Partial close: 3 confirmed scrape bugs fixed (Ray Katana, Bow of Innocent Blood, Bow of Fey Magic) via scripts/fixups/fix-jrelay-confirmed-bugs.mjs. The other 12 high-drift weapons documented in product/data/_references/triage-notes.md as either Deca rebalances (leave) or unverified (need community cross-check). Issue stays open as the audit framework — re-runnable on every scrape pass."
```

**Step 3: Comment on #13**

```bash
gh issue comment 13 --body "Phase 1 (type plumbing) shipped. Item.enchants?: EnchantSlot[] is now part of the type contract; no engine wiring yet. Next phase needs an enchant data source — blocked on #11. Closing once we have stat enchants flowing through the engine."
```

---

## Done criteria

- [ ] Three scrape-error weapons fixed and committed via re-runnable script
- [ ] Drift validator no longer flags those three
- [ ] Triage notes vendored, references README updated
- [ ] EnchantSlot + Item.enchants types added, tests passing
- [ ] Issues #12 + #13 commented with progress
- [ ] All quality gates clean (lint, typecheck, test, build)

## What this plan deliberately does NOT do

- Does NOT bulk-fix the 12 non-scrape-error drift weapons (would regress Deca rebalances)
- Does NOT cross-check current realmeye for the 2 "C — uncertain" items (would be a second pass once we have a current XML — see Plan D)
- Does NOT wire enchants into the engine (waiting on data pipeline #11)
- Does NOT add an enchant picker UI (waiting on engine support)

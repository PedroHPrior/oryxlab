# Engine correctness pass — closing the gaps surfaced by the r/RotMG launch

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close five concrete correctness gaps in the OryxLab DPS engine and item catalog that were either (a) flagged by community feedback on the launch thread or (b) discovered while investigating that feedback. Numbers should land within ±3% of community references on the existing 22-build bench, down from ±6% today.

**Architecture:** Extend the existing pure-functional engine in `src/engine/dps.ts` with a per-weapon hit-rate coefficient, then layer two data fixes on top: clean up the 86 weapons whose stats diverge from the JRelay 2020 baseline (manually triaged, not bulk-applied), and apply a small data shim for items the modern client uses that the legacy bench also references. Enchants and modern stat scaling stay deferred behind upstream blockers (#11) — but we add the type plumbing so the next person doesn't have to refactor.

**Tech Stack:** TypeScript strict, Vitest, the existing balance.json knob file, the vendored JRelay XML at `product/data/_references/jrelay-items-2020.xml`.

---

## Gap inventory

Five gaps in priority order. Tasks below address gaps 1–4. Gap 5 is upstream-blocked.

| # | Gap | Issue | Source | Fixed by |
|---|---|---|---|---|
| 1 | Hit-rate per weapon (every shot treated as landing) | [#10](https://github.com/PedroHPrior/oryxlab/issues/10) | u/Randill746 launch thread | Tasks 1–4 |
| 2 | 86 weapons drift from JRelay 2020 baseline | [#12](https://github.com/PedroHPrior/oryxlab/issues/12) | Local validation script | Tasks 5–6 |
| 3 | Type plumbing for future enchants | [#13](https://github.com/PedroHPrior/oryxlab/issues/13) | u/xdxdGabriel launch thread | Task 7 |
| 4 | Optimizer surfaces inflated DPS (Frostfall Rod 10k+) | (no ticket; surfaced in sweep test) | UI sweep on launch day | Task 8 |
| 5 | Modern items missing from catalog | [#11](https://github.com/PedroHPrior/oryxlab/issues/11) | Multiple commenters | Blocked: needs current XML dump |

Stat-scaling reworks (#14) deferred until u/xdxdGabriel responds with specifics — no point guessing which classes were touched.

---

## Task 1: Add `effectiveHitRate` field to ItemStats type

**Files:**
- Modify: `product/sections/comparator/types.ts:54-79`
- Test: `tests/engine/dps.test.ts` (existing file, add new describe block)

**Step 1: Write the failing test**

Add to `tests/engine/dps.test.ts` at the bottom:

```ts
describe("effectiveHitRate field", () => {
  it("ItemStats accepts an effectiveHitRate value between 0 and 1", () => {
    const stats: import("../../product/sections/comparator/types").ItemStats = {
      dmgMin: 100,
      dmgMax: 200,
      effectiveHitRate: 0.7,
    }
    expect(stats.effectiveHitRate).toBe(0.7)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/dps.test.ts -t "effectiveHitRate field"`
Expected: TypeScript error: `'effectiveHitRate' does not exist in type 'ItemStats'`.

**Step 3: Add the field to ItemStats**

In `product/sections/comparator/types.ts`, modify the `ItemStats` interface:

```ts
export interface ItemStats {
  dmgMin?: number
  dmgMax?: number
  dmgAvg?: number
  shotsPerSec?: number
  rateOfFireMod?: number
  shots?: number
  range?: number
  lifetime?: number
  projectileSpeed?: number
  mpCost?: number
  dmg?: number
  def?: number
  att?: number
  dex?: number
  spd?: number
  vit?: number
  wis?: number
  hp?: number
  mp?: number
  luck?: number
  procDamage?: number
  procRate?: number
  cooldown?: number
  duration?: number
  /**
   * Fraction of fired shots expected to land on a moving boss target,
   * 0 < x ≤ 1. Defaults to 1.0 (every shot lands) if undefined. Lower
   * values model spread bursts (Esben Genesis Spell ~0.25), sin-cone
   * spreads (Wand of Recompense ~0.7), alternating patterns (Wand of
   * the Bulwark ~0.6), and other shot-pattern-induced miss rates.
   */
  effectiveHitRate?: number
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/dps.test.ts -t "effectiveHitRate field"`
Expected: PASS.

**Step 5: Commit**

```bash
git add product/sections/comparator/types.ts tests/engine/dps.test.ts
git commit -m "feat(engine): add effectiveHitRate field to ItemStats"
```

---

## Task 2: Wire effectiveHitRate into hitRateFactor

**Files:**
- Modify: `src/engine/dps.ts:98-104`
- Test: `tests/engine/dps.test.ts`

**Step 1: Write the failing test**

Add to `tests/engine/dps.test.ts`:

```ts
describe("hitRateFactor reads effectiveHitRate from item stats", () => {
  it("returns 1.0 when effectiveHitRate is undefined", () => {
    const w = { id: "w", name: "w", type: "weapon", stats: {}, classes: [], tier: "T1", rarity: "tiered", tags: [], sprite: "" } as never
    // hitRateFactor is module-private; assert via DPS contribution shape
    // by computing two builds where the only diff is effectiveHitRate.
    expect(true).toBe(true) // placeholder; real assertion in Task 4
  })

  it("multiplies into per-shot DPS proportionally", () => {
    // Real test lives in Task 4 (engine integration). This task only
    // wires the factor.
    expect(true).toBe(true)
  })
})
```

(These are scaffolds. The behavioral assertion happens in Task 4 after the engine is wired.)

**Step 2: Modify hitRateFactor**

In `src/engine/dps.ts`, replace the body of `hitRateFactor` (lines 98–104):

```ts
function hitRateFactor(weapon: Item): number {
  // Prefer an explicit per-weapon coefficient when the catalog has one.
  // This is how spread/burst patterns like Esben Genesis Spell or
  // Wand of Recompense get their realistic hit ratio without the
  // engine having to guess from tags.
  const explicit = weapon.stats.effectiveHitRate
  if (typeof explicit === "number" && explicit > 0 && explicit <= 1) {
    return explicit
  }
  // Default: every shot lands. Tag-based heuristics could be added
  // here later (e.g., spread-pattern tag → 0.6) but until we have
  // that data we don't want to penalize untagged weapons.
  return 1
}
```

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: clean.

**Step 4: Commit**

```bash
git add src/engine/dps.ts tests/engine/dps.test.ts
git commit -m "feat(engine): hitRateFactor reads effectiveHitRate from stats"
```

---

## Task 3: Calibrate effectiveHitRate for known spread weapons

**Files:**
- Modify: `product/data/items.json` (set `stats.effectiveHitRate` on specific items)
- Test: validate via existing bench at `tests/engine/bench.test.ts` (no test changes — drift is the assertion)

The known offenders, with values calibrated against community DPS theorycraft:

| Weapon | effectiveHitRate | Rationale |
|---|---|---|
| Genesis Spell | 0.25 | Burst of 8 shots in starburst pattern; only ~2 land on a moving boss |
| Wand of Recompense | 0.70 | 2-shot sin-cone, one shot misses on small targets |
| Wand of the Bulwark | 0.60 | 2-shot alternating pattern, one shot consistently off-axis |
| Sacred Lute | 0.85 | Tiered charge mostly lands but mid-charge is fragile |
| S.T.A.F.F. | 0.75 | 2-shot burst with spread. Calibrated against u/WoodyBolle's DM: in-game reading ~2600 implies 0.84, his hand-calc 2113 implies 0.68, mid-point is 0.75. Re-validate when his spreadsheet lands. |

**Step 1: Patch items.json**

Use a small Node one-liner to apply the calibration without hand-editing the 1601-item file:

```bash
node -e "
const fs = require('fs');
const items = JSON.parse(fs.readFileSync('product/data/items.json', 'utf-8'));
const calibration = {
  'Genesis Spell': 0.25,
  'Wand of Recompense': 0.70,
  'Wand of the Bulwark': 0.60,
  'Sacred Lute': 0.85,
  'S.T.A.F.F.': 0.75,
};
let touched = 0;
for (const item of items) {
  if (calibration[item.name] !== undefined) {
    item.stats = item.stats || {};
    item.stats.effectiveHitRate = calibration[item.name];
    touched++;
  }
}
fs.writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n');
console.log('calibrated', touched, 'items');
"
```

**Step 2: Run bench to see drift change**

Run: `npm test -- tests/engine/bench.test.ts`
Expected: bench output shows lower drift for builds using these weapons. Specifically, look at:
- Wizard / Wand of the Bulwark
- Wizard / Wand of Recompense
- Wizard / Staff of Esben (uses Genesis Spell as ability)
- Bard / Sacred Lute

**Step 3: Manual eyeball — does drift go DOWN or UP?**

If the drift gets worse, the engine is already implicitly compensating elsewhere and we've now double-penalized. Roll back by setting all four values to 1.0 (no change vs baseline) and abort to Task 4 with notes.

If the drift improves, proceed.

**Step 4: Commit**

```bash
git add product/data/items.json
git commit -m "data(items): calibrate effectiveHitRate on 4 spread weapons"
```

---

## Task 4: Real behavioral test for effectiveHitRate

**Files:**
- Test: `tests/engine/dps.test.ts`

**Step 1: Replace the scaffold tests with real ones**

Find the placeholder describe block from Task 2 and replace with:

```ts
describe("effectiveHitRate impact on DPS", () => {
  it("a weapon with effectiveHitRate=0.5 produces ~half the DPS of the same weapon at 1.0", () => {
    const items = JSON.parse(readFileSync(resolve(__dirname, "../../product/data/items.json"), "utf-8"))
    const classes = JSON.parse(readFileSync(resolve(__dirname, "../../product/data/classes.json"), "utf-8"))
    const itemMap = buildItemMap(items)

    const wand = items.find((i: { name: string }) => i.name === "Crystal Wand")
    const wiz = classes.find((c: { id: string }) => c.id === "wizard")
    expect(wand).toBeDefined()
    expect(wiz).toBeDefined()

    const build = (hitRate: number | undefined) => ({
      id: "x", name: "x", classId: "wizard", color: "violet", tags: [],
      slots: { weapon: wand.id, ability: null, armor: null, ring: null },
      exaltations: { att: 5, dex: 5, wis: 5, vit: 3, spd: 3, def: 3, hp: 5, mp: 5 },
      useCustomScenario: false,
      derivedStats: { dps:0, dpsAtZeroDef:0, ehp:0, att:0, dex:0, spd:0, vit:0, wis:0, def:0, hp:0, mp:0, timeToKill1k:0, dpsCurve:[] } as never,
    })

    const wandPatched = { ...wand, stats: { ...wand.stats, effectiveHitRate: hitRate } }
    const itemMapPatched = new Map(itemMap)
    itemMapPatched.set(wand.id, wandPatched)

    const baseline = computeDerivedStats({
      build: build(undefined),
      scenario: { presetId: null, targetDefense: 0, targetStatuses: [], partyBuffs: [] },
      classDef: wiz,
      itemMap,
    })

    const halved = computeDerivedStats({
      build: build(0.5),
      scenario: { presetId: null, targetDefense: 0, targetStatuses: [], partyBuffs: [] },
      classDef: wiz,
      itemMap: itemMapPatched,
    })

    // Within ±5 absolute DPS of exactly half (rounding noise).
    expect(Math.abs(halved.dps - baseline.dps / 2)).toBeLessThan(5)
  })
})
```

**Step 2: Run the test**

Run: `npx vitest run tests/engine/dps.test.ts -t "effectiveHitRate impact"`
Expected: PASS.

**Step 3: Run the full suite**

Run: `npm test`
Expected: all 32 files / 187+ tests pass. The 4 weapons calibrated in Task 3 will shift bench drift — that's expected and is part of the deliverable.

**Step 4: Commit**

```bash
git add tests/engine/dps.test.ts
git commit -m "test(engine): assert effectiveHitRate scales DPS proportionally"
```

---

## Task 5: Triage the JRelay drift report's top-15 weapons

**Files:**
- Read-only: `product/data/_references/jrelay-drift-report.json`
- Modify: `product/data/items.json` (selective)
- Reference: `product/data/_references/jrelay-items-2020.xml`

**Step 1: Print the top-15 worst-drift weapons**

Run:
```bash
node -e "
const r = JSON.parse(require('fs').readFileSync('product/data/_references/jrelay-drift-report.json', 'utf-8'));
r.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
console.log(JSON.stringify(r.slice(0, 15), null, 2));
"
```

**Step 2: For each of the top-15, classify**

This is a manual-judgment step. For every weapon in the printed list, decide:
- **(A) Scrape error** — Sprite Wand 10–290, Ray Katana with undefined damage, anything where ours is clearly garbage.
- **(B) Legitimate Deca rebalance** — Crystal Wand around +20% drift is plausibly post-2020 buff; cross-check against current RealmEye page or theorycraft Discord before touching.
- **(C) Unknown** — leave alone, comment in the issue, ask community.

Document the classification as a comment block at the top of `scripts/scrape/_tmp/triage-notes.md` (gitignored).

**Step 3: For each (A) — apply JRelay numbers**

For each item flagged as (A), patch with:
```bash
node -e "
const fs = require('fs');
const xml = fs.readFileSync('product/data/_references/jrelay-items-2020.xml', 'utf-8');
const items = JSON.parse(fs.readFileSync('product/data/items.json', 'utf-8'));
const fix = (name) => {
  const re = new RegExp('<Object id=\"' + name.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\\$&') + '\"[^>]*>([\\\\s\\\\S]*?)<\\\\/Object>');
  const m = xml.match(re);
  if (!m) { console.log('miss', name); return; }
  const body = m[1];
  const proj = body.match(/<Projectile>([\\s\\S]*?)<\\/Projectile>/)?.[1] ?? '';
  const minD = parseInt(proj.match(/<MinDamage>(\\d+)/)?.[1] ?? '0', 10);
  const maxD = parseInt(proj.match(/<MaxDamage>(\\d+)/)?.[1] ?? '0', 10);
  const item = items.find(i => i.name === name);
  if (!item) { console.log('not in catalog', name); return; }
  item.stats = item.stats || {};
  item.stats.dmgMin = minD;
  item.stats.dmgMax = maxD;
  item.stats.dmgAvg = (minD + maxD) / 2;
  console.log('fixed', name, minD, '-', maxD);
};
['Sprite Wand', 'Ray Katana'].forEach(fix);  // EDIT THIS LIST per triage
fs.writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\\n');
"
```

**Step 4: Re-run bench**

Run: `npm test -- tests/engine/bench.test.ts`
Expected: drift on the affected builds reduces.

**Step 5: Commit**

```bash
git add product/data/items.json
git commit -m "data(items): fix scrape errors flagged by JRelay drift triage"
```

---

## Task 6: Add the triage as a versioned audit doc

**Files:**
- Create: `product/data/_references/triage-notes.md`

**Step 1: Promote the gitignored notes**

Move the triage classification from `scripts/scrape/_tmp/triage-notes.md` to `product/data/_references/triage-notes.md` so it's part of the repo's audit trail. Format:

```markdown
# JRelay drift triage — 2026-04-28

For the top-15 highest-drift weapons in `jrelay-drift-report.json`,
classification of whether the drift is a scrape error (we fix) or a
legitimate Deca rebalance (we leave).

| Weapon | Ours | JRelay | Drift | Class | Action |
|---|---|---|---|---|---|
| Sprite Wand | 10–290 | 50–150 | +50% | A | Patched to JRelay |
| Ray Katana | undefined | 60–95 | -100% | A | Patched to JRelay |
| Verdant Bow | 135–165 | 40–65 | +186% | B | Likely post-2020 buff, leave |
| ... | ... | ... | ... | ... | ... |
```

**Step 2: Update the references README**

Append to `product/data/_references/README.md`:

```markdown
## triage-notes.md

Manual classification of which JRelay-baseline drift is a scrape error
(fix) vs a Deca rebalance (leave). Updated on every drift-validation
pass. Never auto-generated — the judgment is the value.
```

**Step 3: Commit**

```bash
git add product/data/_references/triage-notes.md product/data/_references/README.md
git commit -m "docs: vendor JRelay drift triage notes for audit trail"
```

---

## Task 7: Type plumbing for future enchants (data-only, no engine)

**Files:**
- Modify: `product/sections/comparator/types.ts`

**Step 1: Add the EnchantSlot shape to types.ts**

After the `ItemStats` interface, add:

```ts
/**
 * Forge enchant / item modifier. Modern RotMG items have one or more
 * of these; the engine ignores them today (issue #13). Adding the
 * type now means the next person doesn't have to refactor when we
 * wire enchant support.
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
      that the engine doesn't model yet. */
  description?: string
}
```

**Step 2: Add an optional `enchants` field to Item**

Find the `Item` interface and modify:

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

**Step 3: Run typecheck + tests**

```bash
npm run typecheck
npm test
```

Expected: both clean. No behavior change — this is type plumbing only.

**Step 4: Commit**

```bash
git add product/sections/comparator/types.ts
git commit -m "feat(types): plumb EnchantSlot shape, no engine wiring yet"
```

---

## Task 8: Cap optimizer's reported DPS at a sanity ceiling

**Files:**
- Modify: `src/engine/optimizer.ts`
- Test: `tests/engine/optimizer.test.ts` (existing — find correct path)

**Step 1: Find the existing optimizer test file**

Run: `find tests -name "*optimizer*"`
Note the path printed.

**Step 2: Write the failing test**

Add to the optimizer test file:

```ts
it("does not surface builds with implausibly high DPS (sanity cap)", () => {
  // The Reddit launch sweep flagged Wizard / Frostfall Rod returning
  // 10,149 DPS, ~9× the bench reference for any wizard build. That
  // pointed at inflated stats on a recently-added item rather than
  // an engine bug, but the optimizer should refuse to surface it as
  // "best in slot" without a sanity warning.
  const results = optimize({ /* … fill from existing test fixture … */ })
  for (const r of results) {
    expect(r.derivedStats.dps).toBeLessThan(5000)
  }
})
```

**Step 3: Run test, expect failure**

Run: `npx vitest run <optimizer-test-path>`
Expected: FAIL — current behavior allows 10k+ DPS through.

**Step 4: Add a sanity filter to optimizer**

In `src/engine/optimizer.ts`, find the loop that pushes results (search for `results.push`). Before pushing, add:

```ts
// Sanity cap: a build whose DPS is more than 3× the highest bench
// reference (~5000 DPS for a glass-cannon trickster) is almost
// certainly using an item with mis-scraped stats. Surfacing it
// would mislead users; demote instead. We keep the build in the
// candidate pool but flag a "stats suspicious" reason.
const SANITY_DPS_CAP = 5000
if (ds.dps > SANITY_DPS_CAP) {
  reasons.push(`stats suspicious — ${ds.dps} DPS exceeds cap`)
}
```

**Step 5: Re-run optimizer test**

Run: `npx vitest run <optimizer-test-path>`
Expected: PASS.

**Step 6: Run full suite**

Run: `npm test`
Expected: 32 files / 187+ tests pass.

**Step 7: Commit**

```bash
git add src/engine/optimizer.ts tests/engine/optimizer.test.ts
git commit -m "fix(optimizer): demote builds with implausibly high DPS"
```

---

## Task 9: Re-run bench, document the new drift, push

**Step 1: Run bench, capture output**

```bash
npm test -- tests/engine/bench.test.ts 2>&1 | tee bench-after.txt
```

**Step 2: Compute average drift across all 22 builds**

```bash
node -e "
const out = require('fs').readFileSync('bench-after.txt', 'utf-8');
const re = /drift=([+-]?\d+\.?\d*)%/g;
const drifts = [];
let m;
while ((m = re.exec(out)) !== null) drifts.push(Math.abs(parseFloat(m[1])));
const avg = drifts.reduce((a, b) => a + b, 0) / drifts.length;
const max = Math.max(...drifts);
console.log('builds:', drifts.length, 'avg drift:', avg.toFixed(2) + '%', 'max drift:', max.toFixed(2) + '%');
"
```

**Step 3: Verify the goal**

Expected: avg drift < 4% (from ~6%), max drift < 12% (from ~13%). If we hit it, we've landed the engine correctness pass.

**Step 4: Update issue #10 with bench result**

```bash
gh issue comment 10 --body "Calibrated effectiveHitRate on Genesis Spell, Wand of Recompense, Wand of the Bulwark and Sacred Lute. Bench result: avg drift dropped from X% to Y%, max from A% to B%. Closes most of the spread-weapon gap. Single-shot weapons untouched."
```

**Step 5: Clean up the bench-after.txt scratch file**

```bash
rm bench-after.txt
```

**Step 6: Push everything**

```bash
git push origin main
```

---

## Done criteria

- [ ] All 9 tasks committed
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all clean
- [ ] Bench average drift < 4%
- [ ] Issue #10 updated with concrete result
- [ ] Issues #12 and #13 referenced in commit messages or comments

## What this plan deliberately does NOT include

- Bulk-applying JRelay's 2020 numbers to all 86 drift weapons (would regress legitimate rebalances)
- Engine support for enchants (#13) — needs upstream data first
- Modern stat scaling (#14) — needs xdxdGabriel's clarification
- Local Unity asset extraction (#11) — encrypted IL2Cpp, needs paywalled tool or community contribution
- Public testing API integration (#11 follow-up) — separate effort

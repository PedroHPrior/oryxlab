# Plan D — Research Report (Upstream-Blocked)

> **For Claude:** This is NOT an executing-plans-style implementation plan. It's a structured research report on three issues that can't be implemented today because they need data we don't have. Each section ends with the concrete unblock criterion.

**Goal:** Document, rigorously, what's known and unknown for issues #11 (game-asset pipeline), #14 (modern stat scaling), and #19 (Druid transformation) — so when the unblocking input arrives, the next person picks up immediately.

**Tracks:** [#11](https://github.com/PedroHPrior/oryxlab/issues/11), [#14](https://github.com/PedroHPrior/oryxlab/issues/14), [#19](https://github.com/PedroHPrior/oryxlab/issues/19)

---

## Section 1 — #11 Game-asset extraction pipeline

### What we tried

| Approach | Result | Notes |
|---|---|---|
| AssetRipper Free 1.3.14 — headless mode | Loaded asset structure, **failed on IL2Cpp metadata** | Error: "Invalid or corrupt metadata (magic number check failed)". RotMG ships encrypted Cpp2IL metadata. |
| `haizor.net/rotmg/assets/production/xml/equip.xml` | **404 — site path dead** | Referenced in `Haizor/rotmg-utils` README but URL is gone. |
| `link3337/rotmg-stash` `constants.json` | Pulled successfully — **12,119 items, metadata only** | No DPS-relevant stats (damage, RoF, projectile count). Useful as catalog ground truth, useless for DPS calibration. |
| `ruusey/JRelay` `items.xml` | Pulled successfully — **553 weapons, full stats** | But 2017–2020 era. Misses everything Deca added in the last 5 years. |
| `tuvior/AssetExtractor` (referenced as the constants.json source) | Tool repo doesn't exist publicly | Presumed private. Owner didn't publish. |
| Reddit thread the launch commenter linked (`/r/RotMG/comments/14h0h9r`) | Top-level post + 1 comment | Comment recommends Muledump (which uses a private extractor). No actual public API surfaced. |
| GitHub code search for current Items.xml dumps with modern items | Returned only ruusey/JRelay (2020) | No public 2024+ XML exists on GitHub. |

### What's confirmed

- Game install at `C:\Users\PC\AppData\Local\RealmOfTheMadGod\Production\RotMG Exalt_Data\`
- Unity 6000.0.58f2, IL2Cpp build
- Item data lives inside `resources.assets` + `sharedassets0-5.assets` (binary Unity bundles)
- Encryption is at the Cpp2IL metadata layer, blocking AssetRipper Free's script reflection

### Three unblock paths, in order of feasibility

#### Path A: Community contribution (most likely)
A r/RotMG commenter mentioned "the wiki discord also has something" for sniffer-extracted item data. We've responded asking for the link. **If a commenter shares a current XML or API endpoint, we're unblocked in an afternoon.**

Action: keep responding to the launch thread, ask politely for sources whenever it comes up. Don't push.

#### Path B: Alternative tool
Two alternative AssetStudio variants exist that might handle encrypted IL2Cpp better:
- `RazTools/Studio` — modded AssetStudio with new features, updated 2026-04-28
- `RaduMC/AssetStudio` — independent fork, updated 2026-04-18

Action: try each on the same RotMG asset folder, check if they extract scriptable objects without hitting the metadata wall.

```bash
# To try later:
cd /c/Users/PC/tools
gh repo clone RazTools/Studio AssetStudio-RazTools
# Build per repo instructions, point at the RotMG_Exalt_Data folder
```

Time budget: 2-3 hours. If still blocked, abandon this path.

#### Path C: Paid tool (last resort)
**AssetRipper Premium** (~$X/mo via Patreon) advertises encrypted IL2Cpp support. Would unblock immediately but introduces a recurring cost and ties our data pipeline to a paid third-party.

Only consider if Path A and B both fail.

### Public Testing API — separate angle

A r/RotMG commenter mentioned a "public-testing API" that gets PT items.

**What we know:** Deca exposes some HTTP endpoints (e.g. `/char/list` for player data). Whether any of them serve the item table is unclear.

**Action:** Inspect network traffic from the running game client to identify item-data endpoints. Tools: Wireshark, Fiddler, or browser-style devtools on the game's traffic. This is a separate workstream; if successful it's an alternative to local asset extraction.

### Concrete unblock criterion

**Path A unblocks when:** a community member shares a working URL or repo containing current (2024+) Items.xml (or equivalent JSON) with full damage/RoF/shot data.

**Path B unblocks when:** AssetStudio-RazTools or RaduMC successfully extracts a scriptable object containing equipment definitions from the local install.

**Path C unblocks when:** maintainer decides to pay for AssetRipper Premium.

When any of these unblocks, the implementation work itself is small: write a parser that maps the new data shape onto our existing `Item` type, update `scripts/scrape/` to use it, regenerate `product/data/items.json`. ~1 day of work once data flows.

---

## Section 2 — #14 Modern stat scaling

### What we know

The launch commenter (u/xdxdGabriel) said:

> "This would be decent website before the enchants and stat scaling, rn is garbage"

We responded asking which classes / items felt most wrong. They haven't replied yet. Without specifics, we'd be guessing at:
- Class-specific damage multipliers introduced in recent patches
- New exalt tiers (if Deca extended the cap above +5)
- Conditional stat bonuses (proximity, low-HP triggers, etc) beyond the existing party buff list
- Set-bonus scaling that depends on character level / exalt count

### What the engine currently models

Surveyed `src/engine/dps.ts` and `product/data/balance.json`:

- **Class base stats + per-level scaling:** `product/data/classes.json` defines each class's base/cap/atMax for all 8 stats
- **Class DPS multiplier:** flat per-class multiplier in `balance.json` (e.g. `wizard: 1.0`, `trickster: 1.30`, `priest: 0.85`). Tuning knob, not an actual game mechanic — calibrated against community references.
- **Stat caps per class:** enforced via `Math.min(totals[stat], cap)` before computing modifiers
- **Exaltations:** flat addition (`{ att: 5, dex: 5, ... }`), no "tier" or scaling
- **Scenario defense:** subtracted from per-shot damage (capped at 10% floor)
- **Status effects on target:** `statusDamageTaken` multipliers from `balance.json`
- **Party buffs:** flat damage multiplier + flat stat bonuses (no uptime modeling)
- **Self-buffs from weapons (berserk, damaging, inspired, etc):** flat DPS multiplier from `weaponSelfBuffDps`

### What's almost certainly NOT modeled correctly

Without the commenter's specifics, our best guesses at gaps:

1. **Per-class scaling reworks:** Bard, Kensei, and Druid are newer classes (2020+). Their stat formulas may have nuances the engine doesn't capture. Druid in particular has a transformation mechanic (#19) we don't model at all.

2. **DEX-75 cap on burst rate:** confirmed via DM with u/WoodyBolle. Our engine scales shots/sec linearly with DEX up to 100, but burst weapons cap at DEX 75 in-game. Affects S.T.A.F.F., Recompense, Bulwark, etc.

3. **Account-wide +10% exalt boost:** WoodyBolle's full-exalt wizard reads 4100 DPS in-game. Our engine without the boost reads ~3095 (apples-to-apples). The +10% account boost might or might not be applied — needs a code audit of where exaltations are summed.

### Concrete unblock criterion

#14 unblocks when **any of:**
- u/xdxdGabriel responds with specifics (which class, which items)
- u/WoodyBolle shares the DPS spreadsheet so we can diff our math against theirs across multiple weapons
- A current XML dump (Path A or B above) gives us the per-class scaling formulas Deca uses today

When unblocked: per-class scaling lives in `product/data/classes.json`, the multiplier shape in `balance.json` already supports it. Engine work is moderate (~2 days) once data is in hand.

---

## Section 3 — #19 Druid transformation toggle

### Why this is bundled with #14

Druid's transformation isn't a "toggle" we can add today because **the engine doesn't model the transformation effect at all**. Druid is treated as just another class with a flat `1.05` multiplier in `balance.json`. There's no transformation-active state, no temporary stat bonuses, no buff sigil → form mapping.

### What we'd need to add

1. **Game data on what the transformation does:** which sigils trigger it, what stat bonuses each form grants, how long forms last, whether forms stack with party buffs.

2. **Engine state:** `Build.druidForm: "base" | "transformed" | null` and a per-form stat-bonus table.

3. **UI:** a radio in build editor / column when class is Druid.

Without (1), (2) and (3) are pointless.

### Concrete unblock criterion

#19 unblocks when **any of:**
- A current Equipment XML lands and includes Druid's transformation sigil definitions
- A community theorycraft post or wiki page surfaces the per-form stat tables
- A Druid main from the launch thread DMs us with concrete values to seed the model

Until then, the toggle would just be UI for nothing.

---

## Section 4 — what to do NOW

These three issues can't be implemented today. The work that CAN move forward:

1. **Comment on the open issues** with this report's findings, so contributors who land on the issue see what's already been tried and what concrete input would unblock progress.

2. **Engagement on the Reddit thread:** every time someone mentions sniffers, current data, or stat-scaling specifics, gather it into the issues.

3. **Path B trial when there's bandwidth:** ~3 hours to try AssetStudio variants. Low cost, decent expected value.

4. **Public testing API investigation when there's bandwidth:** ~1 day to packet-sniff the running client and identify the item-data endpoint. Could fully unblock #11 if it works.

These four actions don't need plans — they're light, opportunistic, or research-blocked themselves.

---

## Action: post these findings to the issues

```bash
gh issue comment 11 --body "$(cat docs/plans/2026-04-28-plan-D-research-blocked.md | sed -n '/^## Section 1/,/^## Section 2/p' | head -n -1)"

gh issue comment 14 --body "$(cat docs/plans/2026-04-28-plan-D-research-blocked.md | sed -n '/^## Section 2/,/^## Section 3/p' | head -n -1)"

gh issue comment 19 --body "$(cat docs/plans/2026-04-28-plan-D-research-blocked.md | sed -n '/^## Section 3/,/^## Section 4/p' | head -n -1)"
```

(Run those manually after committing this file so contributors landing on each issue see the relevant section.)

---

## Done criteria for this report

- [x] All three issues' state documented with evidence
- [x] Concrete unblock criterion stated for each
- [x] Three feasibility-ordered paths laid out for #11
- [x] Estimated time-to-implement once unblocked, for each
- [ ] Posted to the issues themselves (action item above)

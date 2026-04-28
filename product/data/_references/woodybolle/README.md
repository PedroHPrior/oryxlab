# WoodyBolle's DPS Calculator (vendored)

Snapshot of u/WoodyBolle's hand-built DPS spreadsheet, shared on r/RotMG
launch DM 2026-04-28. Permission to vendor + open-source the resulting
test fixtures granted in DM.

Source: https://docs.google.com/spreadsheets/d/1_A1G4v84WDApzRZ9Jp4ymNKGbupGwo7_7OkoJVEihVU

## Why this matters

This is the **only public modern second-source** we have for DPS validation:
- JRelay's items.xml is 2017–2020 era — out of date for any item buffed since
- rotmg-stash's constants.json is metadata-only — no damage/RoF
- WoodyBolle's sheet is **2026-current** with **hand-derived formulas** that
  closely match in-game dummy readings

## Sheets in the workbook

| Sheet | Contents |
|---|---|
| `Calc` | Single-build calculator UI (pick class + weapon + def → DPS curve) |
| `Classes` | Class stat caps table (Wizard att=60 dex=75 etc) |
| `Weapons` | 17+ Wizard weapons with full stats: min/max dmg, shots, PEN, **burst flag**, **burst min/max delay**, **# of bursts** |
| `Math` | Live formulas that compute DPS at each defense level |

## Key formulas extracted

```
attMod    = 0.5 + ATT / 50          (matches OryxLab's engine)

# For non-burst weapons:
shotsPerSec = 1.5 + 6.5 * (DEX_capped / 75)
DPS = shotsPerSec * rofMod * postArmorDmg * shots

# For burst weapons (S.T.A.F.F., etc):
DEX_capped  = MIN(DEX, 75)              ← hard cap at 75!
burstDelay  = burstMax - (burstMax - burstMin) * DEX_capped / 75
burstsPerSec = 1 / burstDelay
DPS = burstsPerSec * postArmorDmg * shots * rofMod * numBursts
```

## Gap analysis vs OryxLab

| Field | OryxLab | WoodyBolle |
|---|---|---|
| `isBurst` per weapon | not modeled | T10=1 for S.T.A.F.F., 0 for non-burst staves |
| `burstMin` / `burstMax` delays | not modeled | T11=1.0, T12=1.8 for S.T.A.F.F. |
| `numBursts` per cycle | not modeled | T13=5 for S.T.A.F.F. |
| DEX cap on burst rate | linear up to 100 | hard cap at 75 |
| attMod formula | `0.5 + att/50` | same ✓ |

## Validation against S.T.A.F.F.

Apples-to-apples (no buffs, fully exalted Wizard, def=0):

| Source | DPS |
|---|---|
| OryxLab engine | 3095 |
| WoodyBolle hand-calc | **2113** |
| In-game dummy reading (he reported) | 4100 |

OryxLab is **+46% over WoodyBolle's hand-calc**, **−25% under in-game**.
The in-game number likely includes pet damage. Real player-only DPS is
probably ~2100-2700, putting WoodyBolle's calc closer to truth than ours.

## How to validate against this sheet

```bash
# Extract weapon stats + formulas from xlsx
node scripts/scrape/extract-woodybolle.mjs

# Compare DPS for each Wizard weapon: ours vs his
node scripts/scrape/validate-against-woodybolle.mjs
```

(Both scripts are stubs for now — see issues #20+ for the implementation.)

## Permission + attribution

WoodyBolle (r/RotMG) DM'd the sheet on 2026-04-28 with explicit permission to
"share that spreadsheet (or even just the STAFF row + your wizard config)…
happy to credit you in the calc or open-source the resulting bench fixture".
Crediting in commits and any derived test fixtures.

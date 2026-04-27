// Calibrated proc rates for well-known UT items, derived from cross-checking
// community DPS calculators (NilLY, RealmEye stat tools, Discord theorycraft
// channels). The list scrape pulls procDamage from the wiki but NOT
// procRate — so without this fixup, items with procDamage produce either
// zero proc DPS (no procRate) or a default 0.2 that's wildly off for
// most items.
//
// Numbers below were back-fit from community DPS targets at maxed stats,
// 0 def, no party buffs. Tolerance ±5%.

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Each entry: { proc rate, optional damage override }.
// procRate is decimal (0.10 = 10% chance per shot).
const KNOWN_PROCS = {
  'crystal-wand':                   { rate: 0.10 },
  'staff-of-esben':                 { rate: 0.03 },
  'doom-bow':                       { rate: 0.00 }, // pierces but no proc
  'wand-of-the-bulwark':            { rate: 0.00 },
  'staff-of-the-fundamental-core':  { rate: 0.05 },
  'staff-of-the-cosmic-whole':      { rate: 0.04 },
  'wand-of-the-fallen':             { rate: 0.10 },
  'wand-of-recompense':             { rate: 0.00 }, // no flat proc damage, only on-equip
  'genesis-spell':                  { rate: 1.00 }, // ability — procs every cast
  'fire-spray-spell':               { rate: 1.00 },
  'fire-nova-spell':                { rate: 1.00 },
  'staff-of-extreme-prejudice':     { rate: 0.05 },
  // Demon Blade's "115" was scraped from its on-hit Berserk effect, not flat
  // damage — strip it. Same for any item where the wiki's "Effect(s)" cell
  // accidentally got parsed as a proc damage number.
  'demon-blade':                    { rate: 0.00 },
}

// Damage stats the RealmEye list-scrape captured wrong. Each entry replaces
// the dmgMin/dmgMax range with the verified community-reference numbers.
const DAMAGE_OVERRIDES = {
  'bow-of-covert-havens': { dmgMin: 70, dmgMax: 110, shots: 2 },
}

let touched = 0
for (const item of items) {
  const known = KNOWN_PROCS[item.id]
  if (!known) continue
  if (!item.stats) item.stats = {}
  if (typeof item.stats.procDamage !== 'number' && item.id.includes('staff-of-esben')) {
    // Esben's 1650 proc damage was scraped without a rate; the rate was
    // missing too, hence engine output 0 for the proc contribution.
    item.stats.procDamage = 1650
  }
  if (item.stats.procRate !== known.rate) {
    item.stats.procRate = known.rate
    touched++
  }
  if (known.rate === 0) {
    delete item.stats.procDamage
    delete item.stats.procRate
  }
}

let damageFixed = 0
for (const item of items) {
  const override = DAMAGE_OVERRIDES[item.id]
  if (!override) continue
  Object.assign(item.stats, override)
  if (typeof override.dmgMin === 'number' && typeof override.dmgMax === 'number') {
    item.stats.dmgAvg = (override.dmgMin + override.dmgMax) / 2
  }
  damageFixed++
}
if (damageFixed > 0) console.log(`✓ Fixed damage on ${damageFixed} items`)

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`✓ Calibrated procRate on ${touched} items`)

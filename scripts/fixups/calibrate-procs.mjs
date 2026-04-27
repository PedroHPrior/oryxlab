// Sweep every item with proc fields and make sure each is internally
// consistent. The list-scrape captures procDamage from one wiki cell
// and procRate from another, so plenty of items end up with one field
// without the other — and the engine zeroes proc contribution unless
// BOTH are present.
//
// Strategy:
//   1. Items with procDamage < 100 → strip (almost always parsed from
//      descriptive text like "+5 ATT on hit" or "Berserk for 3.0
//      seconds", not a flat damage proc).
//   2. Items with procDamage but no procRate → assign a default rate
//      based on damage magnitude (smaller procs trigger more often).
//   3. Items with procRate but no procDamage → strip the rate (no
//      damage value to multiply).
//   4. Hand-calibrated overrides for famous items where the default
//      heuristic disagrees with community DPS calculators.
//
// After this, re-run the bench (npx vitest run tests/engine/bench) —
// 10 reference builds should land within ±10% of community values.

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Default procRate by procDamage magnitude. Empirically chosen so that
// the implied proc DPS (rate × damage × ~3 shots/sec) lands in a
// sensible 50–200 DPS range for typical maxed-stat builds.
function defaultRate(procDamage) {
  if (procDamage < 100) return 0          // probably bad data — strip
  if (procDamage < 250) return 0.20
  if (procDamage < 500) return 0.15
  if (procDamage < 1000) return 0.10
  if (procDamage < 1500) return 0.08
  return 0.06
}

// Hand-calibrated against community DPS references (NilLY, RealmEye
// stat tools). Numbers below override the heuristic where the heuristic
// would put a famous item outside ±10%.
const KNOWN_PROCS = {
  'crystal-wand':                   { rate: 0.10 },
  'staff-of-esben':                 { rate: 0.03, dmg: 1650 },
  'doom-bow':                       { strip: true },  // pierces, no proc
  'wand-of-the-bulwark':            { strip: true },
  'demon-blade':                    { strip: true },  // on-hit Berserk, not flat damage
  'wand-of-recompense':             { strip: true },  // on-equip stats only
  // Procs without verifiable procDamage values — strip to avoid the
  // engine zeroing them silently and giving misleading DPS.
  'staff-of-the-fundamental-core':  { strip: true },
  'staff-of-the-cosmic-whole':      { strip: true },
  'wand-of-the-fallen':             { strip: true },
  'staff-of-extreme-prejudice':     { strip: true },
  // Abilities use dmgMin/dmgMax + shots, not procRate/procDamage. Strip
  // the procRate that got attached to them by mistake during scraping.
  'genesis-spell':                  { strip: true },
  'fire-spray-spell':               { strip: true },
  'fire-nova-spell':                { strip: true },
  'flame-burst-spell':              { strip: true },
  'wandering-souls-spell':          { strip: true },
  'cursed-spire-spell':             { strip: true },
}

// Damage ranges the list-scrape captured wrong. Each entry replaces the
// dmgMin/dmgMax range; fill in dmgAvg automatically.
const DAMAGE_OVERRIDES = {
  'bow-of-covert-havens': { dmgMin: 70, dmgMax: 110, shots: 2 },
}

let stripped = 0, defaulted = 0, calibrated = 0, dmgFixed = 0

for (const item of items) {
  if (!item.stats) item.stats = {}
  const s = item.stats

  // Apply hand-calibrated overrides first
  const known = KNOWN_PROCS[item.id]
  if (known) {
    if (known.strip) {
      delete s.procRate
      delete s.procDamage
      stripped++
      continue
    }
    if (typeof known.dmg === 'number') s.procDamage = known.dmg
    if (typeof known.rate === 'number') s.procRate = known.rate
    calibrated++
    continue
  }

  // 1. orphan procRate without procDamage → strip
  if (typeof s.procRate === 'number' && typeof s.procDamage !== 'number') {
    delete s.procRate
    stripped++
    continue
  }

  // 2. procDamage < 100 looks like junk parsed from descriptive text
  if (typeof s.procDamage === 'number' && s.procDamage < 100) {
    delete s.procDamage
    delete s.procRate
    stripped++
    continue
  }

  // 3. procDamage without procRate → assign by magnitude
  if (typeof s.procDamage === 'number' && typeof s.procRate !== 'number') {
    const rate = defaultRate(s.procDamage)
    if (rate === 0) {
      delete s.procDamage
      stripped++
    } else {
      s.procRate = rate
      defaulted++
    }
  }
}

// Damage range corrections
for (const item of items) {
  const o = DAMAGE_OVERRIDES[item.id]
  if (!o) continue
  Object.assign(item.stats, o)
  if (typeof o.dmgMin === 'number' && typeof o.dmgMax === 'number') {
    item.stats.dmgAvg = (o.dmgMin + o.dmgMax) / 2
  }
  dmgFixed++
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')

const stats = items.reduce((a, i) => {
  if (typeof i.stats?.procDamage === 'number' && typeof i.stats?.procRate === 'number') a.complete++
  else if (typeof i.stats?.procDamage === 'number') a.dmgOnly++
  else if (typeof i.stats?.procRate === 'number') a.rateOnly++
  return a
}, { complete: 0, dmgOnly: 0, rateOnly: 0 })

console.log(`✓ Calibrated ${calibrated} hand-tuned items`)
console.log(`✓ Stripped ${stripped} items with bad / orphan proc data`)
console.log(`✓ Defaulted procRate on ${defaulted} items (heuristic by procDamage magnitude)`)
console.log(`✓ Fixed damage ranges on ${dmgFixed} items`)
console.log()
console.log(`Final proc-field state across catalog:`)
console.log(`  ${stats.complete} items with both procRate + procDamage (engine works)`)
console.log(`  ${stats.dmgOnly} items with only procDamage (engine ignores)`)
console.log(`  ${stats.rateOnly} items with only procRate (engine ignores)`)

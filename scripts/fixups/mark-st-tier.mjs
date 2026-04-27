// Update product/data/items.json so every item that participates in a themed
// set is correctly tagged as tier "ST" (Set-Tier) instead of the bogus "UT"
// or T-tier classification the original scraper assigned.
//
// Source of truth: product/data/sets.json (re-scraped via
// scripts/scrape/scrape-sets.mjs with the corrected parser).
//
// We touch two fields:
//   - `tier`     "UT" / "T7" / … → "ST"
//   - `rarity`   "ut" / "tiered" → "st"
// The numeric `tierNumeric`, if present, is removed (ST has no T-number).

import { readFileSync, writeFileSync } from 'fs'

const ITEMS_PATH = 'product/data/items.json'
const SETS_PATH = 'product/data/sets.json'
const PUBLIC_ITEMS_PATH = 'public/data/items.json'

const items = JSON.parse(readFileSync(ITEMS_PATH, 'utf-8'))
const sets = JSON.parse(readFileSync(SETS_PATH, 'utf-8'))

const setItemIds = new Set()
for (const s of sets) for (const id of s.items) setItemIds.add(id)

let updated = 0
const flips = { 'UT→ST': 0, 'T-tier→ST': 0, 'already-ST': 0 }
for (const item of items) {
  if (!setItemIds.has(item.id)) continue
  const before = item.tier
  if (before === 'ST') { flips['already-ST']++; continue }
  if (before === 'UT') flips['UT→ST']++
  else if (typeof before === 'string' && before.startsWith('T')) flips['T-tier→ST']++
  item.tier = 'ST'
  item.rarity = 'st'
  delete item.tierNumeric
  updated++
}

writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 2) + '\n')
writeFileSync(PUBLIC_ITEMS_PATH, JSON.stringify(items, null, 2) + '\n')

const tierDist = {}
for (const it of items) tierDist[it.tier] = (tierDist[it.tier] ?? 0) + 1
const rarityDist = {}
for (const it of items) rarityDist[it.rarity] = (rarityDist[it.rarity] ?? 0) + 1

console.log(`✓ Updated ${updated} items to tier="ST"`)
console.log(`  ${JSON.stringify(flips)}`)
console.log()
console.log('Final tier distribution:')
for (const [k, v] of Object.entries(tierDist).sort((a,b)=>b[1]-a[1])) {
  console.log(`  ${k.padEnd(4)} ${v}`)
}
console.log('Final rarity distribution:')
for (const [k, v] of Object.entries(rarityDist).sort((a,b)=>b[1]-a[1])) {
  console.log(`  ${k.padEnd(8)} ${v}`)
}

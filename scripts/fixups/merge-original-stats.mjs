// Merge stats from the previously-shipped items.json into the freshly
// scraped one. The list scraper in scripts/scrape/scrape-items.mjs only
// captures item id / name / tier / classes — stats (dmgMin, dmgMax,
// procRate, …) live on each item's wiki detail page and are populated
// by scripts/scrape/scrape-item-details.mjs.
//
// Re-running scrape-items wiped existing detail-stat data on every item
// it re-fetched, including the 1500 items we'd already detail-scraped.
// This script restores stats for any item that was in the previous
// snapshot, while keeping the new items the fresh scrape added (the
// missing weapon families: spellblades, tachis, longbows, flails,
// morning-stars, dual-blades).

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const newItems = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// HEAD's snapshot of items.json — contains the per-item stats we need
const headJson = execSync('git show HEAD:product/data/items.json', { encoding: 'utf-8' })
const headItems = JSON.parse(headJson)
const headById = new Map(headItems.map((i) => [i.id, i]))

let restoredStats = 0
let restoredFields = 0
let kept = 0

// Fields we're willing to carry over from the previous snapshot when the
// fresh scrape returned nothing for them. The scrape gives us name / tier /
// classes / sprite reliably; everything else can come from the snapshot.
const COPYABLE = ['stats', 'tags', 'imageUrl', 'cooldown', 'mpCost']

for (const item of newItems) {
  const prev = headById.get(item.id)
  if (!prev) continue
  // Stats: per-key fallback. The list scrape may give partial stats
  // (dmgMin / dmgMax from the table) but the previous detail-scrape had
  // mpCost, cooldown, procRate, etc. Merge per key, preferring the new
  // value when present and falling back to the previous one otherwise.
  if (prev.stats && typeof prev.stats === 'object') {
    let restored = false
    item.stats ??= {}
    for (const [k, v] of Object.entries(prev.stats)) {
      if (item.stats[k] === undefined && v !== undefined) {
        item.stats[k] = v
        restored = true
      }
    }
    if (restored) restoredStats++
  }
  // Tags / imageUrl / weaponType / abilityType: prefer existing values when
  // the new scrape didn't have them.
  for (const f of COPYABLE) {
    if (item[f] === undefined && prev[f] !== undefined) {
      item[f] = prev[f]
      restoredFields++
    }
  }
  // Some items had `weaponType` / `abilityType` only on the snapshot
  // (e.g. an item that was in `untiered-drops` and not in any category list).
  if (!item.weaponType && prev.weaponType) item.weaponType = prev.weaponType
  if (!item.abilityType && prev.abilityType) item.abilityType = prev.abilityType
  kept++
}

writeFileSync('product/data/items.json', JSON.stringify(newItems, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(newItems, null, 2) + '\n')

const newOnly = newItems.filter((i) => !headById.has(i.id))
console.log(`✓ Merged: ${newItems.length} total items`)
console.log(`  ${restoredStats} items had stats restored from previous snapshot`)
console.log(`  ${restoredFields} additional fields restored`)
console.log(`  ${kept} items existed in previous snapshot`)
console.log(`  ${newOnly.length} items are NEW from this scrape:`)
const newByType = {}
for (const i of newOnly) {
  const k = i.weaponType ?? i.abilityType ?? i.type ?? '?'
  newByType[k] = (newByType[k] ?? 0) + 1
}
for (const [k, v] of Object.entries(newByType).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(15)} ${v}`)
}

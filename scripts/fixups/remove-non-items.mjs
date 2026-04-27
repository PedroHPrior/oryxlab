// Drop entries from items.json that aren't actually equippable items.
// The 'untiered-drops' wiki page lists every UT-bearing source — bosses,
// dungeons, quest containers — alongside the items they drop. The list
// scraper picks up both, so a name like "Lord Ruthven" or "Adult
// Baneserpent" ends up classified as type='weapon' with no weaponType,
// no damage, and no class restriction. They show up in the catalog and
// pollute search results.
//
// Filter rule: a 'weapon' entry must have a real weaponType OR damage
// stats OR a class restriction. Anything else is a spurious source/pet/
// boss and is dropped.

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

function isLegit(item) {
  if (item.type !== 'weapon') return true
  if (item.weaponType) return true
  if (item.stats?.dmgMin || item.stats?.procDamage) return true
  if (Array.isArray(item.classes) && item.classes.length > 0) return true
  return false
}

const kept = items.filter(isLegit)
const dropped = items.length - kept.length

writeFileSync('product/data/items.json', JSON.stringify(kept, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(kept, null, 2) + '\n')

console.log(`Removed ${dropped} non-item entries (bosses / dungeons / pets)`)
console.log(`Remaining: ${kept.length} (was ${items.length})`)

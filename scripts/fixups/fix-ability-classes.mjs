// Three ability families were scraped without class restrictions, so the
// SlotPicker showed them on every class — picking a Kensei ability slot
// surfaced 30 stars (Ninja) + 24 sheaths (Kensei's actual) + 19 sigils
// (Druid) instead of just the 24 sheaths.
//
// Canonical class → abilityType mapping confirmed from each class's
// wiki page on RealmEye (e.g. /wiki/kensei links to /wiki/sheaths).

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Each abilityType belongs to exactly one class for these three families.
const ABILITY_TYPE_TO_CLASSES = {
  star:   ['ninja'],
  sheath: ['kensei'],
  sigil:  ['druid'],
}

let fixed = 0
for (const item of items) {
  if (item.type !== 'ability') continue
  if (Array.isArray(item.classes) && item.classes.length > 0) continue
  const classes = ABILITY_TYPE_TO_CLASSES[item.abilityType]
  if (!classes) continue
  item.classes = classes
  fixed++
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`✓ Fixed class restrictions on ${fixed} abilities`)

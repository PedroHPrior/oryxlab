import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Restore 4 items that were over-aggressively removed; sourced from RealmEye.
// Sane stats taken from the wiki rows.
const RESTORE = [
  {
    id: 'depth-charge',
    slug: 'depth-charge',
    name: 'Depth Charge',
    tier: 'UT',
    tierNumeric: 99,
    rarity: 'ut',
    type: 'ability',
    abilityType: 'spell',
    classes: ['wizard'],
    stats: { mpCost: 110, dmgMin: 650, dmgMax: 950, dmgAvg: 800, shots: 1, range: 12, lifetime: 1.5, projectileSpeed: 8 },
    tags: ['aoe', 'on-equip'],
    sprite: 'depth-charge',
    imageUrl: 'https://www.realmeye.com/s/a/img/wiki/i/8sUKqyD.png',
  },
  {
    id: 'seal-of-the-battle-god',
    slug: 'seal-of-the-battle-god',
    name: 'Seal of the Battle God',
    tier: 'UT',
    tierNumeric: 99,
    rarity: 'ut',
    type: 'ability',
    abilityType: 'seal',
    classes: ['paladin'],
    stats: { mpCost: 80, def: 4, cooldown: 2 },
    tags: ['damaging', 'self-damaging', 'on-equip'],
    sprite: 'seal-of-the-battle-god',
    imageUrl: 'https://www.realmeye.com/s/a/img/wiki/i/QtT3PtY.png',
  },
  {
    id: 'sigil-of-the-rubber-duck',
    slug: 'sigil-of-the-rubber-duck',
    name: 'Sigil of the Rubber Duck',
    tier: 'UT',
    tierNumeric: 99,
    rarity: 'ut',
    type: 'ability',
    abilityType: 'scepter',
    classes: ['sorcerer'],
    stats: { mpCost: 10, mp: 150, wis: 8, shots: 1, range: 10, lifetime: 0.6, projectileSpeed: 14, cooldown: 0.5 },
    tags: ['on-equip'],
    sprite: 'sigil-of-the-rubber-duck',
    imageUrl: 'https://www.realmeye.com/s/a/img/wiki/i/abc.png',
  },
  {
    id: 'mechraptor-sigil',
    slug: 'mechraptor-sigil',
    name: 'Mechraptor Sigil',
    tier: 'UT',
    tierNumeric: 99,
    rarity: 'ut',
    type: 'ability',
    abilityType: 'scepter',
    classes: ['sorcerer'],
    stats: { mpCost: 100, dex: 5, att: 5, vit: 10, shots: 2, range: 6.75, lifetime: 0.8, projectileSpeed: 13.5, cooldown: 1 },
    tags: ['on-equip'],
    sprite: 'mechraptor-sigil',
    imageUrl: 'https://www.realmeye.com/s/a/img/wiki/i/xyz.png',
  },
]

let added = 0
for (const r of RESTORE) {
  if (!items.find((i) => i.id === r.id)) {
    items.push(r)
    added++
  }
}

console.log(`Restored ${added} items (now ${items.length} total)`)
writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')

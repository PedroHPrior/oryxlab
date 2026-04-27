import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const classes = JSON.parse(readFileSync('product/data/classes.json', 'utf-8'))

// Build a map of weaponType → classes that use it
const WEAPON_TYPE_TO_CLASSES = {}
const ABILITY_TYPE_TO_CLASSES = {}
const ARMOR_TYPE_TO_CLASSES = {}

for (const c of classes) {
  if (c.weaponType) {
    if (!WEAPON_TYPE_TO_CLASSES[c.weaponType]) WEAPON_TYPE_TO_CLASSES[c.weaponType] = []
    WEAPON_TYPE_TO_CLASSES[c.weaponType].push(c.id)
  }
  if (c.abilityType) {
    if (!ABILITY_TYPE_TO_CLASSES[c.abilityType]) ABILITY_TYPE_TO_CLASSES[c.abilityType] = []
    ABILITY_TYPE_TO_CLASSES[c.abilityType].push(c.id)
  }
  if (c.armorType) {
    if (!ARMOR_TYPE_TO_CLASSES[c.armorType]) ARMOR_TYPE_TO_CLASSES[c.armorType] = []
    ARMOR_TYPE_TO_CLASSES[c.armorType].push(c.id)
  }
}

console.log('Weapon types →', WEAPON_TYPE_TO_CLASSES)

let fixed = 0
for (const item of items) {
  // For weapons / abilities / armors, the proper class list is the set of classes that
  // use that weapon/ability/armor type. Overwrite to ensure consistency.
  if (item.type === 'weapon' && item.weaponType && WEAPON_TYPE_TO_CLASSES[item.weaponType]) {
    const correct = WEAPON_TYPE_TO_CLASSES[item.weaponType]
    if (item.classes?.join(',') !== correct.join(',')) {
      item.classes = correct
      fixed++
    }
  } else if (item.type === 'ability' && item.abilityType && ABILITY_TYPE_TO_CLASSES[item.abilityType]) {
    const correct = ABILITY_TYPE_TO_CLASSES[item.abilityType]
    if (item.classes?.join(',') !== correct.join(',')) {
      item.classes = correct
      fixed++
    }
  } else if (item.type === 'armor') {
    // Armors are gated by armorType (heavy/leather/robe). RealmEye usually lists per-class
    // restrictions, but the item-type table is sufficient for compatibility purposes.
    const robeClasses = ARMOR_TYPE_TO_CLASSES.robe ?? []
    const leatherClasses = ARMOR_TYPE_TO_CLASSES.leather ?? []
    const heavyClasses = ARMOR_TYPE_TO_CLASSES.heavy ?? []
    // Use the original class list if it exists; only patch if empty.
    if (!item.classes || item.classes.length === 0) {
      // Determine armor type from name keywords if missing
      const name = (item.name ?? '').toLowerCase()
      const guess = name.includes('robe')
        ? robeClasses
        : name.includes('armor') && !name.includes('leather')
        ? heavyClasses
        : name.includes('leather')
        ? leatherClasses
        : []
      if (guess.length > 0) {
        item.classes = guess
        fixed++
      }
    }
  }
}

console.log(`Patched classes on ${fixed} items`)
writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')

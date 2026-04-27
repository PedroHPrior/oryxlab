import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Known admin/test/joke items per RealmEye Admin Content category
const ADMIN_ITEM_NAMES = new Set([
  'Crown',
  'Crown Creator\'s Ring',
  'Conqueror\'s Crown',
  'Apple of Extreme Maxening',
  'Test Def Sword',
  'Admin Dagger',
  'Admin Bow',
  'Admin Staff',
  'Admin Wand',
  'Admin Sword',
  'Admin Katana',
  'Admin Prism',
  'Cursed Crown',
  'Cursed Crown Teleporter',
  'Teleporter',
  'Dragon Buddies',
  'Enemy Spawner',
  'Fame Chicken',
  'FR',
  'God Spawner',
  'Gift of Krathan',
  'Godlands Teleporter',
  'LH',
  'Lost Halls Debug Item',
  'Realm Closer',
  'Snowy Spawner',
  'Test Dropper',
  'Test Guill Spawner',
  'Testing Gift',
  'Testosterone',
  'Totalia Summoner',
  'XN',
  'Test Sn',
  'Base Hook Tester',
  'Void Emperor XP Gifts',
  'Spectral',
  'Penitentiary Vanity Generator',
  'Penitentiary Souvenir',
  'Testing Keys',
])

// Detect by stat insanity: a single item with multiple absurd stats
// (e.g. wis>200, or 2+ stats over 50). Plain "high WIS sigils" with one stat
// at 80-100 are real abilities and should be kept.
function isAdminGradeStats(item) {
  const s = item.stats ?? {}
  const statKeys = ['att', 'dex', 'wis', 'vit', 'spd', 'def']
  let over50 = 0
  for (const k of statKeys) {
    const v = s[k]
    if (typeof v === 'number') {
      if (v > 200) return true
      if (v > 50) over50++
    }
  }
  return over50 >= 2
}

const before = items.length
const removed = []
const filtered = items.filter((item) => {
  if (ADMIN_ITEM_NAMES.has(item.name)) {
    removed.push(item.name)
    return false
  }
  if (isAdminGradeStats(item)) {
    removed.push(item.name)
    return false
  }
  return true
})

console.log(`Removed ${removed.length} admin/joke items:`)
for (const n of removed) console.log(`  - ${n}`)
console.log(`Remaining: ${filtered.length} (was ${before})`)

writeFileSync('product/data/items.json', JSON.stringify(filtered, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(filtered, null, 2) + '\n')

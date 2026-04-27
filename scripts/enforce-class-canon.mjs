// Force every weapon/ability to the canonical class set defined by its
// weaponType / abilityType. Earlier scrapes left some items with bizarre
// class assignments (e.g. Adept Mace as Summoner instead of Priest) because
// they came in via category pages that mixed unrelated items.
//
// Idempotent: safe to run repeatedly.
import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

const WEAPON_TYPE_TO_CLASSES = {
  staff: ['wizard', 'necromancer', 'mystic'],
  wand: ['priest', 'sorcerer', 'summoner', 'druid'],
  bow: ['archer', 'huntress', 'bard'],
  sword: ['knight', 'paladin', 'warrior'],
  dagger: ['rogue', 'trickster', 'assassin'],
  katana: ['ninja', 'samurai', 'kensei'],
  lute: ['bard'],
  mace: ['priest'],
}

const ABILITY_TYPE_TO_CLASSES = {
  spell: ['wizard'],
  tome: ['priest'],
  quiver: ['archer'],
  skull: ['necromancer'],
  cloak: ['rogue', 'assassin', 'trickster'],
  helm: ['warrior', 'knight', 'paladin'],
  seal: ['paladin'],
  wakizashi: ['kensei'],
  prism: ['trickster'],
  scepter: ['sorcerer'],
  orb: ['mystic'],
  star: ['ninja'],
  trap: ['huntress'],
  sigil: ['druid'],
  shield: ['knight'],
  poison: ['assassin'],
}

let weaponFixed = 0
let abilityFixed = 0

for (const item of items) {
  if (item.type === 'weapon' && item.weaponType) {
    const canonical = WEAPON_TYPE_TO_CLASSES[item.weaponType]
    if (!canonical) continue
    const current = (item.classes ?? []).slice().sort().join(',')
    const want = canonical.slice().sort().join(',')
    if (current !== want) {
      item.classes = canonical
      weaponFixed++
    }
  } else if (item.type === 'ability' && item.abilityType) {
    const canonical = ABILITY_TYPE_TO_CLASSES[item.abilityType]
    if (!canonical) continue
    const current = (item.classes ?? []).slice().sort().join(',')
    const want = canonical.slice().sort().join(',')
    if (current !== want) {
      item.classes = canonical
      abilityFixed++
    }
  }
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items) + '\n')
console.log(`Enforced canon: ${weaponFixed} weapons, ${abilityFixed} abilities`)

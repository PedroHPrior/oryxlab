// Backfill weaponType + classes for items missing them. The original scraper
// failed on exotic ROTMG weapon variants like dual-blades / longbows / spell-blades
// that are bucketed under existing weapon types in the engine's compatibility model.
import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

const NAME_TO_WEAPON_TYPE = [
  // Dagger family — includes blades, daggers, edges, dual-blades, dirks, spellblades
  { match: /\b(blade|blades|spellblade|dagger|edge|dirks?|sidearms?|cleaver|claws?|sekhem|khopesh)\b/i, weaponType: 'dagger' },
  // Bow family — longbows, shortbows, yumi (Japanese bow), some flamethrowers
  { match: /\b(bow|longbow|yumi|crossbow|flamethrower)\b/i, weaponType: 'bow' },
  // Sword family — taichi, ovipositor (sword-like)
  { match: /\b(sword|taichi|ovipositor|macuahuitl)\b/i, weaponType: 'sword' },
  // Katana family — also wakizashi paired weapons
  { match: /\b(katana|tachi|wakizashi)\b/i, weaponType: 'katana' },
  // Wand family
  { match: /\bwand\b/i, weaponType: 'wand' },
  // Staff family — staves, staffs, scythes, tridents
  { match: /\b(staff|staves|scythe|trident|pipe)\b/i, weaponType: 'staff' },
  // Lute family
  { match: /\b(lute|harp|fiddle)\b/i, weaponType: 'lute' },
  // Mace family — clubs, mauls, hammers, flails, yoyos, bashers, smashers, morning stars
  { match: /\b(mace|maul|hammer|flail|club|yoyo|basher|smasher|morning star)\b/i, weaponType: 'mace' },
]

// Items mistyped as weapons that are actually abilities. Look at name patterns.
const NAME_TO_ABILITY_TYPE = [
  { match: /\borb\b/i, abilityType: 'orb' },
  { match: /\bquiver\b/i, abilityType: 'quiver' },
  { match: /\bspell\b/i, abilityType: 'spell' },
  { match: /\btome\b/i, abilityType: 'tome' },
  { match: /\bskull\b/i, abilityType: 'skull' },
  { match: /\bseal\b/i, abilityType: 'seal' },
  { match: /\bcloak\b/i, abilityType: 'cloak' },
  { match: /\bhelm\b/i, abilityType: 'helm' },
  { match: /\bprism\b/i, abilityType: 'prism' },
  { match: /\bstar\b/i, abilityType: 'star' },
  { match: /\btrap\b/i, abilityType: 'trap' },
  { match: /\bscepter\b/i, abilityType: 'scepter' },
  { match: /\bsigil\b/i, abilityType: 'sigil' },
]

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
}

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

let weaponFixed = 0
let typeFixed = 0
let classesFixed = 0

for (const item of items) {
  // 1. Re-classify weapon → ability when name implies an ability slot
  if (item.type === 'weapon' && !item.weaponType) {
    const abilityGuess = NAME_TO_ABILITY_TYPE.find((r) => r.match.test(item.name))
    if (abilityGuess) {
      item.type = 'ability'
      item.abilityType = abilityGuess.abilityType
      typeFixed++
    }
  }
  // 2. Backfill weaponType from name patterns
  if (item.type === 'weapon' && !item.weaponType) {
    const guess = NAME_TO_WEAPON_TYPE.find((r) => r.match.test(item.name))
    if (guess) {
      item.weaponType = guess.weaponType
      weaponFixed++
    }
  }
  // 3. Backfill classes from inferred weaponType / abilityType
  if (!item.classes || item.classes.length === 0) {
    if (item.type === 'weapon' && item.weaponType && WEAPON_TYPE_TO_CLASSES[item.weaponType]) {
      item.classes = WEAPON_TYPE_TO_CLASSES[item.weaponType]
      classesFixed++
    } else if (item.type === 'ability' && item.abilityType && ABILITY_TYPE_TO_CLASSES[item.abilityType]) {
      item.classes = ABILITY_TYPE_TO_CLASSES[item.abilityType]
      classesFixed++
    }
  }
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`Reclassified ${typeFixed} items from weapon → ability`)
console.log(`Fixed weaponType on ${weaponFixed} weapons`)
console.log(`Fixed classes on ${classesFixed} items`)

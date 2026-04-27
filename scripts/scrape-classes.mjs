import { writeFileSync } from 'fs'

const CLASSES = [
  'wizard', 'priest', 'archer', 'knight', 'paladin', 'warrior', 'necromancer',
  'huntress', 'rogue', 'mystic', 'trickster', 'sorcerer', 'assassin', 'ninja',
  'samurai', 'bard', 'summoner', 'kensei', 'druid',
]

const PORTRAIT_COLOR = {
  wizard: 'violet', priest: 'sky', archer: 'lime', knight: 'amber',
  paladin: 'sky', warrior: 'rose', necromancer: 'emerald', huntress: 'fuchsia',
  rogue: 'cyan', mystic: 'purple', trickster: 'amber', sorcerer: 'pink',
  assassin: 'purple', ninja: 'indigo', samurai: 'rose', bard: 'violet',
  summoner: 'teal', kensei: 'rose', druid: 'lime',
}

async function fetchPage(slug) {
  const url = `https://www.realmeye.com/wiki/${slug}`
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!r.ok) return null
  return await r.text()
}

const STAT_LABELS = {
  'Hit Points': 'hp',
  'Magic Points': 'mp',
  'Attack': 'att',
  'Defense': 'def',
  'Speed': 'spd',
  'Dexterity': 'dex',
  'Vitality': 'vit',
  'Wisdom': 'wis',
}

function parseStats(html) {
  // Stats are in a table immediately preceding "Maximum Achievable Stats"
  const before = html.split(/Maximum Achievable Stats/)[0]
  // Within `before`, find the last table-striped block
  const lastTableIdx = before.lastIndexOf('<table class="table table-striped"')
  const tableSection = before.slice(lastTableIdx)
  // Find each <tr> with a <th align="center">StatName</th>
  const stats = {}
  const rowRe = /<tr>\s*<th align="center">([^<]+)<\/th>([\s\S]*?)<\/tr>/g
  let m
  while ((m = rowRe.exec(tableSection)) !== null) {
    const label = m[1].trim()
    const key = STAT_LABELS[label]
    if (!key) continue
    const cells = [...m[2].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map((mm) => mm[1].trim())
    if (cells.length >= 4) {
      stats[key] = {
        base: parseInt(cells[0], 10) || 0,
        perLevel: cells[1],
        atMax: parseInt(cells[2], 10) || 0,
        cap: parseInt(cells[3], 10) || 0,
      }
    }
  }
  return stats
}

function parseEquipment(html) {
  // Find the "Equipment" or class equipment table near the top of the page
  // Look for the first sequence of class-equipment-like images near intro
  // Pattern: img alts that match weapon/ability/armor categories
  const start = html.indexOf('<h1') || 0
  const slice = html.slice(start, start + 3000)
  const equips = []
  const re = /<a href="\/wiki\/([^"]+)"><img alt="([^"]+)"[^>]+src="([^"]+)"[^>]+class="img-responsive"/g
  let m
  while ((m = re.exec(slice)) !== null) {
    equips.push({ slug: m[1], alt: m[2], src: m[3] })
  }
  return equips
}

const TYPE_BY_SLUG = {
  wands: 'wand', staves: 'staff', bows: 'bow', swords: 'sword', katanas: 'katana',
  daggers: 'dagger', lutes: 'lute', maces: 'mace',
  spells: 'spell', tomes: 'tome', quivers: 'quiver', skulls: 'skull',
  cloaks: 'cloak', helms: 'helm', seals: 'seal', wakizashi: 'wakizashi',
  scepters: 'scepter', orbs: 'orb', stars: 'star', traps: 'trap', prisms: 'prism',
  shields: 'shield', poisons: 'poison', sheaths: 'sheath', sigils: 'sigil',
  spellblades: 'spellblade',
  'leather-armors': 'leather', 'heavy-armors': 'heavy', robes: 'robe',
  rings: 'ring',
}

const out = []
for (const id of CLASSES) {
  process.stdout.write(`${id}... `)
  const html = await fetchPage(id)
  if (!html) { console.log('skip'); continue }

  // Class portrait sprite — first image with alt matching class name (case-insensitive)
  const portraitRe = new RegExp(`<img[^>]+alt="${id.charAt(0).toUpperCase() + id.slice(1)}[^"]*"[^>]+src="(\/s\/a\/img\/wiki\/i\/[^"]+)"`, 'i')
  const portraitMatch = html.match(portraitRe)
  const imageUrl = portraitMatch ? `https://www.realmeye.com${portraitMatch[1]}` : null

  const stats = parseStats(html)
  const equipImgs = parseEquipment(html)

  // Determine equipment type: equipImgs[0] is the class portrait, rest are equipment categories
  const weaponSlug = equipImgs.find((e) => TYPE_BY_SLUG[e.slug] && ['wand','staff','bow','sword','katana','dagger','lute','mace'].includes(TYPE_BY_SLUG[e.slug]))?.slug
  const abilitySlug = equipImgs.find((e) => {
    const t = TYPE_BY_SLUG[e.slug]
    return t && !['wand','staff','bow','sword','katana','dagger','lute','mace','leather','heavy','robe','ring','spellblade'].includes(t)
  })?.slug
  const armorSlug = equipImgs.find((e) => ['leather-armors','heavy-armors','robes'].includes(e.slug))?.slug

  out.push({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    portraitColor: PORTRAIT_COLOR[id] ?? 'violet',
    imageUrl,
    weaponType: weaponSlug ? TYPE_BY_SLUG[weaponSlug] : null,
    abilityType: abilitySlug ? TYPE_BY_SLUG[abilitySlug] : null,
    armorType: armorSlug ? TYPE_BY_SLUG[armorSlug] : null,
    stats,
  })
  console.log(`HP ${stats.hp?.cap ?? '?'} ATT ${stats.att?.cap ?? '?'} DEF ${stats.def?.cap ?? '?'} weap=${weaponSlug ?? '?'} abil=${abilitySlug ?? '?'}`)
  await new Promise(r => setTimeout(r, 200))
}

writeFileSync('product/data/classes.json', JSON.stringify(out, null, 2) + '\n')
console.log(`\n${out.length} classes saved to product/data/classes.json`)

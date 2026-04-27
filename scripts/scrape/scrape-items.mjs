import { writeFileSync } from 'fs'

const CATEGORIES = [
  { slug: 'wands', type: 'weapon', weaponType: 'wand' },
  { slug: 'bows', type: 'weapon', weaponType: 'bow' },
  { slug: 'swords', type: 'weapon', weaponType: 'sword' },
  { slug: 'staves', type: 'weapon', weaponType: 'staff' },
  { slug: 'katanas', type: 'weapon', weaponType: 'katana' },
  { slug: 'daggers', type: 'weapon', weaponType: 'dagger' },
  { slug: 'lutes', type: 'weapon', weaponType: 'lute' },
  { slug: 'maces', type: 'weapon', weaponType: 'mace' },
  // Newer weapon families introduced after our initial scrape — each one
  // is its own RealmEye wiki list page. Without these, hundreds of items
  // (spellblades for Sorcerer, tachis for Samurai/Kensei, etc.) are missing
  // from the catalog entirely.
  { slug: 'spellblades', type: 'weapon', weaponType: 'spellblade' },
  { slug: 'tachis', type: 'weapon', weaponType: 'tachi' },
  { slug: 'longbows', type: 'weapon', weaponType: 'longbow' },
  { slug: 'flails', type: 'weapon', weaponType: 'flail' },
  { slug: 'morning-stars', type: 'weapon', weaponType: 'morning-star' },
  { slug: 'dual-blades', type: 'weapon', weaponType: 'dual-blade' },
  { slug: 'spells', type: 'ability', abilityType: 'spell' },
  { slug: 'seals', type: 'ability', abilityType: 'seal' },
  { slug: 'quivers', type: 'ability', abilityType: 'quiver' },
  { slug: 'skulls', type: 'ability', abilityType: 'skull' },
  { slug: 'cloaks', type: 'ability', abilityType: 'cloak' },
  { slug: 'helms', type: 'ability', abilityType: 'helm' },
  { slug: 'wakizashi', type: 'ability', abilityType: 'wakizashi' },
  { slug: 'scepters', type: 'ability', abilityType: 'scepter' },
  { slug: 'orbs', type: 'ability', abilityType: 'orb' },
  { slug: 'stars', type: 'ability', abilityType: 'star' },
  { slug: 'traps', type: 'ability', abilityType: 'trap' },
  { slug: 'prisms', type: 'ability', abilityType: 'prism' },
  { slug: 'tomes', type: 'ability', abilityType: 'tome' },
  { slug: 'shields', type: 'ability', abilityType: 'shield' },
  { slug: 'poisons', type: 'ability', abilityType: 'poison' },
  { slug: 'sheaths', type: 'ability', abilityType: 'sheath' },
  { slug: 'sigils', type: 'ability', abilityType: 'sigil' },
  { slug: 'leather-armors', type: 'armor', armorType: 'leather' },
  { slug: 'heavy-armors', type: 'armor', armorType: 'heavy' },
  { slug: 'robes', type: 'armor', armorType: 'robe' },
  { slug: 'rings', type: 'ring' },
]

async function fetchPage(slug) {
  const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
  if (!r.ok) return null
  return await r.text()
}

const SLUG_TO_CLASS_ID = {
  wizard: 'wizard', priest: 'priest', archer: 'archer', knight: 'knight',
  paladin: 'paladin', warrior: 'warrior', necromancer: 'necromancer',
  huntress: 'huntress', rogue: 'rogue', mystic: 'mystic',
  trickster: 'trickster', sorcerer: 'sorcerer', assassin: 'assassin',
  ninja: 'ninja', samurai: 'samurai', bard: 'bard', summoner: 'summoner',
  kensei: 'kensei', druid: 'druid', sentry: 'sentry',
}

function extractClasses(html) {
  const m = html.match(/<p>[\s\S]*?<\/p>/)
  if (!m) return []
  const para = m[0]
  const classes = new Set()
  for (const slug of Object.keys(SLUG_TO_CLASS_ID)) {
    const re = new RegExp(String.raw`/wiki/${slug}\b`, 'i')
    if (re.test(para)) classes.add(SLUG_TO_CLASS_ID[slug])
  }
  return Array.from(classes)
}

function extractAllItems(html) {
  const out = []
  const re =
    /<a href="\/wiki\/([^"#]+)"><img alt="([^"]+)"[^>]+src="(\/s\/a\/img\/wiki\/i\/[^"]+)"[^>]*class="img-responsive"/g
  let m
  while ((m = re.exec(html)) !== null) {
    const slug = m[1]
    const name = m[2].replace(/&#39;|&apos;/g, "'").replace(/’/g, "'")
    if (slug === 'null') continue
    out.push({ slug, name, imageUrl: `https://www.realmeye.com${m[3]}` })
  }
  return out
}

function extractTierRows(html, category, classes) {
  const out = []
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g
  let rm
  while ((rm = rowRe.exec(html)) !== null) {
    const row = rm[1]
    const linkMatch = row.match(/<a href="\/wiki\/([^"#]+)">(?:<b>)?([^<]+)(?:<\/b>)?<\/a>/)
    if (!linkMatch) continue
    const slug = linkMatch[1]
    const name = linkMatch[2].trim().replace(/&#39;|&apos;/g, "'").replace(/’/g, "'")
    const imgMatch = row.match(
      /<img[^>]+alt="([^"]+)"[^>]+src="(\/s\/a\/img\/wiki\/i\/[^"]+)"[^>]*class="img-responsive"/,
    )
    if (!imgMatch) continue
    const altLc = imgMatch[1].toLowerCase()
    const nameLc = name.toLowerCase()
    if (altLc !== nameLc && !altLc.includes(nameLc) && !nameLc.includes(altLc)) continue
    let tier = 'UT', tierNumeric = 99, rarity = 'ut'
    // Only match 1-2 digit numbers (0-15 typical tiers) — avoid feed-power 500+
    const tierCellMatch = row.match(/<td[^>]*><b>(\d{1,2}|UT)<\/b><\/td>/)
    if (tierCellMatch) {
      const t = tierCellMatch[1]
      if (t === 'UT') { tier = 'UT'; tierNumeric = 99; rarity = 'ut' }
      else {
        const n = parseInt(t, 10)
        if (n >= 0 && n <= 15) {
          tier = `T${n}`
          tierNumeric = n
          rarity = 'tiered'
        }
      }
    }
    let dmgMin, dmgMax, avg
    const dmgMatch = row.match(/<b>(\d+)-(\d+)\s*\(?([\d.]+)?\)?<\/b>/)
    if (dmgMatch) {
      dmgMin = parseInt(dmgMatch[1], 10); dmgMax = parseInt(dmgMatch[2], 10)
      avg = dmgMatch[3] ? parseFloat(dmgMatch[3]) : (dmgMin + dmgMax) / 2
    }
    out.push({
      slug, name, tier, tierNumeric, rarity,
      type: category.type,
      ...(category.weaponType ? { weaponType: category.weaponType } : {}),
      ...(category.abilityType ? { abilityType: category.abilityType } : {}),
      ...(category.armorType ? { armorType: category.armorType } : {}),
      classes,
      stats: dmgMin !== undefined ? { dmgMin, dmgMax, dmgAvg: avg } : {},
      tags: [], sprite: slug,
      imageUrl: `https://www.realmeye.com${imgMatch[2]}`,
    })
  }
  return out
}

const ITEMS_BY_ID = new Map()

for (const cat of CATEGORIES) {
  process.stdout.write(`${cat.slug}... `)
  const html = await fetchPage(cat.slug)
  if (!html) { console.log('skip'); continue }
  const classes = extractClasses(html)
  const allLinks = extractAllItems(html)
  const tierRows = extractTierRows(html, cat, classes)
  const tierBySlug = new Map(tierRows.map((r) => [r.slug, r]))

  let added = 0
  for (const link of allLinks) {
    if (ITEMS_BY_ID.has(link.slug)) continue
    const tierData = tierBySlug.get(link.slug)
    const item = tierData ?? {
      slug: link.slug,
      name: link.name,
      tier: 'UT', tierNumeric: 99, rarity: 'ut',
      type: cat.type,
      ...(cat.weaponType ? { weaponType: cat.weaponType } : {}),
      ...(cat.abilityType ? { abilityType: cat.abilityType } : {}),
      ...(cat.armorType ? { armorType: cat.armorType } : {}),
      classes,
      stats: {},
      tags: [],
      sprite: link.slug,
      imageUrl: link.imageUrl,
    }
    ITEMS_BY_ID.set(link.slug, { id: link.slug, ...item })
    added++
  }
  console.log(`+${added} (total ${ITEMS_BY_ID.size})`)
  await new Promise((r) => setTimeout(r, 120))
}

// Untiered drops (catches UTs in grid layout)
process.stdout.write('untiered-drops... ')
const utHtml = await fetchPage('untiered-drops')
if (utHtml) {
  const allUTs = extractAllItems(utHtml)
  let added = 0
  for (const link of allUTs) {
    if (ITEMS_BY_ID.has(link.slug)) continue
    ITEMS_BY_ID.set(link.slug, {
      id: link.slug, slug: link.slug, name: link.name,
      tier: 'UT', tierNumeric: 99, rarity: 'ut',
      type: 'weapon',
      classes: [], stats: {}, tags: [],
      sprite: link.slug, imageUrl: link.imageUrl,
    })
    added++
  }
  console.log(`+${added} (total ${ITEMS_BY_ID.size})`)
}

const ALL = Array.from(ITEMS_BY_ID.values())
writeFileSync('product/data/items.json', JSON.stringify(ALL, null, 2) + '\n')
console.log(`\n${ALL.length} items saved`)

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const noStats = items.filter((i) => Object.keys(i.stats ?? {}).length === 0)
console.log(`Checking ${noStats.length} no-stat items for equipment validity...`)

async function fetchPage(slug) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (r.status === 429) {
        await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)))
        continue
      }
      if (!r.ok) return null
      return await r.text()
    } catch {
      await new Promise((res) => setTimeout(res, 1000))
    }
  }
  return null
}

// An item page reveals it's real equipment if its main info table has any of these labels.
const EQUIPMENT_INDICATORS = [
  /<th[^>]*>\s*Tier\s*<\/th>/i,
  /<th[^>]*>\s*Damage\s*<\/th>/i,
  /<th[^>]*>\s*MP Cost\s*<\/th>/i,
  /<th[^>]*>\s*Mana Cost\s*<\/th>/i,
  /<th[^>]*>\s*Stat Bonus(?:es)?\s*<\/th>/i,
  /<th[^>]*>\s*Defense\s*<\/th>/i,
  /<th[^>]*>\s*Shots\s*<\/th>/i,
  /<th[^>]*>\s*Effect\(s?\)\s*<\/th>/i,
  /<th[^>]*>\s*Range\s*<\/th>/i,
  /<th[^>]*>\s*Rate of Fire\s*<\/th>/i,
  /<th[^>]*>\s*Feed Power\s*<\/th>/i,
]

// Also: pet/mob/category/boss patterns we can pre-filter without fetching
const SUSPECT_NAME_PATTERNS = [
  /^(Adolescent|Adult|Baby) /i,
  / (Pet|Egg|Skin)$/i,
  /^(Alien|Hellhound|Beehemoth)/i,
  /(Bunny|Lord|Queen|King|Knight Lieutenant)$/i,
  / (Bosses?|Boss)$/i,
  /^(Health|Magic|Attack|Defense|Speed|Dexterity|Vitality|Wisdom|Untiered|Limited) Rings$/i,
  /^(Killer Bee|Spider|Crystal Worm|Septavius|Twilight) /i,
]

let removed = 0
let kept = 0
let checked = 0
const start = Date.now()

const finalItems = []

for (const item of items) {
  // Items with stats are real equipment
  if (Object.keys(item.stats ?? {}).length > 0) {
    finalItems.push(item)
    continue
  }

  // Pre-filter by name patterns (no network)
  if (SUSPECT_NAME_PATTERNS.some((re) => re.test(item.name))) {
    removed++
    continue
  }

  // Fetch page and check for equipment indicators
  checked++
  const html = await fetchPage(item.slug)
  if (!html) {
    // If page can't be fetched, conservative: remove
    removed++
    continue
  }
  const isEquipment = EQUIPMENT_INDICATORS.some((re) => re.test(html))
  if (isEquipment) {
    finalItems.push(item)
    kept++
  } else {
    removed++
  }
  if (checked % 30 === 0) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  checked ${checked} — kept ${kept} removed (so far) ${removed} — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 700))
}

console.log(`\n✓ Kept ${finalItems.length} equipment items`)
console.log(`  Removed ${items.length - finalItems.length} non-items (pets/mobs/categories/bosses)`)

writeFileSync('product/data/items.json', JSON.stringify(finalItems, null, 2) + '\n')

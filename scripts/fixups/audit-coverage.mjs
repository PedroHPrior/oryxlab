// Audit catalog coverage against RealmEye's category lists. For each
// category page, fetch the full HTML, extract every item-slug link,
// and compare against our items.json.

import { readFileSync } from 'fs'

const ALL_CATEGORIES = [
  // Weapons
  'wands', 'bows', 'swords', 'staves', 'katanas', 'daggers', 'lutes', 'maces',
  'spellblades', 'tachis', 'longbows', 'flails', 'morning-stars', 'dual-blades',
  // Abilities
  'spells', 'seals', 'quivers', 'skulls', 'cloaks', 'helms', 'wakizashi',
  'scepters', 'orbs', 'stars', 'traps', 'prisms', 'tomes', 'shields',
  'poisons', 'sheaths', 'sigils',
  // Armors
  'leather-armors', 'heavy-armors', 'robes',
  // Accessories
  'rings',
]

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const haveIds = new Set(items.map((i) => i.id))

async function fetchPage(slug) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OryxLab/1.0)' },
      })
      if (!r.ok) {
        await new Promise((res) => setTimeout(res, 800))
        continue
      }
      return await r.text()
    } catch {
      await new Promise((res) => setTimeout(res, 800))
    }
  }
  return null
}

// Each item on a category page is linked from a sprite anchor:
//   <a href="/wiki/<slug>"><img alt="<name>" src="/s/a/img/wiki/i/...
// That pattern is a tight signal — it skips nav/sidebar links and only
// returns actual catalog rows.
function extractItemSlugs(html) {
  const slugs = new Set()
  const re = /<a href="\/wiki\/([a-z0-9-]+)"[^>]*><img[^>]+src="\/s\/a\/img\/wiki\/i\//g
  let m
  while ((m = re.exec(html)) !== null) slugs.add(m[1])
  return slugs
}

const report = []
let totalCanonical = 0
let totalMissing = 0

for (const slug of ALL_CATEGORIES) {
  process.stdout.write(`${slug.padEnd(20)} `)
  const html = await fetchPage(slug)
  if (!html) {
    console.log('FETCH FAILED')
    continue
  }
  const canonical = extractItemSlugs(html)
  const missing = [...canonical].filter((s) => !haveIds.has(s))
  totalCanonical += canonical.size
  totalMissing += missing.length
  const status = missing.length === 0 ? '✓' : `MISSING ${missing.length}`
  console.log(`canonical=${canonical.size}, missing=${missing.length} ${status}`)
  if (missing.length > 0 && missing.length <= 8) {
    for (const m of missing.slice(0, 8)) console.log(`     - ${m}`)
  }
  report.push({ category: slug, canonical: canonical.size, missing })
  await new Promise((r) => setTimeout(r, 400))
}

console.log()
console.log(`Total canonical items across all category pages: ${totalCanonical}`)
console.log(`Total missing from our catalog: ${totalMissing}`)
console.log(`Our catalog has ${items.length} items`)
const missingByCat = report.filter((r) => r.missing.length > 0)
if (missingByCat.length > 0) {
  console.log()
  console.log('Categories with gaps:')
  for (const r of missingByCat) console.log(`  ${r.category.padEnd(20)} ${r.missing.length} missing`)
}

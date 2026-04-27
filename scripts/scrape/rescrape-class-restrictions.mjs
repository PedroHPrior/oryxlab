// Re-scrape per-item class restrictions from RealmEye.
// RealmEye encodes class restriction icons inside the item infobox; alt text
// like "Wizard" / "Knight" identifies which classes can equip the item.
//
// Strategy: collect all class-name img alts from the FIRST table on the item page,
// intersect with our 19 known classes. If ≥1 class found, override item.classes.
// If 0 found, leave item.classes alone (it's likely class-agnostic — rings, etc.).

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const classes = JSON.parse(readFileSync('product/data/classes.json', 'utf-8'))
const KNOWN_CLASSES = new Set(classes.map((c) => c.name))
const NAME_TO_ID = new Map(classes.map((c) => [c.name, c.id]))

// Only re-check weapons, abilities, armors. Rings & talismans are class-agnostic.
const candidates = items.filter((i) => i.type === 'weapon' || i.type === 'ability' || i.type === 'armor')

console.log(`Re-scraping class restrictions on ${candidates.length} items`)

async function fetchPage(slug) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (r.status === 429) { await new Promise((res) => setTimeout(res, 2000 * (attempt + 1))); continue }
      if (!r.ok) return null
      return await r.text()
    } catch { await new Promise((res) => setTimeout(res, 1000)) }
  }
  return null
}

// Pick the canonical stats table — the FIRST table that has a `Tier` row.
// Skips description blocks but keeps the live version (legacy versions also have
// Tier; we'll pick the first occurrence which is always current per RealmEye layout).
function extractFirstTable(html) {
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)]
  for (const m of tables) {
    if (/<th[^>]*>\s*Tier\s*<\/th>/i.test(m[1])) return m[1]
  }
  return null
}

// Class restriction icons usually appear in the first ~3KB of the page
// (header / item infobox). Scanning the WHOLE page would also pick up
// "related set" tables and per-class tier ladders (false positives), so we
// limit the search to the head region right around the stats table.
function extractClasses(html) {
  // Grab everything from the start of the page through the first stats table
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)]
  let cutoff = 8000
  for (const m of tables) {
    if (/<th[^>]*>\s*Tier\s*<\/th>/i.test(m[1])) {
      cutoff = m.index + m[0].length
      break
    }
  }
  const headRegion = html.slice(0, cutoff)
  const altRe = /<img[^>]*alt="([^"]+)"/g
  const found = new Set()
  let m
  while ((m = altRe.exec(headRegion)) !== null) {
    if (KNOWN_CLASSES.has(m[1])) found.add(NAME_TO_ID.get(m[1]))
  }
  return [...found]
}

let processed = 0, changed = 0
const start = Date.now()

for (const item of candidates) {
  const html = await fetchPage(item.slug)
  processed++
  if (html) {
    const newClasses = extractClasses(html)
    if (newClasses.length > 0) {
      const before = (item.classes ?? []).slice().sort().join(',')
      const after = newClasses.slice().sort().join(',')
      if (before !== after) {
        item.classes = newClasses
        changed++
      }
    }
  }
  if (processed % 50 === 0 || processed === candidates.length) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${candidates.length} — ${changed} class-lists updated — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 500))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ ${changed}/${candidates.length} items had class lists corrected`)

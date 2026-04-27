// Re-scrape base Damage / Shots / Range / Rate of Fire from RealmEye for every weapon.
// Reads ONLY the main info table — never the Effect(s) / Awakened Enchantment rows
// (those held inflated values that poisoned the original scrape).
//
// Strategy: locate the FIRST <th>Damage</th> row inside the page's primary stats <table>,
// taking only the numeric "min–max" pair before any "+X per …" tail.

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const weapons = items.filter((i) => i.type === 'weapon')

console.log(`Re-scraping base damage on ${weapons.length} weapons`)

async function fetchPage(slug) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (r.status === 429) { await new Promise((res) => setTimeout(res, 2000 * (attempt + 1))); continue }
      if (!r.ok) return null
      return await r.text()
    } catch { await new Promise((res) => setTimeout(res, 1000)) }
  }
  return null
}

function strip(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

// Find the canonical stats table for the current variant of the item.
// On RealmEye, item pages contain many tables (description, legacy version,
// awakened, drops, related sets, etc.). The CURRENT variant always has both
// `Tier` AND `Damage` rows. We pick the FIRST table matching that pattern —
// it's the live version, not legacy/awakened.
function extractStatsTable(html) {
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)]
  for (const m of tables) {
    const t = m[1]
    if (/<th[^>]*>\s*Tier\s*<\/th>/i.test(t) && /<th[^>]*>\s*Damage\s*<\/th>/i.test(t)) {
      return t
    }
  }
  return null
}

function extractField(tableHtml, label) {
  const re = new RegExp(`<th[^>]*>\\s*${label}\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i')
  const m = tableHtml.match(re)
  return m ? strip(m[1]) : null
}

function parseDamage(text) {
  if (!text) return null
  // "70–105 (average: 87.5)" or "70-105"
  const m = text.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (!m) return null
  return { dmgMin: parseInt(m[1], 10), dmgMax: parseInt(m[2], 10) }
}

function parseShots(text) {
  if (!text) return null
  const m = text.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function parseRange(text) {
  if (!text) return null
  const m = text.match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : null
}

function parseRoFMod(text) {
  if (!text) return null
  // "Rate of Fire 25%" or "Rate of Fire 110%" or "100%"
  const m = text.match(/(\d+)\s*%/)
  return m ? parseInt(m[1], 10) / 100 : null
}

let processed = 0, fixed = 0
const start = Date.now()
const beforeMaxDmg = new Map()

for (const item of weapons) {
  beforeMaxDmg.set(item.id, item.stats.dmgMax)
  const html = await fetchPage(item.slug)
  processed++
  if (html) {
    const table = extractStatsTable(html)
    if (table) {
      const dmgText = extractField(table, 'Damage')
      const shotsText = extractField(table, 'Shots')
      const rangeText = extractField(table, 'Range')
      const rofText = extractField(table, 'Rate of Fire')

      const dmg = parseDamage(dmgText)
      const shots = parseShots(shotsText)
      const range = parseRange(rangeText)
      const rof = parseRoFMod(rofText)

      if (dmg) {
        const prev = item.stats.dmgMax ?? 0
        item.stats.dmgMin = dmg.dmgMin
        item.stats.dmgMax = dmg.dmgMax
        if (Math.abs(prev - dmg.dmgMax) > 5) fixed++
      }
      if (typeof shots === 'number') item.stats.shots = shots
      if (typeof range === 'number') item.stats.range = range
      if (typeof rof === 'number') item.stats.rateOfFireMod = rof
    }
  }
  if (processed % 50 === 0 || processed === weapons.length) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${weapons.length} — ${fixed} damage values corrected — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 500))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ Re-scraped ${weapons.length} weapons. ${fixed} had damage values corrected.`)

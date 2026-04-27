// Scrape talismans from RealmEye.
// Talismans are slot-5 endgame items that grant flat stat bonuses + on-equip
// effects. RealmEye lists them at /wiki/talismans.

import { readFileSync, writeFileSync } from 'fs'

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

function strip(s) { return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() }

function extractStatsTable(html) {
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)]
  for (const m of tables) {
    if (/<th[^>]*>\s*Tier\s*<\/th>/i.test(m[1])) return m[1]
  }
  return null
}

function extractField(table, label) {
  const re = new RegExp(`<th[^>]*>\\s*${label}\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i')
  const m = table.match(re)
  return m ? strip(m[1]) : null
}

function parseStatBonus(text) {
  if (!text) return {}
  const out = {}
  // "+5 ATT, +6 DEX, +60 HP" style
  const re = /\+\s*(\d+)\s*(ATT|DEX|WIS|VIT|SPD|DEF|HP|MP|LUCK)/gi
  let m
  while ((m = re.exec(text)) !== null) {
    out[m[2].toLowerCase()] = parseInt(m[1], 10)
  }
  return out
}

const STATUS_TAGS = [
  ['berserk', 'self-berserk'], ['speedy', 'self-speedy'], ['inspired', 'self-inspired'],
  ['damaging', 'self-damaging'], ['healing', 'self-healing'], ['armored', 'self-armored'],
  ['invulnerable', 'self-invulnerable'],
]
const ENEMY_TAGS = [
  ['paralyze', 'inflicts-paralyze'], ['slowed', 'inflicts-slowed'],
  ['cursed', 'inflicts-cursed'], ['curse', 'inflicts-curse'], ['exposed', 'inflicts-exposed'],
  ['stunned', 'inflicts-stunned'], ['bleeding', 'inflicts-bleeding'],
]

function extractTagsFromText(text) {
  const tags = new Set()
  const lower = (text ?? '').toLowerCase()
  for (const [needle, tag] of STATUS_TAGS) if (lower.includes(needle)) tags.add(tag)
  for (const [needle, tag] of ENEMY_TAGS) if (lower.includes(needle)) tags.add(tag)
  return [...tags]
}

// Step 1: discover talisman slugs
async function listTalismanSlugs() {
  const html = await fetchPage('talismans')
  if (!html) return []
  const slugs = new Set()
  // Items linked from the talismans index page that look like /wiki/<name>
  const re = /<a href="\/wiki\/([^"#]+)"[^>]*>[^<]*Talisman[^<]*<\/a>/gi
  let m
  while ((m = re.exec(html)) !== null) slugs.add(m[1])
  // Also scan generic /wiki/<slug> entries that include "talisman" in the slug
  const re2 = /<a href="\/wiki\/([^"#]*talisman[^"#]*)"/gi
  let m2
  while ((m2 = re2.exec(html)) !== null) slugs.add(m2[1])
  return [...slugs]
}

const slugs = await listTalismanSlugs()
console.log(`Found ${slugs.length} talisman slugs`)

const talismans = []
let processed = 0
const start = Date.now()

for (const slug of slugs) {
  const html = await fetchPage(slug)
  processed++
  if (html) {
    const table = extractStatsTable(html)
    if (table) {
      const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) ?? html.match(/<title>([^<]+)<\/title>/)
      const name = titleMatch ? strip(titleMatch[1]).replace(/\s*-\s*the RotMG Wiki.*/i, '').trim() : slug
      const tier = extractField(table, 'Tier') ?? 'Talisman'
      const bonusText = extractField(table, 'Stat Bonus(?:es)?') ?? extractField(table, 'On Equip') ?? ''
      const effectsText = extractField(table, 'Effect\\(s?\\)') ?? ''
      const stats = parseStatBonus(bonusText)
      const tags = ['talisman', ...extractTagsFromText(`${bonusText} ${effectsText}`)]
      // Image
      const imgMatch = html.match(/<img[^>]+src="(\/s\/a\/img\/wiki\/i\/[^"]+)"/)
      const imageUrl = imgMatch ? `https://www.realmeye.com${imgMatch[1]}` : null

      talismans.push({
        id: slug,
        slug,
        name,
        tier: 'Talisman',
        tierNumeric: 99,
        rarity: 'talisman',
        type: 'talisman',
        classes: [],
        stats,
        tags,
        sprite: slug,
        imageUrl,
      })
    }
  }
  if (processed % 20 === 0 || processed === slugs.length) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${slugs.length} — kept ${talismans.length} — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 500))
}

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
// Remove any existing talismans, then append
const filtered = items.filter((i) => i.type !== 'talisman')
const merged = filtered.concat(talismans)
writeFileSync('product/data/items.json', JSON.stringify(merged, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(merged, null, 2) + '\n')
console.log(`\n✓ Added ${talismans.length} talismans (total items: ${merged.length})`)

// Backfill cooldown values for all damaging abilities that don't have one yet.
import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const candidates = items.filter(
  (i) =>
    i.type === 'ability' &&
    typeof i.stats.cooldown !== 'number' &&
    ((typeof i.stats.dmgMin === 'number' && i.stats.dmgMin > 0) ||
      (typeof i.stats.procDamage === 'number' && i.stats.procDamage > 0)),
)

console.log(`Backfilling cooldown on ${candidates.length} damaging abilities`)

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

// Pick the canonical stats table — the FIRST table containing both `Tier` and
// `MP Cost` rows (or `Cooldown`). Skips description/legacy/awakened tables.
function extractFirstTable(html) {
  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g)]
  for (const m of tables) {
    const t = m[1]
    if (/<th[^>]*>\s*Tier\s*<\/th>/i.test(t) && /<th[^>]*>\s*(MP\s*Cost|Cooldown)\s*<\/th>/i.test(t)) {
      return t
    }
  }
  return null
}

function extractCooldown(table) {
  const re = /<th[^>]*>\s*Cooldown\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i
  const m = table.match(re)
  if (!m) return null
  const v = strip(m[1])
  const num = v.match(/([\d.]+)/)
  return num ? parseFloat(num[1]) : null
}

let processed = 0, updated = 0
const start = Date.now()

for (const item of candidates) {
  const html = await fetchPage(item.slug)
  processed++
  if (html) {
    const table = extractFirstTable(html)
    if (table) {
      const cd = extractCooldown(table)
      if (typeof cd === 'number' && cd > 0) {
        item.stats.cooldown = cd
        updated++
      }
    }
  }
  if (processed % 30 === 0 || processed === candidates.length) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${candidates.length} — backfilled ${updated} — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 500))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ ${updated}/${candidates.length} abilities backfilled with cooldown`)

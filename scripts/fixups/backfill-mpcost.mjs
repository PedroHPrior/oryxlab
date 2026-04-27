import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

const candidates = items.filter(
  (i) =>
    i.type === 'ability' &&
    typeof i.stats.mpCost !== 'number' &&
    ((typeof i.stats.dmgMin === 'number' && i.stats.dmgMin > 0) ||
      (typeof i.stats.procDamage === 'number' && i.stats.procDamage > 0)),
)

console.log(`Backfilling mpCost on ${candidates.length} damaging abilities`)

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

function strip(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractMpCost(html) {
  const m = html.match(/<th[^>]*>\s*MP\s*Cost\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (!m) return null
  const v = strip(m[1])
  const num = v.match(/(\d+)/)
  return num ? parseInt(num[1], 10) : null
}

function extractCooldown(html) {
  const m = html.match(/<th[^>]*>\s*Cooldown\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (!m) return null
  const v = strip(m[1])
  const num = v.match(/([\d.]+)/)
  return num ? parseFloat(num[1]) : null
}

let processed = 0
let updated = 0
const start = Date.now()

for (const item of candidates) {
  const html = await fetchPage(item.slug)
  processed++
  if (html) {
    const mp = extractMpCost(html)
    const cd = extractCooldown(html)
    if (typeof mp === 'number' && mp > 0) {
      item.stats.mpCost = mp
      updated++
    }
    if (typeof cd === 'number' && cd > 0 && typeof item.stats.cooldown !== 'number') {
      item.stats.cooldown = cd
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
console.log(`\n✓ ${updated}/${candidates.length} abilities backfilled with mpCost`)

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Retry only items that still have empty stats (likely failed before)
const todo = items.filter((i) => Object.keys(i.stats ?? {}).length === 0)
console.log(`Retrying ${todo.length} items with empty stats…`)

async function fetchPage(slug, attempt = 0) {
  try {
    const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    })
    if (r.status === 429 && attempt < 3) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)))
      return fetchPage(slug, attempt + 1)
    }
    if (!r.ok) return null
    return await r.text()
  } catch {
    if (attempt < 2) {
      await new Promise((res) => setTimeout(res, 1000))
      return fetchPage(slug, attempt + 1)
    }
    return null
  }
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseStatBlock(html) {
  const out = {}
  const pairRe = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g
  let m
  while ((m = pairRe.exec(html)) !== null) {
    const label = stripTags(m[1])
    const value = stripTags(m[2])
    if (label && value) out[label] = value
  }
  return out
}

const STAT_NORMALIZE = {
  'Attack': 'att', 'ATT': 'att',
  'Defense': 'def', 'DEF': 'def',
  'Speed': 'spd', 'SPD': 'spd',
  'Dexterity': 'dex', 'DEX': 'dex',
  'Vitality': 'vit', 'VIT': 'vit',
  'Wisdom': 'wis', 'WIS': 'wis',
  'Hit Points': 'hp', 'HP': 'hp', 'Maximum HP': 'hp',
  'Magic Points': 'mp', 'MP': 'mp', 'Maximum MP': 'mp',
  'Luck': 'luck', 'LUCK': 'luck',
}

function parseStatBonuses(rawValue) {
  const out = {}
  if (!rawValue) return out
  const re = /([+-]?\d+)\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS|LUCK)\b/gi
  let m
  while ((m = re.exec(rawValue)) !== null) {
    const n = parseInt(m[1], 10)
    const key = STAT_NORMALIZE[m[2].toUpperCase()] ?? m[2].toLowerCase()
    out[key] = (out[key] ?? 0) + n
  }
  return out
}

function parseEffects(rawValue) {
  if (!rawValue) return []
  const known = [
    'piercing', 'armor piercing', 'armor break', 'paralyze', 'paralyze immune',
    'stunned', 'stun immune', 'slowed', 'slow immune', 'curse', 'cursed',
    'bleeding', 'silence', 'silenced', 'unstable', 'exposed', 'inspired',
    'damaging', 'healing', 'speedy', 'berserk', 'invulnerable', 'invincible',
    'armored', 'dazed', 'confused', 'sick', 'quiet', 'weak', 'petrified',
    'aoe', 'multi-shot', 'true damage', 'pierces armor',
    'passes cover', 'wavy', 'boomerang', 'parametric',
  ]
  const lc = rawValue.toLowerCase()
  return known.filter((tag) => lc.includes(tag))
}

function enrichItem(item, html) {
  const block = parseStatBlock(html)

  const dmg = block['Damage'] ?? block['Damage per Hit']
  if (dmg) {
    const m = dmg.match(/(\d+)\s*[–-]\s*(\d+)/)
    if (m) {
      item.stats.dmgMin = parseInt(m[1], 10)
      item.stats.dmgMax = parseInt(m[2], 10)
    }
  }
  if (block['Shots']) {
    const m = block['Shots'].match(/^(\d+)/)
    if (m) item.stats.shots = parseInt(m[1], 10)
  }
  if (block['Rate of Fire']) {
    const m = block['Rate of Fire'].match(/(\d+)\s*%/)
    if (m) item.stats.rateOfFireMod = parseInt(m[1], 10) / 100
  }
  if (block['Range']) {
    const m = block['Range'].match(/([\d.]+)/)
    if (m) item.stats.range = parseFloat(m[1])
  }
  if (block['Lifetime']) {
    const m = block['Lifetime'].match(/([\d.]+)/)
    if (m) item.stats.lifetime = parseFloat(m[1])
  }
  if (block['Projectile Speed']) {
    const m = block['Projectile Speed'].match(/([\d.]+)/)
    if (m) item.stats.projectileSpeed = parseFloat(m[1])
  }
  if (block['MP Cost'] || block['Mana Cost']) {
    const v = block['MP Cost'] ?? block['Mana Cost']
    const m = v.match(/(\d+)/)
    if (m) item.stats.mpCost = parseInt(m[1], 10)
  }
  if (block['Defense']) {
    const m = block['Defense'].match(/([+-]?\d+)/)
    if (m) item.stats.def = parseInt(m[1], 10)
  }

  const sb = block['Stat Bonus'] ?? block['Stat Bonuses'] ?? ''
  Object.assign(item.stats, parseStatBonuses(sb))
  if (block['Effect(s)']) {
    item.tags = Array.from(new Set([...(item.tags ?? []), ...parseEffects(block['Effect(s)'])]))
    Object.assign(item.stats, parseStatBonuses(block['Effect(s)']))
  }
  if (block['On Equip']) {
    item.tags = Array.from(new Set([...(item.tags ?? []), 'on-equip']))
    Object.assign(item.stats, parseStatBonuses(block['On Equip']))
  }
  for (const v of Object.values(block)) {
    if (/[+-]\d+\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS)/i.test(v)) {
      Object.assign(item.stats, parseStatBonuses(v))
    }
  }
  return item
}

const BATCH_SIZE = 4 // smaller batch to avoid rate limit
const DELAY = 600

let processed = 0, failed = 0, enriched = 0
const start = Date.now()

for (let i = 0; i < todo.length; i += BATCH_SIZE) {
  const batch = todo.slice(i, i + BATCH_SIZE)
  const results = await Promise.all(
    batch.map(async (item) => {
      const html = await fetchPage(item.slug)
      if (!html) return false
      const before = Object.keys(item.stats ?? {}).length
      enrichItem(item, html)
      return Object.keys(item.stats ?? {}).length > before
    }),
  )
  for (const r of results) {
    processed++
    if (r) enriched++
    else failed++
  }
  if (processed % 40 === 0 || i + BATCH_SIZE >= todo.length) {
    const pct = ((processed / todo.length) * 100).toFixed(1)
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${todo.length} (${pct}%) — enriched ${enriched} fail ${failed} — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, DELAY))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ Saved. ${enriched} additionally enriched, ${failed} still failing`)

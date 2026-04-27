import { readFileSync, writeFileSync } from 'fs'

// Visits each item's individual wiki page to extract full stat block:
// stat bonuses (HP/MP/ATT/DEF/SPD/DEX/VIT/WIS), projectile properties,
// effects, status inflictions, MP cost, range, lifetime, rate of fire.

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
console.log(`Enriching ${items.length} items...`)

async function fetchPage(slug) {
  try {
    const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!r.ok) return null
    return await r.text()
  } catch {
    return null
  }
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseStatBlock(html) {
  // Match all <th>label</th> followed by <td>value</td> pairs in the main info table
  const out = {}
  const pairRe = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g
  let m
  while ((m = pairRe.exec(html)) !== null) {
    const label = stripTags(m[1])
    const value = stripTags(m[2])
    if (label && value) {
      out[label] = value
    }
  }
  return out
}

const STAT_BONUS_KEYS = ['HP', 'MP', 'ATT', 'DEF', 'SPD', 'DEX', 'VIT', 'WIS', 'LUCK']
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
  // "+5 ATT, +5 DEX, +5 WIS" or "+5 ATT and +5 DEX" or "Maximum HP +200; +4 VIT"
  const out = {}
  if (!rawValue) return out
  const re = /([+-]?\d+)\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS|LUCK)\b/gi
  let m
  while ((m = re.exec(rawValue)) !== null) {
    const n = parseInt(m[1], 10)
    const key = m[2].toUpperCase()
    out[STAT_NORMALIZE[key] ?? key.toLowerCase()] = (out[STAT_NORMALIZE[key] ?? key.toLowerCase()] ?? 0) + n
  }
  // Also capture "Maximum HP +200" form
  const altRe = /(Maximum\s+HP|Maximum\s+MP|Hit Points|Magic Points|Attack|Defense|Speed|Dexterity|Vitality|Wisdom|Luck)\s*([+-]\d+)/gi
  let am
  while ((am = altRe.exec(rawValue)) !== null) {
    const key = STAT_NORMALIZE[am[1].trim()]
    if (key) out[key] = (out[key] ?? 0) + parseInt(am[2], 10)
  }
  return out
}

function parseDamage(rawValue) {
  // "105–150 (average: 127.5)" or "100-180" or "1200–1400 max damage"
  if (!rawValue) return null
  const m = rawValue.match(/(\d+)\s*[–-]\s*(\d+)/)
  if (!m) return null
  return { dmgMin: parseInt(m[1], 10), dmgMax: parseInt(m[2], 10) }
}

function parseRateOfFire(rawValue) {
  // "110%" → 1.10
  if (!rawValue) return null
  const m = rawValue.match(/(\d+)\s*%/)
  if (!m) return null
  return parseInt(m[1], 10) / 100
}

function parseShots(rawValue) {
  if (!rawValue) return null
  const m = rawValue.match(/^(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function parseEffects(rawValue) {
  // Effects cell: "Piercing — Shots hit multiple targets <br> Armor Piercing — Ignores defense"
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

function parseMP(rawValue) {
  if (!rawValue) return null
  const m = rawValue.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

function enrichItem(item, html) {
  const block = parseStatBlock(html)
  // Standard fields by label
  const d = parseDamage(block['Damage'] ?? block['Damage per Hit'] ?? '')
  if (d) {
    item.stats.dmgMin = d.dmgMin
    item.stats.dmgMax = d.dmgMax
  }
  const shots = parseShots(block['Shots'] ?? '')
  if (shots) item.stats.shots = shots
  const rof = parseRateOfFire(block['Rate of Fire'] ?? '')
  if (rof) item.stats.rateOfFireMod = rof
  const range = block['Range']
  if (range) {
    const m = range.match(/([\d.]+)/)
    if (m) item.stats.range = parseFloat(m[1])
  }
  const lifetime = block['Lifetime']
  if (lifetime) {
    const m = lifetime.match(/([\d.]+)/)
    if (m) item.stats.lifetime = parseFloat(m[1])
  }
  const projSpd = block['Projectile Speed']
  if (projSpd) {
    const m = projSpd.match(/([\d.]+)/)
    if (m) item.stats.projectileSpeed = parseFloat(m[1])
  }
  const mp = parseMP(block['MP Cost'] ?? block['Mana Cost'] ?? '')
  if (mp !== null) item.stats.mpCost = mp
  // Defense for armor
  const def = block['Defense']
  if (def) {
    const m = def.match(/([+-]?\d+)/)
    if (m) item.stats.def = parseInt(m[1], 10)
  }
  // Stat bonuses table
  const sb = block['Stat Bonus'] ?? block['Stat Bonuses'] ?? ''
  const bonuses = parseStatBonuses(sb)
  Object.assign(item.stats, bonuses)
  // Also try "Effect(s)" + bonuses listed in description-like cells
  if (block['Effect(s)']) {
    const tags = parseEffects(block['Effect(s)'])
    item.tags = Array.from(new Set([...(item.tags ?? []), ...tags]))
    Object.assign(item.stats, parseStatBonuses(block['Effect(s)']))
  }
  if (block['On Equip']) {
    item.tags = Array.from(new Set([...(item.tags ?? []), 'on-equip']))
    Object.assign(item.stats, parseStatBonuses(block['On Equip']))
  }
  // Description text inside item-info-page often has "+5 ATT, +5 DEX..."
  // Capture from ALL stripped cells
  for (const [, v] of Object.entries(block)) {
    if (/[+-]\d+\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS)/i.test(v)) {
      Object.assign(item.stats, parseStatBonuses(v))
    }
  }
  return item
}

const BATCH_SIZE = 8
const DELAY_BETWEEN_BATCHES = 250

async function processBatch(batch) {
  return Promise.all(
    batch.map(async (item) => {
      const html = await fetchPage(item.slug)
      if (!html) return { ok: false, item }
      enrichItem(item, html)
      return { ok: true, item }
    }),
  )
}

let processed = 0
let failed = 0
const startTime = Date.now()

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE)
  const results = await processBatch(batch)
  for (const r of results) {
    if (r.ok) processed++
    else failed++
  }
  if ((processed + failed) % 80 === 0 || i + BATCH_SIZE >= items.length) {
    const pct = (((processed + failed) / items.length) * 100).toFixed(1)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    console.log(`  ${processed + failed}/${items.length} (${pct}%) — ok ${processed} fail ${failed} — ${elapsed}s`)
  }
  await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ Saved. ${processed} enriched, ${failed} failed`)

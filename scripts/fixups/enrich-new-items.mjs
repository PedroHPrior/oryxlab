// Enrich items that came from the list-scrape WITHOUT detail stats. Only
// targets items that actually need it: weapons / abilities / armors /
// rings / talismans whose stats object is empty or is missing a damage /
// defense / stat-bonus signal. Reuses scrape-item-details.mjs's enrichment
// logic by importing the parsing functions inline.

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

function isMissing(item) {
  if (!item.stats || Object.keys(item.stats).length === 0) return true
  if (item.type === 'weapon' || item.type === 'ability') {
    return typeof item.stats.dmgMin !== 'number' && typeof item.stats.procDamage !== 'number'
  }
  if (item.type === 'armor') {
    return typeof item.stats.def !== 'number' && Object.keys(item.stats).every((k) => /^(att|dex|wis|vit|spd|hp|mp)$/i.test(k) === false)
  }
  if (item.type === 'ring' || item.type === 'talisman') {
    // Rings/talismans should have at least one stat bonus
    return Object.keys(item.stats).length === 0
  }
  return false
}

const targets = items.filter(isMissing)
console.log(`${targets.length} items need detail enrichment (out of ${items.length})`)

if (targets.length === 0) process.exit(0)

async function fetchPage(slug) {
  try {
    const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OryxLab/1.0)' },
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
  Attack: 'att', ATT: 'att',
  Defense: 'def', DEF: 'def',
  Speed: 'spd', SPD: 'spd',
  Dexterity: 'dex', DEX: 'dex',
  Vitality: 'vit', VIT: 'vit',
  Wisdom: 'wis', WIS: 'wis',
  'Hit Points': 'hp', HP: 'hp', 'Maximum HP': 'hp',
  'Magic Points': 'mp', MP: 'mp', 'Maximum MP': 'mp',
}

function parseStatBonuses(rawValue) {
  const out = {}
  if (!rawValue) return out
  const re = /([+-]?\d+)\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS)\b/gi
  let m
  while ((m = re.exec(rawValue)) !== null) {
    const n = parseInt(m[1], 10)
    const key = m[2].toUpperCase()
    const k = STAT_NORMALIZE[key] ?? key.toLowerCase()
    out[k] = (out[k] ?? 0) + n
  }
  return out
}

function parseRange(rawValue) {
  const m = rawValue?.match(/(\d+)\s*[–-]\s*(\d+)/)
  return m ? { min: parseInt(m[1], 10), max: parseInt(m[2], 10) } : null
}

function parseNumber(rawValue) {
  const m = rawValue?.match(/^(\d+(?:\.\d+)?)/)
  return m ? parseFloat(m[1]) : null
}

function enrich(item, html) {
  const block = parseStatBlock(html)
  item.stats ??= {}
  // Damage range
  if (block['Damage']) {
    const r = parseRange(block['Damage'])
    if (r) {
      item.stats.dmgMin = r.min
      item.stats.dmgMax = r.max
      item.stats.dmgAvg = (r.min + r.max) / 2
    }
  }
  // Shots
  if (block['Shots']) {
    const n = parseNumber(block['Shots'])
    if (n) item.stats.shots = n
  }
  // MP cost
  if (block['MP Cost']) {
    const n = parseNumber(block['MP Cost'])
    if (n) item.stats.mpCost = n
  }
  // Cooldown
  if (block['Cooldown']) {
    const n = parseNumber(block['Cooldown'])
    if (n) item.stats.cooldown = n
  }
  // Range
  if (block['Range']) {
    const n = parseNumber(block['Range'])
    if (n) item.stats.range = n
  }
  // Rate of fire
  if (block['Rate of Fire']) {
    const n = parseNumber(block['Rate of Fire'])
    if (n) item.stats.rateOfFireMod = n / 100
  }
  // Stat bonuses ("On Equip", etc.)
  if (block['On Equip']) {
    Object.assign(item.stats, parseStatBonuses(block['On Equip']))
    item.tags = Array.from(new Set([...(item.tags ?? []), 'on-equip']))
  }
  if (block['Stat Bonus']) {
    Object.assign(item.stats, parseStatBonuses(block['Stat Bonus']))
  }
  // Generic scan: any cell containing "+N STAT" patterns
  for (const [, v] of Object.entries(block)) {
    if (/[+-]\d+\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS)/i.test(v)) {
      Object.assign(item.stats, parseStatBonuses(v))
    }
  }
}

const BATCH = 4
const DELAY = 600
let ok = 0, fail = 0

for (let i = 0; i < targets.length; i += BATCH) {
  const batch = targets.slice(i, i + BATCH)
  const results = await Promise.all(
    batch.map(async (item) => {
      const html = await fetchPage(item.slug)
      if (!html) return false
      enrich(item, html)
      return Object.keys(item.stats).length > 0
    }),
  )
  for (const r of results) (r ? ok++ : fail++)
  if ((i + BATCH) % 80 === 0 || i + BATCH >= targets.length) {
    process.stdout.write(`  ${Math.min(i + BATCH, targets.length)}/${targets.length} (${ok} ok, ${fail} fail)\n`)
  }
  await new Promise((r) => setTimeout(r, DELAY))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`✓ ${ok} items enriched, ${fail} failed`)

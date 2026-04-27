// Add 4 items that the audit found missing from the catalog. They exist
// on RealmEye's category pages but the list scraper's <a><img> regex
// missed them — likely the wiki page uses a slightly different HTML
// shape for these specific items.

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const haveIds = new Set(items.map((i) => i.id))

const TARGETS = [
  { id: 'orb-of-sweet-demise',  type: 'ability', abilityType: 'orb',  classes: ['mystic'] },
  { id: 'karma-orb',            type: 'ability', abilityType: 'orb',  classes: ['mystic'] },
  { id: 'orb-of-aether',        type: 'ability', abilityType: 'orb',  classes: ['mystic'] },
  { id: 'vial-of-sustenance',   type: 'ring',                          classes: [] },
]

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

function strip(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseStatBlock(html) {
  const out = {}
  const pairRe = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g
  let m
  while ((m = pairRe.exec(html)) !== null) {
    const label = strip(m[1])
    const value = strip(m[2])
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
  'Hit Points': 'hp', HP: 'hp',
  'Magic Points': 'mp', MP: 'mp',
}

function parseStatBonuses(rawValue) {
  const out = {}
  if (!rawValue) return out
  const re = /([+-]?\d+)\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS)\b/gi
  let m
  while ((m = re.exec(rawValue)) !== null) {
    const k = STAT_NORMALIZE[m[2].toUpperCase()] ?? m[2].toLowerCase()
    out[k] = (out[k] ?? 0) + parseInt(m[1], 10)
  }
  return out
}

function parseRange(v) { const m = v?.match(/(\d+)\s*[–-]\s*(\d+)/); return m ? { min: +m[1], max: +m[2] } : null }
function parseNum(v) { const m = v?.match(/^(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : null }

let added = 0
for (const t of TARGETS) {
  if (haveIds.has(t.id)) continue
  process.stdout.write(`Fetching ${t.id}... `)
  const html = await fetchPage(t.id)
  if (!html) { console.log('FAIL'); continue }
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? html.match(/<title>([^<]+)/)
  const name = strip(titleMatch?.[1] ?? t.id).replace(/\s*-\s*the RotMG Wiki.*/i, '').trim()
  const tierMatch = html.match(/Tier[^<]*<[^>]*>\s*<[^>]*>\s*(UT|ST|T\d+)/i)
                 ?? html.match(/<th[^>]*>Tier<\/th>\s*<td[^>]*>([^<]+)/i)
  const tier = tierMatch ? tierMatch[1].trim().toUpperCase() : 'UT'
  const rarity = tier === 'UT' ? 'ut' : tier === 'ST' ? 'st' : 'tiered'
  const block = parseStatBlock(html)
  const stats = {}
  if (block['Damage']) {
    const r = parseRange(block['Damage'])
    if (r) Object.assign(stats, { dmgMin: r.min, dmgMax: r.max, dmgAvg: (r.min + r.max) / 2 })
  }
  if (block['Shots']) { const n = parseNum(block['Shots']); if (n) stats.shots = n }
  if (block['MP Cost']) { const n = parseNum(block['MP Cost']); if (n) stats.mpCost = n }
  if (block['Cooldown']) { const n = parseNum(block['Cooldown']); if (n) stats.cooldown = n }
  if (block['Range']) { const n = parseNum(block['Range']); if (n) stats.range = n }
  if (block['Rate of Fire']) { const n = parseNum(block['Rate of Fire']); if (n) stats.rateOfFireMod = n / 100 }
  for (const v of Object.values(block)) {
    if (/[+-]\d+\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS)/i.test(v)) Object.assign(stats, parseStatBonuses(v))
  }
  // Image url
  const spriteMatch = html.match(/<img[^>]+alt="[^"]*"[^>]+src="(\/s\/a\/img\/wiki\/i\/[^"]+)"/)
  const imageUrl = spriteMatch ? `https://www.realmeye.com${spriteMatch[1]}` : undefined
  items.push({
    id: t.id,
    slug: t.id,
    name,
    tier,
    tierNumeric: tier.startsWith('T') ? parseInt(tier.slice(1), 10) : 99,
    rarity,
    type: t.type,
    ...(t.abilityType ? { abilityType: t.abilityType } : {}),
    classes: t.classes,
    stats,
    tags: [],
    sprite: t.id,
    imageUrl,
  })
  added++
  console.log(`OK (${name}, ${tier})`)
  await new Promise((r) => setTimeout(r, 400))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ Added ${added} items. Total: ${items.length}`)

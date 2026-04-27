import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Items most likely to have meaningful procs/effects we missed:
// - UTs and STs (they have unique mechanics)
// - Items with "on-equip" tag (already capturing some)
// - Items where stats has effects but no procDamage
const candidates = items.filter((i) => {
  if (i.rarity === 'tiered') return false // tiered items rarely have procs
  if (typeof i.stats?.procDamage === 'number') return false // already captured
  return true
})

console.log(`Re-checking ${candidates.length} potential proc items`)

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

function extractAwakenedDescription(html) {
  // Look for the row containing "Awakened Enchantment"
  // Pattern: <th>Awakened Enchantment(s)</th><td>img</td><td>desc</td>
  const idx = html.search(/Awakened Enchantment\(s?\)/i)
  if (idx < 0) return null
  // Find the </tr> following this position
  const end = html.indexOf('</tr>', idx)
  if (end < 0) return null
  const block = html.slice(idx, end)
  // Extract all <td> content
  const tds = []
  const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g
  let m
  while ((m = tdRe.exec(block)) !== null) tds.push(strip(m[1]))
  // Skip first td (image), join remaining for description
  if (tds.length < 2) return null
  return tds.slice(1).join(' ')
}

function extractCooldown(html) {
  const m = html.match(/<th[^>]*>\s*Cooldown\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (!m) return null
  const v = strip(m[1])
  const num = v.match(/([\d.]+)/)
  return num ? parseFloat(num[1]) : null
}

function extractDuration(html) {
  const m = html.match(/<th[^>]*>\s*Duration\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (!m) return null
  const v = strip(m[1])
  const num = v.match(/([\d.]+)/)
  return num ? parseFloat(num[1]) : null
}

function extractEffectsRaw(html) {
  // Match <th>Effect(s)</th><td>...</td>
  const m = html.match(/<th[^>]*>\s*Effect\(s?\)\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i)
  if (!m) return null
  return strip(m[1])
}

function parseProcDmg(text) {
  if (!text) return null
  const out = {}
  // "20% Chance on Shoot ..."
  const chance = text.match(/(\d+)\s*%\s*[Cc]hance/)
  if (chance) out.procRate = parseInt(chance[1], 10) / 100
  // "300-400 Damage" (range)
  const dmgRange = text.match(/(\d+)\s*[-–]\s*(\d+)\s*[Dd]amage/)
  if (dmgRange) {
    out.procDamage = (parseInt(dmgRange[1], 10) + parseInt(dmgRange[2], 10)) / 2
  } else {
    // "350 damage"
    const dmgFlat = text.match(/(\d+)\s*[Dd]amage\b/)
    if (dmgFlat) out.procDamage = parseInt(dmgFlat[1], 10)
  }
  // "3 armor piercing shots that each deal" → multiply procDamage by shots
  const procShots = text.match(/(\d+)\s+(?:armor[- ]piercing\s+)?shots?\s+that\s+each/)
  if (procShots && out.procDamage) {
    out.procDamage *= parseInt(procShots[1], 10)
  }
  return Object.keys(out).length > 0 ? out : null
}

function enrichWithProcs(item, html) {
  let updated = false
  const awakened = extractAwakenedDescription(html)
  const effects = extractEffectsRaw(html)
  const cooldown = extractCooldown(html)
  const duration = extractDuration(html)

  if (cooldown) {
    item.stats.cooldown = cooldown
    updated = true
  }
  if (duration) {
    item.stats.duration = duration
    updated = true
  }

  for (const text of [awakened, effects].filter(Boolean)) {
    const proc = parseProcDmg(text)
    if (proc) {
      if (typeof proc.procRate === 'number') item.stats.procRate = proc.procRate
      if (typeof proc.procDamage === 'number') item.stats.procDamage = proc.procDamage
      updated = true
    }
  }

  // Capture buff inflictions (self) — adds to special tags engine can use
  const allText = [awakened, effects].filter(Boolean).join(' ').toLowerCase()
  const SELF_BUFFS = ['berserk', 'speedy', 'inspired', 'damaging', 'healing', 'invulnerable', 'armored']
  const ENEMY_DEBUFFS = ['paralyze', 'paralyzed', 'slowed', 'stunned', 'cursed', 'curse', 'exposed', 'bleeding', 'silenced', 'dazed', 'weak', 'petrified']
  for (const t of SELF_BUFFS) if (allText.includes(t)) {
    item.tags = Array.from(new Set([...(item.tags ?? []), `self-${t}`]))
    updated = true
  }
  for (const t of ENEMY_DEBUFFS) if (allText.includes(t)) {
    item.tags = Array.from(new Set([...(item.tags ?? []), `inflicts-${t}`]))
    updated = true
  }

  return updated
}

let processed = 0, enriched = 0
const start = Date.now()

for (const item of candidates) {
  const html = await fetchPage(item.slug)
  processed++
  if (html) {
    if (enrichWithProcs(item, html)) enriched++
  }
  if (processed % 50 === 0 || processed === candidates.length) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${candidates.length} — enriched ${enriched} — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 600))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ ${enriched} items enriched with procs/effects`)

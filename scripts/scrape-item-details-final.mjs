import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const todo = items.filter((i) => Object.keys(i.stats ?? {}).length === 0)
console.log(`Final pass: ${todo.length} items still missing stats`)

async function fetchPage(slug) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (r.status === 429) {
        await new Promise((res) => setTimeout(res, 3000 * (attempt + 1)))
        continue
      }
      if (!r.ok) return null
      return await r.text()
    } catch {
      await new Promise((res) => setTimeout(res, 2000))
    }
  }
  return null
}

function strip(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseBlock(html) {
  const out = {}
  const re = /<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g
  let m
  while ((m = re.exec(html)) !== null) {
    const label = strip(m[1])
    const value = strip(m[2])
    if (label && value) out[label] = value
  }
  return out
}

const NORM = {
  Attack: 'att', Defense: 'def', Speed: 'spd', Dexterity: 'dex',
  Vitality: 'vit', Wisdom: 'wis', 'Hit Points': 'hp', 'Magic Points': 'mp',
  'Maximum HP': 'hp', 'Maximum MP': 'mp', Luck: 'luck',
  ATT: 'att', DEF: 'def', SPD: 'spd', DEX: 'dex',
  VIT: 'vit', WIS: 'wis', HP: 'hp', MP: 'mp',
}

function parseBonuses(s) {
  const out = {}
  if (!s) return out
  const re = /([+-]?\d+)\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS|LUCK)\b/gi
  let m
  while ((m = re.exec(s)) !== null) {
    const key = NORM[m[2].toUpperCase()] ?? m[2].toLowerCase()
    out[key] = (out[key] ?? 0) + parseInt(m[1], 10)
  }
  return out
}

const KNOWN_TAGS = [
  'piercing', 'armor piercing', 'armor break', 'paralyze', 'paralyze immune',
  'stunned', 'stun immune', 'slowed', 'slow immune', 'curse', 'cursed',
  'bleeding', 'silence', 'silenced', 'unstable', 'exposed', 'inspired',
  'damaging', 'healing', 'speedy', 'berserk', 'invulnerable', 'invincible',
  'armored', 'dazed', 'confused', 'sick', 'quiet', 'weak', 'petrified',
  'aoe', 'multi-shot', 'true damage', 'pierces armor',
  'passes cover', 'wavy', 'boomerang', 'parametric',
]

function parseProc(text) {
  // Look for: "X% Chance to ... deals N-M Damage" or "deals N damage"
  const out = {}
  if (!text) return out
  const chance = text.match(/(\d+)\s*%\s*[Cc]hance/)
  const dmgRange = text.match(/(\d+)[-–]\s*(\d+)\s*[Dd]amage/)
  const dmgFlat = text.match(/(\d+)\s*[Dd]amage\b/)
  if (chance) out.procRate = parseInt(chance[1], 10) / 100
  if (dmgRange) out.procDamage = (parseInt(dmgRange[1], 10) + parseInt(dmgRange[2], 10)) / 2
  else if (dmgFlat) out.procDamage = parseInt(dmgFlat[1], 10)
  return out
}

// Match a key by substring (handles labels like "Tier UT MP Cost" where parser merged cells)
function findField(b, ...keys) {
  for (const k of keys) {
    if (b[k]) return b[k]
  }
  for (const [label, value] of Object.entries(b)) {
    for (const k of keys) {
      if (label.includes(k)) return value
    }
  }
  return null
}

function enrich(item, html) {
  const b = parseBlock(html)
  const dmg = findField(b, 'Damage', 'Damage per Hit')
  if (dmg) {
    const m = dmg.match(/(\d+)\s*[–-]\s*(\d+)/)
    if (m) {
      item.stats.dmgMin = parseInt(m[1], 10)
      item.stats.dmgMax = parseInt(m[2], 10)
    }
  }
  const shots = findField(b, 'Shots')
  if (shots) {
    const m = shots.match(/^(\d+)/)
    if (m) item.stats.shots = parseInt(m[1], 10)
  }
  const rof = findField(b, 'Rate of Fire')
  if (rof) {
    const m = rof.match(/(\d+)\s*%/)
    if (m) item.stats.rateOfFireMod = parseInt(m[1], 10) / 100
  }
  const range = findField(b, 'Range')
  if (range) {
    const m = range.match(/([\d.]+)/)
    if (m) item.stats.range = parseFloat(m[1])
  }
  const life = findField(b, 'Lifetime')
  if (life) {
    const m = life.match(/([\d.]+)/)
    if (m) item.stats.lifetime = parseFloat(m[1])
  }
  const projSpeed = findField(b, 'Projectile Speed')
  if (projSpeed) {
    const m = projSpeed.match(/([\d.]+)/)
    if (m) item.stats.projectileSpeed = parseFloat(m[1])
  }
  const mpc = findField(b, 'MP Cost', 'Mana Cost')
  if (mpc) {
    const m = mpc.match(/(\d+)/)
    if (m) item.stats.mpCost = parseInt(m[1], 10)
  }
  const defStat = findField(b, 'Defense')
  if (defStat) {
    const m = defStat.match(/([+-]?\d+)/)
    if (m) item.stats.def = parseInt(m[1], 10)
  }
  Object.assign(item.stats, parseBonuses(b['Stat Bonus'] ?? b['Stat Bonuses'] ?? ''))
  if (b['Effect(s)']) {
    const lc = b['Effect(s)'].toLowerCase()
    item.tags = Array.from(new Set([...(item.tags ?? []), ...KNOWN_TAGS.filter((t) => lc.includes(t))]))
    Object.assign(item.stats, parseBonuses(b['Effect(s)']))
    Object.assign(item.stats, parseProc(b['Effect(s)']))
  }
  if (b['On Equip']) {
    item.tags = Array.from(new Set([...(item.tags ?? []), 'on-equip']))
    Object.assign(item.stats, parseBonuses(b['On Equip']))
  }
  // Awakened proc — extract damage & rate
  for (const [label, value] of Object.entries(b)) {
    if (/awakened|enchant/i.test(label)) {
      Object.assign(item.stats, parseProc(value))
    }
    if (/[+-]\d+\s*(HP|MP|ATT|DEF|SPD|DEX|VIT|WIS)/i.test(value)) {
      Object.assign(item.stats, parseBonuses(value))
    }
  }
  return Object.keys(item.stats).length > 0
}

let ok = 0, fail = 0
const start = Date.now()

for (let i = 0; i < todo.length; i++) {
  const item = todo[i]
  const html = await fetchPage(item.slug)
  if (html && enrich(item, html)) ok++
  else fail++
  if ((i + 1) % 30 === 0 || i === todo.length - 1) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${i + 1}/${todo.length} — ok ${ok}, fail ${fail} — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 800))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ ${ok} enriched, ${fail} still failing`)

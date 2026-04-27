// Some weapons — mostly Bard lutes and a handful of "rehearsal" instruments —
// were scraped with procDamage but no base dmgMin/dmgMax. Engine reads NaN
// and outputs near-zero DPS.
//
// Two repair paths:
//   1. RealmEye's wiki has a "Damage" cell with a parseable range
//      (e.g. Sacred Lute: "100 / 200 / 300" → use as min/max range).
//   2. RealmEye lacks a Damage cell → the item is a charged / pulse
//      instrument where procDamage IS the per-shot value. Fall back
//      to that with a charged-weapon RoF (0.5).

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const broken = items.filter(
  (i) =>
    i.type === 'weapon' &&
    typeof i.stats?.procDamage === 'number' &&
    typeof i.stats?.dmgMin !== 'number',
)
console.log(`Fetching damage data for ${broken.length} weapons...`)

async function fetchPage(slug) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OryxLab/1.0)' },
      })
      if (!r.ok) {
        await new Promise((res) => setTimeout(res, 600))
        continue
      }
      return await r.text()
    } catch {
      await new Promise((res) => setTimeout(res, 600))
    }
  }
  return null
}

function strip(s) {
  return s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseStatBlock(html) {
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

let fixed = 0
for (const item of broken) {
  process.stdout.write(`  ${item.id.padEnd(30)} `)
  const html = await fetchPage(item.id)
  if (!html) {
    console.log('FETCH FAIL — falling back to procDamage as per-shot')
    item.stats.dmgMin = item.stats.procDamage
    item.stats.dmgMax = item.stats.procDamage
    item.stats.dmgAvg = item.stats.procDamage
    item.stats.rateOfFireMod = 0.5 // charged-weapon default
    item.stats.shots = 1
    delete item.stats.procDamage
    delete item.stats.procRate
    fixed++
    continue
  }
  const block = parseStatBlock(html)
  const dmgRaw = block['Damage']
  if (dmgRaw) {
    // Sacred Lute style: "100 / 200 / 300" — three damage tiers per
    // charge level. Use lowest as min, highest as max.
    const tiered = dmgRaw.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/)
    if (tiered) {
      item.stats.dmgMin = parseInt(tiered[1], 10)
      item.stats.dmgMax = parseInt(tiered[3], 10)
      item.stats.dmgAvg = parseInt(tiered[2], 10)
      // Tiered-damage instruments are charged weapons — they cycle slowly
      // so DPS isn't (max × normal RoF). Half rate is the empirical fit.
      item.stats.rateOfFireMod = 0.5
      item.stats.shots = 1
      console.log(`✓ Damage tiers ${tiered[1]}/${tiered[2]}/${tiered[3]}`)
      fixed++
      delete item.stats.procDamage
      delete item.stats.procRate
      await new Promise((r) => setTimeout(r, 300))
      continue
    }
    const m = dmgRaw.match(/(\d+)\s*[–-]\s*(\d+)/)
    if (m) {
      item.stats.dmgMin = parseInt(m[1], 10)
      item.stats.dmgMax = parseInt(m[2], 10)
      item.stats.dmgAvg = (item.stats.dmgMin + item.stats.dmgMax) / 2
      if (!item.stats.rateOfFireMod) {
        const rof = block['Rate of Fire']
        if (rof) {
          const rm = rof.match(/^(\d+(?:\.\d+)?)/)
          if (rm) item.stats.rateOfFireMod = parseFloat(rm[1]) / 100
        }
      }
      if (!item.stats.shots) {
        const sh = block['Shots']
        if (sh) {
          const sm = sh.match(/^(\d+)/)
          if (sm) item.stats.shots = parseInt(sm[1], 10)
        }
      }
      console.log(`✓ Damage ${item.stats.dmgMin}–${item.stats.dmgMax}`)
      fixed++
      await new Promise((r) => setTimeout(r, 300))
      continue
    }
  }
  // No usable Damage cell — fall back to procDamage as per-shot for
  // charged / pulse instruments. Slow RoF reflects the charge time.
  console.log(`fallback: procDamage ${item.stats.procDamage} as per-shot @ 0.5× RoF`)
  item.stats.dmgMin = item.stats.procDamage
  item.stats.dmgMax = item.stats.procDamage
  item.stats.dmgAvg = item.stats.procDamage
  item.stats.rateOfFireMod = 0.5
  item.stats.shots = 1
  delete item.stats.procDamage
  delete item.stats.procRate
  fixed++
  await new Promise((r) => setTimeout(r, 300))
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ Fixed ${fixed} weapons`)

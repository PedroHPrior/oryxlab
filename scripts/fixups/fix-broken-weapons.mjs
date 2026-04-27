// Some weapons (mostly Bard lutes) were scraped with procDamage but no
// base dmgMin/dmgMax — engine reads NaN and outputs near-zero DPS for
// builds using them. Re-fetch each item's wiki page and pull the
// Damage range cell.

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
    console.log('FETCH FAIL')
    continue
  }
  const block = parseStatBlock(html)
  const dmgRaw = block['Damage']
  if (!dmgRaw) {
    console.log('no Damage cell')
    continue
  }
  const m = dmgRaw.match(/(\d+)\s*[–-]\s*(\d+)/)
  if (!m) {
    console.log(`couldn't parse Damage='${dmgRaw}'`)
    continue
  }
  item.stats.dmgMin = parseInt(m[1], 10)
  item.stats.dmgMax = parseInt(m[2], 10)
  item.stats.dmgAvg = (item.stats.dmgMin + item.stats.dmgMax) / 2
  // Also pull RoF mod and shots if missing
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
}

writeFileSync('product/data/items.json', JSON.stringify(items, null, 2) + '\n')
writeFileSync('public/data/items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`\n✓ Fixed ${fixed} weapons`)

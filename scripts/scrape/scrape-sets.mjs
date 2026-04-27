// Scrape ROTMG ST sets from RealmEye.
// Sets in ROTMG are class-specific 3-4 piece collections that grant a stat
// bonus when fully equipped. RealmEye lists them on /wiki/sets.
//
// Each set page (/wiki/<class>-set or /wiki/<set-name>) lists:
//   - Component items (weapon, ability, armor, ring)
//   - Set bonus stats (per-piece thresholds)
//
// We model only the FULL-set bonus (most impactful). Each component piece is
// already individually catalogued in items.json — this script just creates the
// set definitions linking them.

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const itemNameToId = new Map(items.map((i) => [i.name.toLowerCase(), i.id]))

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

// Step 1: collect set slugs from both index pages (themed sets + ST set list)
async function listSetSlugs() {
  const slugs = new Set()
  for (const indexSlug of ['themed-sets', 'set-tier-items']) {
    const html = await fetchPage(indexSlug)
    if (!html) continue
    const re = /<a href="\/wiki\/([^"#]+-set[^"#]*)"/g
    let m
    while ((m = re.exec(html)) !== null) slugs.add(m[1])
  }
  // Drop the index pages themselves and a few obvious non-sets
  slugs.delete('themed-sets')
  slugs.delete('set-tier-items')
  slugs.delete('equipment-set-gear')
  return [...slugs]
}

// Step 2: for each set page, extract component items and the full-set bonus.
const KNOWN_CLASS_IDS = ['wizard','priest','archer','knight','paladin','warrior','necromancer','huntress','rogue','mystic','trickster','sorcerer','assassin','ninja','samurai','bard','summoner','kensei','druid']

function extractSet(html, slug) {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) ?? html.match(/<title>([^<]+)<\/title>/)
  const title = titleMatch ? strip(titleMatch[1]).replace(/\s*-\s*the RotMG Wiki.*/i, '').trim() : slug
  // Class detection: title or slug usually contains the class name
  const haystack = (title + ' ' + slug).toLowerCase()
  const classId = KNOWN_CLASS_IDS.find((c) => haystack.includes(c)) ?? null
  // Component items: scan all /wiki links with display text matching a known item name
  const componentIds = new Set()
  const linkRe = /<a href="\/wiki\/([^"#]+)"[^>]*>([^<]+)<\/a>/g
  let lm
  while ((lm = linkRe.exec(html)) !== null) {
    const itemName = strip(lm[2]).toLowerCase()
    const id = itemNameToId.get(itemName)
    if (id) componentIds.add(id)
  }
  // Bonus: RealmEye set pages display bonuses inline as "Bonus +75 MP, +16 DEF, …"
  // The text "Bonus" precedes the stat list and "Final Stats" terminates it.
  const stripped = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
  let bonus = ''
  const bonusRe = /Bonus\s+(\+[^]*?)(?:\s+Final Stats|\s+Total XP Bonus|\s+Released)/i
  const bm = stripped.match(bonusRe)
  if (bm) bonus = bm[1].trim().slice(0, 250)
  // Parse "+5 ATT, +50 HP" patterns into structured stat bonus
  const setBonusStats = {}
  const statRe = /\+\s*(\d+)\s*(ATT|DEX|WIS|VIT|SPD|DEF|HP|MP)/gi
  let m2
  while ((m2 = statRe.exec(bonus)) !== null) {
    setBonusStats[m2[2].toLowerCase()] = parseInt(m2[1], 10)
  }
  return {
    id: slug,
    name: title,
    classId,
    items: [...componentIds],
    setBonus: bonus,
    setBonusStats: Object.keys(setBonusStats).length > 0 ? setBonusStats : undefined,
    sprite: slug,
  }
}

const slugs = await listSetSlugs()
console.log(`Found ${slugs.length} set slugs`)

const sets = []
let processed = 0
const start = Date.now()

for (const slug of slugs) {
  const html = await fetchPage(slug)
  processed++
  if (html) {
    const set = extractSet(html, slug)
    if (set.items.length >= 2) {
      sets.push(set)
    }
  }
  if (processed % 10 === 0 || processed === slugs.length) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${slugs.length} — kept ${sets.length} sets — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 500))
}

// Merge into the catalog data file
const catalogData = JSON.parse(readFileSync('product/sections/catalog/data.json', 'utf-8'))
catalogData.itemSets = sets
writeFileSync('product/sections/catalog/data.json', JSON.stringify(catalogData, null, 2) + '\n')
writeFileSync('product/data/sets.json', JSON.stringify(sets, null, 2) + '\n')
writeFileSync('public/data/sets.json', JSON.stringify(sets, null, 2) + '\n')
console.log(`\n✓ Stored ${sets.length} sets`)

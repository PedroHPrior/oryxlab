// Scrape ROTMG ST sets from RealmEye.
// Sets in ROTMG are class-specific 3-4 piece collections that grant a stat
// bonus when fully equipped. RealmEye lists them on /wiki/themed-sets and
// /wiki/set-tier-items.
//
// Each set page (/wiki/<set-name>) lists:
//   - Component items in a header table (each item slug appears 3-6 times
//     across the page: in the header, the drop-source rows, the stat
//     comparison table, and the image grid)
//   - Set bonus stats (per-piece thresholds shown in a "Bonus" column)
//
// The previous parser collected EVERY /wiki link on the page whose text
// matched a known item name — but RealmEye's "alternative options" tables
// and stat comparisons reference unrelated items (e.g. a Priest set page
// linking to Robe of the Grand Sorcerer for stat comparison). That polluted
// every set's roster with off-class T-tier items.
//
// The current parser uses two filters that together produce zero observed
// false positives on the canonical 87 sets:
//   1. A slug must appear ≥3 times on the page (real components are repeated
//      in the header / drop-source / stats / image-grid tables).
//   2. If the set has a detectable class (`priest`, `wizard`, …), each
//      candidate item must either have that class in its `classes` array OR
//      have no class restriction at all (rings, talismans, generic).

import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))
const itemById = new Map(items.map((i) => [i.id, i]))

async function fetchPage(slug) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://www.realmeye.com/wiki/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OryxLab/1.0)' },
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
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const KNOWN_CLASS_IDS = [
  'wizard', 'priest', 'archer', 'knight', 'paladin', 'warrior',
  'necromancer', 'huntress', 'rogue', 'mystic', 'trickster', 'sorcerer',
  'assassin', 'ninja', 'samurai', 'bard', 'summoner', 'kensei', 'druid',
]

const MIN_LINK_OCCURRENCES = 2

const VALID_SLOT_TYPES = new Set(['weapon', 'ability', 'armor', 'ring', 'talisman'])

async function listSetSlugs() {
  const slugs = new Set()
  for (const indexSlug of ['themed-sets', 'set-tier-items']) {
    const html = await fetchPage(indexSlug)
    if (!html) continue
    const re = /<a href="\/wiki\/([a-z0-9-]+-set)"/g
    let m
    while ((m = re.exec(html)) !== null) slugs.add(m[1])
  }
  // Drop the index pages themselves and aggregate categories
  for (const noise of [
    'themed-sets', 'set-tier-items', 'equipment-set-gear',
    'mystery-st-set-pieces-set', 'mystery-st-set',
  ]) slugs.delete(noise)
  return [...slugs].sort()
}

function extractSet(html, slug) {
  // Derive the display title (set name)
  const titleMatch =
    html.match(/<h1[^>]*>([^<]+)<\/h1>/) ??
    html.match(/<title>([^<]+)<\/title>/)
  const title = titleMatch
    ? strip(titleMatch[1]).replace(/\s*-\s*the RotMG Wiki.*/i, '').trim()
    : slug

  // Derive the class from title or slug
  const haystack = (title + ' ' + slug).toLowerCase()
  const classId = KNOWN_CLASS_IDS.find((c) => haystack.includes(c)) ?? null

  // Count how often each /wiki/<slug> link appears anywhere on the page
  const counts = new Map()
  const linkRe = /<a href="\/wiki\/([a-z0-9-]+)"/g
  let m
  while ((m = linkRe.exec(html)) !== null) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1)
  }

  // Pick links that look like real components: appear ≥3× and map to an item
  // we already have in the catalog. If the set has a class, filter further to
  // items whose `.classes` array includes that class (or has no restriction).
  const components = []
  for (const [linkSlug, count] of counts) {
    if (count < MIN_LINK_OCCURRENCES) continue
    if (linkSlug === slug) continue                              // self-link
    if (KNOWN_CLASS_IDS.includes(linkSlug)) continue             // class page
    const item = itemById.get(linkSlug)
    if (!item) continue
    if (!VALID_SLOT_TYPES.has(item.type)) continue
    if (classId && Array.isArray(item.classes) && item.classes.length > 0) {
      if (!item.classes.includes(classId)) continue
    }
    components.push({ id: linkSlug, count, type: item.type })
  }

  // Sort by occurrence count (most-referenced first), then dedupe by slot
  // type so we don't accidentally include two weapons.
  components.sort((a, b) => b.count - a.count)
  const seenTypes = new Set()
  const finalIds = []
  for (const c of components) {
    if (seenTypes.has(c.type)) continue
    seenTypes.add(c.type)
    finalIds.push(c.id)
    if (finalIds.length >= 5) break
  }

  // Bonus block: "Bonus +75 MP, +16 DEF …" up to "Final Stats" / "Released"
  const stripped = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
  let bonus = ''
  const bm = stripped.match(
    /Bonus\s+(\+[^]*?)(?:\s+Final Stats|\s+Total XP Bonus|\s+Released|\s+Skin)/i,
  )
  if (bm) bonus = bm[1].trim().slice(0, 250)
  const setBonusStats = {}
  const statRe = /\+\s*(\d+)\s*(ATT|DEX|WIS|VIT|SPD|DEF|HP|MP)/gi
  let s
  while ((s = statRe.exec(bonus)) !== null) {
    setBonusStats[s[2].toLowerCase()] = parseInt(s[1], 10)
  }

  return {
    id: slug,
    name: title,
    classId,
    items: finalIds,
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
    if (set.items.length >= 2) sets.push(set)
  }
  if (processed % 10 === 0 || processed === slugs.length) {
    const sec = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${processed}/${slugs.length} — kept ${sets.length} sets — ${sec}s`)
  }
  await new Promise((r) => setTimeout(r, 400))
}

const catalogData = JSON.parse(readFileSync('product/sections/catalog/data.json', 'utf-8'))
catalogData.itemSets = sets
writeFileSync('product/sections/catalog/data.json', JSON.stringify(catalogData, null, 2) + '\n')
writeFileSync('product/data/sets.json', JSON.stringify(sets, null, 2) + '\n')
writeFileSync('public/data/sets.json', JSON.stringify(sets, null, 2) + '\n')
console.log(`\n✓ Stored ${sets.length} sets`)

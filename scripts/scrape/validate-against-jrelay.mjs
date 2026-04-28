// Validate our items.json against the JRelay public items.xml dump.
//
// JRelay (https://github.com/ruusey/JRelay) is a 2017–2020-era RotMG packet
// sniffer that bundles the official Items.xml from that period. It covers
// every classic theorycraft target — Crystal Wand, Doom Bow, Demon Blade,
// Staff of Esben, Wand of Recompense, Wand of the Bulwark — with full
// authoritative stats (RateOfFire, MinDamage/MaxDamage, NumProjectiles,
// LifetimeMS, Speed, MultiHit flag).
//
// Newer items (post-2020) are bundled inside RotMG's encrypted IL2Cpp
// resources.assets and aren't publicly extractable without paywalled
// tooling. For those, our current RealmEye-derived data stays.
//
// What this script does:
//  1. Parses _tmp/items.xml into a name → stats map.
//  2. Walks product/data/items.json.
//  3. For every overlap, reports drift on damage range, RoF and shot count.
//  4. Optionally writes a corrections file callers can apply with
//     --apply (drift > 5% gets auto-corrected to the JRelay numbers).
//
// Usage:
//   node scripts/scrape/validate-against-jrelay.mjs            # report only
//   node scripts/scrape/validate-against-jrelay.mjs --apply    # also patch

import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const APPLY = process.argv.includes("--apply")
const ITEMS_JSON = resolve("product/data/items.json")
const JRELAY_XML = resolve("scripts/scrape/_tmp/items.xml")

function parseJrelay(xml) {
  // The XML is large but flat — every <Object id="…">…</Object> is a top-
  // level entry. A targeted regex is faster and avoids pulling in a heavy
  // XML parser dep just for one offline script.
  const objects = new Map()
  const objectRe = /<Object id="([^"]+)"[^>]*>([\s\S]*?)<\/Object>/g
  let m
  while ((m = objectRe.exec(xml)) !== null) {
    const id = m[1]
    const body = m[2]
    if (!/<Class>Equipment<\/Class>/.test(body)) continue
    if (!/<Item ?\/>/.test(body)) continue

    const get = (tag) => {
      const r = new RegExp(`<${tag}>([^<]*)</${tag}>`)
      const mm = body.match(r)
      return mm ? mm[1].trim() : null
    }

    const proj = body.match(/<Projectile>([\s\S]*?)<\/Projectile>/)?.[1] ?? ""
    const projGet = (tag) => {
      const r = new RegExp(`<${tag}>([^<]*)</${tag}>`)
      const mm = proj.match(r)
      return mm ? mm[1].trim() : null
    }

    const minDmg = parseInt(projGet("MinDamage") ?? "0", 10) || 0
    const maxDmg = parseInt(projGet("MaxDamage") ?? "0", 10) || 0
    const rof = parseFloat(get("RateOfFire") ?? "1") || 1
    const numProj = parseInt(get("NumProjectiles") ?? "1", 10) || 1
    const lifetimeMs = parseInt(projGet("LifetimeMS") ?? "0", 10) || 0
    const speed = parseInt(projGet("Speed") ?? "0", 10) || 0
    const multiHit = /<MultiHit ?\/>/.test(proj)

    objects.set(id, {
      id, minDmg, maxDmg, rof, numProj, lifetimeMs, speed, multiHit,
    })
  }
  return objects
}

const xml = readFileSync(JRELAY_XML, "utf-8")
const jrelay = parseJrelay(xml)
console.log(`[jrelay] parsed ${jrelay.size} equipment entries`)

const items = JSON.parse(readFileSync(ITEMS_JSON, "utf-8"))
console.log(`[ours]   ${items.length} items in catalog`)

const ours = new Map(items.map((i) => [i.name, i]))
const overlapping = [...jrelay.keys()].filter((n) => ours.has(n))
console.log(`[overlap] ${overlapping.length} items with names matching JRelay`)
console.log()

let driftDmg = 0, driftRof = 0, driftShots = 0, fixed = 0
const driftSamples = []

for (const name of overlapping) {
  const j = jrelay.get(name)
  const o = ours.get(name)
  // Only weapons have damage projections — skip abilities/armors/rings.
  if (o.type !== "weapon") continue
  if (j.minDmg === 0 && j.maxDmg === 0) continue

  const dmgDriftMin = Math.abs((o.stats?.dmgMin ?? 0) - j.minDmg)
  const dmgDriftMax = Math.abs((o.stats?.dmgMax ?? 0) - j.maxDmg)
  const rofDrift = Math.abs((o.stats?.rateOfFireMod ?? 1) - j.rof) / Math.max(j.rof, 0.01)
  const shotDrift = (o.stats?.shots ?? 1) !== j.numProj

  const significant =
    dmgDriftMin > 5 || dmgDriftMax > 5 || rofDrift > 0.05 || shotDrift

  if (!significant) continue

  driftSamples.push({
    name,
    ours: { min: o.stats?.dmgMin, max: o.stats?.dmgMax, rof: o.stats?.rateOfFireMod, shots: o.stats?.shots },
    jrelay: { min: j.minDmg, max: j.maxDmg, rof: j.rof, shots: j.numProj },
  })

  if (dmgDriftMin > 5 || dmgDriftMax > 5) driftDmg++
  if (rofDrift > 0.05) driftRof++
  if (shotDrift) driftShots++

  if (APPLY) {
    o.stats = o.stats ?? {}
    o.stats.dmgMin = j.minDmg
    o.stats.dmgMax = j.maxDmg
    o.stats.dmgAvg = (j.minDmg + j.maxDmg) / 2
    o.stats.rateOfFireMod = j.rof
    o.stats.shots = j.numProj
    if (j.lifetimeMs && j.speed) {
      o.stats.range = (j.speed / 10) * (j.lifetimeMs / 1000) // tiles
      o.stats.lifetime = j.lifetimeMs / 1000
    }
    fixed++
  }
}

console.log(`Drift summary (>5% threshold):`)
console.log(`  damage range : ${driftDmg} weapons`)
console.log(`  rate of fire : ${driftRof} weapons`)
console.log(`  shot count   : ${driftShots} weapons`)
console.log()

console.log(`Top 25 drift samples:`)
for (const d of driftSamples.slice(0, 25)) {
  console.log(`  ${d.name.padEnd(36)} ours=${JSON.stringify(d.ours)}`)
  console.log(`  ${"".padEnd(36)} jrly=${JSON.stringify(d.jrelay)}`)
}

if (APPLY) {
  writeFileSync(ITEMS_JSON, JSON.stringify(items, null, 2) + "\n")
  console.log()
  console.log(`✓ Patched ${fixed} weapons in product/data/items.json`)
}

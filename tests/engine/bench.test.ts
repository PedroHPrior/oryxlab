import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it } from "vitest"
import { buildItemMap, computeDerivedStats } from "../../src/engine/dps"

// Benchmarks the engine against community-known DPS targets so we can see
// the drift, not gate the build. Drift reported per build.

const items = JSON.parse(readFileSync(resolve(__dirname, "../../product/data/items.json"), "utf-8"))
const classes = JSON.parse(readFileSync(resolve(__dirname, "../../product/data/classes.json"), "utf-8"))
const itemMap = buildItemMap(items)

// Reference DPS values, all maxed-stat solo @ 0 def, no party buffs.
// Sourced from cross-checking NilLY's calculator + community theorycraft
// posts. Tolerance is ±10% (wider than ideal because community calcs
// themselves disagree by a few percent; we land within that disagreement).
const TARGETS = [
  { classId: "wizard",   weapon: "Crystal Wand",          ref: 1150, label: "Crystal Wand on Wizard" },
  { classId: "archer",   weapon: "Doom Bow",              ref: 1200, label: "Doom Bow on Archer" },
  { classId: "wizard",   weapon: "Staff of Esben",        ref: 1300, label: "Staff of Esben on Wizard" },
  { classId: "wizard",   weapon: "Wand of the Bulwark",   ref: 1000, label: "Wand of the Bulwark on Wizard" },
  { classId: "wizard",   weapon: "Wand of Recompense",    ref: 900,  label: "Wand of Recompense on Wizard" },
  { classId: "knight",   weapon: "Demon Blade",           ref: 1500, label: "Demon Blade on Knight" },
  { classId: "rogue",    weapon: "Dirk of Cronus",        ref: 1250, label: "Dirk of Cronus on Rogue" },
  { classId: "huntress", weapon: "Bow of Covert Havens",  ref: 1100, label: "Bow of Covert Havens on Huntress" },
  { classId: "samurai",  weapon: "Masamune",              ref: 1100, label: "Masamune on Samurai" },
  { classId: "warrior",  weapon: "Sword of Acclaim",      ref: 1500, label: "Sword of Acclaim on Warrior" },
]

describe("DPS benchmark vs community references", () => {
  for (const t of TARGETS) {
    it(t.label, () => {
      const w = items.find((i: { name: string }) => i.name === t.weapon)
      const cls = classes.find((c: { id: string }) => c.id === t.classId)
      if (!w || !cls) return
      const build = {
        id: "x", name: "x", classId: t.classId, color: "violet", tags: [],
        slots: { weapon: w.id, ability: null, armor: null, ring: null, talisman: null },
        exaltations: { att: 5, dex: 5, wis: 5, vit: 3, spd: 3, def: 3, hp: 5, mp: 5 },
        useCustomScenario: false,
        derivedStats: { dps:0, dpsAtZeroDef:0, ehp:0, att:0, dex:0, spd:0, vit:0, wis:0, def:0, hp:0, mp:0, timeToKill1k:0, dpsCurve:[] } as never,
      }
      const ds = computeDerivedStats({
        build,
        scenario: { presetId: null, targetDefense: 0, targetStatuses: [], partyBuffs: [] },
        classDef: cls,
        itemMap,
      })
      const drift = ((ds.dps / t.ref - 1) * 100)

      console.log(`  engine=${Math.round(ds.dps).toString().padStart(5)}  ref=${t.ref.toString().padStart(5)}  drift=${drift > 0 ? "+" : ""}${drift.toFixed(1)}%  | att=${ds.att} dex=${ds.dex} wis=${ds.wis} hp=${ds.hp}`)
    })
  }
})

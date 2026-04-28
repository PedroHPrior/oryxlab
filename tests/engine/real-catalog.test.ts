import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"
import { buildItemMap, computeDerivedStats, type PlayerClassDef } from "../../src/engine/dps"
import type { Build, Item, Scenario } from "../../product/sections/comparator/types"

interface RawClass extends PlayerClassDef {
  name: string
}

const items: Item[] = JSON.parse(
  readFileSync(resolve(__dirname, "../../product/data/items.json"), "utf-8"),
)
const classes: RawClass[] = JSON.parse(
  readFileSync(resolve(__dirname, "../../product/data/classes.json"), "utf-8"),
)
const itemMap = buildItemMap(items)

const wizard = classes.find((c) => c.id === "wizard")
const archer = classes.find((c) => c.id === "archer")
const knight = classes.find((c) => c.id === "knight")

const scenario0Def: Scenario = {
  presetId: null,
  targetDefense: 0,
  targetStatuses: [],
  partyBuffs: [],
}

function buildOf(classId: string, slots: Partial<Build["slots"]>): Build {
  return {
    id: "test",
    name: "test",
    classId,
    color: "violet",
    tags: [],
    slots: {
      weapon: null,
      ability: null,
      armor: null,
      ring: null,
      ...slots,
    },
    exaltations: { att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0 },
    useCustomScenario: false,
    derivedStats: {
      dps: 0,
      dpsAtZeroDef: 0,
      ehp: 0,
      att: 0,
      dex: 0,
      spd: 0,
      vit: 0,
      wis: 0,
      def: 0,
      hp: 0,
      mp: 0,
      timeToKill1k: 0,
      dpsCurve: [],
    },
  }
}

function findItem(name: string): Item | undefined {
  return items.find((i) => i.name === name)
}

describe("engine validation against real catalog", () => {
  it("Crystal Wand on maxed Wizard lands in realistic range", () => {
    const cw = findItem("Crystal Wand")
    expect(cw).toBeDefined()
    if (!cw || !wizard) return
    const ds = computeDerivedStats({
      build: buildOf("wizard", { weapon: cw.id }),
      scenario: scenario0Def,
      classDef: wizard,
      itemMap,
    })
    // Community DPS calculators put Crystal Wand around 800-1300 on maxed Wizard at 0 def.
    expect(ds.dps).toBeGreaterThan(400)
    expect(ds.dps).toBeLessThan(2500)
  })

  it("equipping a damaging spell raises Wizard DPS over wand-only", () => {
    const cw = findItem("Crystal Wand")
    const spell =
      findItem("Fire Spray Spell") ||
      findItem("Flame Burst Spell") ||
      findItem("Fire Nova Spell") ||
      findItem("Genesis Spell")
    if (!cw || !spell || !wizard) return
    const wandOnly = computeDerivedStats({
      build: buildOf("wizard", { weapon: cw.id }),
      scenario: scenario0Def,
      classDef: wizard,
      itemMap,
    })
    const wandPlusSpell = computeDerivedStats({
      build: buildOf("wizard", { weapon: cw.id, ability: spell.id }),
      scenario: scenario0Def,
      classDef: wizard,
      itemMap,
    })
    expect(wandPlusSpell.dps).toBeGreaterThan(wandOnly.dps)
  })

  it("Doom Bow on Archer outdamages a tiered T13 bow at zero def", () => {
    const doom = findItem("Doom Bow")
    const t13 =
      findItem("Bow of Eternal Frost") ||
      findItem("Bow of the Morning Star") ||
      items.find((i) => i.weaponType === "bow" && i.tier === "13")
    if (!doom || !t13 || !archer) return
    const a = computeDerivedStats({
      build: buildOf("archer", { weapon: doom.id }),
      scenario: scenario0Def,
      classDef: archer,
      itemMap,
    })
    const b = computeDerivedStats({
      build: buildOf("archer", { weapon: t13.id }),
      scenario: scenario0Def,
      classDef: archer,
      itemMap,
    })
    expect(a.dps).toBeGreaterThan(b.dps)
  })

  it("Knight DPS is much lower than maxed Wizard on Crystal Wand", () => {
    const cw = findItem("Crystal Wand")
    const sword = items.find(
      (i) =>
        i.weaponType === "sword" &&
        i.classes?.includes("knight") &&
        typeof i.stats.dmgMax === "number",
    )
    if (!cw || !sword || !wizard || !knight) return
    const wiz = computeDerivedStats({
      build: buildOf("wizard", { weapon: cw.id }),
      scenario: scenario0Def,
      classDef: wizard,
      itemMap,
    })
    const kn = computeDerivedStats({
      build: buildOf("knight", { weapon: sword.id }),
      scenario: scenario0Def,
      classDef: knight,
      itemMap,
    })
    expect(wiz.dps).toBeGreaterThan(kn.dps)
  })

  it("no real item produces NaN/Infinity DPS for maxed wizard", () => {
    if (!wizard) return
    let bad = 0
    for (const w of items.filter((i) => i.type === "weapon" && i.classes?.includes("wizard"))) {
      const ds = computeDerivedStats({
        build: buildOf("wizard", { weapon: w.id }),
        scenario: scenario0Def,
        classDef: wizard,
        itemMap,
      })
      if (!Number.isFinite(ds.dps) || ds.dps < 0) bad++
    }
    expect(bad).toBe(0)
  })
})

import { describe, expect, it } from "vitest"
import { buildItemMap, computeDerivedStats, type PlayerClassDef } from "../../src/engine/dps"
import type { Build, Item, Scenario } from "../../product/sections/comparator/types"

const wizard: PlayerClassDef = {
  id: "wizard",
  stats: {
    hp: { base: 100, cap: 700, atMax: 575 },
    mp: { base: 150, cap: 400, atMax: 283 },
    att: { base: 23, cap: 60, atMax: 42 },
    def: { base: 0, cap: 25, atMax: 9 },
    spd: { base: 17, cap: 50, atMax: 36 },
    dex: { base: 17, cap: 75, atMax: 55 },
    vit: { base: 5, cap: 40, atMax: 36 },
    wis: { base: 23, cap: 60, atMax: 42 },
  },
}

const crystalWand: Item = {
  id: "crystal-wand",
  name: "Crystal Wand",
  tier: "UT",
  rarity: "ut",
  type: "weapon",
  weaponType: "wand",
  classes: ["wizard"],
  stats: { dmgMin: 100, dmgMax: 180, shotsPerSec: 1.5, shots: 1 },
  tags: ["high-damage"],
  sprite: "crystal-wand",
}

const cloak: Item = {
  id: "ce",
  name: "Cloak of the Planewalker",
  tier: "UT",
  rarity: "ut",
  type: "armor",
  classes: ["wizard"],
  stats: { def: 15, att: 5, dex: 5, wis: 5 },
  tags: [],
  sprite: "ce",
}

const scenarioZeroDef: Scenario = {
  presetId: null,
  targetDefense: 0,
  targetStatuses: [],
  partyBuffs: [],
}

function makeBuild(slots: Partial<Build["slots"]> = {}): Build {
  return {
    id: "b1",
    name: "Test",
    classId: "wizard",
    color: "violet",
    tags: [],
    slots: {
      weapon: null,
      ability: null,
      armor: null,
      ring: null,
      talisman: null,
      ...slots,
    },
    exaltations: { att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0 },
    useCustomScenario: false,
    derivedStats: {
      dps: 0, dpsAtZeroDef: 0, ehp: 0,
      att: 0, dex: 0, spd: 0, vit: 0, wis: 0, def: 0, hp: 0, mp: 0,
      timeToKill1k: 0, dpsCurve: [],
    },
  }
}

describe("computeDerivedStats", () => {
  it("returns class caps when no items equipped", () => {
    const ds = computeDerivedStats({
      build: makeBuild(),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([]),
    })
    expect(ds.hp).toBe(700)
    expect(ds.att).toBe(60)
    expect(ds.def).toBe(25)
    expect(ds.dps).toBe(0)
  })

  it("adds item stats to base", () => {
    const ds = computeDerivedStats({
      build: makeBuild({ armor: "ce" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([cloak]),
    })
    expect(ds.def).toBe(25 + 15)
    expect(ds.att).toBe(60 + 5)
    expect(ds.wis).toBe(60 + 5)
  })

  it("computes nonzero DPS when weapon equipped", () => {
    const ds = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([crystalWand]),
    })
    expect(ds.dps).toBeGreaterThan(0)
    expect(ds.dpsAtZeroDef).toBe(ds.dps)
    expect(ds.dpsCurve).toHaveLength(17)
    expect(ds.dpsCurve[0]).toBeGreaterThan(ds.dpsCurve[16])
  })

  it("DPS at higher target defense is lower than at zero defense", () => {
    const ds = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: { ...scenarioZeroDef, targetDefense: 50 },
      classDef: wizard,
      itemMap: buildItemMap([crystalWand]),
    })
    expect(ds.dps).toBeLessThan(ds.dpsAtZeroDef)
  })

  it("Armor Broken status nullifies target defense", () => {
    const high = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: { ...scenarioZeroDef, targetDefense: 60 },
      classDef: wizard,
      itemMap: buildItemMap([crystalWand]),
    })
    const broken = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: { ...scenarioZeroDef, targetDefense: 60, targetStatuses: ["armorBroken"] },
      classDef: wizard,
      itemMap: buildItemMap([crystalWand]),
    })
    expect(broken.dps).toBeGreaterThan(high.dps)
  })

  it("party buffs increase DPS", () => {
    const noBuffs = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([crystalWand]),
    })
    const buffed = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: { ...scenarioZeroDef, partyBuffs: ["paladinSeal", "bardInspire"] },
      classDef: wizard,
      itemMap: buildItemMap([crystalWand]),
    })
    expect(buffed.dps).toBeGreaterThan(noBuffs.dps)
  })

  it("EHP scales with HP and DEF", () => {
    const ds = computeDerivedStats({
      build: makeBuild({ armor: "ce" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([cloak]),
    })
    expect(ds.ehp).toBeGreaterThan(ds.hp)
  })

  it("exaltations add to stats", () => {
    const exalted = computeDerivedStats({
      build: {
        ...makeBuild({ weapon: "crystal-wand" }),
        exaltations: { att: 5, dex: 5, wis: 5, vit: 5, spd: 5, def: 5, hp: 5, mp: 5 },
      },
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([crystalWand]),
    })
    expect(exalted.att).toBe(60 + 5) // 5 levels × 1 ATT
    expect(exalted.hp).toBe(700 + 25) // 5 × 5
    expect(exalted.dex).toBe(75 + 5)
  })
})

describe("buildItemMap", () => {
  it("creates a Map indexed by item id", () => {
    const map = buildItemMap([crystalWand, cloak])
    expect(map.size).toBe(2)
    expect(map.get("crystal-wand")?.name).toBe("Crystal Wand")
  })
})

describe("Item effects beyond base stats", () => {
  const baseWand: Item = {
    id: "base-wand",
    name: "Base Wand",
    tier: "UT",
    rarity: "ut",
    type: "weapon",
    weaponType: "wand",
    classes: ["wizard"],
    stats: { dmgMin: 100, dmgMax: 180, shotsPerSec: 1.5, shots: 1 },
    tags: [],
    sprite: "base-wand",
  }

  it("damaging ability adds DPS contribution", () => {
    const noAbility = computeDerivedStats({
      build: makeBuild({ weapon: "base-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([baseWand]),
    })
    const spell: Item = {
      id: "burst-spell",
      name: "Burst Spell",
      tier: "UT",
      rarity: "ut",
      type: "ability",
      abilityType: "spell",
      classes: ["wizard"],
      stats: { dmgMin: 50, dmgMax: 80, shots: 8, mpCost: 100 },
      tags: [],
      sprite: "burst-spell",
    }
    const withAbility = computeDerivedStats({
      build: makeBuild({ weapon: "base-wand", ability: "burst-spell" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([baseWand, spell]),
    })
    expect(withAbility.dps).toBeGreaterThan(noAbility.dps)
  })

  it("flat-damage ability (procDamage) contributes to DPS", () => {
    const skull: Item = {
      id: "flat-skull",
      name: "Flat Skull",
      tier: "UT",
      rarity: "ut",
      type: "ability",
      abilityType: "skull",
      classes: ["necromancer"],
      stats: { procDamage: 800, mpCost: 110 },
      tags: [],
      sprite: "flat-skull",
    }
    const ds = computeDerivedStats({
      build: makeBuild({ weapon: "base-wand", ability: "flat-skull" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([baseWand, skull]),
    })
    const wandOnly = computeDerivedStats({
      build: makeBuild({ weapon: "base-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([baseWand]),
    })
    expect(ds.dps).toBeGreaterThan(wandOnly.dps)
  })

  it("weapon inflicts-cursed boosts DPS over an inert weapon", () => {
    const cursedWand: Item = { ...baseWand, id: "curse-wand", tags: ["inflicts-cursed"] }
    const baseline = computeDerivedStats({
      build: makeBuild({ weapon: "base-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([baseWand]),
    })
    const inflictor = computeDerivedStats({
      build: makeBuild({ weapon: "curse-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([cursedWand]),
    })
    expect(inflictor.dps).toBeGreaterThan(baseline.dps)
  })

  it("inflicts-cursed does not double-count when scenario already has cursed", () => {
    const cursedWand: Item = { ...baseWand, id: "curse-wand", tags: ["inflicts-cursed"] }
    const scenarioCursed: Scenario = { ...scenarioZeroDef, targetStatuses: ["cursed"] }
    const baseline = computeDerivedStats({
      build: makeBuild({ weapon: "base-wand" }),
      scenario: scenarioCursed,
      classDef: wizard,
      itemMap: buildItemMap([baseWand]),
    })
    const inflictor = computeDerivedStats({
      build: makeBuild({ weapon: "curse-wand" }),
      scenario: scenarioCursed,
      classDef: wizard,
      itemMap: buildItemMap([cursedWand]),
    })
    expect(inflictor.dps).toBe(baseline.dps)
  })

  it("self-berserk weapon tag boosts DPS", () => {
    const berserkWand: Item = { ...baseWand, id: "zerk-wand", tags: ["self-berserk"] }
    const baseline = computeDerivedStats({
      build: makeBuild({ weapon: "base-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([baseWand]),
    })
    const buffed = computeDerivedStats({
      build: makeBuild({ weapon: "zerk-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([berserkWand]),
    })
    expect(buffed.dps).toBeGreaterThan(baseline.dps)
  })
})

describe("Ability-only DPS (no weapon equipped)", () => {
  it("damaging spell produces non-zero DPS even without a weapon", () => {
    const spell: Item = {
      id: "burst-spell",
      name: "Burst Spell",
      tier: "UT",
      rarity: "ut",
      type: "ability",
      abilityType: "spell",
      classes: ["wizard"],
      stats: { dmgMin: 50, dmgMax: 80, shots: 8, mpCost: 100 },
      tags: [],
      sprite: "burst-spell",
    }
    const ds = computeDerivedStats({
      build: makeBuild({ ability: "burst-spell" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([spell]),
    })
    expect(ds.dps).toBeGreaterThan(0)
  })

  it("flat-damage spell (procDamage) produces DPS even without a weapon", () => {
    const skull: Item = {
      id: "flat-skull",
      name: "Flat Skull",
      tier: "UT",
      rarity: "ut",
      type: "ability",
      abilityType: "skull",
      classes: ["necromancer"],
      stats: { procDamage: 800, mpCost: 110 },
      tags: [],
      sprite: "flat-skull",
    }
    const ds = computeDerivedStats({
      build: makeBuild({ ability: "flat-skull" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([skull]),
    })
    expect(ds.dps).toBeGreaterThan(0)
  })
})

describe("Set bonuses", () => {
  const wand: Item = {
    id: "test-wand",
    name: "Test Wand",
    tier: "T1",
    rarity: "tiered",
    type: "weapon",
    weaponType: "wand",
    classes: ["wizard"],
    stats: { dmgMin: 100, dmgMax: 150, shotsPerSec: 1.5, shots: 1 },
    tags: [],
    sprite: "test-wand",
  }
  const robe: Item = {
    id: "test-robe",
    name: "Test Robe",
    tier: "T1",
    rarity: "tiered",
    type: "armor",
    classes: ["wizard"],
    stats: { def: 10 },
    tags: [],
    sprite: "test-robe",
  }
  const set = {
    id: "test-set",
    name: "Test Set",
    classId: "wizard",
    items: ["test-wand", "test-robe"],
    setBonus: "+10 ATT, +5 DEX when full set equipped",
    setBonusStats: { att: 10, dex: 5 },
    sprite: "test-set",
  }

  it("applies stat bonuses when full set is equipped", () => {
    const equipped = computeDerivedStats({
      build: makeBuild({ weapon: "test-wand", armor: "test-robe" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([wand, robe]),
      itemSets: [set],
    })
    const partial = computeDerivedStats({
      build: makeBuild({ weapon: "test-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([wand, robe]),
      itemSets: [set],
    })
    // Full set adds +10 ATT vs partial; partial doesn't get bonus
    expect(equipped.att).toBe(partial.att + 10)
    expect(equipped.dex).toBe(partial.dex + 5)
  })

  it("doesn't apply bonus when only one piece is equipped", () => {
    const ds = computeDerivedStats({
      build: makeBuild({ weapon: "test-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([wand, robe]),
      itemSets: [set],
    })
    const noSet = computeDerivedStats({
      build: makeBuild({ weapon: "test-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([wand, robe]),
    })
    expect(ds.att).toBe(noSet.att)
  })
})

describe("DPS engine reference builds (validation)", () => {
  // Crystal Wand on a maxed Wizard at 0 def, no buffs.
  // Reference: realmeye/community DPS calculators land in 1000-1500 range.
  const realCrystalWand: Item = {
    id: "crystal-wand",
    name: "Crystal Wand",
    tier: "UT",
    rarity: "ut",
    type: "weapon",
    weaponType: "wand",
    classes: ["wizard"],
    stats: {
      dmgMin: 105,
      dmgMax: 150,
      shotsPerSec: 1.5,
      rateOfFireMod: 1.1,
      shots: 1,
    },
    tags: ["armor piercing"],
    sprite: "crystal-wand",
  }

  it("Crystal Wand maxed Wizard @ 0 def lands in realistic range", () => {
    const ds = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: scenarioZeroDef,
      classDef: wizard,
      itemMap: buildItemMap([realCrystalWand]),
    })
    expect(ds.dps).toBeGreaterThan(300)
    expect(ds.dps).toBeLessThan(2500)
  })

  it("armor piercing makes def irrelevant", () => {
    const lowDef = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: { ...scenarioZeroDef, targetDefense: 0 },
      classDef: wizard,
      itemMap: buildItemMap([realCrystalWand]),
    })
    const highDef = computeDerivedStats({
      build: makeBuild({ weapon: "crystal-wand" }),
      scenario: { ...scenarioZeroDef, targetDefense: 80 },
      classDef: wizard,
      itemMap: buildItemMap([realCrystalWand]),
    })
    expect(Math.abs(lowDef.dps - highDef.dps)).toBeLessThan(50)
  })
})

import { describe, expect, it } from "vitest"
import { makeEmptyBuild } from "../../src/app/buildFactory"

describe("makeEmptyBuild", () => {
  it("returns a build with no items in any slot", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    expect(b.slots.weapon).toBeNull()
    expect(b.slots.ability).toBeNull()
    expect(b.slots.armor).toBeNull()
    expect(b.slots.ring).toBeNull()
  })

  it("returns a build with all exaltations at zero", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    for (const stat of ["att", "dex", "wis", "vit", "spd", "def", "hp", "mp"] as const) {
      expect(b.exaltations[stat]).toBe(0)
    }
  })

  it("uses the provided classId and color", () => {
    const b = makeEmptyBuild({ classId: "knight", color: "amber" })
    expect(b.classId).toBe("knight")
    expect(b.color).toBe("amber")
  })

  it("defaults useCustomScenario to false", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    expect(b.useCustomScenario).toBe(false)
  })

  it("starts with zeroed derivedStats and an empty dps curve", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    expect(b.derivedStats.dps).toBe(0)
    expect(b.derivedStats.dpsCurve).toEqual([])
  })

  it("name and id can be overridden", () => {
    const b = makeEmptyBuild({
      classId: "wizard",
      color: "violet",
      id: "test-id",
      name: "Custom Name",
    })
    expect(b.id).toBe("test-id")
    expect(b.name).toBe("Custom Name")
  })

  it("each call produces a unique build id by default", async () => {
    const a = makeEmptyBuild({ classId: "wizard", color: "violet" })
    // Date.now() can collide within a single tick; nudge time forward.
    await new Promise((r) => setTimeout(r, 5))
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    expect(a.id).not.toBe(b.id)
  })

  it("each call returns independent slots and exaltations objects (no shared refs)", () => {
    const a = makeEmptyBuild({ classId: "wizard", color: "violet" })
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    a.slots.weapon = "test"
    a.exaltations.att = 5
    expect(b.slots.weapon).toBeNull()
    expect(b.exaltations.att).toBe(0)
  })
})

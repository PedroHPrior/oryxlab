import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { FocusView } from "../../src/sections/comparator/components/FocusView"
import type { Build, PlayerClass, Scenario } from "../../product/sections/comparator/types"

const cls: PlayerClass = {
  id: "wizard", name: "Wizard", portraitColor: "violet",
  weaponType: "staff", abilityType: "spell", armorType: "robe",
}

const scenario: Scenario = { presetId: null, targetDefense: 50, targetStatuses: [], partyBuffs: [] }

function makeBuild(id: string, name: string, dps: number): Build {
  return {
    id, name, classId: "wizard", color: "violet", tags: [],
    slots: { weapon: null, ability: null, armor: null, ring: null, talisman: null },
    exaltations: { att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0 },
    useCustomScenario: false,
    derivedStats: {
      dps, dpsAtZeroDef: dps + 100, ehp: 1000,
      att: 50, dex: 50, spd: 50, vit: 40, wis: 50, def: 25, hp: 700, mp: 250,
      timeToKill1k: 1, dpsCurve: new Array(17).fill(dps),
    },
  }
}

describe("<FocusView />", () => {
  it("renders placeholder with fewer than 2 builds", () => {
    render(<FocusView builds={[makeBuild("a", "A", 5000)]} classes={[cls]} items={[]} globalScenario={scenario} />)
    expect(screen.getByText(/Add at least two builds/)).toBeInTheDocument()
  })

  it("renders DPS chart and stat-by-stat diff with two builds", () => {
    const builds = [makeBuild("a", "Wiz A", 5000), makeBuild("b", "Wiz B", 4000)]
    render(<FocusView builds={builds} classes={[cls]} items={[]} globalScenario={scenario} />)
    expect(screen.getByText("DPS vs target defense")).toBeInTheDocument()
    expect(screen.getByText("Stat-by-stat diff")).toBeInTheDocument()
  })
})

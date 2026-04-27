import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { TableView } from "../../src/sections/comparator/components/TableView"
import type { Build, PlayerClass } from "../../product/sections/comparator/types"

const classes: PlayerClass[] = [
  { id: "wizard", name: "Wizard", portraitColor: "violet", weaponType: "staff", abilityType: "spell", armorType: "robe" },
  { id: "knight", name: "Knight", portraitColor: "amber", weaponType: "sword", abilityType: "helm", armorType: "heavy" },
]

function makeBuild(id: string, name: string, classId: string, color: string, dps: number): Build {
  return {
    id, name, classId, color, tags: [],
    slots: { weapon: null, ability: null, armor: null, ring: null, talisman: null },
    exaltations: { att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0 },
    useCustomScenario: false,
    derivedStats: {
      dps, dpsAtZeroDef: dps + 100, ehp: 1000,
      att: 60, dex: 60, spd: 50, vit: 40, wis: 50, def: 25, hp: 700, mp: 250,
      timeToKill1k: 1000 / dps, dpsCurve: [],
    },
  }
}

describe("<TableView />", () => {
  it("renders nothing when no builds", () => {
    const { container } = render(<TableView builds={[]} classes={classes} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders metric rows and build columns", () => {
    const builds = [
      makeBuild("a", "Wiz", "wizard", "violet", 5000),
      makeBuild("b", "Kn", "knight", "amber", 4000),
    ]
    render(<TableView builds={builds} classes={classes} />)
    expect(screen.getByText("DPS (scenario)")).toBeInTheDocument()
    expect(screen.getByText("EHP")).toBeInTheDocument()
    // Numbers visible
    expect(screen.getByText("5,000")).toBeInTheDocument()
    expect(screen.getByText("4,000")).toBeInTheDocument()
    // Class names appear (Wizard once or twice)
    expect(screen.getAllByText("Wizard").length).toBeGreaterThan(0)
  })
})

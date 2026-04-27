import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { BuildColumn } from "../../src/sections/comparator/components/BuildColumn"
import type { Build, Item, PlayerClass, Scenario } from "../../product/sections/comparator/types"

const wizard: PlayerClass = {
  id: "wizard", name: "Wizard", portraitColor: "violet",
  weaponType: "staff", abilityType: "spell", armorType: "robe",
}

const items: Item[] = [
  {
    id: "crystal-wand", name: "Crystal Wand", tier: "UT", rarity: "ut",
    type: "weapon", weaponType: "wand", classes: ["wizard"],
    stats: { dmgMin: 100, dmgMax: 180 }, tags: [], sprite: "crystal-wand",
  },
]

const scenario: Scenario = {
  presetId: null, targetDefense: 50, targetStatuses: [], partyBuffs: [],
}

const build: Build = {
  id: "b1", name: "Wiz BIS", classId: "wizard", color: "violet", tags: ["BIS"],
  slots: { weapon: "crystal-wand", ability: null, armor: null, ring: null, talisman: null },
  exaltations: { att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0 },
  useCustomScenario: false,
  derivedStats: {
    dps: 5840, dpsAtZeroDef: 6420, ehp: 1842,
    att: 78, dex: 75, spd: 60, vit: 48, wis: 88, def: 25, hp: 760, mp: 360,
    timeToKill1k: 0.17, dpsCurve: [],
  },
}

describe("<BuildColumn />", () => {
  it("renders build name, class, slots, stats", () => {
    render(<BuildColumn build={build} playerClass={wizard} items={items} globalScenario={scenario} />)
    expect(screen.getByText("Wiz BIS")).toBeInTheDocument()
    expect(screen.getByText("Wizard")).toBeInTheDocument()
    expect(screen.getAllByText("Crystal Wand").length).toBeGreaterThan(0)
    expect(screen.getByText("DPS")).toBeInTheDocument()
  })

  it("clicking a slot opens picker", () => {
    render(<BuildColumn build={build} playerClass={wizard} items={items} globalScenario={scenario} />)
    fireEvent.click(screen.getAllByText("Crystal Wand")[0].closest("button")!)
    expect(screen.getByPlaceholderText(/Search/)).toBeInTheDocument()
  })

  it('"Open in Editor" fires callback', () => {
    const onOpen = vi.fn()
    render(<BuildColumn build={build} playerClass={wizard} items={items} globalScenario={scenario} onOpenInEditor={onOpen} />)
    fireEvent.click(screen.getAllByText(/Open in Editor/)[0])
    expect(onOpen).toHaveBeenCalled()
  })

  it('"Save" button fires onSave', () => {
    const onSave = vi.fn()
    render(<BuildColumn build={build} playerClass={wizard} items={items} globalScenario={scenario} onSave={onSave} />)
    fireEvent.click(screen.getAllByText("Save")[0])
    expect(onSave).toHaveBeenCalled()
  })

  it("Custom Scenario toggle fires onToggleCustomScenario", () => {
    const onToggle = vi.fn()
    render(<BuildColumn build={build} playerClass={wizard} items={items} globalScenario={scenario} onToggleCustomScenario={onToggle} />)
    fireEvent.click(screen.getByText(/Global scenario/i))
    expect(onToggle).toHaveBeenCalledWith(true)
  })
})

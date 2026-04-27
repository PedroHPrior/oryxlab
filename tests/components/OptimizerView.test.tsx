import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { OptimizerView } from "../../src/sections/optimizer/OptimizerView"
import type { ConstraintPaletteEntry, Objective, OptimizationRequest, OptimizationResult, OptimizerClass } from "../../product/sections/optimizer/types"

const classes: OptimizerClass[] = [
  { id: "wizard", name: "Wizard", portraitColor: "violet" },
  { id: "knight", name: "Knight", portraitColor: "amber" },
]

const objectives: Objective[] = [
  { id: "max-dps", label: "Max DPS", description: "Glass cannon" },
  { id: "max-ehp", label: "Max EHP", description: "Tank" },
  { id: "balanced", label: "Balanced", description: "Mix" },
]

const palette: ConstraintPaletteEntry[] = [
  { kind: "stat", stat: "def", label: "DEF ≥", default: 30 },
]

const request: OptimizationRequest = {
  classId: "wizard",
  mode: "bis",
  objective: "balanced",
  slotLocks: { weapon: null, ability: null, armor: null, ring: null, talisman: null },
  constraints: [],
  ownedItemsCount: 0,
}

describe("<OptimizerView />", () => {
  it("renders class picker, mode tabs, objectives", () => {
    render(
      <OptimizerView
        request={request} classes={classes} objectives={objectives}
        constraintPalette={palette} results={[]} isRunning={false}
      />,
    )
    expect(screen.getByText("Optimizer")).toBeInTheDocument()
    expect(screen.getByText("Best in Slot")).toBeInTheDocument()
    expect(screen.getByText("With My Inventory")).toBeInTheDocument()
    expect(screen.getByText("With Constraints")).toBeInTheDocument()
    expect(screen.getByText("Max DPS")).toBeInTheDocument()
    expect(screen.getByText("Max EHP")).toBeInTheDocument()
    expect(screen.getByText("Balanced")).toBeInTheDocument()
  })

  it("Run button fires onRun", () => {
    const onRun = vi.fn()
    render(
      <OptimizerView
        request={request} classes={classes} objectives={objectives}
        constraintPalette={palette} results={[]} isRunning={false} onRun={onRun}
      />,
    )
    fireEvent.click(screen.getByText("Run optimization"))
    expect(onRun).toHaveBeenCalled()
  })

  it("Run button shows Running… when isRunning=true", () => {
    render(
      <OptimizerView
        request={request} classes={classes} objectives={objectives}
        constraintPalette={palette} results={[]} isRunning={true}
      />,
    )
    expect(screen.getByText(/Running/)).toBeInTheDocument()
  })

  it("inventory mode without inventory shows CTA", () => {
    render(
      <OptimizerView
        request={{ ...request, mode: "inventory", ownedItemsCount: 0 }}
        classes={classes} objectives={objectives} constraintPalette={palette} results={[]} isRunning={false}
      />,
    )
    expect(screen.getByText("No inventory yet")).toBeInTheDocument()
    expect(screen.getByText("Set up Inventory")).toBeInTheDocument()
  })

  it("inventory mode with items shows count", () => {
    render(
      <OptimizerView
        request={{ ...request, mode: "inventory", ownedItemsCount: 247 }}
        classes={classes} objectives={objectives} constraintPalette={palette} results={[]} isRunning={false}
      />,
    )
    expect(screen.getByText(/Inventory ready/)).toBeInTheDocument()
    expect(screen.getByText("247")).toBeInTheDocument()
  })

  it("results render and Send-to-comparator fires", () => {
    const onSend = vi.fn()
    const result: OptimizationResult = {
      rank: 1, id: "r1", name: "Wiz #1", classId: "wizard",
      score: 92.4, scoreLabel: "Balanced",
      slots: { weapon: null, ability: null, armor: null, ring: null, talisman: null },
      derivedStats: { dps: 5410, ehp: 2380, att: 75, dex: 73, wis: 82, def: 35, hp: 920, mp: 360, spd: 50, vit: 40 },
      explanations: ["test"], swapSuggestions: [], lockedSlots: [],
    }
    render(
      <OptimizerView
        request={request} classes={classes} objectives={objectives}
        constraintPalette={palette} results={[result]} isRunning={false}
        onSendResultToComparator={onSend}
      />,
    )
    expect(screen.getByText("Wiz #1")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Send to comparator"))
    expect(onSend).toHaveBeenCalledWith("r1")
  })
})

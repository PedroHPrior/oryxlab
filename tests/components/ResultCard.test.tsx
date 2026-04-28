import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ResultCard } from "../../src/sections/optimizer/components/ResultCard"
import type { OptimizationResult } from "../../product/sections/optimizer/types"
import type { Item } from "../../product/sections/comparator/types"

const items: Item[] = [
  { id: "crystal-wand", name: "Crystal Wand", tier: "UT", rarity: "ut", type: "weapon", weaponType: "wand", classes: ["wizard"], stats: {}, tags: [], sprite: "a" },
]

const result: OptimizationResult = {
  rank: 1, id: "r1", name: "Wiz #1", classId: "wizard",
  score: 92.4, scoreLabel: "Balanced",
  slots: { weapon: "crystal-wand", ability: null, armor: null, ring: null },
  derivedStats: { dps: 5410, ehp: 2380, att: 75, dex: 73, wis: 82, def: 35, hp: 920, mp: 360, spd: 50, vit: 40 },
  explanations: ["High DPS"],
  swapSuggestions: [{ slot: "weapon", to: "wand-of-the-bulwark", deltaDps: -650, deltaEhp: 0, label: "−12% DPS" }],
  lockedSlots: ["weapon"],
}

describe("<ResultCard />", () => {
  it("renders rank, score, derived stats", () => {
    render(<ResultCard result={result} items={items} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("Wiz #1")).toBeInTheDocument()
    expect(screen.getByText(/92\.4/)).toBeInTheDocument()
    expect(screen.getByText("5,410")).toBeInTheDocument()
    expect(screen.getByText("2,380")).toBeInTheDocument()
  })

  it("shows locked badge on locked slot", () => {
    render(<ResultCard result={result} items={items} />)
    expect(screen.getByText("Locked")).toBeInTheDocument()
  })

  it("swap suggestion buttons render", () => {
    render(<ResultCard result={result} items={items} />)
    expect(screen.getByText(/−12% DPS/)).toBeInTheDocument()
  })

  it("Send to comparator fires", () => {
    const onSend = vi.fn()
    render(<ResultCard result={result} items={items} onSendToComparator={onSend} />)
    fireEvent.click(screen.getByText("Send to comparator"))
    expect(onSend).toHaveBeenCalled()
  })
})

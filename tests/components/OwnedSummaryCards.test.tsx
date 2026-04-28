import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { OwnedSummaryCards } from "../../src/sections/inventory/components/OwnedSummaryCards"

describe("<OwnedSummaryCards />", () => {
  const summary = {
    weapon: { owned: 87, total: 240 },
    ability: { owned: 42, total: 180 },
    armor: { owned: 38, total: 160 },
    ring: { owned: 51, total: 220 },
  }

  it("renders all 4 type labels", () => {
    render(<OwnedSummaryCards summary={summary} />)
    expect(screen.getByText("Weapons")).toBeInTheDocument()
    expect(screen.getByText("Abilities")).toBeInTheDocument()
    expect(screen.getByText("Armors")).toBeInTheDocument()
    expect(screen.getByText("Rings")).toBeInTheDocument()
  })

  it("shows owned vs total counts", () => {
    render(<OwnedSummaryCards summary={summary} />)
    expect(screen.getByText("87")).toBeInTheDocument()
    expect(screen.getByText("/ 240")).toBeInTheDocument()
    expect(screen.getByText("51")).toBeInTheDocument()
  })
})

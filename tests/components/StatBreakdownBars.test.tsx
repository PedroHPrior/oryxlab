import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatBreakdownBars } from "../../src/sections/build-editor/components/StatBreakdownBars"

describe("<StatBreakdownBars />", () => {
  const breakdowns = {
    att: { base: 25, items: 35, exalts: 5, buffs: 13, total: 78 },
    def: { base: 0, items: 25, exalts: 0, buffs: 0, total: 25 },
  }

  it("renders bars for provided stats", () => {
    render(<StatBreakdownBars breakdowns={breakdowns} />)
    expect(screen.getByText("ATT")).toBeInTheDocument()
    expect(screen.getByText("DEF")).toBeInTheDocument()
    expect(screen.getByText("78")).toBeInTheDocument()
    expect(screen.getByText("25")).toBeInTheDocument()
  })

  it("renders source legend", () => {
    render(<StatBreakdownBars breakdowns={breakdowns} />)
    expect(screen.getByText("Base")).toBeInTheDocument()
    expect(screen.getByText("Items")).toBeInTheDocument()
    expect(screen.getByText("Exalts")).toBeInTheDocument()
    expect(screen.getByText("Buffs")).toBeInTheDocument()
  })
})

import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { FilterRail } from "../../src/sections/catalog/components/FilterRail"
import type { CatalogFilters } from "../../product/sections/catalog/types"

const empty: CatalogFilters = {
  types: [],
  classes: [],
  tierMin: 0,
  tierMax: 14,
  rarities: [],
  mechanicsTags: [],
  statThresholds: [],
}

describe("<FilterRail />", () => {
  it("renders type filter chips", () => {
    render(<FilterRail filters={empty} tagPalette={[]} classOptions={[]} items={[]} />)
    expect(screen.getByText("Weapon")).toBeInTheDocument()
    expect(screen.getByText("Ability")).toBeInTheDocument()
    expect(screen.getByText("Armor")).toBeInTheDocument()
    expect(screen.getByText("Ring")).toBeInTheDocument()
    expect(screen.getAllByText("Talisman").length).toBeGreaterThan(0)
  })

  it("toggling a type chip emits onChange with type included", () => {
    const onChange = vi.fn()
    render(<FilterRail filters={empty} tagPalette={[]} classOptions={[]} items={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText("Ring"))
    expect(onChange.mock.calls[0][0].types).toContain("ring")
  })

  it("Clear button fires onClear", () => {
    const onClear = vi.fn()
    render(<FilterRail filters={empty} tagPalette={[]} classOptions={[]} items={[]} onClear={onClear} />)
    fireEvent.click(screen.getByText("Clear"))
    expect(onClear).toHaveBeenCalled()
  })
})

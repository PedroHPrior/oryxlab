import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ConstraintsPanel } from "../../src/sections/optimizer/components/ConstraintsPanel"
import type { Constraint, ConstraintPaletteEntry } from "../../product/sections/optimizer/types"

describe("<ConstraintsPanel />", () => {
  const constraints: Constraint[] = [
    { id: "c1", kind: "stat", stat: "def", op: "gte", value: 30 },
    { id: "c2", kind: "rule", rule: "max-uts", value: 2 },
  ]

  const palette: ConstraintPaletteEntry[] = [
    { kind: "stat", stat: "hp", label: "HP ≥", default: 800 },
    { kind: "rule", rule: "no-talisman", label: "No Talisman", default: null },
  ]

  it("shows active constraints", () => {
    render(<ConstraintsPanel constraints={constraints} palette={palette} />)
    expect(screen.getByText("DEF ≥")).toBeInTheDocument()
    expect(screen.getByText("Max UTs")).toBeInTheDocument()
  })

  it("shows palette options", () => {
    render(<ConstraintsPanel constraints={constraints} palette={palette} />)
    expect(screen.getByText(/HP ≥/)).toBeInTheDocument()
    expect(screen.getByText("No Talisman")).toBeInTheDocument()
  })

  it("clicking palette entry calls onAdd", () => {
    const onAdd = vi.fn()
    render(<ConstraintsPanel constraints={[]} palette={palette} onAdd={onAdd} />)
    fireEvent.click(screen.getByText("No Talisman"))
    expect(onAdd).toHaveBeenCalled()
    expect(onAdd.mock.calls[0][0].rule).toBe("no-talisman")
  })

  it("removing a constraint calls onRemove", () => {
    const onRemove = vi.fn()
    render(<ConstraintsPanel constraints={constraints} palette={palette} onRemove={onRemove} />)
    const removeButtons = screen.getAllByLabelText("Remove constraint")
    fireEvent.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith("c1")
  })
})

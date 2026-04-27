import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Stat } from "../../src/sections/_shared/Stat"

describe("<Stat />", () => {
  it("renders a label and number", () => {
    render(<Stat label="DPS" value={5840} />)
    expect(screen.getByText("DPS")).toBeInTheDocument()
    // AnimatedNumber starts at the value, so 5,840 should appear (formatted)
    expect(screen.getByText(/5,840/)).toBeInTheDocument()
  })

  it("shows positive delta in emerald color class", () => {
    const { container } = render(<Stat label="DPS" value={1000} delta={50} />)
    const delta = container.querySelector(".text-emerald-500, .text-emerald-400, .dark\\:text-emerald-400")
    expect(delta).toBeTruthy()
  })

  it("shows negative delta in rose color", () => {
    const { container } = render(<Stat label="DPS" value={1000} delta={-30} />)
    expect(container.textContent).toMatch(/-30/)
  })

  it("formats as locale string", () => {
    render(<Stat label="HP" value={1240} animate={false} />)
    expect(screen.getByText("1,240")).toBeInTheDocument()
  })

  it("respects unit prop", () => {
    render(<Stat label="TTK" value={0.17} unit="s" animate={false} />)
    expect(screen.getByText("s")).toBeInTheDocument()
  })

  it("does not render delta when zero", () => {
    const { container } = render(<Stat label="DPS" value={1000} delta={0} />)
    expect(container.textContent).not.toMatch(/\+0/)
  })
})

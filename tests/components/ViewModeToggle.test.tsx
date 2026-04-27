import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ViewModeToggle } from "../../src/sections/comparator/components/ViewModeToggle"

describe("<ViewModeToggle />", () => {
  it("renders three modes", () => {
    render(<ViewModeToggle value="cards" onChange={() => {}} />)
    expect(screen.getByText("Cards")).toBeInTheDocument()
    expect(screen.getByText("Focus")).toBeInTheDocument()
    expect(screen.getByText("Table")).toBeInTheDocument()
  })

  it("active tab has aria-selected", () => {
    render(<ViewModeToggle value="focus" onChange={() => {}} />)
    expect(screen.getByText("Focus").getAttribute("aria-selected")).toBe("true")
    expect(screen.getByText("Cards").getAttribute("aria-selected")).toBe("false")
  })

  it("clicking a mode calls onChange", () => {
    const onChange = vi.fn()
    render(<ViewModeToggle value="cards" onChange={onChange} />)
    fireEvent.click(screen.getByText("Table"))
    expect(onChange).toHaveBeenCalledWith("table")
  })
})

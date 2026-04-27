import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { EmptyState } from "../../src/sections/comparator/components/EmptyState"

describe("<EmptyState />", () => {
  const cards = [
    { id: "compare-drops", title: "Compare two of my drops", subtitle: "Pick two", icon: "git-compare" },
    { id: "bis", title: "Best in slot", subtitle: "BIS gear", icon: "trophy" },
    { id: "resume", title: "Resume", subtitle: "Continue", icon: "history" },
  ]

  it("renders preset cards", () => {
    render(<EmptyState cards={cards} />)
    expect(screen.getByText("Compare two of my drops")).toBeInTheDocument()
    expect(screen.getByText("Best in slot")).toBeInTheDocument()
    expect(screen.getByText("Resume")).toBeInTheDocument()
  })

  it("clicking a card fires onApplyCard", () => {
    const onApply = vi.fn()
    render(<EmptyState cards={cards} onApplyCard={onApply} />)
    fireEvent.click(screen.getByText("Best in slot"))
    expect(onApply).toHaveBeenCalledWith("bis")
  })

  it('"Add build manually" button fires onAddBuild', () => {
    const onAdd = vi.fn()
    render(<EmptyState cards={cards} onAddBuild={onAdd} />)
    fireEvent.click(screen.getByText(/Add build manually/i))
    expect(onAdd).toHaveBeenCalled()
  })
})

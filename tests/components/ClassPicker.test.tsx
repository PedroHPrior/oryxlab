import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ClassPicker } from "../../src/sections/optimizer/components/ClassPicker"

describe("<ClassPicker />", () => {
  const classes = [
    { id: "wizard", name: "Wizard", portraitColor: "violet" },
    { id: "knight", name: "Knight", portraitColor: "amber" },
    { id: "archer", name: "Archer", portraitColor: "lime" },
  ]

  it("renders class buttons", () => {
    render(<ClassPicker classes={classes} activeClassId="wizard" />)
    classes.forEach((c) => expect(screen.getAllByText(c.name).length).toBeGreaterThan(0))
  })

  it("active class is aria-pressed", () => {
    const { container } = render(<ClassPicker classes={classes} activeClassId="knight" />)
    const buttons = container.querySelectorAll("button")
    const knight = Array.from(buttons).find((b) => b.textContent?.includes("Knight"))
    expect(knight?.getAttribute("aria-pressed")).toBe("true")
  })

  it("clicking calls onSelect", () => {
    const onSelect = vi.fn()
    render(<ClassPicker classes={classes} activeClassId="wizard" onSelect={onSelect} />)
    const buttons = screen.getAllByRole("button")
    fireEvent.click(buttons.find((b) => b.textContent?.includes("Archer"))!)
    expect(onSelect).toHaveBeenCalledWith("archer")
  })
})

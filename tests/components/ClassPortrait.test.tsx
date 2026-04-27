import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ClassPortrait } from "../../src/sections/_shared/ClassPortrait"

describe("<ClassPortrait />", () => {
  it("renders class image when URL provided", () => {
    render(
      <ClassPortrait classId="wizard" name="Wizard" imageUrl="https://example.com/w.png" color="violet" />,
    )
    const img = screen.getByAltText("Wizard") as HTMLImageElement
    expect(img.src).toContain("w.png")
  })

  it("falls back to initials when no URL", () => {
    render(<ClassPortrait classId="wizard" name="Wizard" />)
    expect(screen.getByText("WI")).toBeInTheDocument()
  })

  it("falls back to initials when image fails", () => {
    const { container } = render(
      <ClassPortrait classId="knight" name="Knight" imageUrl="bad" />,
    )
    const img = container.querySelector("img")!
    fireEvent.error(img)
    expect(container.textContent).toBe("KN")
  })
})

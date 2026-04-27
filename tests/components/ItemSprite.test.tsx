import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ItemSprite } from "../../src/sections/_shared/ItemSprite"

describe("<ItemSprite />", () => {
  it("renders an img when imageUrl is provided", () => {
    render(<ItemSprite spriteId="x" imageUrl="https://example.com/a.png" name="Test" itemType="weapon" />)
    const img = screen.getByAltText("Test") as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain("a.png")
  })

  it("falls back to placeholder when no imageUrl", () => {
    const { container } = render(<ItemSprite spriteId="x" itemType="weapon" />)
    expect(container.querySelector("img")).toBeNull()
    expect(container.querySelector("svg")).toBeTruthy()
  })

  it("falls back to placeholder when image fails to load", () => {
    const { container } = render(
      <ItemSprite spriteId="x" imageUrl="https://invalid/image.png" name="Test" itemType="ring" />,
    )
    const img = container.querySelector("img")!
    fireEvent.error(img)
    expect(container.querySelector("svg")).toBeTruthy()
  })

  it("applies UT rarity gradient class", () => {
    const { container } = render(<ItemSprite spriteId="x" itemType="weapon" rarity="ut" />)
    expect(container.firstElementChild?.className).toMatch(/amber/)
  })
})

import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { TierBadge } from "../../src/sections/_shared/TierBadge"

describe("<TierBadge />", () => {
  it("renders the tier text", () => {
    render(<TierBadge tier="T14" rarity="tiered" />)
    expect(screen.getByText("T14")).toBeInTheDocument()
  })

  it("applies UT styling", () => {
    const { container } = render(<TierBadge tier="UT" rarity="ut" />)
    expect(container.firstElementChild?.className).toMatch(/amber/)
  })

  it("applies ST styling", () => {
    const { container } = render(<TierBadge tier="ST" rarity="st" />)
    expect(container.firstElementChild?.className).toMatch(/rose/)
  })
})

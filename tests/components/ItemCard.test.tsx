import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ItemCard } from "../../src/sections/catalog/components/ItemCard"
import type { CatalogItem } from "../../product/sections/catalog/types"

const sample: CatalogItem = {
  id: "crystal-wand",
  name: "Crystal Wand",
  tier: "UT",
  tierNumeric: 99,
  rarity: "ut",
  type: "weapon",
  weaponType: "wand",
  classes: ["wizard"],
  stats: { dmgMin: 100, dmgMax: 180, shotsPerSec: 1.5, shots: 1 },
  tags: ["high-damage"],
  sprite: "crystal-wand",
  imageUrl: "https://www.realmeye.com/x.png",
  dropsFrom: [],
  lore: "",
  owned: true,
}

describe("<ItemCard />", () => {
  it("renders the item name and tier", () => {
    render(<ItemCard item={sample} />)
    expect(screen.getByText("Crystal Wand")).toBeInTheDocument()
    expect(screen.getByText("UT")).toBeInTheDocument()
  })

  it('shows "Owned" badge when owned', () => {
    render(<ItemCard item={sample} />)
    expect(screen.getByText("Owned")).toBeInTheDocument()
  })

  it("does not show Owned badge when not owned", () => {
    render(<ItemCard item={{ ...sample, owned: false }} />)
    expect(screen.queryByText("Owned")).toBeNull()
  })

  it("clicking the open button calls onOpenDetail", () => {
    const onOpenDetail = vi.fn()
    render(<ItemCard item={sample} onOpenDetail={onOpenDetail} />)
    fireEvent.click(screen.getByLabelText(/Open details/i))
    expect(onOpenDetail).toHaveBeenCalled()
  })
})
